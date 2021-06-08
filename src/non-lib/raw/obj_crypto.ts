import { HttpRequestor, RequestorHelper } from "../base/base_requestor";
import { HttpRequest } from "../base/http_request";
import {
    AnyNamedObject,
    AnyNamedObjectDecoder,
    BuckyErrorCode,
    CYFS_DEC_ID,
    CYFS_FLAGS,
    CYFS_SIGN_OBJ,
    CYFS_SIGN_OBJ_ID,
    CYFS_SIGN_RET,
    CYFS_SIGN_TYPE,
    CYFS_VERIFY_TYPE
} from "../../cyfs-base";
import { Err, Ok } from "ts-results";
import { BuckyError, BuckyResult } from "../../cyfs-base";
import { ObjectId } from "../../cyfs-base/objects/object_id";
import { DeviceId } from "../../cyfs-base/objects/device";

enum VerifySignType {
    Desc,
    Body,
    Both,
}

enum VerifyObjectType {
    // 校验是否有owner的有效签名
    Owner,

    // 校验是否有指定object的有效签名
    Object,

    // 校验指定的签名是否有效
    Sign,
}

// 可以选择使用people签名还是device签名
export const NON_REQUEST_FLAG_SIGN_BY_PEOPLE: number = 0x01 << 1;
export const NON_REQUEST_FLAG_SIGN_BY_DEVICE: number = 0x01 << 2;

// (desc, body) * (set, push)，优先使用set > push
export const NON_REQUEST_FLAG_SIGN_SET_DESC: number = 0x01 << 3;
export const NON_REQUEST_FLAG_SIGN_SET_BODY: number = 0x01 << 4;
export const NON_REQUEST_FLAG_SIGN_PUSH_DESC: number = 0x01 << 5;
export const NON_REQUEST_FLAG_SIGN_PUSH_BODY: number = 0x01 << 6;

export interface NONVerifyByObjectRequest {
    target?: DeviceId;
    sign_type: VerifySignType;

    object_id: ObjectId;
    object_raw: Uint8Array;

    sign_object_id?: ObjectId;
    sign_object?: Uint8Array;
}

export interface NONVerifyByOwnerRequest {
    target?: DeviceId;
    sign_type: VerifySignType;
    object_id: ObjectId;
    object_raw: Uint8Array;
}

export interface VerifySignResult {
    index: number;
    valid: boolean;
    sign_object_id: ObjectId;
}

export interface VerifyObjectResult {
    valid: boolean;
    desc_signs: VerifySignResult[];
    body_signs: VerifySignResult[];

}

export interface NONVerifyObjectResponse {
    result: VerifyObjectResult;
}

export interface NONVerifyBySignRequest {
    target?: DeviceId;

    object_id: ObjectId;
    desc_signs?: Uint8Array;
    body_signs?: Uint8Array;
}

export interface NONSignObjectRequest {
    object_id: ObjectId,

    dec_id?: ObjectId,

    // 目标device
    target?: DeviceId,

    object_raw: Uint8Array,
    flags: number,
}

export interface SignedObject {
    object_raw: Uint8Array,
    object: AnyNamedObject,
}

export enum SignObjectResult {
    Signed,
    Pending,
}

export interface NONSignObjectResponse {
    result: SignObjectResult,
    object?: SignedObject,
}

export class ObjectCryptoRequestor {
    service_url: string
    constructor(private requestor: HttpRequestor) {
        const addr = requestor.remote_addr();
        this.service_url = `http://${addr}/non/crypto`;
    }

    format_url(sign: boolean, target: DeviceId | undefined, object_id: ObjectId): string {
        const seg = sign ? "sign" : "verify";
        if (target) {
            return `${this.service_url}/${seg}/${target}/${object_id}`;
        } else {
            return `${this.service_url}/${seg}/${object_id}`;
        }
    }

    encode_verify_by_object_request(req: NONVerifyByObjectRequest): HttpRequest {
        const url = this.format_url(false, req.target, req.object_id);
        const http_req = new HttpRequest('POST', url);
        http_req.insert_header(CYFS_VERIFY_TYPE, VerifyObjectType.Object.toString());
        http_req.insert_header(CYFS_SIGN_TYPE, req.sign_type.toString());

        if (req.sign_object_id) {
            http_req.insert_header(CYFS_SIGN_OBJ_ID, req.sign_object_id.toString());
        }
        if (req.sign_object) {
            http_req.insert_header(CYFS_SIGN_OBJ, Buffer.from(req.sign_object).toString('hex'));
        }
        return http_req;
    }

    encode_verify_by_owner_request(req: & NONVerifyByOwnerRequest): HttpRequest {
        const url = this.format_url(false, req.target, req.object_id);
        const http_req = new HttpRequest('POST', url);
        http_req.insert_header(CYFS_VERIFY_TYPE, VerifyObjectType.Owner.toString());
        http_req.insert_header(CYFS_SIGN_TYPE, req.sign_type.toString());
        return http_req;
    }

    async request(object_id: ObjectId, http_req: HttpRequest): Promise<BuckyResult<NONVerifyObjectResponse>> {

        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            const json: NONVerifyObjectResponse = await resp.json();
            console.log(`verify resp body: ${json}`);
            return Ok(json);
        } else {
            const msg = `verify object from non failed: obj=${object_id} status=${resp.status} msg=${await resp.text()}`;
            console.error(msg);
            const err_code = RequestorHelper.trans_status_code(resp.status);
            return Err(new BuckyError(err_code, msg));
        }
    }

    public async verify_by_object(req: NONVerifyByObjectRequest): Promise<BuckyResult<NONVerifyObjectResponse>> {
        const http_req = this.encode_verify_by_object_request(req);
        http_req.set_body(req.object_raw);

        return this.request(req.object_id, http_req);
    }

    public async verify_by_sign(_req: NONVerifyBySignRequest) {
        throw new Error('unimplemented');
    }

    encode_sign_object_request(req: NONSignObjectRequest): HttpRequest {
        const url = this.format_url(true, req.target, req.object_id);
        const http_req = new HttpRequest('POST', url);
        http_req.insert_header(CYFS_FLAGS, req.flags.toString());
        if (req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, req.dec_id!.toString());
        }
        return http_req;
    }

    async decode_sign_resp(resp: Response): Promise<BuckyResult<NONSignObjectResponse>> {
        const sign_result_header = resp.headers.get(CYFS_SIGN_RET);
        if (sign_result_header == null) {
            return Err(new BuckyError(BuckyErrorCode.NotFound, "miss sign ret header"));
        }
        let sign_result: SignObjectResult;
        switch (sign_result_header) {
            case "pending":
                sign_result = SignObjectResult.Pending
                break;
            case "signed":
                sign_result = SignObjectResult.Signed
                break;
            default:
                return Err(new BuckyError(BuckyErrorCode.NotMatch, `unknown sign object result : ${sign_result_header}`))
        }

        const buf = new Uint8Array(await resp.arrayBuffer());
        const r = new AnyNamedObjectDecoder().raw_decode(buf);
        if (r.err) {
            console.error("sign_object, decode any named object failed, err:{}", r.err);
            return r;
        }

        const sign_resp: NONSignObjectResponse = {
            result: sign_result,
            object: {
                object: r.unwrap()[0],
                object_raw: buf
            },
        }
        return Ok(sign_resp)
    }

    public async sign_object(req: NONSignObjectRequest): Promise<BuckyResult<NONSignObjectResponse>> {
        const http_req = this.encode_sign_object_request(req);
        http_req.set_body(req.object_raw);

        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            const sign_resp = await this.decode_sign_resp(resp);
            return sign_resp;
        } else {
            const msg = `sign object from non failed: obj=${req.object_id} status=${resp.status} msg=${await resp.text()}`;
            console.error(msg);
            const err_code = RequestorHelper.trans_status_code(resp.status);
            return Err(new BuckyError(err_code, msg));
        }
    }

}
