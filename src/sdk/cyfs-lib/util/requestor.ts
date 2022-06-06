import { HttpRequest } from "../base/http_request";
import { BaseRequestor, RequestorHelper } from "../base/base_requestor";
import { UtilGetDeviceRequest, UtilGetDeviceResponse, UtilGetDeviceStaticInfoRequest, UtilGetDeviceStaticInfoResponse, UtilGetNetworkAccessInfoRequest, UtilGetNetworkAccessInfoResponse, UtilGetNOCInfoRequest, UtilGetNOCInfoResponse, UtilGetOODStatusRequest, UtilGetOODStatusResponse, UtilGetSystemInfoRequest, UtilGetSystemInfoResponse, UtilGetVersionInfoRequest, UtilGetVersionInfoResponse, UtilGetZoneRequest, UtilGetZoneResponse, UtilRequestCommon, UtilResolveOODRequest, UtilResolveOODResponse } from "./request";
import { BuckyResult, CYFS_DEC_ID, CYFS_FLAGS, CYFS_OOD_DEVICE_ID, CYFS_TARGET, CYFS_ZONE_ID, DeviceDecoder, DeviceId, ObjectId, Err, Ok } from "../../cyfs-base";
import { ZoneDecoder, ZoneId } from "../../cyfs-core";
import { UtilBuildDirFromObjectMapOutputRequest, UtilBuildDirFromObjectMapOutputResponse, UtilGetDeviceStaticInfoOutputResponseJsonCodec, UtilGetNetworkAccessInfoOutputResponseJsonCodec, UtilGetOODStatusOutputResponseJsonCodec, UtilGetZoneOutputResponse, UtilResolveOODOutputResponseJsonCodec, UtilBuildDirFromObjectMapOutputRequestCodec, UtilBuildDirFromObjectMapOutputResponseJsonCodec } from "./output_request";

export class UtilRequestor {
    service_url: string;

    constructor(private requestor: BaseRequestor, private dec_id?: ObjectId) {
        this.service_url = `http://${requestor.remote_addr()}/util/`;
    }

    // url支持下面的格式，其中device_id是可选
    // {host:port}/util/{util_path}/[req_path/]object_id[/inner_path]
    format_url(
        util_path: string,
        req_path?: string,
        object_id?: ObjectId
    ): string {
        const parts = [];
        parts.push(util_path);
        if (req_path) {
            parts.push(req_path.replace(/^\/+|\/+$/g, ""));
        }
        if (object_id) {
            parts.push(object_id.to_base_58());
        }

        const p = parts.join("/");
        return this.service_url + p;
    }

    encode_common_headers(
        com_req: UtilRequestCommon,
        http_req: HttpRequest,
    ): void {
        if (com_req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, com_req.dec_id.to_string());
        } else if (this.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, this.dec_id.to_string());
        }

        if (com_req.target) {
            http_req.insert_header(CYFS_TARGET, com_req.target.to_string());
        }

        http_req.insert_header(CYFS_FLAGS, com_req.flags.toString());
    }

    encode_get_device_request(req: UtilGetDeviceRequest): HttpRequest {
        const url = this.format_url("device", req.common.req_path);
        const http_req = new HttpRequest('Get', url);
        this.encode_common_headers(req.common, http_req);
        return http_req;
    }

    async decode_get_device_response(resp: & Response): Promise<BuckyResult<UtilGetDeviceResponse>> {
        const buf = await resp.arrayBuffer();
        const r = new DeviceDecoder().from_raw(new Uint8Array(buf));
        if (r.err) {
            return r;
        }
        const device = r.unwrap();
        return Ok({
            device,
            device_id: device.device_id()
        })
    }

    // {serviceURL}/util/device
    public async get_device(req: UtilGetDeviceRequest): Promise<BuckyResult<UtilGetDeviceResponse>> {
        const http_req = this.encode_get_device_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            return await this.decode_get_device_response(resp)
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`get_device error: status=${resp.status}, `, e);
            return Err(e);
        }
    }

    encode_get_zone_request(req: UtilGetZoneRequest): HttpRequest {
        const url = this.format_url("zone", req.common.req_path, req.object_id);
        const http_req = new HttpRequest("Post", url);
        this.encode_common_headers(req.common, http_req);

        if (req.object_raw) {
            http_req.set_body(req.object_raw);
        }

        return http_req;
    }

    async decode_get_zone_response(resp: Response): Promise<BuckyResult<UtilGetZoneResponse>> {
        const buf = await resp.arrayBuffer();
        const r = new ZoneDecoder().from_raw(new Uint8Array(buf));
        if (r.err) {
            return r;
        }

        const zone_id = RequestorHelper.decode_header(resp, CYFS_ZONE_ID, s => ZoneId.from_base_58(s).unwrap());
        if (zone_id.err) {
            return zone_id;
        }

        const device_id = RequestorHelper.decode_header(resp, CYFS_OOD_DEVICE_ID, s => DeviceId.from_base_58(s).unwrap());
        if (device_id.err) {
            return device_id;
        }

        return Ok({
            zone: r.unwrap(),
            zone_id: zone_id.unwrap(),
            device_id: device_id.unwrap()
        })
    }

    // 根据device/people/simplegroup查询所在的zone
    // 如果已知object的内容，那么可以附带，加速non-stack的查询
    // xxx/util/zone[/object_id]
    public async get_zone(
        req: UtilGetZoneRequest,
    ): Promise<BuckyResult<UtilGetZoneOutputResponse>> {
        const http_req = this.encode_get_zone_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            const zone_resp = await this.decode_get_zone_response(resp);
            if (zone_resp.err) {
                return zone_resp;
            }

            return Ok(zone_resp.unwrap());
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    // url支持下面的格式，其中owner_id是可选
    // {host:port}/[req_path/]object_id?owner={owner_id}
    format_resolve_url(req_path: string | undefined, owner_id: ObjectId | undefined, object_id: ObjectId): string {
        let url = this.format_url("resolve_ood", req_path, object_id);

        if (owner_id) {
            url += `?owner=${owner_id}`
        }

        return url;
    }

    encode_resolve_ood_request(req: UtilResolveOODRequest): HttpRequest {
        const url = this.format_resolve_url(req.common.req_path, req.owner_id, req.object_id);

        // 目前没有body
        const http_req = new HttpRequest("Get", url);
        this.encode_common_headers(req.common, http_req);

        return http_req;
    }

    public async resolve_ood(
        req: UtilResolveOODRequest,
    ): Promise<BuckyResult<UtilResolveOODResponse>> {
        const http_req = this.encode_resolve_ood_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            const json = await resp.json();
            const r = new UtilResolveOODOutputResponseJsonCodec().decode_object(json);
            if (r.err) {
                return r;
            }

            return Ok(r.unwrap());
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    encode_get_ood_status_request(req: UtilGetOODStatusRequest): HttpRequest {
        const url = this.format_url("ood_status", req.common.req_path);
        const http_req = new HttpRequest("Get", url);
        this.encode_common_headers(req.common, http_req);

        return http_req
    }

    public async get_ood_status(
        req: UtilGetOODStatusRequest,
    ): Promise<BuckyResult<UtilGetOODStatusResponse>> {
        const http_req = this.encode_get_ood_status_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            const json = await resp.json();
            const r = new UtilGetOODStatusOutputResponseJsonCodec().decode_object(json);
            if (r.err) {
                return r;
            }

            return Ok(r.unwrap());
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    encode_get_noc_info_request(req: UtilGetNOCInfoRequest): HttpRequest {
        const url = this.format_url("noc_info", req.common.req_path);
        const http_req = new HttpRequest("Get", url);
        this.encode_common_headers(req.common, http_req);

        return http_req
    }

    public async get_noc_info(
        req: UtilGetNOCInfoRequest,
    ): Promise<BuckyResult<UtilGetNOCInfoResponse>> {
        const http_req = this.encode_get_noc_info_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            const json = await resp.json();
            return Ok(json as UtilGetNOCInfoResponse);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    encode_get_network_access_info_request(req: UtilGetNetworkAccessInfoRequest): HttpRequest {
        const url = this.format_url("network_access_info", req.common.req_path);
        const http_req = new HttpRequest("Get", url);
        this.encode_common_headers(req.common, http_req);

        return http_req;
    }

    public async get_network_access_info(
        req: UtilGetNetworkAccessInfoRequest,
    ): Promise<BuckyResult<UtilGetNetworkAccessInfoResponse>> {
        const http_req = this.encode_get_network_access_info_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            const json = await resp.json();
            const r = new UtilGetNetworkAccessInfoOutputResponseJsonCodec().decode_object(json);
            if (r.err) {
                return r;
            }

            return Ok(r.unwrap());
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    encode_get_device_static_info_request(req: UtilGetDeviceStaticInfoRequest): HttpRequest {
        const url = this.format_url("device_static_info", req.common.req_path);
        const http_req = new HttpRequest("Get", url);
        this.encode_common_headers(req.common, http_req);

        return http_req;
    }

    public async get_device_static_info(
        req: UtilGetDeviceStaticInfoRequest,
    ): Promise<BuckyResult<UtilGetDeviceStaticInfoResponse>> {
        const http_req = this.encode_get_device_static_info_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            const json = await resp.json();
            const r = new UtilGetDeviceStaticInfoOutputResponseJsonCodec().decode_object(json);
            if (r.err) {
                return r;
            }

            return Ok(r.unwrap());
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    encode_get_system_info_request(req: UtilGetSystemInfoRequest): HttpRequest {
        const url = this.format_url("system_info", req.common.req_path);
        const http_req = new HttpRequest("Get", url);
        this.encode_common_headers(req.common, http_req);

        return http_req
    }

    public async get_system_info(
        req: UtilGetSystemInfoRequest,
    ): Promise<BuckyResult<UtilGetSystemInfoResponse>> {
        const http_req = this.encode_get_system_info_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            const json = await resp.json();
            return Ok(json as UtilGetSystemInfoResponse);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    encode_get_version_info_request(req: UtilGetVersionInfoRequest): HttpRequest {
        const url = this.format_url("version_info", req.common.req_path);
        const http_req = new HttpRequest("Get", url);
        this.encode_common_headers(req.common, http_req);

        return http_req
    }

    public async get_version_info(
        req: UtilGetVersionInfoRequest,
    ): Promise<BuckyResult<UtilGetVersionInfoResponse>> {
        const http_req = this.encode_get_version_info_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            const json = await resp.json();
            return Ok(json as UtilGetVersionInfoResponse);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }

    encode_build_dir_from_object_map_request(req: UtilBuildDirFromObjectMapOutputRequest): HttpRequest {
        const url = this.format_url("build_dir_from_object_map", req.common.req_path);
        const http_req = new HttpRequest("Post", url);
        http_req.set_json_body(new UtilBuildDirFromObjectMapOutputRequestCodec().encode_object(req));

        return http_req
    }

    public async build_dir_from_object_map(
        req: UtilBuildDirFromObjectMapOutputRequest
    ): Promise<BuckyResult<UtilBuildDirFromObjectMapOutputResponse>> {
        const http_req = this.encode_build_dir_from_object_map_request(req);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        if (resp.status === 200) {
            const json = await resp.json();
            const resp_obj = new UtilBuildDirFromObjectMapOutputResponseJsonCodec().decode_object(json);
            if (resp_obj.err) {
                return resp_obj
            }

            return Ok(resp_obj.unwrap())
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }
}