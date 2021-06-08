import { HttpRequestor, RequestorHelper } from "../base/base_requestor";
import { HttpRequest } from "../base/http_request";
import { Err, Ok } from "ts-results";
import { SelectEncoder, SelectOption, SelectFilter, SelectResponse } from "../base/select_request";
import { AnyNamedObject, AnyNamedObjectDecoder, BuckyError, BuckyResult, CYFS_DEC_ID, CYFS_FLAGS, None, Option } from "../../cyfs-base";
import { ObjectId } from "../../cyfs-base/objects/object_id";

export interface NOCPutRequest {
    object_id: ObjectId;
    object_raw: Uint8Array;

    dec_id?: ObjectId;
    flags: number;
}

export interface NOCGetRequest {
    object_id: ObjectId;

    dec_id?: ObjectId;
    flags: number;
}

export interface NOCGetResponse {
    object_raw: Uint8Array;
    object: AnyNamedObject;
}

export interface NOCSelectRequest {
    filter: SelectFilter,
    opt: Option<SelectOption>

    dec_id?: ObjectId;
    flags: number;
}

export class NOCRequestor {
    service_url: string;

    constructor(private requestor: HttpRequestor) {
        this.service_url = `http://${requestor.remote_addr()}/noc/`;
    }

    format_url(object_id: ObjectId): string {
        return `${this.service_url}object/${object_id}`;
    }

    format_select_url(): string {
        return `${this.service_url}objects`;
    }

    encode_put_request(req: NOCPutRequest): HttpRequest {
        const url = this.format_url(req.object_id);
        const http_req = new HttpRequest('POST', url);

        http_req.insert_header(CYFS_FLAGS, req.flags.toString());
        if (req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, req.dec_id.toString());
        }

        return http_req;
    }

    public async put_object(req: NOCPutRequest): Promise<BuckyResult<null>> {
        const http_req = this.encode_put_request(req);
        http_req.set_body(req.object_raw);

        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            console.log(`put object to noc service success: ${req.object_id}`);
        } else {
            const msg = `put object to noc service failed: ${req.object_id} status=${resp.status} msg=${await resp.text()}`;
            console.error(msg);

            return Err(BuckyError.from(msg));
        }

        return Ok(null);
    }

    encode_get_request(req: NOCGetRequest): HttpRequest {
        const url = this.format_url(req.object_id);
        const http_req = new HttpRequest('GET', url);

        http_req.insert_header(CYFS_FLAGS, req.flags.toString());
        if (req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, req.dec_id.toString());
        }

        return http_req;
    }

    public async get_object(req: NOCGetRequest): Promise<BuckyResult<NOCGetResponse>> {
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

            const get_resp: NOCGetResponse = {
                object_raw: new Uint8Array(buf),
                object: obj,
            };
            return Ok(get_resp);
        } else {
            const msg = `get object failed: obj=${req.object_id} status=${resp.status} msg=${await resp.text()}`;
            console.error(msg);
            const err_code = RequestorHelper.trans_status_code(resp.status);
            return Err(new BuckyError(err_code, msg));
        }
    }

    encode_select_request(req: NOCSelectRequest): HttpRequest {
        let opt = req.opt;
        if (opt == null) {
            opt = None;
        }
        const codec = new SelectEncoder(this.format_select_url());
        const http_req = codec.encode_select_request(req.filter, opt);

        http_req.insert_header(CYFS_FLAGS, req.flags.toString());
        if (req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, req.dec_id.toString());
        }
        return http_req;
    }

    public async select(req: NOCSelectRequest): Promise<BuckyResult<SelectResponse>> {
        const http_req = this.encode_select_request(req);

        console.log('http_req:', http_req);

        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            console.log(resp);
            return Ok(await SelectResponse.from_response(resp));
        } else {
            const msg = `select object failed: status=${resp.status} msg=${await resp.text()}`;
            console.error(msg);

            const err_code = RequestorHelper.trans_status_code(resp.status);
            return Err(new BuckyError(err_code, msg));
        }
    }
}