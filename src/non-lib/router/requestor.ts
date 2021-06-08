import { Ok, Err } from 'ts-results';

import {
    RouterGetObjectRequest, RouterGetObjectResponse,
    RouterPutObjectRequest,
    RouterSelectObjectRequest,
    RouterSelectObjectResponse
} from "./request";
import { HttpRequest } from '../base/http_request';
import { SelectEncoder, SelectResponse } from "../base/select_request";
import { HttpRequestor, RequestorHelper } from "../base/base_requestor";
import { AnyNamedObjectDecoder, BuckyError, BuckyResult, CYFS_DEC_ID, CYFS_FLAGS, Option } from "../../cyfs-base";
import { ObjectId } from "../../cyfs-base/objects/object_id";


export class RouterRequestor {
    serviceURL: string;
    constructor(private requestor: HttpRequestor) {
        this.serviceURL = `http://${requestor.remote_addr()}/router/`
    }

    format_url(target: ObjectId | undefined, object_id: ObjectId): string {
        if (target) {
            return `${this.serviceURL}object/${target}/${object_id}`;
        } else {
            return `${this.serviceURL}object/${object_id}`;
        }
    }

    format_select_url(target: ObjectId | undefined): string {
        if (target) {
            return `${this.serviceURL}objects/${target}`;
        } else {
            return `${this.serviceURL}objects`;
        }
    }

    encode_put_request(req: RouterPutObjectRequest): HttpRequest {
        const url = this.format_url(req.target, req.object_id);

        const http_req = new HttpRequest('POST', url);
        if (req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, req.dec_id.toString());
        }

        http_req.insert_header(CYFS_FLAGS, req.flags.toString());

        return http_req;
    }

    public async put_object(req: RouterPutObjectRequest): Promise<BuckyResult<null>> {
        const http_req = this.encode_put_request(req);
        http_req.set_body(req.object_raw);

        console.log(`router will put object: obj=${req.object_id}, url=${http_req.url}`);

        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            console.log(`put object to router success: ${req.object_id}`);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`get object from router failed: obj=${req.object_id}, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }

        return Ok(null);
    }

    encode_get_request(req: RouterGetObjectRequest) {
        const url = this.format_url(req.target, req.object_id);
        const http_req = new HttpRequest('GET', url);
        if (req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, req.dec_id.toString());
        }

        http_req.insert_header(CYFS_FLAGS, req.flags.toString());
        return http_req;
    }

    public async get_object(req: RouterGetObjectRequest): Promise<BuckyResult<RouterGetObjectResponse>> {
        const http_req = this.encode_get_request(req);
        console.log(`router will get object: obj=${req.object_id}, url=${http_req.url}`);

        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            const object_raw = await resp.arrayBuffer();

            const r = new AnyNamedObjectDecoder().raw_decode(new Uint8Array(object_raw));
            if (r.err) {
                console.error("NOCRequestor::get_object, decode any named object failed, err:{}", r.err);
                return r;
            }
            const [obj, _buf] = r.unwrap();

            return Ok({ object: obj, object_raw: new Uint8Array(object_raw) });
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`get object from router failed: obj=${req.object_id}, status=${resp.status}, err=${JSON.stringify((e))}`);
            return Err(new BuckyError(e.code, e.msg));
        }
    }

    encode_select_request(req: RouterSelectObjectRequest) {
        const codec = new SelectEncoder(this.format_select_url(req.target));
        const http_req = codec.encode_select_request(req.filter, req.opt);

        if (req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, req.dec_id.toString());
        }
        http_req.insert_header(CYFS_FLAGS, req.flags.toString());

        return http_req;
    }

    public async select(req: RouterSelectObjectRequest): Promise<BuckyResult<RouterSelectObjectResponse>> {
        const http_req = this.encode_select_request(req);

        console.log(`router will select objects: url=${http_req.url}, req=${JSON.stringify(http_req)}`);

        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            console.log(`select objects resp:`, resp);
            return Ok(await SelectResponse.from_response(resp));
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`select object from router failed: status=${resp.status}, err=${JSON.stringify((e))}`);
            return Err(new BuckyError(e.code, e.msg));
        }
    }
}
