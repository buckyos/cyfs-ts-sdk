import { BaseRequestor, RequestorHelper } from "../base/base_requestor";
import { HttpRequest } from "../base/http_request";
import {
    BuckyErrorCode,
    CYFS_DEC_ID,
    CYFS_FLAGS,
    CYFS_OBJECT_ID,
    CYFS_REQ_PATH,
    CYFS_SIGN_FLAGS,
    CYFS_SIGN_OBJ,
    CYFS_SIGN_OBJ_ID,
    CYFS_SIGN_RET,
    CYFS_SIGN_TYPE,
    CYFS_TARGET,
    CYFS_VERIFY_SIGNS,
    CYFS_VERIFY_TYPE
} from "../../cyfs-base";
import { Err, Ok } from "ts-results";
import { BuckyError, BuckyResult } from "../../cyfs-base";
import { ObjectId } from "../../cyfs-base/objects/object_id";
import { CryptoSignObjectRequest, CryptoVerifyObjectRequest } from './request';
import { CryptoOutputRequestCommon, CryptoSignObjectOutputResponse, CryptoVerifyObjectOutputRequest, CryptoVerifyObjectOutputResponse, CryptoVerifyObjectOutputResponseJsonCodec, SignObjectResult, VerifySignsJsonCodec } from "./output_request";
import { NONObjectInfo } from "../non/def";


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
            http_req.insert_header(CYFS_REQ_PATH, com_req.req_path);
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
        http_req.insert_header(CYFS_SIGN_FLAGS, req.flags.toString());
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
}
