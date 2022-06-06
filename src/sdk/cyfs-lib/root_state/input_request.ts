import { ObjectId, DeviceId, ObjectMapSimpleContentType, } from "../../cyfs-base";
import { NONProtocol } from "../base/protocol";
import {
    ObjectMapOpEnvType,
    OpEnvSetResponse,
} from "./def";
import JSBI from "jsbi";
import { OpEnvNextOutputResponse } from "./output_request";

export interface RootStateInputRequestCommon {
    // 来源DEC
    dec_id?: ObjectId;

    // 来源设备和协议
    source: DeviceId;
    protocol: NONProtocol;
    flags: number;
}

export interface RootStateGetCurrentRootInputRequest {
    common: RootStateInputRequestCommon;
}

export interface RootStateGetCurrentRootInputResponse {
    root: ObjectId;
}

export interface RootStateCreateOpEnvInputRequest {
    common: RootStateInputRequestCommon;

    op_env_type: ObjectMapOpEnvType;
}

export interface OpEnvInputRequestCommon {
    // 来源DEC
    dec_id?: ObjectId;

    // 来源设备和协议
    source: DeviceId;
    protocol: NONProtocol;

    flags: number;

    // 所属session id
    sid: JSBI;
}

export interface OpEnvLoadInputRequest {
    common: OpEnvInputRequestCommon;

    target: ObjectId;
}

export interface OpEnvLoadByPathInputRequest {
    common: OpEnvInputRequestCommon;

    path: string;
}

export interface OpEnvCreateNewInputRequest {
    common: OpEnvInputRequestCommon;

    content_type: ObjectMapSimpleContentType;
}

export interface OpEnvLockInputRequest {
    common: OpEnvInputRequestCommon;

    path_list: string[];
    duration_in_millsecs: JSBI;
    try_lock: boolean,
}

export interface OpEnvCommitInputRequest {
    common: OpEnvInputRequestCommon;
}

export interface OpEnvAbortInputRequest {
    common: OpEnvInputRequestCommon;
}

export interface OpEnvGetByKeyInputRequest {
    common: OpEnvInputRequestCommon;

    path?: string;
    key: string;
}

export interface OpEnvInsertWithKeyInputRequest {
    common: OpEnvInputRequestCommon;

    path?: string;
    key: string;
    value: ObjectId;
}

export interface OpEnvSetWithKeyInputRequest {
    common: OpEnvInputRequestCommon;

    path?: string;
    key: string;
    value: ObjectId;
    prev_value?: ObjectId;
    auto_insert: boolean;
}

export interface OpEnvRemoveWithKeyInputRequest {
    common: OpEnvInputRequestCommon;

    path?: string;
    key: string;
    prev_value?: ObjectId;
}

export interface OpEnvSetInputRequest {
    common: OpEnvInputRequestCommon;

    path?: string;
    value: ObjectId;
}

export type OpEnvContainsInputRequest = OpEnvSetInputRequest;
export type OpEnvContainsInputResponse = OpEnvSetResponse;

// insert
export type OpEnvInsertInputRequest = OpEnvSetInputRequest;
export type OpEnvInsertInputResponse = OpEnvSetResponse;

// remove
export type OpEnvRemoveInputRequest = OpEnvSetInputRequest;
export type OpEnvRemoveInputResponse = OpEnvSetResponse;

// 迭代器next
export interface OpEnvNextInputRequest {
    common: OpEnvInputRequestCommon;

    // 步进的元素个数
    step: number;
}

export type OpEnvNextInputResponse = OpEnvNextOutputResponse;