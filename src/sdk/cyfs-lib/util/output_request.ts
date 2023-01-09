import JSBI from "jsbi";
import { BuckyResult, CyfsChannel, Device, DeviceDecoder, DeviceId, Endpoint, ObjectId, Ok, OODWorkMode } from "../../cyfs-base";
import { Zone, ZoneId } from "../../cyfs-core";
import { JsonCodec, JsonCodecHelper } from "../base/codec";
import { GlobalStateAccessMode } from '../root_state/def';
import { ZoneRole } from '../zone/def';
import { NamedObjectCacheStat, SnStatus, SystemInfo } from "./def";
import { BuildDirType } from "./request";

export interface UtilOutputRequestCommon {
    // 请求路径，可为空
    req_path?: string;

    // 来源DEC
    dec_id?: ObjectId;

    // 用以默认行为
    target?: ObjectId;

    flags: number;
}

export class UtilOutputRequestCommonJsonCodec extends JsonCodec<UtilOutputRequestCommon> {
    constructor() { super(); }
    encode_object(param: UtilOutputRequestCommon): any {
        return {
            req_path: param.req_path,
            dec_id: param.dec_id?.to_base_58(),
            target: param.target?.to_base_58(),
            flags: param.flags
        }
    }
    decode_object(o: any): BuckyResult<UtilOutputRequestCommon> {
        let dec_id;
        if (o.dec_id) {
            const r = ObjectId.from_base_58(o.dec_id);
            if (r.err) {
                return r;
            }
            dec_id = r.unwrap()
        }

        let target;
        if (o.target) {
            const r = ObjectId.from_base_58(o.target);
            if (r.err) {
                return r;
            }
            target = r.unwrap()
        }

        return Ok({
            req_path: o.req_path,
            dec_id,
            target,
            flags: o.flags
        });
    }
}

export interface UtilGetDeviceOutputRequest {
    common: UtilOutputRequestCommon;
}

export interface UtilGetDeviceOutputResponse {
    device_id: DeviceId;
    device: Device;
}

export interface UtilGetZoneOutputRequest {
    common: UtilOutputRequestCommon;

    object_id?: ObjectId;
    object_raw?: Uint8Array;
}

export interface UtilGetZoneOutputResponse {
    zone_id: ZoneId;
    zone: Zone;
    device_id: DeviceId;
}

export interface UtilResolveOODOutputRequest {
    common: UtilOutputRequestCommon;

    object_id: ObjectId;
    owner_id?: ObjectId;
}

export interface UtilResolveOODOutputResponse {
    device_list: DeviceId[];
}

export class UtilResolveOODOutputResponseJsonCodec extends JsonCodec<UtilResolveOODOutputResponse> {
    constructor() { super(); }
    decode_object(o: any): BuckyResult<UtilResolveOODOutputResponse> {
        const device_list: DeviceId[] = [];
        for (const deviceid of o.device_list) {
            const r = DeviceId.from_base_58(deviceid);
            if (r.err) {
                return r;
            }
            device_list.push(r.unwrap());
        }
        return Ok({ device_list })
    }
}

export enum OODNetworkType {
    Unknown = 'unknown',
    Intranet = 'intranet',
    Extranet = 'extranet',
}

export interface OODStatus {
    network: OODNetworkType;

    first_ping: JSBI;
    first_success_ping: JSBI;
    last_success_ping: JSBI;

    last_ping: JSBI;
    last_ping_result: number;

    ping_count: number;
    ping_success_count: JSBI;

    // 当前连续失败的次数，成功后重置
    cont_fail_count: number;

    ping_avg_during: JSBI;
    ping_max_during: JSBI;
    ping_min_during: JSBI;

    // current zone's ood
    ood_device_id: DeviceId,

    // is root-state sync enable on this device
    enable_sync: boolean;

    // device local root-state
    device_root_state: ObjectId;
    device_root_state_revision: JSBI;

    // zone local root-state
    zone_root_state?: ObjectId;
    zone_root_state_revision: JSBI;
}

export class OODStatusJsonCodec extends JsonCodec<OODStatus> {
    constructor() { super(); }

    decode_object(o: any): BuckyResult<OODStatus> {
        let first_ping;
        {
            const r = JsonCodecHelper.decode_big_int(o.first_ping);
            if (r.err) {
                return r;
            }
            first_ping = r.unwrap();
        }

        let first_success_ping;
        {
            const r = JsonCodecHelper.decode_big_int(o.first_success_ping);
            if (r.err) {
                return r;
            }
            first_success_ping = r.unwrap();
        }

        let last_success_ping;
        {
            const r = JsonCodecHelper.decode_big_int(o.last_success_ping);
            if (r.err) {
                return r;
            }
            last_success_ping = r.unwrap();
        }

        let last_ping;
        {
            const r = JsonCodecHelper.decode_big_int(o.last_ping);
            if (r.err) {
                return r;
            }
            last_ping = r.unwrap();
        }

        let ping_success_count;
        {
            const r = JsonCodecHelper.decode_big_int(o.ping_success_count);
            if (r.err) {
                return r;
            }
            ping_success_count = r.unwrap();
        }

        let ping_avg_during;
        {
            const r = JsonCodecHelper.decode_big_int(o.ping_avg_during);
            if (r.err) {
                return r;
            }
            ping_avg_during = r.unwrap();
        }


        let ping_max_during;
        {
            const r = JsonCodecHelper.decode_big_int(o.ping_max_during);
            if (r.err) {
                return r;
            }
            ping_max_during = r.unwrap();
        }

        let ping_min_during;
        {
            const r = JsonCodecHelper.decode_big_int(o.ping_min_during);
            if (r.err) {
                return r;
            }
            ping_min_during = r.unwrap();
        }

        let ood_device_id;
        {
            const r = DeviceId.from_base_58(o.ood_device_id);
            if (r.err) {
                return r;
            }
            ood_device_id = r.unwrap();
        }

        const enable_sync = o.enable_sync as boolean;

        let device_root_state;
        {
            const r = ObjectId.from_base_58(o.device_root_state);
            if (r.err) {
                return r;
            }
            device_root_state = r.unwrap();
        }
        let device_root_state_revision;
        {
            const r = JsonCodecHelper.decode_big_int(o.device_root_state_revision);
            if (r.err) {
                return r;
            }
            device_root_state_revision = r.unwrap();
        }

        let zone_root_state;
        if (o.zone_root_state) {
            const r = ObjectId.from_base_58(o.zone_root_state);
            if (r.err) {
                return r;
            }
            zone_root_state = r.unwrap();
        }
        let zone_root_state_revision;
        {
            const r = JsonCodecHelper.decode_big_int(o.zone_root_state_revision);
            if (r.err) {
                return r;
            }
            zone_root_state_revision = r.unwrap();
        }


        return Ok({
            network: o.network as OODNetworkType,
            first_ping,
            first_success_ping,
            last_success_ping,

            last_ping,
            last_ping_result: o.last_ping_result,

            ping_count: o.ping_count,
            ping_success_count,

            cont_fail_count: o.cont_fail_count,

            ping_avg_during,
            ping_max_during,
            ping_min_during,

            ood_device_id,
            enable_sync,

            device_root_state,
            device_root_state_revision,

            zone_root_state,
            zone_root_state_revision,
        })
    }
}

export interface UtilGetOODStatusOutputRequest {
    common: UtilOutputRequestCommon;
}

export interface UtilGetOODStatusOutputResponse {
    status: OODStatus;
}

export class UtilGetOODStatusOutputResponseJsonCodec extends JsonCodec<UtilGetOODStatusOutputResponse> {
    constructor() { super() }

    decode_object(o: any): BuckyResult<UtilGetOODStatusOutputResponse> {
        const r = new OODStatusJsonCodec().decode_object(o.status);
        if (r.err) {
            return r;
        }
        return Ok({ status: r.unwrap() });
    }
}

export interface UtilGetNOCInfoOutputRequest {
    common: UtilOutputRequestCommon;
}

export interface UtilGetNOCInfoOutputResponse {
    stat: NamedObjectCacheStat;
}

export interface DeviceStaticInfo {
    // 当前设备id
    device_id: DeviceId;
    device: Device;

    // 当前设备是不是ood
    is_ood_device: boolean;

    ood_work_mode: OODWorkMode,

    zone_role: ZoneRole,

    root_state_access_mode: GlobalStateAccessMode,
    local_cache_access_mode: GlobalStateAccessMode,

    // 当前zone的主ood id
    ood_device_id: DeviceId;

    // 当前所属zone
    zone_id: ZoneId;

    // 当前zone的owner
    owner_id?: ObjectId;

    // 当前协议栈的cyfs根目录
    cyfs_root: string;

    // current sn list config
    sn_list: DeviceId[],
    known_sn_list: DeviceId[],
}

export class DeviceStaticInfoJsonCodec extends JsonCodec<DeviceStaticInfo> {
    constructor() { super(); }
    decode_object(o: any): BuckyResult<DeviceStaticInfo> {
        let device_id;
        {
            const r = DeviceId.from_base_58(o.device_id);
            if (r.err) {
                return r;
            }
            device_id = r.unwrap();
        }

        let device;
        {
            const r = new DeviceDecoder().from_hex(o.device);
            if (r.err) {
                return r;
            }
            device = r.unwrap();
        }

        let ood_device_id;
        {
            const r = DeviceId.from_base_58(o.ood_device_id);
            if (r.err) {
                return r;
            }
            ood_device_id = r.unwrap();
        }

        let zone_id;
        {
            const r = ZoneId.from_base_58(o.zone_id);
            if (r.err) {
                return r;
            }
            zone_id = r.unwrap();
        }

        let owner_id;
        if (o.owner_id) {
            const r = ObjectId.from_base_58(o.owner_id);
            if (r.err) {
                return r;
            }
            owner_id = r.unwrap();
        }

        const sn_list = [];
        for (const id of o.sn_list) {
            const r = DeviceId.from_base_58(id);
            if (r.err) {
                return r;
            }
            sn_list.push(r.unwrap())
        }

        const known_sn_list = [];
        for (const id of o.known_sn_list) {
            const r = DeviceId.from_base_58(id);
            if (r.err) {
                return r;
            }
            known_sn_list.push(r.unwrap())
        }


        return Ok({
            device_id,
            device,
            is_ood_device: o.is_ood_device,
            ood_work_mode: o.ood_work_mode as OODWorkMode,
            zone_role: o.zone_role as ZoneRole,

            root_state_access_mode: o.root_state_access_mode as GlobalStateAccessMode,
            local_cache_access_mode: o.local_cache_access_mode as GlobalStateAccessMode,

            ood_device_id,
            zone_id,
            owner_id,
            cyfs_root: o.cyfs_root,
            sn_list,
            known_sn_list
        })
    }
}

export interface UtilGetDeviceStaticInfoOutputRequest {
    common: UtilOutputRequestCommon;
}

export interface UtilGetDeviceStaticInfoOutputResponse {
    info: DeviceStaticInfo;
}

export class UtilGetDeviceStaticInfoOutputResponseJsonCodec extends JsonCodec<UtilGetDeviceStaticInfoOutputResponse> {
    constructor() { super(); }
    decode_object(o: any): BuckyResult<UtilGetDeviceStaticInfoOutputResponse> {
        let info;
        {
            const r = new DeviceStaticInfoJsonCodec().decode_object(o.info);
            if (r.err) {
                return r;
            }
            info = r.unwrap();
        }

        return Ok({ info })
    }
}

export enum BdtNetworkAccessType {
    NAT = 'nat',
    WAN = 'wan',
}

export interface BdtNetworkAccessEndpoint {
    lan_ep: Endpoint;
    wan_ep: Endpoint;

    access_type: BdtNetworkAccessType;
}

export class BdtNetworkAccessEndpointJsonCodec extends JsonCodec<BdtNetworkAccessEndpoint> {
    constructor() { super(); }
    decode_object(o: any): BuckyResult<BdtNetworkAccessEndpoint> {
        let lan_ep;
        {
            const r = Endpoint.fromString(o.lan_ep);
            if (r.err) {
                return r;
            }
            lan_ep = r.unwrap();
        }

        let wan_ep;
        {
            const r = Endpoint.fromString(o.wan_ep);
            if (r.err) {
                return r;
            }
            wan_ep = r.unwrap();
        }

        return Ok({
            lan_ep,
            wan_ep,
            access_type: o.access_type as BdtNetworkAccessType
        });
    }
}

export interface BdtNetworkAccessSn {
    sn: DeviceId;
    sn_status: SnStatus;
}

export class BdtNetworkAccessSnJsonCodec extends JsonCodec<BdtNetworkAccessSn> {
    constructor() { super(); }
    decode_object(o: any): BuckyResult<BdtNetworkAccessSn> {
        let sn;
        {
            const r = DeviceId.from_base_58(o.sn);
            if (r.err) {
                return r;
            }
            sn = r.unwrap();
        }

        return Ok({
            sn,
            sn_status: o.sn_status as SnStatus
        });
    }
}

export interface BdtNetworkAccessInfo {
    v4: BdtNetworkAccessEndpoint[];
    v6: BdtNetworkAccessEndpoint[];

    sn: BdtNetworkAccessSn[];
}

export class BdtNetworkAccessInfoJsonCodec extends JsonCodec<BdtNetworkAccessInfo> {
    constructor() { super(); }
    decode_object(o: any): BuckyResult<BdtNetworkAccessInfo> {
        const v4 = [];
        for (const endpoint of o.v4) {
            const r = new BdtNetworkAccessEndpointJsonCodec().decode_object(endpoint)
            if (r.err) {
                return r;
            }
            v4.push(r.unwrap())
        }

        const v6 = [];
        for (const endpoint of o.v6) {
            const r = new BdtNetworkAccessEndpointJsonCodec().decode_object(endpoint)
            if (r.err) {
                return r;
            }
            v6.push(r.unwrap())
        }

        const sn = [];
        for (const endpoint of o.sn) {
            const r = new BdtNetworkAccessSnJsonCodec().decode_object(endpoint)
            if (r.err) {
                return r;
            }
            sn.push(r.unwrap())
        }

        return Ok({
            v4,
            v6,
            sn
        });
    }
}

export interface UtilGetNetworkAccessInfoOutputRequest {
    common: UtilOutputRequestCommon;
}

export interface UtilGetNetworkAccessInfoOutputResponse {
    info: BdtNetworkAccessInfo;
}

export class UtilGetNetworkAccessInfoOutputResponseJsonCodec extends JsonCodec<UtilGetNetworkAccessInfoOutputResponse> {
    constructor() { super(); }
    decode_object(o: any): BuckyResult<UtilGetNetworkAccessInfoOutputResponse> {
        let info;
        {
            const r = new BdtNetworkAccessInfoJsonCodec().decode_object(o.info);
            if (r.err) {
                return r;
            }
            info = r.unwrap();
        }

        return Ok({ info })
    }
}

export interface UtilGetSystemInfoOutputRequest {
    common: UtilOutputRequestCommon;
}

export interface UtilGetSystemInfoOutputResponse {
    info: SystemInfo;
}

export interface VersionInfo {
    version: string;
    channel: CyfsChannel;
    target: string;
}

export interface UtilGetVersionInfoOutputRequest {
    common: UtilOutputRequestCommon;
}

export interface UtilGetVersionInfoOutputResponse {
    info: VersionInfo;
}

export interface UtilBuildDirFromObjectMapOutputRequest {
    common: UtilOutputRequestCommon,
    object_map_id: ObjectId,
    dir_type: BuildDirType,
}

export class UtilBuildDirFromObjectMapOutputRequestCodec extends JsonCodec<UtilBuildDirFromObjectMapOutputRequest> {
    constructor() { super(); }
    encode_object(param: UtilBuildDirFromObjectMapOutputRequest): any {
        return {
            common: new UtilOutputRequestCommonJsonCodec().encode_object(param.common),
            object_map_id: param.object_map_id.to_base_58(),
            dir_type: param.dir_type
        }
    }
}

export interface UtilBuildDirFromObjectMapOutputResponse {
    object_id: ObjectId,
}

export class UtilBuildDirFromObjectMapOutputResponseJsonCodec extends JsonCodec<UtilBuildDirFromObjectMapOutputResponse> {
    constructor() { super(); }
    decode_object(o: any): BuckyResult<UtilBuildDirFromObjectMapOutputResponse> {
        const r = ObjectId.from_base_58(o.object_id);
        if (r.err) {
            return r;
        }
        const object_id = r.unwrap();

        return Ok({
            object_id
        })
    }
}