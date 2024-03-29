import { CryptoDecryptDataOutputRequest, CryptoDecryptDataOutputResponse, CryptoEncryptDataOutputRequest, CryptoEncryptDataOutputResponse, CryptoOutputRequestCommon, CryptoSignObjectOutputRequest, CryptoSignObjectOutputResponse, CryptoVerifyObjectOutputRequest, CryptoVerifyObjectOutputResponse } from "./output_request";

export type CryptoRequestCommon = CryptoOutputRequestCommon;
export type CryptoSignObjectRequest = CryptoSignObjectOutputRequest;
export type CryptoSignObjectResponse = CryptoSignObjectOutputResponse;
export type CryptoVerifyObjectRequest = CryptoVerifyObjectOutputRequest;
export type CryptoVerifyObjectResponse = CryptoVerifyObjectOutputResponse;

export type CryptoEncryptDataRequest = CryptoEncryptDataOutputRequest;
export type CryptoEncryptDataResponse = CryptoEncryptDataOutputResponse;
export type CryptoDecryptDataRequest = CryptoDecryptDataOutputRequest;
export type CryptoDecryptDataResponse = CryptoDecryptDataOutputResponse;