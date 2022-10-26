import { JsonCodec } from "..";
import { AesKey, AnyNamedObject, BuckyError, BuckyErrorCode, BuckyResult, Err, ObjectId, Ok } from "../../cyfs-base";
import { NONObjectInfo, NONObjectInfoJsonCodec } from "../non/def";

export interface CryptoOutputRequestCommon {
    // 请求路径，可为空
    req_path?: string;

    // 来源DEC
    dec_id?: ObjectId;

    // 用以默认行为
    target?: ObjectId;

    flags: number;
}

// 可以选择使用people签名还是device签名
export const CRYPTO_REQUEST_FLAG_SIGN_BY_PEOPLE: number = 0x01 << 1;
export const CRYPTO_REQUEST_FLAG_SIGN_BY_DEVICE: number = 0x01 << 2;

// (desc; body) * (set; push)，优先使用set > push
export const CRYPTO_REQUEST_FLAG_SIGN_SET_DESC: number = 0x01 << 3;
export const CRYPTO_REQUEST_FLAG_SIGN_SET_BODY: number = 0x01 << 4;
export const CRYPTO_REQUEST_FLAG_SIGN_PUSH_DESC: number = 0x01 << 5;
export const CRYPTO_REQUEST_FLAG_SIGN_PUSH_BODY: number = 0x01 << 6;

export interface CryptoSignObjectOutputRequest {
    common: CryptoOutputRequestCommon;

    object: NONObjectInfo;

    flags: number;
}

export enum SignObjectResult {
    Signed = "signed",
    Pending = "pending",
}

export interface CryptoSignObjectOutputResponse {
    result: SignObjectResult;

    object?: NONObjectInfo;
}

export class CryptoSignObjectOutputResponseJsonCodec extends JsonCodec<CryptoSignObjectOutputResponse> {
    encode_object(param: CryptoSignObjectOutputResponse): any {
        let object;
        if (param.object) {
            object = new NONObjectInfoJsonCodec().encode_object(param.object)
        }
        return {
            result: param.result,
            object
        }
    }

    decode_object(o: any): BuckyResult<CryptoSignObjectOutputResponse> {
        let object;
        if (o.object) {
            const r = new NONObjectInfoJsonCodec().decode_object(o.object)
            if (r.err) {
                return r;
            }
            object = r.unwrap()
        }

        return Ok({
            result: o.result as SignObjectResult,
            object
        })
    }
}

export enum VerifySignType {
    Desc = "desc",
    Body = "body",
    Both = "both",
}

export interface SignObject {
    object_id: ObjectId;
    object_raw?: Uint8Array;
    object?: AnyNamedObject;
}

export class SignObjectJsonCodec extends JsonCodec<SignObject> {
    encode_object(param: SignObject): any {
        return {
            object_id: param.object_id.toString(),
            object_raw: param.object_raw?.toHex()
        }
    }

    decode_object(o: any): BuckyResult<SignObject> {
        const r = ObjectId.from_base_58(o.object_id);
        let object_raw;
        if (o.object_raw) {
            const r = Uint8Array.prototype.fromHex(o.object_raw);
            if (r.err) {
                return r;
            }
            object_raw = r.unwrap();
        }

        return Ok({
            object_id: r.unwrap(),
            object_raw
        })
    }
}

export interface VerifySigns {
    desc_signs?: Uint8Array;
    body_signs?: Uint8Array;
}

export class VerifySignsJsonCodec extends JsonCodec<VerifySigns> {
    constructor() {super();}
    encode_object(param: VerifySigns): any {
        const o: any = {};
        if (param.desc_signs) {
            o.desc_signs = param.desc_signs.toHex();
        }
        if (param.body_signs) {
            o.body_signs = param.body_signs.toHex();
        }
        return o;
    }

    decode_object(o: any): BuckyResult<VerifySigns> {
        let desc_signs;
        if (o.desc_signs) {
            const r = Uint8Array.prototype.fromHex(o.desc_signs)
            if (r.err) {
                return r;
            }
            desc_signs = r.unwrap()
        }

        let body_signs;
        if (o.body_signs) {
            const r = Uint8Array.prototype.fromHex(o.body_signs)
            if (r.err) {
                return r;
            }
            body_signs = r.unwrap()
        }

        return Ok({desc_signs, body_signs})
    }
}

export class VerifyObjectType {
    constructor(public type: string, public sign_object?: SignObject, public verify_signs?: VerifySigns){}
    // 校验是否有owner的有效签名
    static Owner(): VerifyObjectType {
        return new VerifyObjectType("owner")
    }

    static Own(): VerifyObjectType {
        return new VerifyObjectType("own")
    }

    // 校验是否有指定object的有效签名
    static Object(sign_object: SignObject): VerifyObjectType {
        return new VerifyObjectType("object", sign_object);
    }

    // 校验指定的签名是否有效
    static Sign(verify_signs: VerifySigns): VerifyObjectType {
        return new VerifyObjectType("sign", undefined, verify_signs);
    }

    match(visitor: {
        Owner?: () => void,
        Own?: () => void,
        Object?: (object: SignObject) => void,
        Sign?: (sign: VerifySigns) => void
    }): void {
        if (this.type === "owner") {
            visitor.Owner?.();
        } else if (this.type === "object") {
            visitor.Object?.(this.sign_object!)
        } else if (this.type === "sign") {
            visitor.Sign?.(this.verify_signs!)
        }
    }
}

export class VerifyObjectTypeJsonCodec extends JsonCodec<VerifyObjectType> {
    encode_object(param: VerifyObjectType): any {
        const out: any = {type: param.type}

        param.match({
            Object: (object) => {
                out.sign_object = new SignObjectJsonCodec().encode_object(object)
            },
            Sign: (sign) => {
                out.verify_signs = new VerifySignsJsonCodec().encode_object(sign)
            }
        })

        return out;
    }

    decode_object(o: any): BuckyResult<VerifyObjectType> {
        if (o.type === "owner") {
            return Ok(VerifyObjectType.Owner())
        } else if (o.type === "own") {
            return Ok(VerifyObjectType.Own())
        } else if (o.type === "object") {
            const r = new SignObjectJsonCodec().decode_object(o.sign_object);
            if (r.err) {
                return r;
            }
            return Ok(VerifyObjectType.Object(r.unwrap()))
        } else if (o.type === "verify_signs") {
            const r = new VerifySignsJsonCodec().decode_object(o.verify_signs);
            if (r.err) {
                return r;
            }
            return Ok(VerifyObjectType.Sign(r.unwrap()))
        } else {
            return Err(new BuckyError(BuckyErrorCode.Unknown, ""))
        }
    }
}

export interface CryptoVerifyObjectOutputRequest {
    common: CryptoOutputRequestCommon;

    // 校验的签名位置
    sign_type: VerifySignType;

    // 被校验对象
    object: NONObjectInfo;

    // 签名来源对象
    sign_object: VerifyObjectType;
}

export interface VerifySignResult {
    index: number;
    valid: boolean;
    sign_object_id: ObjectId;
}

export class VerifySignResultJsonCodec extends JsonCodec<VerifySignResult> {
    encode_object(param: VerifySignResult): any {
        return  {
            index: param.index,
            valid: param.valid,
            sign_object_id: param.sign_object_id.toString()
        }
    }

    decode_object(o: any): BuckyResult<VerifySignResult> {
        const r = ObjectId.from_base_58(o.sign_object_id);
        if (r.err) {
            return r;
        }

        return Ok({
            index: o.index,
            valid: o.valid,
            sign_object_id: r.unwrap()
        })
    }
}

export interface VerifyObjectResult {
    valid: boolean;

    desc_signs: VerifySignResult[];
    body_signs: VerifySignResult[];
}

export class VerifyObjectResultJsonCodec extends JsonCodec<VerifyObjectResult> {
    encode_object(param: VerifyObjectResult): any {
        const desc_signs = [];
        const body_signs = [];
        for (const sign of param.desc_signs) {
            desc_signs.push(new VerifySignResultJsonCodec().encode_object(sign))
        }
        for (const sign of param.body_signs) {
            body_signs.push(new VerifySignResultJsonCodec().encode_object(sign))
        }
        return  {
            valid: param.valid,
            desc_signs,
            body_signs
        }
    }

    decode_object(o: any): BuckyResult<VerifyObjectResult> {
        const desc_signs = [];
        for (const sign of o.desc_signs) {
            const r = new VerifySignResultJsonCodec().decode_object(sign);
            if (r.err) {
                return r;
            }
            desc_signs.push(r.unwrap())
        }
        
        const body_signs = [];
        for (const sign of o.body_signs) {
            const r = new VerifySignResultJsonCodec().decode_object(sign);
            if (r.err) {
                return r;
            }
            body_signs.push(r.unwrap())
        }

        return Ok({
            valid: o.valid,
            desc_signs,
            body_signs
        })
    }
}

export interface CryptoVerifyObjectOutputResponse {
    result: VerifyObjectResult;
}

export class CryptoVerifyObjectOutputResponseJsonCodec extends JsonCodec<CryptoVerifyObjectOutputResponse> {
    encode_object(param: CryptoVerifyObjectOutputResponse): any {
        return {result: new VerifyObjectResultJsonCodec().encode_object(param.result)}
    }

    decode_object(o: any): BuckyResult<CryptoVerifyObjectOutputResponse> {
        const r = new VerifyObjectResultJsonCodec().decode_object(o.result);
        if (r.err) {
            return r;
        }
        return Ok({result: r.unwrap()})
    }
}

export const CRYPTO_REQUEST_FLAG_CRYPT_BY_OWNER = 0x01 << 1;
export const CRYPTO_REQUEST_FLAG_CRYPT_BY_DEVICE = 0x01 << 2;

export enum CryptoEncryptType {
    EncryptData = "encrypt_data",
    GenAESKeyAndEncrypt = "gen_aeskey_and_encrypt",
}

export interface CryptoEncryptDataOutputRequest {
    common: CryptoOutputRequestCommon,

    encrypt_type: CryptoEncryptType,

    data?: Uint8Array,

    flags: number,
}

export interface CryptoEncryptDataOutputResponse {
    aes_key?: AesKey,

    result: Uint8Array,
}

export enum CryptoDecryptType {
    DecryptData = "decrypt_data",
    DecryptAESKey = "decrypt_aeskey",
}

export interface CryptoDecryptDataOutputRequest {
    common: CryptoOutputRequestCommon,

    decrypt_type: CryptoDecryptType,

    data: Uint8Array,

    flags: number,
}

export enum DecryptDataResult {
    Decrypted = "decrypted",
    Pending = "pending",
}

export interface CryptoDecryptDataOutputResponse {
    result: DecryptDataResult,
    data: Uint8Array,
}