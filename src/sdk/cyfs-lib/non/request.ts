import { NONDeleteObjectOutputRequest, NONDeleteObjectOutputResponse, NONGetObjectOutputRequest, NONGetObjectOutputResponse, NONOutputRequestCommon, NONPostObjectOutputRequest, NONPostObjectOutputResponse, NONPutObjectOutputRequest, NONPutObjectOutputResponse} from "./output_request";

export type NONRequestCommon = NONOutputRequestCommon;

export type NONGetObjectRequest = NONGetObjectOutputRequest;
export type NONGetObjectResponse = NONGetObjectOutputResponse;

export type NONPutObjectRequest = NONPutObjectOutputRequest;
export type NONPutObjectResponse = NONPutObjectOutputResponse;

export type NONPostObjectRequest = NONPostObjectOutputRequest;
export type NONPostObjectResponse = NONPostObjectOutputResponse;

export type NONDeleteObjectRequest = NONDeleteObjectOutputRequest;
export type NONDeleteObjectResponse = NONDeleteObjectOutputResponse;