import {
    RootStateOutputRequestCommon,
    RootStateGetCurrentRootOutputRequest,
    RootStateGetCurrentRootOutputResponse,
    RootStateCreateOpEnvOutputRequest,
    RootStateCreateOpEnvOutputResponse,
    OpEnvOutputRequestCommon,
    OpEnvLoadOutputRequest,
    OpEnvLoadByPathOutputRequest,
    OpEnvCreateNewOutputRequest,
    OpEnvLockOutputRequest,
    OpEnvCommitOutputRequest,
    OpEnvCommitOutputResponse,
    OpEnvAbortOutputRequest,
    OpEnvGetByKeyOutputRequest,
    OpEnvGetByKeyOutputResponse,
    OpEnvInsertWithKeyOutputRequest,
    OpEnvSetWithKeyOutputRequest,
    OpEnvSetWithKeyOutputResponse,
    OpEnvRemoveWithKeyOutputRequest,
    OpEnvRemoveWithKeyOutputResponse,
    OpEnvContainsOutputRequest,
    OpEnvContainsOutputResponse,
    OpEnvInsertOutputRequest,
    OpEnvInsertOutputResponse,
    OpEnvRemoveOutputRequest,
    OpEnvRemoveOutputResponse,
} from "./output_request";

export type RootStateRequestCommon = RootStateOutputRequestCommon;

export type RootStateGetCurrentRootRequest =
    RootStateGetCurrentRootOutputRequest;
export type RootStateGetCurrentRootResponse =
    RootStateGetCurrentRootOutputResponse;

export type RootStateCreateOpEnvRequest = RootStateCreateOpEnvOutputRequest;
export type RootStateCreateOpEnvResponse = RootStateCreateOpEnvOutputResponse;

export type OpEnvRequestCommon = OpEnvOutputRequestCommon;

export type OpEnvLoadRequest = OpEnvLoadOutputRequest;
export type OpEnvLoadByPathRequest = OpEnvLoadByPathOutputRequest;
export type OpEnvCreateNewRequest = OpEnvCreateNewOutputRequest;

export type OpEnvLockRequest = OpEnvLockOutputRequest;

export type OpEnvCommitRequest = OpEnvCommitOutputRequest;
export type OpEnvCommitResponse = OpEnvCommitOutputResponse;

export type OpEnvAbortRequest = OpEnvAbortOutputRequest;

export type OpEnvGetByKeyRequest = OpEnvGetByKeyOutputRequest;
export type OpEnvGetByKeyResponse = OpEnvGetByKeyOutputResponse;

export type OpEnvInsertWithKeyRequest = OpEnvInsertWithKeyOutputRequest;

export type OpEnvSetWithKeyRequest = OpEnvSetWithKeyOutputRequest;
export type OpEnvSetWithKeyResponse = OpEnvSetWithKeyOutputResponse;

export type OpEnvRemoveWithKeyRequest = OpEnvRemoveWithKeyOutputRequest;
export type OpEnvRemoveWithKeyResponse = OpEnvRemoveWithKeyOutputResponse;

export type OpEnvContainsRequest = OpEnvContainsOutputRequest;
export type OpEnvContainsResponse = OpEnvContainsOutputResponse;

export type OpEnvInsertRequest = OpEnvInsertOutputRequest;
export type OpEnvInsertResponse = OpEnvInsertOutputResponse;

export type OpEnvRemoveRequest = OpEnvRemoveOutputRequest;
export type OpEnvRemoveResponse = OpEnvRemoveOutputResponse;