import { BaseRequestor, RequestorHelper } from "../base/base_requestor";
import { HttpRequest } from "../base/http_request";
import {
    BuckyErrorCode,
    CYFS_DEC_ID,
    CYFS_FLAGS,
    CYFS_OBJECT_ID,
    CYFS_REQ_PATH,
    CYFS_CRYPTO_FLAGS,
    CYFS_SIGN_OBJ,
    CYFS_SIGN_OBJ_ID,
    CYFS_SIGN_RET,
    CYFS_SIGN_TYPE,
    CYFS_TARGET,
    CYFS_VERIFY_SIGNS,
    CYFS_VERIFY_TYPE,
    AesKey,
    CYFS_AES_KEY,
    CYFS_DECRYPT_RET,
    CYFS_DECRYPT_TYPE,
    CYFS_ENCRYPT_TYPE,
    error
} from "../../cyfs-base";
import { Err, Ok, Some } from "ts-results";
import { BuckyError, BuckyResult } from "../../cyfs-base";
import { ObjectId } from "../../cyfs-base/objects/object_id";
import { CryptoSignObjectRequest, CryptoVerifyObjectRequest } from './request';
import { CryptoDecryptDataOutputRequest, CryptoDecryptDataOutputResponse, CryptoEncryptDataOutputRequest, CryptoEncryptDataOutputResponse, CryptoOutputRequestCommon, CryptoSignObjectOutputResponse, CryptoVerifyObjectOutputRequest, CryptoVerifyObjectOutputResponse, CryptoVerifyObjectOutputResponseJsonCodec, DecryptDataResult, SignObjectResult, VerifySignsJsonCodec } from "./output_request";
import { NONObjectInfo } from "../non/def";
import { match } from "assert";
import { info } from "console";
import { format } from "path";


export class CryptoRequestor {
    service_url: string
    constructor(private requestor: BaseRequestor, private dec_id?: ObjectId) {
        const addr = requestor.remote_addr();
        this.service_url = `http://${addr}/crypto/`;
    }

    encode_common_headers(com_req: CryptoOutputRequestCommon, http_req: HttpRequest): void {
        if (com_req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, com_req.dec_id.to_string());
        } else if (this.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, this.dec_id.to_string()); 
        }

        if (com_req.req_path) {
            http_req.insert_header(CYFS_REQ_PATH, encodeURIComponent(com_req.req_path));
        }

        if (com_req.target) {
            http_req.insert_header(CYFS_TARGET, com_req.target.to_string());
        }

        http_req.insert_header(CYFS_FLAGS, com_req.flags.toString());
    }

    encode_verify_object_request(req: CryptoVerifyObjectOutputRequest): HttpRequest {
        const url = this.service_url + "verify"

        const http_req = new HttpRequest("Post", url);
        this.encode_common_headers(req.common, http_req);

        http_req.insert_header(CYFS_OBJECT_ID, req.object.object_id.to_string());
        http_req.insert_header(CYFS_SIGN_TYPE, req.sign_type);
        
        http_req.insert_header(CYFS_VERIFY_TYPE, req.sign_object.type);

        req.sign_object.match({
            Object: (sign_object) => {
                http_req.insert_header(
                    CYFS_SIGN_OBJ_ID,
                    sign_object.object_id.to_string(),
                );
                if (sign_object.object_raw) {
                    http_req.insert_header(CYFS_SIGN_OBJ, sign_object.object_raw.toHex());
                }
            },
            Sign: (signs) => {
                http_req.insert_header(
                    CYFS_VERIFY_SIGNS,
                    new VerifySignsJsonCodec().encode_string(signs),
                );
            }
        })

        return http_req;
    }

    async decode_verify_object_response(
        object_id: ObjectId,
        resp: Response,
    ): Promise<BuckyResult<CryptoVerifyObjectOutputResponse>> {
        const body = await resp.text();
        const r = new CryptoVerifyObjectOutputResponseJsonCodec().decode_string(body);
        if (r.err) {
            return r;
        }

        return Ok(r.unwrap())
    }

    // 校验一个对象是否有指定object的签名
    public async verify_object(
        req: CryptoVerifyObjectRequest,
    ): Promise<BuckyResult<CryptoVerifyObjectOutputResponse>> {
        const http_req = this.encode_verify_object_request(req);
        http_req.set_body(req.object.object_raw);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            const r = await this.decode_verify_object_response(req.object.object_id, resp);
            if (r.err) {
                return r;
            }
            return Ok(r.unwrap())
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e)
        }
    }

    encode_sign_object_request(req: CryptoSignObjectRequest): HttpRequest {
        const url = this.service_url + "sign"
        const http_req = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, http_req);
        http_req.insert_header(CYFS_OBJECT_ID, req.object.object_id.to_string());
        http_req.insert_header(CYFS_CRYPTO_FLAGS, req.flags.toString());
        return http_req;
    }

    async decode_sign_object_response(
        object_id: ObjectId,
        resp: Response,
    ): Promise<BuckyResult<CryptoSignObjectOutputResponse>> {
        const r = RequestorHelper.decode_header(resp, CYFS_SIGN_RET, s => s as SignObjectResult);
        if (r.err) {
            return r;
        }
        const result = r.unwrap();
        if (result === SignObjectResult.Signed) {
            const buf = await resp.arrayBuffer();

            const r = NONObjectInfo.new_from_object_raw(new Uint8Array(buf));
            if (r.err) {
                return r;
            }

            return Ok({
                result,
                object: r.unwrap(),
            })
        } else if (result === SignObjectResult.Pending) {
            return Ok({
                result
            })
        } else {
            return Err(new BuckyError(BuckyErrorCode.Unknown, ""))
        }
    }

    public async sign_object(
        req: CryptoSignObjectRequest,
    ): Promise<BuckyResult<CryptoSignObjectOutputResponse>> {
        const http_req = this.encode_sign_object_request(req);
        http_req.set_body(req.object.object_raw);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap()

        if (resp.status === 200) {
            const r = await this.decode_sign_object_response(req.object.object_id, resp);
            if (r.err) {
                return r;
            }
            return Ok(r.unwrap())
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e)
        }
    }

    // encrypt
    encode_encrypt_data_request(req: CryptoEncryptDataOutputRequest): HttpRequest {
        const url = this.service_url + "encrypt";

        const http_req = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, http_req);
        http_req.insert_header(CYFS_ENCRYPT_TYPE, req.encrypt_type);
        http_req.insert_header(CYFS_CRYPTO_FLAGS, req.flags.toString());

        return http_req
    }

    async decode_encrypt_data_response(
        resp: Response,
    ): Promise<BuckyResult<CryptoEncryptDataOutputResponse>> {
        let aes_key;
        if (resp.headers.has(CYFS_AES_KEY)) {
            const r = AesKey.from_str(resp.headers.get(CYFS_AES_KEY)!)
            if (r.err) {
                return r;
            }
            aes_key = r.unwrap();
        }

        const result = new Uint8Array(await resp.arrayBuffer())

        return Ok({ aes_key, result })
    }

    public async encrypt_data(
        req: CryptoEncryptDataOutputRequest,
    ): Promise<BuckyResult<CryptoEncryptDataOutputResponse>> {
        const http_req = this.encode_encrypt_data_request(req);
        let data_len = 0;
        if (req.data) {
            data_len = req.data.byteLength;
            http_req.set_body(req.data)
        }

        const resp_r = await this.requestor.request(http_req);
        if (resp_r.err) {
            return resp_r;
        }
        const resp = resp_r.unwrap();

        if (resp.status === 200) {
            const eresp_r = await this.decode_encrypt_data_response(resp);
            if (eresp_r.err) {
                return eresp_r;
            }
            const eresp = eresp_r.unwrap()

            console.info(`encrypt data success: data=${data_len}, type=${req.encrypt_type}, ret=${eresp.result.byteLength}`);

            return Ok(eresp);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`encrypt data failed: data=${data_len}, type=${req.encrypt_type}, ${e}`);
            return Err(e);
        }
    }

    // decrypt
    encode_decrypt_data_request(req: CryptoDecryptDataOutputRequest): HttpRequest {
        const url = this.service_url + "decrypt";

        const http_req = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, http_req);
        http_req.insert_header(CYFS_DECRYPT_TYPE, req.decrypt_type);
        http_req.insert_header(CYFS_CRYPTO_FLAGS, req.flags.toString());

        return http_req
    }

    async decode_decrypt_data_response(
        resp: Response,
    ): Promise<BuckyResult<CryptoDecryptDataOutputResponse>> {
        const result = RequestorHelper.decode_header(resp, CYFS_DECRYPT_RET, (s) => s as DecryptDataResult);
        if (result.err) {
            return result;
        }

        const data = new Uint8Array(await resp.arrayBuffer());

        return Ok({ result: result.unwrap(), data });
    }

    public async decrypt_data(
        req: CryptoDecryptDataOutputRequest,
    ): Promise<BuckyResult<CryptoDecryptDataOutputResponse>> {
        const http_req = this.encode_decrypt_data_request(req);
        const data_len = req.data.byteLength;
        http_req.set_body(req.data);

        const resp_r = await this.requestor.request(http_req);
        if (resp_r.err) {
            return resp_r;
        }
        const resp = resp_r.unwrap();

        if (resp.status === 200) {
            const dresp_r = await this.decode_decrypt_data_response(resp);
            if (dresp_r.err) {
                return dresp_r;
            }
            const dresp = dresp_r.unwrap();

            console.info(`decrypt data crypto success: data=${data_len}, type=${req.decrypt_type}, ${dresp}`);

            return Ok(dresp);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`decrypt data crypto failed: data=${data_len}, type=${req.decrypt_type}, ${e}`);

            return Err(e);
        }
    }
}
