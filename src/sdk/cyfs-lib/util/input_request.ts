import { DeviceId, ObjectId } from "../../cyfs-base"
import { RequestProtocol } from "../base/protocol";
import { UtilGetDeviceOutputResponse, UtilGetDeviceStaticInfoOutputResponse, UtilGetNetworkAccessInfoOutputResponse, UtilGetNOCInfoOutputResponse, UtilGetOODStatusOutputResponse, UtilGetSystemInfoOutputResponse, UtilGetVersionInfoOutputResponse, UtilGetZoneOutputResponse, UtilResolveOODOutputResponse } from "./output_request";

export interface UtilInputRequestCommon {
    // 请求路径，可为空
    req_path?: string;

    // 来源DEC
    dec_id?: ObjectId;

    // 来源设备和协议
    source: DeviceId;
    protocol: RequestProtocol;

    // 用以默认行为
    target?: ObjectId;

    flags: number;
}

// get device
export interface UtilGetDeviceInputRequest {
    common: UtilInputRequestCommon;
}

export type UtilGetDeviceInputResponse = UtilGetDeviceOutputResponse;

// get zone
export interface UtilGetZoneInputRequest {
    common: UtilInputRequestCommon;

    object_id?: ObjectId;
    object_raw?: Uint8Array;
}


export type UtilGetZoneInputResponse  = UtilGetZoneOutputResponse;

// resolve_ood
export interface UtilResolveOODInputRequest {
    common: UtilInputRequestCommon;

    object_id: ObjectId;
    owner_id?: ObjectId;
}

export type UtilResolveOODInputResponse = UtilResolveOODOutputResponse;

// get_ood_status
export interface UtilGetOODStatusInputRequest {
    common: UtilInputRequestCommon;
}

export type UtilGetOODStatusInputResponse  = UtilGetOODStatusOutputResponse;

// get_noc_stat
export interface UtilGetNOCInfoInputRequest {
    common: UtilInputRequestCommon;
}


export type UtilGetNOCInfoInputResponse = UtilGetNOCInfoOutputResponse;

// get_device_static_info
export interface UtilGetDeviceStaticInfoInputRequest {
    common: UtilInputRequestCommon;
}

export type UtilGetDeviceStaticInfoInputResponse = UtilGetDeviceStaticInfoOutputResponse;

// get_network_access_info
export interface UtilGetNetworkAccessInfoInputRequest {
    common: UtilInputRequestCommon;
}

export type UtilGetNetworkAccessInfoInputResponse = UtilGetNetworkAccessInfoOutputResponse;

// get_system_info
export interface UtilGetSystemInfoInputRequest {
    common: UtilInputRequestCommon;
}

export type UtilGetSystemInfoInputResponse = UtilGetSystemInfoOutputResponse;

// get_version_info
export interface UtilGetVersionInfoInputRequest {
    common: UtilInputRequestCommon;
}

export type UtilGetVersionInfoInputResponse = UtilGetVersionInfoOutputResponse;