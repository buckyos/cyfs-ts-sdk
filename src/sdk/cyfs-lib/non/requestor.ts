import JSBI from "jsbi";
import { BuckyResult, CYFS_API_LEVEL, CYFS_DEC_ID, CYFS_FLAGS, CYFS_NON_ACTION, CYFS_OBJECT_EXPIRES_TIME, CYFS_OBJECT_ID, CYFS_OBJECT_UPDATE_TIME, CYFS_RESULT, CYFS_TARGET, Err, ObjectId, Ok, Attributes, CYFS_ATTRIBUTES, CYFS_ACCESS, CYFS_REQ_PATH, CYFS_INNER_PATH, BuckyBuffer, BuckyError, BuckyErrorCode } from "../../cyfs-base"
import { http_status_code_ok } from "../../util";
import { BaseRequestor, RequestorHelper } from "../base/base_requestor";
import { HttpRequest } from "../base/http_request";
import { CYFS_REQUEST_FLAG_DELETE_WITH_QUERY } from "../base/request";
import { NONAction, NONObjectInfo, NONPutObjectResult } from "./def";
import { NONDeleteObjectOutputRequest, NONDeleteObjectOutputResponse, NONGetObjectOutputRequest, NONGetObjectOutputResponse, NONOutputRequestCommon, NONPostObjectOutputRequest, NONPostObjectOutputResponse, NONPutObjectOutputRequest, NONPutObjectOutputResponse, NONUpdateObjectMetaOutputRequest} from "./output_request";

export class NONRequestorHelper {
    static async decode_object_info(req: Response): Promise<BuckyResult<NONObjectInfo>> {
        // 头部必须有object-id字段
        const id = RequestorHelper.decode_header(req, CYFS_OBJECT_ID, (s) => s);
        if (id.err) {
            return id;
        }
        const object_id = ObjectId.from_base_58(id.unwrap());
        if (object_id.err) {
            return object_id;
        }

        const object_raw = await req.arrayBuffer();

        // 兼容object_raw为空的情况，此种情况表示没有可返回的Object对象本身,id可能是个data id或是个ChunkId
        if (object_raw.byteLength === 0) {
            const msg = `object id ${id} not a valid object`;
            console.warn(msg)
            return Err(new BuckyError(BuckyErrorCode.InvalidInput, msg))
        }

        const info = new NONObjectInfo(object_id.unwrap(), new Uint8Array(object_raw));
        const r = info.decode_and_verify();
        if (r.err) {
            return r;
        }

        return Ok(info);
    }

    static async decode_option_object_info(req: Response): Promise<BuckyResult<NONObjectInfo|undefined>> {
        const id = RequestorHelper.decode_optional_header(req, CYFS_OBJECT_ID, (s) => s);
        if (id === undefined) {
            return Ok(id);
        }

        const object_id = ObjectId.from_base_58(id);
        if (object_id.err) {
            return object_id;
        }

        const object_raw = await req.arrayBuffer();

        const info = new NONObjectInfo(object_id.unwrap(), new Uint8Array(object_raw));
        const r = info.decode_and_verify();
        if (r.err) {
            return r;
        }

        return Ok(info);
    }

    static encode_object_info(req: HttpRequest, info: NONObjectInfo): void {
        req.insert_header(CYFS_OBJECT_ID, info.object_id.to_string());
        if (info.object_raw.length > 0) {
            req.set_body(info.object_raw);
        }
    }

    static async decode_get_object_response(
        resp: Response,
    ): Promise<BuckyResult<NONGetObjectOutputResponse>> {
        const r = await NONRequestorHelper.decode_object_info(resp)
        if (r.err) {
            console.error(`decode object from resp bytes error: ${r.val}`);
            return r;
        }

        const attr = RequestorHelper.decode_optional_header(resp, CYFS_ATTRIBUTES, s => new Attributes(parseInt(s, 10)));

        const object_update_time =
            RequestorHelper.decode_optional_header(resp, CYFS_OBJECT_UPDATE_TIME, (s) => JSBI.BigInt(s));
        const object_expires_time =
            RequestorHelper.decode_optional_header(resp, CYFS_OBJECT_EXPIRES_TIME, (s) => JSBI.BigInt(s));

        const ret = {
            object: r.unwrap(),
            object_expires_time,
            object_update_time,
            attr,
        };

        return Ok(ret)
    }
}

export class NONRequestor {
    service_url: string

    constructor(private requestor: BaseRequestor, private dec_id?: ObjectId) {
        this.service_url = `http://${requestor.remote_addr()}/non/`;
    }

    encode_common_headers(
        action: NONAction,
        com_req: NONOutputRequestCommon,
        http_req: HttpRequest,
    ): void {
        if (com_req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, com_req.dec_id.to_string());
        } else if (this.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, this.dec_id.to_string());
        }

        http_req.insert_header(CYFS_NON_ACTION, action);

        http_req.insert_header(CYFS_API_LEVEL, com_req.level);

        if (com_req.req_path) {
            http_req.insert_header(CYFS_REQ_PATH, encodeURIComponent(com_req.req_path));
        }

        if (com_req.target) {
            http_req.insert_header(CYFS_TARGET, com_req.target.to_string());
        }

        http_req.insert_header(CYFS_FLAGS, com_req.flags.toString());
    }

    encode_put_object_request(req: NONPutObjectOutputRequest): HttpRequest {
        {
            if (!req.object.is_empty()) {
                const r = req.object.verify();
                if (r.err) {
                    console.error(`pub object id unmatch: id=${req.object.object_id}, object=${req.object.object_raw.toHex()}`)
                }
            }
            
        }

        const http_req = new HttpRequest('Put', this.service_url);
        this.encode_common_headers(NONAction.PutObject, req.common, http_req);

        if (req.access) {
            http_req.insert_header(CYFS_ACCESS, req.access.value.toString())
        }

        return http_req;
    }

    async decode_put_object_response(
        resp: Response,
    ): Promise<BuckyResult<NONPutObjectOutputResponse>> {
        let result;
        {
            const r = RequestorHelper.decode_header(resp, CYFS_RESULT, (s) => s as NONPutObjectResult);
            if (r.err) {
                return r;
            }
            result = r.unwrap();
        }

        const object_update_time =
            RequestorHelper.decode_optional_header(resp, CYFS_OBJECT_UPDATE_TIME, (s) => JSBI.BigInt(s));
        const object_expires_time =
            RequestorHelper.decode_optional_header(resp, CYFS_OBJECT_EXPIRES_TIME, (s) => JSBI.BigInt(s));

        const ret = {
            result,
            object_expires_time,
            object_update_time,
        };

        return Ok(ret)
    }

    async put_object(
        req: NONPutObjectOutputRequest,
    ): Promise<BuckyResult<NONPutObjectOutputResponse>> {
        const http_req = this.encode_put_object_request(req);
        NONRequestorHelper.encode_object_info(http_req, req.object);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (http_status_code_ok(resp.status)) {
            console.debug("put object to non service success:", req.object.object_id);
            return await this.decode_put_object_response(resp)
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.warn(`put object to non service error! object=${req.object.object_id},`, e);
            return Err(e);
        }
    }

    encode_get_object_request(req: NONGetObjectOutputRequest): HttpRequest {
        const http_req = new HttpRequest('Get', this.service_url);
        this.encode_common_headers(NONAction.GetObject, req.common, http_req);

        http_req.insert_header(CYFS_OBJECT_ID, req.object_id.to_base_58());

        if (req.inner_path) {
            http_req.insert_header(CYFS_INNER_PATH, encodeURIComponent(req.inner_path));
        }

        return http_req
    }

    async get_object(
        req: NONGetObjectOutputRequest,
    ): Promise<BuckyResult<NONGetObjectOutputResponse>> {
        console.debug("get object request:", JSON.stringify(req))
        const http_req = this.encode_get_object_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (http_status_code_ok(resp.status)) {
            console.debug("get object from non service success:", req.object_id);
            return await NONRequestorHelper.decode_get_object_response(resp);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.warn(`get object from non service error! object=${req.object_id},`, e);
            return Err(e);
        }
    }

    encode_post_object_request(req: NONPostObjectOutputRequest): HttpRequest {
        const http_req = new HttpRequest("Post", this.service_url);
        this.encode_common_headers(NONAction.PostObject, req.common, http_req);

        return http_req;
    }

    async decode_post_object_response(
        object_id: ObjectId,
        resp: Response,
    ): Promise<BuckyResult<NONPostObjectOutputResponse>> {
        const ret = await NONRequestorHelper.decode_option_object_info(resp)
        if (ret.err) {
            console.error(`decode object from post resp bytes error: obj=${object_id} ${ret.val}`);
            return ret;
        }

        let object;
        const o_ret = ret.unwrap();
        if (o_ret) {
            object = o_ret;
        }

        const r = { object, };

        return Ok(r);
    }

    async post_object(
        req: NONPostObjectOutputRequest,
    ): Promise<BuckyResult<NONPostObjectOutputResponse>> {
        const http_req = this.encode_post_object_request(req);
        NONRequestorHelper.encode_object_info(http_req, req.object);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (http_status_code_ok(resp.status)) {
            console.debug("post object to non service success:", req.object.object_id);
            return await this.decode_post_object_response(req.object.object_id, resp)
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.warn(`post object to non service error! object=${req.object.object_id},`, e);
            return Err(e);
        }
    }

    encode_delete_object_request(req: NONDeleteObjectOutputRequest): HttpRequest {
        const http_req = new HttpRequest("Delete", this.service_url);
        this.encode_common_headers(NONAction.DeleteObject, req.common, http_req);

        http_req.insert_header(CYFS_OBJECT_ID, req.object_id.to_base_58());

        if (req.inner_path) {
            http_req.insert_header(CYFS_INNER_PATH, encodeURIComponent(req.inner_path));
        }

        return http_req;
    }

    async decode_delete_object_response(
        req: NONDeleteObjectOutputRequest,
        resp: Response,
    ): Promise<BuckyResult<NONDeleteObjectOutputResponse>> {
        let object;
        if ((req.common.flags & CYFS_REQUEST_FLAG_DELETE_WITH_QUERY) !== 0) {
            const r = await NONRequestorHelper.decode_object_info(resp);
            if (r.err) {
                return r;
            }
            object = r.unwrap();
        }

        return Ok({ object });
    }

    async delete_object(req: NONDeleteObjectOutputRequest): Promise<BuckyResult<NONDeleteObjectOutputResponse>> {
        const http_req = this.encode_delete_object_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            r.unwrap();
        }
        const resp = r.unwrap();

        if (http_status_code_ok(resp.status)) {
            console.debug("delete object from non service success:", req.object_id);
            return await this.decode_delete_object_response(req, resp);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`delete object from non service failed: id=${req.object_id},`, e);
            return Err(e);
        }
    }

    async update_object_meta(
        req: NONUpdateObjectMetaOutputRequest,
    ): Promise<BuckyResult<NONPutObjectOutputResponse>> {
        const put_req = {
            common: req.common,
            object: new NONObjectInfo(req.object_id, new Uint8Array()),
            access: req.access,
        };

        return await this.put_object(put_req)
    }
}