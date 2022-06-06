import { Attributes, CYFS_ATTRIBUTES, CYFS_OBJECT_ID, BuckyResult, CYFS_API_LEVEL, CYFS_DEC_ID, CYFS_FLAGS, CYFS_NDN_ACTION, CYFS_REFERER_OBJECT, CYFS_RESULT, CYFS_TARGET, Err, ObjectId, Ok } from "../../cyfs-base";
import { BaseRequestor, RequestorHelper } from "../base/base_requestor";
import { HttpRequest } from "../base/http_request";
import { NDNAction, NDNPutDataResult } from "./def";
import { NDNQueryFileInputResponseJsonCodec, ndn_query_file_param_to_key_pair } from './input_request';
import { NDNDeleteDataOutputRequest, NDNDeleteDataOutputResponse, NDNGetDataOutputRequest, NDNGetDataOutputResponse, NDNOutputRequestCommon, NDNPutDataOutputRequest, NDNPutDataOutputResponse, NDNQueryFileOutputRequest, NDNQueryFileOutputResponse, NDNQueryFileOutputResponseJsonCodec } from "./output_request";

export class NDNRequestor {
    service_url: string

    constructor(private requestor: BaseRequestor, private dec_id?: ObjectId) {
        this.service_url = `http://${requestor.remote_addr()}/ndn/`;
    }

    // url支持下面的格式，其中device_id是可选
    // {host:port}/ndn/[req_path/]object_id[/inner_path]
    format_url(
        req_path: string | undefined,
        object_id?: ObjectId,
        inner_path?: string,
    ): string {
        const parts = [];
        if (req_path) {
            parts.push(req_path.replace(/^\/+|\/+$/g, ""));
        }

        if (object_id) {
            parts.push(object_id.to_base_58());
        }

        if (inner_path) {
            parts.push(inner_path.replace(/^\/+|\/+$/g, ""));
        }

        const p = parts.join("/");
        return this.service_url + p;
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

        if (com_req.referer_object.length > 0) {
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

        if (com_req.referer_object.length > 0) {
            for (const object of com_req.referer_object) {
                querys.append(CYFS_REFERER_OBJECT, object.toString());
            }
        }

        querys.append(CYFS_FLAGS, com_req.flags.toString());

        return querys.toString();
    }

    encode_put_data_request(req: NDNPutDataOutputRequest): HttpRequest {
        const url = this.format_url(req.common.req_path, req.object_id);

        const http_req = new HttpRequest("Put", url);

        this.encode_common_headers(NDNAction.PutData, req.common, http_req);

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

    async put_data(req: NDNPutDataOutputRequest): Promise<BuckyResult<NDNPutDataOutputResponse>> {
        const http_req = this.encode_put_data_request(req);

        http_req.set_body(req.data);
        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            console.info("put data to ndn service success:", req.object_id);
            return await this.decode_put_data_response(resp);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    // 直接使用url+get来触发一个下载请求
    prepare_download_data(req: NDNGetDataOutputRequest): string {
        const url = this.format_url(
            req.common.req_path,
            req.object_id,
            req.inner_path,
        );

        const querys = this.encode_common_headers_to_query(NDNAction.GetData, req.common);
        return url + "?" + querys;
    }

    private encode_get_data_request(req: NDNGetDataOutputRequest): HttpRequest {
        const url = this.format_url(
            req.common.req_path,
            req.object_id,
            req.inner_path,
        );

        const http_req = new HttpRequest("Post", url);
        this.encode_common_headers(NDNAction.GetData, req.common, http_req);

        return http_req;
    }

    private async decode_get_data_response(
        _req: NDNGetDataOutputRequest,
        resp: Response,
    ): Promise<BuckyResult<NDNGetDataOutputResponse>> {
        const data = await resp.arrayBuffer();

        const attr = RequestorHelper.decode_optional_header(resp, CYFS_ATTRIBUTES, s => parseInt(s, 10)).unwrap().to(v => new Attributes(v));

        const object_id = RequestorHelper.decode_header(resp, CYFS_OBJECT_ID, s => ObjectId.from_base_58(s).unwrap());
        if (object_id.err) {
            return object_id;
        }
        const length =
            RequestorHelper.decode_header(resp, "content-length", s => parseInt(s, 10));
        if (length.err) {
            return length;
        }
        const ret = {
            object_id: object_id.unwrap(),
            attr: attr.is_some() ? attr.unwrap() : undefined,

            length: length.unwrap(),
            data: new Uint8Array(data),
        };

        return Ok(ret);
    }

    async get_data(
        req: NDNGetDataOutputRequest,
    ): Promise<BuckyResult<NDNGetDataOutputResponse>> {
        const http_req = this.encode_get_data_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            console.info("get data from ndn service success:", req.object_id);
            return await this.decode_get_data_response(req, resp);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    encode_delete_data_request(req: NDNDeleteDataOutputRequest): HttpRequest {
        const url = this.format_url(
            req.common.req_path,
            req.object_id,
            req.inner_path,
        );

        const http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(NDNAction.DeleteData, req.common, http_req);

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

        if (resp.status === 200) {
            console.info("delete data from ndn service success:", req.object_id);
            return await this.decode_delete_data_response(resp);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    encode_query_file_request(req: NDNQueryFileOutputRequest): HttpRequest {
        const url = this.format_url(
            req.common.req_path,
        );

        const querys = new URLSearchParams();
        const [t, v] = ndn_query_file_param_to_key_pair(req.param);
        querys.append("type", t);
        querys.append("value", v);

        const full_url = url + "?" + querys.toString();

        const http_req = new HttpRequest("Post", full_url);
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

        if (resp.status === 200) {
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