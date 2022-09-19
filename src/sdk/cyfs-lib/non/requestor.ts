import JSBI from "jsbi";
import { BuckyResult, CYFS_API_LEVEL, CYFS_DEC_ID, CYFS_FLAGS, CYFS_NON_ACTION, CYFS_OBJECT_EXPIRES_TIME, CYFS_OBJECT_ID, CYFS_OBJECT_UPDATE_TIME, CYFS_RESULT, CYFS_TARGET, Err, ObjectId, Ok, Option, None, Some, Attributes, CYFS_ATTRIBUTES, CYFS_ACCESS, CYFS_REQ_PATH, CYFS_INNER_PATH } from "../../cyfs-base"
import { BaseRequestor, RequestorHelper } from "../base/base_requestor";
import { HttpRequest } from "../base/http_request";
import { CYFS_REQUEST_FLAG_DELETE_WITH_QUERY } from "../base/request";
import { SelectFilter, SelectFilterUrlCodec, SelectOptionCodec, SelectResponse } from "../base/select_request";
import { NONAction, NONObjectInfo, NONPutObjectResult } from "./def";
import { NONDeleteObjectOutputRequest, NONDeleteObjectOutputResponse, NONGetObjectOutputRequest, NONGetObjectOutputResponse, NONOutputRequestCommon, NONPostObjectOutputRequest, NONPostObjectOutputResponse, NONPutObjectOutputRequest, NONPutObjectOutputResponse, NONSelectObjectOutputRequest, NONSelectObjectOutputResponse } from "./output_request";

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

        const info = new NONObjectInfo(object_id.unwrap(), new Uint8Array(object_raw));
        const r = info.decode_and_verify();
        if (r.err) {
            return r;
        }

        return Ok(info);
    }

    static async decode_option_object_info(req: Response): Promise<BuckyResult<Option<NONObjectInfo>>> {
        const ret = RequestorHelper.decode_optional_header(req, CYFS_OBJECT_ID, (s) => s);
        if (ret.err) {
            return ret;
        }
        const id = ret.unwrap();
        if (id.is_none()) {
            return Ok(None);
        }

        const object_id = ObjectId.from_base_58(id.unwrap());
        if (object_id.err) {
            return object_id;
        }

        const object_raw = await req.arrayBuffer();

        const info = new NONObjectInfo(object_id.unwrap(), new Uint8Array(object_raw));
        const r = info.decode_and_verify();
        if (r.err) {
            return r;
        }

        return Ok(Some(info));
    }

    static encode_object_info(req: HttpRequest, info: NONObjectInfo): void {
        req.insert_header(CYFS_OBJECT_ID, info.object_id.to_string());
        req.set_body(info.object_raw);
    }

    static async decode_get_object_response(
        resp: Response,
    ): Promise<BuckyResult<NONGetObjectOutputResponse>> {
        const r = await NONRequestorHelper.decode_object_info(resp)
        if (r.err) {
            console.error(`decode object from resp bytes error: ${r.val}`);
            return r;
        }

        const attr = RequestorHelper.decode_optional_header(resp, CYFS_ATTRIBUTES, s => parseInt(s, 10)).unwrap().to(v => new Attributes(v));

        const object_update_time =
            RequestorHelper.decode_optional_header(resp, CYFS_OBJECT_UPDATE_TIME, (s) => JSBI.BigInt(s)).unwrap();
        const object_expires_time =
            RequestorHelper.decode_optional_header(resp, CYFS_OBJECT_EXPIRES_TIME, (s) => JSBI.BigInt(s)).unwrap();

        const ret = {
            object: r.unwrap(),
            object_expires_time: object_expires_time.is_some() ? object_expires_time.unwrap() : undefined,
            object_update_time: object_update_time.is_some() ? object_update_time.unwrap() : undefined,
            attr: attr.is_some()? attr.unwrap() : undefined,
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
            http_req.insert_header(CYFS_REQ_PATH, com_req.req_path);
        }

        if (com_req.target) {
            http_req.insert_header(CYFS_TARGET, com_req.target.to_string());
        }

        http_req.insert_header(CYFS_FLAGS, com_req.flags.toString());
    }

    encode_put_object_request(req: NONPutObjectOutputRequest): HttpRequest {
        // #[cfg(debug_assertions)]
        {
            const r = req.object.verify();
            if (r.err) {
                console.error(`pub object id unmatch: id=${req.object.object_id}, object=${req.object.object_raw.toHex()}`)
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
        resp: & Response,
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
            RequestorHelper.decode_optional_header(resp, CYFS_OBJECT_UPDATE_TIME, (s) => JSBI.BigInt(s)).unwrap();
        const object_expires_time =
            RequestorHelper.decode_optional_header(resp, CYFS_OBJECT_EXPIRES_TIME, (s) => JSBI.BigInt(s)).unwrap();

        const ret = {
            result,
            object_expires_time: object_expires_time.is_some() ? object_expires_time.unwrap() : undefined,
            object_update_time: object_update_time.is_some() ? object_update_time.unwrap() : undefined,
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

        if (resp.status === 200) {
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

        return http_req
    }

    async get_object(
        req: NONGetObjectOutputRequest,
    ): Promise<BuckyResult<NONGetObjectOutputResponse>> {
        const http_req = this.encode_get_object_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
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
        if (o_ret.is_some()) {
            object = o_ret.unwrap();
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

        if (resp.status === 200) {
            console.debug("post object to non service success:", req.object.object_id);
            return await this.decode_post_object_response(req.object.object_id, resp)
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.warn(`post object to non service error! object=${req.object.object_id},`, e);
            return Err(e);
        }
    }

    format_select_url(req_path: string | undefined, filter: SelectFilter): string {
        let url = this.service_url;
        if (req_path) {
            url = url + req_path.replace(/^\/+|\/+$/g, "");
        }

        // filter以url params形式编码
        url = SelectFilterUrlCodec.encode(url, filter);

        return url;
    }

    encode_select_request(req: NONSelectObjectOutputRequest): HttpRequest {
        const url = this.format_select_url(req.common.req_path, req.filter);
        const http_req = new HttpRequest("Get", url);
        this.encode_common_headers(NONAction.SelectObject, req.common, http_req);


        SelectOptionCodec.encode(http_req, req.opt);

        return http_req
    }

    async select_object(
        req: NONSelectObjectOutputRequest,
    ): Promise<BuckyResult<NONSelectObjectOutputResponse>> {
        const http_req = this.encode_select_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            const r = await SelectResponse.from_response(resp);
            if (r.err) {
                return r;
            }
            return Ok({
                objects: r.unwrap().objects,
            })
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error("select object from non service failed:", e);
            return Err(e);
        }
    }

    encode_delete_object_request(req: NONDeleteObjectOutputRequest): HttpRequest {
        const http_req = new HttpRequest("Delete", this.service_url);
        this.encode_common_headers(NONAction.DeleteObject, req.common, http_req);

        if (req.inner_path) {
            http_req.insert_header(CYFS_INNER_PATH, req.inner_path);
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

        if (resp.status === 200) {
            console.debug("delete object from non service success:", req.object_id);
            return await this.decode_delete_object_response(req, resp);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`delete object from non service failed: id=${req.object_id},`, e);
            return Err(e);
        }
    }
}