
import { Err, Ok } from "ts-results";
import { HttpRequest } from './http_request'
import { BuckyError, BuckyErrorCode, BuckyResult, CYFS_DEVICE_ID, None, Option, Some } from "../../cyfs-base";
import { DeviceId } from "../../cyfs-base/objects/device";


export class HttpRequestor {
    private fetcher: any;

    constructor(private service_url: string) {
        console.log('HttpRequestor service_url', service_url);

        if (typeof fetch === "undefined") {
            const fetch = require('node-fetch');
            this.fetcher = fetch;
        } else {
            this.fetcher = fetch.bind(window);
        }
    }

    remote_addr(): string {
        return this.service_url;
    }

    async request(req: HttpRequest): Promise<BuckyResult<Response>> {
        // if(req.init){
        //     req.insert_header("credentials", "include");
        //     req.insert_header("mode", "cors");
        //     req.insert_header("test", "xx");
        // }

        try {
            const resp = await this.fetcher(req.url, req.init);
            return Ok(resp as Response);
        } catch (error) {
            const msg = `fetch error: ${error.code}, ${error.message}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.ConnectFailed, msg));
        }
    }
}

export class RequestorHelper {
    public static async decode_str_body<T>(resp: Response, from_str: (s: string) => T): Promise<BuckyResult<T>> {
        const body = await resp.text();
        const r = from_str(body);
        return Ok(r);
    }

    public static decode_header<T>(resp: Response, name: string, from_str: (s: string) => T): BuckyResult<T> {
        const ret = this.decode_optional_header<T>(resp, name, from_str);
        if (ret.unwrap().is_some()) {
            return Ok(ret.unwrap().unwrap());
        } else {
            const msg = `header not found: ${name}`;
            console.error(msg);

            return Err(new BuckyError(BuckyErrorCode.NotFound, msg));
        }
    }


    public static decode_optional_header<T>(resp: Response, name: string, from_str: (s: string) => T): BuckyResult<Option<T>> {
        const value = resp.headers.get(name);

        if (value) {
            return Ok(Some(from_str(value)));
        } else {
            return Ok(None);
        }
    }


    public static decode_optional_headers<T>(resp: Response, name: string, from_str: (s: string) => T): BuckyResult<Option<T[]>> {
        const ret: T[] = [];
        resp.headers.forEach((value, key) => {
            if (key === name) {
                ret.push(from_str(value));
            }
        });
        return Ok(Some(ret));
    }

    public static trans_status_code(code: number): BuckyErrorCode {
        switch (code) {
            case 200: return BuckyErrorCode.Ok;
            case 404: return BuckyErrorCode.NotFound;
            case 400: return BuckyErrorCode.InvalidParam;
            case 401: return BuckyErrorCode.PermissionDenied;
            case 403: return BuckyErrorCode.PermissionDenied;
            default: return BuckyErrorCode.Failed;
        }
    }

    public static insert_device_list_header(http_req: HttpRequest, device_list: DeviceId[]) {
        device_list.map(x => http_req.insert_header(CYFS_DEVICE_ID, x.toString()))
    }
}