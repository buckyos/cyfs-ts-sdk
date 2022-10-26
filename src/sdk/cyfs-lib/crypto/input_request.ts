import { JsonCodec, VerifyObjectTypeJsonCodec } from "..";
import { AesKey, BuckyResult, ObjectId, Ok } from "../../cyfs-base";
import { RequestSourceInfo, SourceHelper } from "../access/source";
import { NONObjectInfo, NONObjectInfoJsonCodec } from "../non/def";
import { CryptoDecryptDataOutputResponse, CryptoDecryptType, CryptoEncryptDataOutputResponse, CryptoEncryptType, CryptoSignObjectOutputResponse, CryptoVerifyObjectOutputResponse, DecryptDataResult, VerifyObjectType, VerifySignType } from "./output_request";

export interface CryptoInputRequestCommon {
    // 请求路径，可为空
    req_path?: string;

    source: RequestSourceInfo,
    // 用以默认行为
    target?: ObjectId;

    flags: number;
}

export class CryptoInputRequestCommonJsonCodec extends JsonCodec<CryptoInputRequestCommon> {
    encode_object(param: CryptoInputRequestCommon): any {
        return {
            req_path: param.req_path,
            source: SourceHelper.source_to_obj(param.source),
            target: param.target?.toString(),
            flags: param.flags
        }
    }
    decode_object(o: any): BuckyResult<CryptoInputRequestCommon> {
        let dec_id;
        if (o.dec_id) {
            const r = ObjectId.from_base_58(o.dec_id);
            if (r.err) {
                return r;
            }
            dec_id = r.unwrap();
        }

        const source = SourceHelper.obj_to_source(o.source);

        let target;
        if (o.target) {
            const r = ObjectId.from_base_58(o.target);
            if (r.err) {
                return r;
            }
            target = r.unwrap();
        }


        return Ok({
            req_path: o.req_path,
            source,
            target,
            flags: o.flags
        })
    }
}

export interface CryptoSignObjectInputRequest {
    common: CryptoInputRequestCommon;

    object: NONObjectInfo;

    flags: number;
}

export class CryptoSignObjectInputRequestJsonCodec extends JsonCodec<CryptoSignObjectInputRequest> {
    encode_object(param: CryptoSignObjectInputRequest): any {
        return {
            common: new CryptoInputRequestCommonJsonCodec().encode_object(param.common),
            object: new NONObjectInfoJsonCodec().encode_object(param.object),
            flags: param.flags
        }
    }

    decode_object(o: any): BuckyResult<CryptoSignObjectInputRequest> {
        let common;
        {
            const r = new CryptoInputRequestCommonJsonCodec().decode_object(o.common);
            if (r.err) {
                return r;
            }
            common = r.unwrap();
        }

        let object;
        {
            const r = new NONObjectInfoJsonCodec().decode_object(o.object);
            if (r.err) {
                return r;
            }
            object = r.unwrap();
        }

        return Ok({
            common,
            object,
            flags: o.flags
        })
    }
}

export type CryptoSignObjectInputResponse = CryptoSignObjectOutputResponse; 

export interface CryptoVerifyObjectInputRequest {
    common: CryptoInputRequestCommon;

    // 校验的签名位置
    sign_type: VerifySignType;

    // 被校验对象
    object: NONObjectInfo;

    // 签名来源对象
    sign_object: VerifyObjectType;
}

export class CryptoVerifyObjectInputRequestJsonCodec extends JsonCodec<CryptoVerifyObjectInputRequest> {
    encode_object(param: CryptoVerifyObjectInputRequest): any {
        return {
            common: new CryptoInputRequestCommonJsonCodec().encode_object(param.common),
            sign_type: param.sign_type,
            object: new NONObjectInfoJsonCodec().encode_object(param.object),
            sign_object: new VerifyObjectTypeJsonCodec().encode_object(param.sign_object)
        }
    }

    decode_object(o: any): BuckyResult<CryptoVerifyObjectInputRequest> {
        let common;
        {
            const r = new CryptoInputRequestCommonJsonCodec().decode_object(o.common);
            if (r.err) {
                return r;
            }
            common = r.unwrap();
        }

        let object;
        {
            const r = new NONObjectInfoJsonCodec().decode_object(o.object);
            if (r.err) {
                return r;
            }
            object = r.unwrap();
        }

        let sign_object;
        {
            const r = new VerifyObjectTypeJsonCodec().decode_object(o.sign_object);
            if (r.err) {
                return r;
            }
            sign_object = r.unwrap();
        }

        return Ok({
            common,
            sign_type: o.sign_type as VerifySignType,
            object,
            sign_object
        })
    }
}

export type CryptoVerifyObjectInputResponse = CryptoVerifyObjectOutputResponse;

export interface CryptoEncryptDataInputRequest {
    common: CryptoInputRequestCommon,

    encrypt_type: CryptoEncryptType,

    data?: Uint8Array,

    flags: number,
}
export type CryptoEncryptDataInputResponse = CryptoEncryptDataOutputResponse;

export class CryptoEncryptDataInputRequestJsonCodec extends JsonCodec<CryptoEncryptDataInputRequest> {
    encode_object(param: CryptoEncryptDataInputRequest) {
        return {
            common: new CryptoInputRequestCommonJsonCodec().encode_object(param.common),
            encrypt_type: param.encrypt_type,
            data: param.data?param.data.toHex():undefined,
            flags: param.flags
        }
    }

    decode_object(o: any): BuckyResult<CryptoEncryptDataInputRequest> {
        let data;
        if (o.data) {
            const r = Uint8Array.prototype.fromHex(o.data);
            if (r.err) {
                return r;
            }
            data = r.unwrap();
        }

        let common;
        {
            const r = new CryptoInputRequestCommonJsonCodec().decode_object(o.common);
            if (r.err) {
                return r;
            }
            common = r.unwrap();
        }

        return Ok({
            common,
            data,
            encrypt_type: o.encrypt_type as CryptoEncryptType,
            flags: o.flags
        })
    }
}

export class CryptoEncryptDataInputResponseJsonCodec extends JsonCodec<CryptoEncryptDataInputResponse> {
    encode_object(param: CryptoEncryptDataInputResponse) {
        return {
            aes_key: param.aes_key?param.aes_key.toString():undefined,
            data: param.result.toHex()
        }
    }

    decode_object(o: any): BuckyResult<CryptoEncryptDataInputResponse> {
        let data;
        {
            const r = Uint8Array.prototype.fromHex(o.data);
            if (r.err) {
                return r;
            }
            data = r.unwrap();
        }

        let aes_key;
        if (o.aes_key) {
            const r = AesKey.from_str(o.aes_key);
            if (r.err) {
                return r;
            }
            aes_key = r.unwrap();
        }

        return Ok({
            result: data,
            aes_key
        })
    }
}

export interface CryptoDecryptDataInputRequest {
    common: CryptoInputRequestCommon,

    decrypt_type: CryptoDecryptType,

    data: Uint8Array,

    flags: number,
}
export type CryptoDecryptDataInputResponse = CryptoDecryptDataOutputResponse;
export class CryptoDecryptDataInputRequestJsonCodec extends JsonCodec<CryptoDecryptDataInputRequest> {
    encode_object(param: CryptoDecryptDataInputRequest) {
        return {
            common: new CryptoInputRequestCommonJsonCodec().encode_object(param.common),
            decrypt_type: param.decrypt_type,
            data: param.data?param.data.toHex():undefined,
            flags: param.flags
        }
    }

    decode_object(o: any): BuckyResult<CryptoDecryptDataInputRequest> {
        let data;
        {
            const r = Uint8Array.prototype.fromHex(o.data);
            if (r.err) {
                return r;
            }
            data = r.unwrap();
        }

        let common;
        {
            const r = new CryptoInputRequestCommonJsonCodec().decode_object(o.common);
            if (r.err) {
                return r;
            }
            common = r.unwrap();
        }

        return Ok({
            common,
            data,
            decrypt_type: o.decrypt_type as CryptoDecryptType,
            flags: o.flags
        })
    }
}

export class CryptoDecryptDataInputResponseJsonCodec extends JsonCodec<CryptoDecryptDataInputResponse> {
    encode_object(param: CryptoDecryptDataInputResponse) {
        return {
            result: param.result,
            data: param.data.toHex()
        }
    }

    decode_object(o: any): BuckyResult<CryptoDecryptDataInputResponse> {
        let data;
        {
            const r = Uint8Array.prototype.fromHex(o.data);
            if (r.err) {
                return r;
            }
            data = r.unwrap();
        }

        return Ok({
            result: o.result as DecryptDataResult,
            data
        })
    }
}