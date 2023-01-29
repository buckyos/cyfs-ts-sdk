import { Attributes, CYFS_ATTRIBUTES, CYFS_OBJECT_ID, BuckyResult, CYFS_API_LEVEL, CYFS_DEC_ID, CYFS_FLAGS, CYFS_NDN_ACTION, CYFS_REFERER_OBJECT, CYFS_RESULT, CYFS_TARGET, Err, ObjectId, Ok, CYFS_REQ_PATH, CYFS_INNER_PATH, CYFS_OWNER_ID, CYFS_DATA_RANGE, CYFS_CONTEXT, CYFS_TASK_GROUP } from "../../cyfs-base";
import { http_status_code_ok } from "../../util";
import { BaseRequestor, RequestorHelper } from "../base/base_requestor";
import { HttpRequest } from "../base/http_request";
import { NDNDataResponseRange } from "../base/range";
import { NDNAction, NDNPutDataResult } from "./def";
import { NDNQueryFileInputResponseJsonCodec, ndn_query_file_param_to_key_pair } from './input_request';
import { NDNDeleteDataOutputRequest, NDNDeleteDataOutputResponse, NDNGetDataOutputRequest, NDNGetDataOutputResponse, NDNOutputRequestCommon, NDNPutDataOutputRequest, NDNPutDataOutputResponse, NDNQueryFileOutputRequest, NDNQueryFileOutputResponse } from "./output_request";

export class NDNRequestor {
    service_url: string

    constructor(private requestor: BaseRequestor, private dec_id?: ObjectId) {
        this.service_url = `http://${requestor.remote_addr()}/ndn/`;
    }

    encode_common_headers(
        action: NDNAction,
        com_req: NDNOutputRequestCommon,
        http_req: HttpRequest,
    ): void {
        if (com_req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, com_req.dec_id.to_string());
        } else if (this.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, this.dec_id.to_string());
        }

        http_req.insert_header(CYFS_NDN_ACTION, action);

        http_req.insert_header(CYFS_API_LEVEL, com_req.level);

        if (com_req.target) {
            http_req.insert_header(CYFS_TARGET, com_req.target.to_string());
        }

        if (com_req.req_path) {
            http_req.insert_header(CYFS_REQ_PATH, encodeURIComponent(com_req.req_path));
        }

        if (com_req.referer_object != null && com_req.referer_object.length > 0) {
            const headers = [];
            for (const object of com_req.referer_object) {
                headers.push(object.toString());
            }
            // 根据RFC 2616，在一个header里传多个值，应该用逗号分隔。没有找到rust http-types里对header进行编码的实际代码
            http_req.insert_header(CYFS_REFERER_OBJECT, headers.join(","))
        }

        http_req.insert_header(CYFS_FLAGS, com_req.flags.toString());
    }

    // 编码到url query
    encode_common_headers_to_query(
        action: NDNAction,
        com_req: NDNOutputRequestCommon,
    ): string {
        const querys = new URLSearchParams();

        if (com_req.dec_id) {
            querys.append(CYFS_DEC_ID, com_req.dec_id.to_string());
        } else if (this.dec_id) {
            querys.append(CYFS_DEC_ID, this.dec_id.to_string());
        }

        querys.append(CYFS_NDN_ACTION, action);

        querys.append(CYFS_API_LEVEL, com_req.level);

        if (com_req.target) {
            querys.append(CYFS_TARGET, com_req.target.to_string());
        }

        if (com_req.referer_object != null && com_req.referer_object.length > 0) {
            for (const object of com_req.referer_object) {
                querys.append(CYFS_REFERER_OBJECT, object.toString());
            }
        }

        querys.append(CYFS_FLAGS, com_req.flags.toString());

        return querys.toString();
    }

    encode_put_data_request(action: NDNAction, req: NDNPutDataOutputRequest): HttpRequest {
        const http_req = new HttpRequest("Put", this.service_url);

        this.encode_common_headers(action, req.common, http_req);

        http_req.insert_header(CYFS_OBJECT_ID, req.object_id.toString());

        return http_req;
    }

    async decode_put_data_response(resp: Response): Promise<BuckyResult<NDNPutDataOutputResponse>> {
        const result = RequestorHelper.decode_header(resp, CYFS_RESULT, s => s as NDNPutDataResult);
        if (result.err) {
            return result;
        }

        const ret = { result: result.unwrap() };

        return Ok(ret)
    }

    async decode_put_shared_data_response(resp: Response): Promise<BuckyResult<NDNPutDataOutputResponse>> {
        const result = RequestorHelper.decode_header(resp, CYFS_RESULT, s => s as NDNPutDataResult);
        if (result.err) {
            return result;
        }

        const ret = { result: result.unwrap() };

        return Ok(ret)
    }

    async put_data(req: NDNPutDataOutputRequest): Promise<BuckyResult<NDNPutDataOutputResponse>> {
        const http_req = this.encode_put_data_request(NDNAction.PutData, req);

        http_req.set_body(req.data);
        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (http_status_code_ok(resp.status)) {
            console.debug("put data to ndn service success:", req.object_id);
            return await this.decode_put_data_response(resp);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    async put_shared_data(req: NDNPutDataOutputRequest): Promise<BuckyResult<NDNPutDataOutputResponse>> {
        const http_req = this.encode_put_data_request(NDNAction.PutSharedData, req);

        http_req.set_body(req.data);
        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (http_status_code_ok(resp.status)) {
            console.debug("put data to ndn service success:", req.object_id);
            return await this.decode_put_shared_data_response(resp);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    private encode_get_data_request(action: NDNAction, req: NDNGetDataOutputRequest): HttpRequest {
        const http_req = new HttpRequest("Get", this.service_url);
        this.encode_common_headers(action, req.common, http_req);

        http_req.insert_header(CYFS_OBJECT_ID, req.object_id.toString());
        if (req.inner_path) {
            http_req.insert_header(CYFS_INNER_PATH, encodeURIComponent(req.inner_path));
        }
        if (req.context) {
            http_req.insert_header(CYFS_CONTEXT, encodeURIComponent(req.context))
        }
        if (req.group) {
            http_req.insert_header(CYFS_TASK_GROUP, encodeURIComponent(req.group))
        }
        if (req.range) {
            http_req.insert_header("Range", req.range.toString())
        }

        return http_req;
    }

    private async decode_get_data_response(
        resp: Response, return_stream?: boolean
    ): Promise<BuckyResult<NDNGetDataOutputResponse>> {
        const attr = RequestorHelper.decode_optional_header(resp, CYFS_ATTRIBUTES, s => new Attributes(parseInt(s, 10)));

        const object_id = RequestorHelper.decode_header(resp, CYFS_OBJECT_ID, s => ObjectId.from_base_58(s).unwrap());
        if (object_id.err) {
            return object_id;
        }
        const owner_id = RequestorHelper.decode_optional_header(resp, CYFS_OWNER_ID, s => ObjectId.from_base_58(s));
        if (owner_id && owner_id.err) {
            return owner_id;
        }

        const range = RequestorHelper.decode_optional_header(resp, CYFS_DATA_RANGE, (s) => {
            return NDNDataResponseRange.from_str(s)
        });

        if (range && range.err) {
            return range
        }

        const length =
            RequestorHelper.decode_header(resp, "content-length", s => parseInt(s, 10));
        if (length.err) {
            return length;
        }
        const group = RequestorHelper.decode_optional_header(resp, CYFS_TASK_GROUP, (s) => {
            return decodeURIComponent(s)
        });

        let data, stream;
        if (return_stream) {
            stream = resp.body!
        } else {
            data = new Uint8Array(await resp.arrayBuffer());
        }

        const ret = {
            object_id: object_id.unwrap(),
            attr,
            owner_id: owner_id?owner_id.unwrap():undefined,
            range: range?range.unwrap():undefined,

            length: length.unwrap(),
            data,
            stream,
            group
        };

        return Ok(ret);
    }

    async get_data(
        req: NDNGetDataOutputRequest, return_stream?: boolean
    ): Promise<BuckyResult<NDNGetDataOutputResponse>> {
        const http_req = this.encode_get_data_request(NDNAction.GetData, req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (http_status_code_ok(resp.status)) {
            console.debug("get data from ndn service success:", req.object_id);
            return await this.decode_get_data_response(resp, return_stream);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    async get_shared_data(
        req: NDNGetDataOutputRequest, return_stream?: boolean
    ): Promise<BuckyResult<NDNGetDataOutputResponse>> {
        const http_req = this.encode_get_data_request(NDNAction.GetSharedData, req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (http_status_code_ok(resp.status)) {
            console.debug("get data from ndn service success:", req.object_id);
            return await this.decode_get_data_response(resp, return_stream);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    encode_delete_data_request(req: NDNDeleteDataOutputRequest): HttpRequest {
        const http_req = new HttpRequest("Delete", this.service_url);
        this.encode_common_headers(NDNAction.DeleteData, req.common, http_req);

        http_req.insert_header(CYFS_OBJECT_ID, req.object_id.to_string());
        if (req.inner_path) {
            http_req.insert_header(CYFS_INNER_PATH, encodeURIComponent(req.inner_path));
        }

        return http_req;
    }

    async decode_delete_data_response(resp: Response): Promise<BuckyResult<NDNDeleteDataOutputResponse>> {
        const object_id = RequestorHelper.decode_header(resp, CYFS_OBJECT_ID, s => ObjectId.from_base_58(s).unwrap());
        if (object_id.err) {
            return object_id;
        }

        return Ok({ object_id: object_id.unwrap() });
    }

    async delete_data(req: NDNDeleteDataOutputRequest): Promise<BuckyResult<NDNDeleteDataOutputResponse>> {
        const http_req = this.encode_delete_data_request(req);
        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (http_status_code_ok(resp.status)) {
            console.debug("delete data from ndn service success:", req.object_id);
            return await this.decode_delete_data_response(resp);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    encode_query_file_request(req: NDNQueryFileOutputRequest): HttpRequest {
        const querys = new URLSearchParams();
        const [t, v] = ndn_query_file_param_to_key_pair(req.param);
        querys.append("type", t);
        querys.append("value", v);

        const full_url = this.service_url + "?" + querys.toString();

        const http_req = new HttpRequest("Get", full_url);
        this.encode_common_headers(NDNAction.QueryFile, req.common, http_req);

        return http_req;
    }


    async query_file(req: NDNQueryFileOutputRequest): Promise<BuckyResult<NDNQueryFileOutputResponse>> {
        const http_req = this.encode_query_file_request(req);
        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (http_status_code_ok(resp.status)) {
            const json = await resp.json();
            const r = (new NDNQueryFileInputResponseJsonCodec()).decode_object(json);
            if (r.err) {
                return r;
            }

            return Ok(r.unwrap());
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }
}