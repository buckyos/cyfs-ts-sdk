
import { HttpRequest } from './http_request'
import { BuckyError, BuckyErrorCode, BuckyResult, CYFS_DEVICE_ID, Err, Ok } from "../../cyfs-base";
import { DeviceId } from "../../cyfs-base/objects/device";
import { WebSocketRequestHandler, WebSocketRequestManager } from '../ws/request';
import { WebSocketSession } from '../ws/session';
import { WebSocketClient } from '../ws/client';
import { decodeResponse, encodeRequest, HTTP_CMD_REQUEST } from "../..";

export abstract class BaseRequestor {
    abstract remote_addr(): string;
    abstract request(req: HttpRequest): Promise<BuckyResult<Response>>;
}

// 标准http的requestor
export class HttpRequestor extends BaseRequestor {
    private fetcher: any;

    constructor(private service_url: string) {
        super();

        console.log('HttpRequestor service_url', service_url);

        if (typeof window !== "undefined" && typeof fetch !== "undefined") {
            this.fetcher = fetch.bind(window)
        } else if (typeof fetch !== "undefined") {
            this.fetcher = fetch
        } else {
            this.fetcher = require('node-fetch');
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
            const resp = await this.fetcher(new URL(req.url), req.init);
            return Ok(resp as Response);
        } catch (error) {
            const msg = `fetch error: ${error.code}, ${error.message}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.ConnectFailed, msg));
        }
    }
}

// 基于WebSocket的requestor
class WSHttpRequestorHandler extends WebSocketRequestHandler {
    constructor() {
        super();
    }

    async on_request(requestor: WebSocketRequestManager,
        cmd: number,
        content: Uint8Array): Promise<BuckyResult<Uint8Array|undefined>> {
        console.error(`ws requestor should not recv any request!`);
        return Err(BuckyError.from(BuckyErrorCode.NotImplement));
    }

    async on_session_begin(session: WebSocketSession) {
        //
    }

    async on_session_end(session: WebSocketSession) {
        //
    }

    clone_handler(): WebSocketRequestHandler {
        return this;
    }
}


export class WSHttpRequestor extends BaseRequestor {
    private client: WebSocketClient;
    private service_url: URL;

    constructor(service_url: string) {
        super();

        console.log('WSHttpRequestor service_url', service_url);
        this.service_url = new URL(service_url);

        const handler = new WSHttpRequestorHandler();
        this.client = new WebSocketClient(service_url, handler);
        this.client.start();
    }

    stop(): void {
        console.log(`will stop ws http requestor! url=${this.service_url}`);
        this.client.stop();
    }

    remote_addr(): string {
        return this.service_url.host;
    }

    async request(req: HttpRequest): Promise<BuckyResult<Response>> {
        const session = this.client.select_session();
        if (session == null) {
            console.error("local ws disconnected! now will end with error");
            return Err(BuckyError.from(BuckyErrorCode.ErrorState));
        }
        const req_buf = encodeRequest(req);
        const resp_r = await session.requestor.post_bytes_req(HTTP_CMD_REQUEST, req_buf);
        if (resp_r.err) {
            return resp_r;
        }

        const resp = decodeResponse(resp_r.unwrap());
        return Ok(resp as unknown as Response);
        // TODO 对req编码后，通过session.requestor.post_bytes_req()
        // return Err(BuckyError.from(BuckyErrorCode.NotImplement));
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
        if (ret !== undefined) {
            return Ok(ret);
        } else {
            const msg = `header not found: ${name}`;
            console.error(msg);

            return Err(new BuckyError(BuckyErrorCode.NotFound, msg));
        }
    }


    public static decode_optional_header<T>(resp: Response, name: string, from_str: (s: string) => T): T|undefined {
        const value = resp.headers.get(name);

        if (value) {
            return from_str(value);
        } else {
            return undefined;
        }
    }

    public static trans_status_code(code: number): BuckyErrorCode {
        if (code >= 200 && code < 300) {
            return BuckyErrorCode.Ok;
        }

        switch (code) {
            case 404: return BuckyErrorCode.NotFound;
            case 400: return BuckyErrorCode.InvalidData;
            case 401: return BuckyErrorCode.PermissionDenied;
            case 403: return BuckyErrorCode.Reject;
            case 406: return BuckyErrorCode.Ignored;
            case 504: return BuckyErrorCode.Timeout;
            case 500: return BuckyErrorCode.Unknown;
            case 501: return BuckyErrorCode.NotHandled;
            default: return BuckyErrorCode.Failed;
        }
    }

    public static insert_device_list_header(http_req: HttpRequest, device_list: DeviceId[]) {
        device_list.map(x => http_req.insert_header(CYFS_DEVICE_ID, x.toString()))
    }

    // statuscode出错情况下， 从body里面提取buckyerror
    public static async error_from_resp(resp: Response): Promise<BuckyError> {
        try {
            const json_err = await resp.json();
            const error = new BuckyError(json_err.code, json_err.msg);
            return error;
        } catch (e) {
            // statuscode成功情况下，如果读取body失败，那么错误码默认都是Ok
            if (resp.status >= 200 && resp.status < 300) {
                return new BuckyError(BuckyErrorCode.Ok, `success resp: status=${resp.status}`);
            }

            console.error(`read error resp failed! status=${resp.status}`, e);
            const error = new BuckyError(BuckyErrorCode.Failed, `error resp, status=${resp.status}, ${resp.statusText}`);
            return error;
        }
    }
}