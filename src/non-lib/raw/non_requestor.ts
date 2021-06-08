import { HttpRequestor, RequestorHelper } from "../base/base_requestor";
import { ObjectCryptoRequestor } from "./obj_crypto";
import { HttpRequest } from "../base/http_request";
import { Err, Ok } from "ts-results";
import { SelectEncoder, SelectOption, SelectFilter, SelectResponse } from "../base/select_request";
import { AnyNamedObject, AnyNamedObjectDecoder, BuckyError, BuckyResult, CYFS_DEC_ID, CYFS_FLAGS, Option } from "../../cyfs-base";
import { DeviceId } from "../../cyfs-base/objects/device";
import { ObjectId } from "../../cyfs-base/objects/object_id";

export interface NONPutRequest {
    object_id: ObjectId;
    object_raw: Uint8Array;

    target?: ObjectId;
    dec_id?: ObjectId;
    flags: number;
}

export interface NONGetRequest {
    object_id: ObjectId;

    // 目标device
    target?: ObjectId;

    dec_id?: ObjectId;
    flags: number;
}

export interface NONGetResponse {
    object_raw: Uint8Array;
    object: AnyNamedObject;
}

export interface NONSelectRequest {
    filter: SelectFilter;
    opt: Option<SelectOption>

    // 目标device
    target?: ObjectId;

    dec_id?: ObjectId;
    flags: number;
}

export class NONRequestor {
    service_url: string;
    crypto: ObjectCryptoRequestor;
    constructor(private requestor: HttpRequestor) {
        this.service_url = `http://${requestor.remote_addr()}/non/`;

        this.crypto = new ObjectCryptoRequestor(requestor);
    }

    format_url(target: ObjectId | undefined, object_id: ObjectId): string {
        if (target) {
            return `${this.service_url}object/${target}/${object_id}`;
        } else {
            return `${this.service_url}object/${object_id}`;
        }
    }

    format_select_url(target: ObjectId | undefined): string {
        if (target) {
            return `${this.service_url}objects/${target}`;
        } else {
            return `${this.service_url}objects`;
        }
    }

    encode_put_request(req: & NONPutRequest): HttpRequest {
        const url = this.format_url(req.target, req.object_id);
        const http_req = new HttpRequest('POST', url);

        http_req.insert_header(CYFS_FLAGS, req.flags.toString());
        if (req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, req.dec_id.toString());
        }

        return http_req;
    }

    public async put_object(req: NONPutRequest): Promise<BuckyResult<null>> {
        const http_req = this.encode_put_request(req);
        http_req.set_body(req.object_raw);

        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            console.log(`put object to non service success: ${req.object_id}`);
        } else {
            const msg = `put object to non service failed: ${req.object_id} status=${resp.status} msg=${await resp.text()}`;
            console.error(msg);

            return Err(BuckyError.from(msg));
        }

        return Ok(null);
    }

    encode_get_request(req: NONGetRequest): HttpRequest {
        const url = this.format_url(req.target, req.object_id);
        const http_req = new HttpRequest('GET', url);

        http_req.insert_header(CYFS_FLAGS, req.flags.toString());
        if (req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, req.dec_id.toString());
        }

        return http_req;
    }

    public async get_object(req: NONGetRequest): Promise<BuckyResult<NONGetResponse>> {
        const http_req = this.encode_get_request(req);

        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            console.log(`get object from non success: obj=${req.object_id}`);
            const buf = await resp.arrayBuffer();

            const r = new AnyNamedObjectDecoder().raw_decode(new Uint8Array(buf));
            if (r.err) {
                console.error("NOCRequestor::get_object, decode any named object failed, err:{}", r.err);
                return r;
            }
            const [obj, _buf] = r.unwrap();

            const get_resp: NONGetResponse = {
                object_raw: new Uint8Array(buf),
                object: obj,
            };
            return Ok(get_resp);
        } else {
            const msg = `get object from non failed: obj=${req.object_id} status=${resp.status} msg=${await resp.text()}`;
            console.error(msg);
            const err_code = RequestorHelper.trans_status_code(resp.status);
            return Err(new BuckyError(err_code, msg));
        }
    }

    encode_select_request(req: NONSelectRequest): HttpRequest {
        const codec = new SelectEncoder(this.format_select_url(req.target));
        const http_req = codec.encode_select_request(req.filter, req.opt);

        http_req.insert_header(CYFS_FLAGS, req.flags.toString());
        if (req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, req.dec_id.toString());
        }

        return http_req;
    }

    public async select(req: NONSelectRequest): Promise<BuckyResult<SelectResponse>> {
        const http_req = this.encode_select_request(req);

        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            return Ok(await SelectResponse.from_response(resp));
        } else {
            const msg = `select object from non failed: status=${resp.status} msg=${await resp.text()}`;
            console.error(msg);

            const err_code = RequestorHelper.trans_status_code(resp.status);
            return Err(new BuckyError(err_code, msg));
        }
    }
}