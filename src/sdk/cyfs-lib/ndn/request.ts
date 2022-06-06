import { NDNOutputRequestCommon, NDNPutDataOutputRequest, NDNPutDataOutputResponse, NDNGetDataOutputRequest, NDNGetDataOutputResponse, NDNDeleteDataOutputRequest, NDNDeleteDataOutputResponse } from "./output_request";

export type NDNRequestCommon = NDNOutputRequestCommon;

export type NDNPutDataRequest = NDNPutDataOutputRequest;
export type NDNPutDataResponse = NDNPutDataOutputResponse;

export type NDNGetDataRequest = NDNGetDataOutputRequest;
export type NDNGetDataResponse = NDNGetDataOutputResponse;

export type NDNDeleteDataRequest = NDNDeleteDataOutputRequest;
export type NDNDeleteDataResponse = NDNDeleteDataOutputResponse;