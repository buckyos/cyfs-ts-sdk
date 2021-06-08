import { HttpRequest } from "../base/http_request";
import { HttpRequestor, RequestorHelper } from "../base/base_requestor";
import { Err, Ok } from "ts-results";
import { ResolveOodRequest, ResolveOodResponse } from "./request";
import { BuckyError, BuckyResult, CYFS_OOD_DEVICE_ID, CYFS_ZONE_ID, Device, DeviceDecoder, Endpoint, Option, People, PeopleId } from "../../cyfs-base";
import { DeviceId } from "../../cyfs-base/objects/device";
import { ObjectId } from "../../cyfs-base/objects/object_id";
import { Zone, ZoneDecoder, ZoneId } from "../../cyfs-core/zone/zone";
import { fromHexString } from "../../cyfs-base/base/bucky_buffer";

interface DeviceStaticInfoRaw {
    device_id: string,
    device: string,
    zone_id: string,
    ood_device_id: string,
    owner_id?: string,
    is_ood_device: boolean,
    cyfs_root: string
}

interface DeviceStaticInfo {
    device_id: DeviceId,
    device: Device,
    zone_id: ZoneId,
    ood_device_id: DeviceId,
    owner_id?: ObjectId,
    is_ood_device: boolean,
    cyfs_root: string
}

interface OODStatus {
    network: string,
    first_ping: number,
    first_success_ping: number,
    last_success_ping: number,
    last_ping: number,
    last_ping_result: number,
    ping_count: number,
    ping_success_count: number,
    cont_fail_count: number,
    ping_avg_during: number,
    ping_max_during: number,
    ping_min_during: number,
}

interface SystemInfo {
    name: string,             // 系统名字
    cpu_usage: number,        // cpu占用率，百分比

    total_memory: number,     // 系统总内存，字节
    used_memory: number,      // 系统已经使用的内存，字节
    
    received_bytes: number,   // 系统下载速度，字节
    transmitted_bytes: number // 系统上传速度，字节
}

interface BdtNetworkAccessEndpoint {
    lan_ep: Endpoint,
    wan_ep: Endpoint,
    access_type: "nat" | "wan"
}

interface BdtNetworkAccessEndpointRaw {
    lan_ep: string,
    wan_ep: string,
    access_type: "nat" | "wan"
}

function decode_network_access_endpoint(e: BdtNetworkAccessEndpointRaw): BuckyResult<BdtNetworkAccessEndpoint> {
    let lan_ep;
    {
        const ret = Endpoint.fromString(e.lan_ep);
        if (ret.err) {
            return ret;
        }
        lan_ep = ret.unwrap();
    }

    let wan_ep;
    {
        const ret = Endpoint.fromString(e.wan_ep);
        if (ret.err) {
            return ret;
        }
        wan_ep = ret.unwrap();
    }

    return Ok({
        lan_ep,
        wan_ep,
        access_type: e.access_type
    });
}

interface SNInfo {
    sn: DeviceId,
    sn_status: "init" | "connecting" | "online" | "offline";
}

interface SNInfoRaw {
    sn: string,
    sn_status: "init" | "connecting" | "online" | "offline";
}

function decode_sn_info(e: SNInfoRaw): BuckyResult<SNInfo> {
    let sn;
    {
        const ret = DeviceId.from_base_58(e.sn);
        if (ret.err) {
            return ret;
        }
        sn = ret.unwrap();
    }

    return Ok({
        sn,
        sn_status: e.sn_status
    });
}

interface NetworkAccessInfo {
    v4: BdtNetworkAccessEndpoint[],
    v6: BdtNetworkAccessEndpoint[],
    sn: SNInfo[]
}

interface NetworkAccessInfoRaw {
    v4: BdtNetworkAccessEndpointRaw[],
    v6: BdtNetworkAccessEndpointRaw[],
    sn: SNInfoRaw[]
}

interface NOCStat {
    count: number,            // 对象个数
    storage_size: number      // 对象占用的磁盘空间，字节
}

export class UtilRequestor {
    serviceURL: string;

    constructor(private requestor: HttpRequestor) {
        this.serviceURL = `http://${requestor.remote_addr()}/util/`;
    }

    // {serviceURL}/util/device
    public async get_current_device(): Promise<BuckyResult<[DeviceId, Device]>> {
        const url = `${this.serviceURL}device`;
        console.log('get_current_device', url);
        const httpReq = new HttpRequest('GET', url);

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            const buf = await resp.arrayBuffer();
            const [device] = new DeviceDecoder().raw_decode(new Uint8Array(buf)).unwrap();
            const deviceId = device.device_id();
            const ret: [DeviceId, Device] = [deviceId, device];
            return Ok(ret);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`get_current_device to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // {serviceURL}/util/device/static_info
    public async get_device_static_info(target: Option<DeviceId> | undefined): Promise<BuckyResult<DeviceStaticInfo>> {
        // ## Device 静态信息
        // * GET http://127.0.0.1:1322/util/device/static_info
        // * 获取本地 device 的一些静态信息(一般情况下不会改变，不需要频繁刷新)，runtime 和 gateway 等内置了NON协议栈的都提供了此接口
        //
        // ## 返回值包含下列信息
        // * device_id 当前设备信息(一般是浏览器对 runtime 发起调用，但 gateway 等其余 NON 协议栈也提供了对等接口)
        // * device 对象(用 js sdk 可以解码对象，提取内部的区域码信息)，[需要解码]
        // * zone_id 当前 device 所属 zone
        // * ood_device_id 当前 zone 的主 ood 设备信息
        // * owner_id 当前 zone 的 owner ，注意这个字段可能不存在，比如 device 没 owner ，那么就是属于孤立 device ，自己就是一个 zone
        // * is_ood_device 当前 device 本身是不是 ood （一般在 runtime 上调用返回是 false，在 gateway 上调用返回 true ）
        // * cyfs_root 当前协议栈的cyfs根目录

        let url = `${this.serviceURL}device/static_info/`;
        if (target && target.is_some()) {
            url = `${url}${target.unwrap().to_base_58()}`;
        }
        console.log('get_device_static_info', url);
        const httpReq = new HttpRequest('GET', url);

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            const text = await resp.text();
            let info: DeviceStaticInfoRaw;
            try {
                info = JSON.parse(text);
            } catch (e) {
                const msg = `get_device_static_info from non stack failed: status=${resp.status} msg=${text}, json parse error.`;
                console.error(msg);
                return Err(BuckyError.from(msg));
            }
            const [device] = new DeviceDecoder().raw_decode(fromHexString(info.device)).unwrap();
            // const deviceId = device.device_id();
            // const ret: [DeviceId, Device] = [deviceId, device];

            let owner_id;
            if (info.owner_id) {
                owner_id = ObjectId.from_base_58(info.owner_id!).unwrap();
            }

            const typed_info: DeviceStaticInfo = {
                device_id: DeviceId.try_from_object_id(ObjectId.from_base_58(info.device_id).unwrap()).unwrap(),
                device,
                zone_id: ZoneId.try_from_object_id(ObjectId.from_base_58(info.zone_id).unwrap()).unwrap(),
                ood_device_id: DeviceId.try_from_object_id(ObjectId.from_base_58(info.ood_device_id).unwrap()).unwrap(),
                owner_id,
                is_ood_device: info.is_ood_device,
                cyfs_root: info.cyfs_root
            };

            return Ok(typed_info);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`get_device_static_info from non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // {serviceURL}/util/device/system_info
    public async get_system_info(target: Option<DeviceId> | undefined): Promise<BuckyResult<SystemInfo>> {
        // ## Device 所在的一些系统信息
        // * GET http://127.0.0.1:1322/util/device/system_info


        let url = `${this.serviceURL}device/system_info/`;
        if (target && target.is_some()) {
            url = `${url}${target.unwrap().to_base_58()}`;
        }
        console.log('get_system_info', url);
        const httpReq = new HttpRequest('GET', url);

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            const text = await resp.text();
            let info: SystemInfo;
            try {
                info = JSON.parse(text);
            } catch (e) {
                const msg = `get_system_info from non stack failed: status=${resp.status} msg=${text}, json parse error.`;
                console.error(msg);
                return Err(BuckyError.from(msg));
            }

            return Ok(info);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`get_system_info from non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // {serviceURL}/util/zone
    public async get_current_zone(): Promise<BuckyResult<[Zone, ZoneId, DeviceId]>> {
        const url = `${this.serviceURL}zone`;
        const httpReq = new HttpRequest('GET', url);

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            const zone_id = (await RequestorHelper.decode_header<ZoneId>(resp, CYFS_ZONE_ID, (s) => {
                return ZoneId.from_base_58(s).unwrap();
            })).unwrap();
            const ood_device_id = (await RequestorHelper.decode_header<DeviceId>(resp, CYFS_OOD_DEVICE_ID, (s: string) => {
                return DeviceId.from_base_58(s).unwrap();
            })).unwrap();
            let zone_ret = new ZoneDecoder().from_raw(new Uint8Array(await resp.arrayBuffer()));
            if (zone_ret.err) {
                return zone_ret;
            }
            return Ok([zone_ret.unwrap(), zone_id, ood_device_id] as [Zone, ZoneId, DeviceId]);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`get_current_zone to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // {serviceURL}/util/zone/{object_id}
    public async get_zone(object_id: ObjectId, object_raw: Option<Uint8Array>): Promise<BuckyResult<[Zone, ZoneId, DeviceId]>> {
        const url = `${this.serviceURL}zone/${object_id}`;
        const httpReq = new HttpRequest('POST', url);
        if (object_raw.is_some()) {
            httpReq.set_body(object_raw.unwrap());
        }

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            const zone_id = (await RequestorHelper.decode_header<ZoneId>(resp, CYFS_ZONE_ID, (s) => {
                return ZoneId.from_base_58(s).unwrap();
            })).unwrap();
            const ood_device_id = (await RequestorHelper.decode_header<DeviceId>(resp, CYFS_OOD_DEVICE_ID, (s: string) => {
                return DeviceId.from_base_58(s).unwrap();
            })).unwrap();
            const zone_ret = new ZoneDecoder().from_raw(new Uint8Array(await resp.arrayBuffer()));
            if (zone_ret.err) {
                return zone_ret;
            }
            return Ok([zone_ret.unwrap(), zone_id, ood_device_id] as [Zone, ZoneId, DeviceId]);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`get_zone to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // {serviceURL}/util/ood_status
    public async get_ood_status(): Promise<BuckyResult<OODStatus>> {
        const url = `${this.serviceURL}ood_status`;
        console.log('get_ood_status', url);
        const httpReq = new HttpRequest('GET', url);

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            const text = await resp.text();
            let info: OODStatus;
            try {
                info = JSON.parse(text);
            } catch (e) {
                const msg = `get_ood_status to non stack failed: status=${resp.status} msg=${text}, json parse error.`;
                console.error(msg);
                return Err(BuckyError.from(msg));
            }
            return Ok(info);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`get_ood_status to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // {serviceURL}/util/noc/stat
    public async get_noc_stat(): Promise<BuckyResult<NOCStat>> {
        const url = `${this.serviceURL}noc/stat`;
        console.log('get_noc_stat', url);
        const httpReq = new HttpRequest('GET', url);

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            const text = await resp.text();
            let info: NOCStat;
            try {
                info = JSON.parse(text);
            } catch (e) {
                const msg = `get_noc_stat to non stack failed: status=${resp.status} msg=${text}, json parse error.`;
                console.error(msg);
                return Err(BuckyError.from(msg));
            }
            return Ok(info);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`get_noc_stat to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // {serviceURL}/bdt/network_access_info/
    public async get_network_access_info(target: Option<DeviceId> | undefined): Promise<BuckyResult<NetworkAccessInfo>> {
        let url = `${this.serviceURL}bdt/network_access_info/`;
        if (target && target.is_some()) {
            url = `${url}${target.unwrap().to_base_58()}`;
        }
        console.log('get_network_access_info', url);
        const httpReq = new HttpRequest('GET', url);

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            const text = await resp.text();
            let info: NetworkAccessInfoRaw;
            try {
                info = JSON.parse(text);
            } catch (e) {
                const msg = `get_network_access_info to non stack failed: status=${resp.status} msg=${text}, json parse error.`;
                console.error(msg);
                return Err(BuckyError.from(msg));
            }

            const ret: NetworkAccessInfo = {
                v4: [],
                v6: [],
                sn: []
            };

            for (const e of info.v4) {
                const r = decode_network_access_endpoint(e);
                if (r.err) {
                    return r;
                }
                ret.v4.push(r.unwrap());
            }

            for (const e of info.v6) {
                const r = decode_network_access_endpoint(e);
                if (r.err) {
                    return r;
                }
                ret.v6.push(r.unwrap());
            }

            for (const e of info.sn) {
                const r = decode_sn_info(e);
                if (r.err) {
                    return r;
                }
                ret.sn.push(r.unwrap());
            }

            return Ok(ret);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`get_network_access_info to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    format_resolve_url(owner_id: ObjectId | undefined, object_id: ObjectId): string {
        let url = `${this.serviceURL}device/`;
        if (owner_id) {
            url = `${url}${owner_id}/`;
        }

        url = `${url}${object_id}`;
        return url;
    }

    encode_resolve_request(req: ResolveOodRequest): HttpRequest {
        const url = this.format_resolve_url(req.owner_id, req.object_id);

        return new HttpRequest('GET', url);
    }

    public async resolve_ood(req: ResolveOodRequest): Promise<BuckyResult<ResolveOodResponse>> {
        const http_req = this.encode_resolve_request(req);

        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            const r = await ResolveOodResponse.from_respone(resp);
            return Ok(r);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`reslove ood failed: obj=${req.object_id}, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }
}