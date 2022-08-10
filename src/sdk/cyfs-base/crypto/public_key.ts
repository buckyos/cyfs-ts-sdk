import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../base/results";
import { RawEncode, RawDecode, to_vec } from "../base/raw_encode";
import { } from "../base/buffer";
import { BuckyNumber, BuckyNumberDecoder } from "../base/bucky_number";
import { Vec, VecDecoder } from "../base/vec";
import { AesKey } from "./aes_key";
import { ObjectLink, ObjectLinkDecoder } from "../objects/object_id";
import { base_trace } from "../base/log";
import bs58 from 'bs58';
import JSBI from 'jsbi';

import {asn1, pki, util} from 'node-forge'
import { HashValue } from "./hash";

//const bs58 = require('../base/bs58');

/*************************************
 * 签名
 *************************************/
export const SIGNATURE_REF_INDEX = 0;
export const SIGNATURE_OBJECT = 1;
export const SIGNATURE_KEY = 2;

// 1.obj_desc.ref_objs,取值范围为[0, 127]
export const SIGNATURE_SOURCE_REFINDEX_REF_OBJ_BEGIN = 0;
export const SIGNATURE_SOURCE_REFINDEX_REF_OBJ_END = 127;

// 2.逻辑ref (从128-255（可以根据需要扩展）
// ref[255] = 自己 （适用于有权对象）
// ref[254] = owner （使用于有主对象）
// ref[253] = author (适用于填写了作者的对象） 
// ref[252-236] = ood_list[x] (适用于所在Zone的ood对象）
export const SIGNATURE_SOURCE_REFINDEX_SELF = 255;
export const SIGNATURE_SOURCE_REFINDEX_OWNER = 254;
export const SIGNATURE_SOURCE_REFINDEX_AUTHOR = 253;

export const SIGNATURE_SOURCE_REFINDEX_ZONE_OOD_BEGIN = 252;
export const SIGNATURE_SOURCE_REFINDEX_ZONE_OOD_END = 236;

export const SIGN_DATA_FLAG_RSA1024 = 0;
export const SIGN_DATA_FLAG_RSA2048 = 1;
export const SIGN_DATA_FLAG_ECC = 2;

export const SIGN_DATA_LEN_RSA1024 = 32;
export const SIGN_DATA_LEN_RSA2048 = 64;
export const SIGN_DATA_LEN_ECC = 16;

export const SIGN_DATA_UNIT = 4; // 4 bytes = 32bit = u32
export const SIGN_DATA_SIZE_RSA1024 = SIGN_DATA_LEN_RSA1024 * SIGN_DATA_UNIT;
export const SIGN_DATA_SIZE_RSA2048 = SIGN_DATA_LEN_RSA2048 * SIGN_DATA_UNIT;
export const SIGN_DATA_SIZE_ECC = SIGN_DATA_LEN_ECC * SIGN_DATA_UNIT;

export interface SignDataPartten<T> {
    Rsa1024SignData: (obj: Rsa1024SignData) => T;
    Rsa2048SignData: (obj: Rsa2048SignData) => T;
    EccSignData: (obj: EccSignData) => T;
}

export interface SignDataVisitor {
    match<T>(p: SignDataPartten<T>): T;
}

export abstract class SignDataBase implements RawEncode {
    type: number;
    value: Uint8Array;

    constructor(type: number, value: Uint8Array) {
        this.type = type;
        this.value = value;
    }

    as_slice(): Uint8Array {
        return this.value;
    }

    raw_measure(): BuckyResult<number> {
        let bytes = 1;
        switch (this.type) {
            case SIGN_DATA_FLAG_RSA1024: {
                bytes += SIGN_DATA_SIZE_RSA1024;
                break;
            }
            case SIGN_DATA_FLAG_RSA2048: {
                bytes += SIGN_DATA_SIZE_RSA2048;
                break;
            }
            case SIGN_DATA_FLAG_ECC: {
                bytes += SIGN_DATA_SIZE_ECC;
                break;
            }
        }
        return Ok(bytes);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        // type
        buf[0] = this.type;
        buf = buf.offset(1);

        // buffer
        buf.set(this.as_slice());

        return Ok(buf.offset(this.as_slice().length));
    }

    to_base_58(): string {
        return bs58.encode(this.as_slice());
    }
}

export class SignDataDecoder implements RawDecode<SignData>{
    constructor() {
        //
    }

    raw_decode(buf: Uint8Array): BuckyResult<[SignData, Uint8Array]> {
        const type = buf[0];
        buf = buf.offset(1);

        switch (type) {
            case SIGN_DATA_FLAG_RSA1024: {
                const bytes = SIGN_DATA_LEN_RSA1024;
                const value = buf.slice(0, bytes);
                buf = buf.offset(bytes);

                const obj = new Rsa1024SignData(value);
                const ret: [SignData, Uint8Array] = [obj, buf];

                return Ok(ret);
            }
            case SIGN_DATA_FLAG_RSA2048: {
                const bytes = SIGN_DATA_LEN_RSA2048;
                const value = buf.slice(0, bytes);
                buf = buf.offset(bytes);

                const obj = new Rsa2048SignData(value);
                const ret: [SignData, Uint8Array] = [obj, buf];

                return Ok(ret);
            }
            case SIGN_DATA_LEN_ECC: {
                const bytes = SIGN_DATA_LEN_ECC;
                const value = buf.slice(0, bytes);
                buf = buf.offset(bytes);

                const obj = new EccSignData(value);
                const ret: [SignData, Uint8Array] = [obj, buf];

                return Ok(ret);
            }
            default: {
                return Err(new BuckyError(BuckyErrorCode.NotMatch, "sign data type not support"));
            }
        }
    }
}

export class Rsa1024SignData extends SignDataBase implements SignDataVisitor {
    constructor(value: Uint8Array) {
        if (value != null && value.length !== SIGN_DATA_SIZE_RSA1024) {
            throw Error("Rsa1024SignData buffer length SHOULD be 32 bytes");
        }
        super(SIGN_DATA_FLAG_RSA1024, value);
    }

    match<T>(p: SignDataPartten<T>): T {
        return p.Rsa1024SignData(this);
    }
}

export class Rsa2048SignData extends SignDataBase implements SignDataVisitor {
    constructor(value: Uint8Array) {
        if (value != null && value.length !== SIGN_DATA_SIZE_RSA2048) {
            throw Error("Rsa1024SignData buffer length SHOULD be 32 bytes");
        }
        super(SIGN_DATA_FLAG_RSA2048, value);
    }

    match<T>(p: SignDataPartten<T>): T {
        return p.Rsa2048SignData(this);
    }
}

export class EccSignData extends SignDataBase implements SignDataVisitor {
    constructor(value: Uint8Array) {
        if (value != null && value.length !== SIGN_DATA_SIZE_ECC) {
            throw Error("Rsa1024SignData buffer length SHOULD be 32 bytes");
        }
        super(SIGN_DATA_FLAG_ECC, value);
    }

    match<T>(p: SignDataPartten<T>): T {
        return p.EccSignData(this);
    }
}

// 签名数据类型
export type SignData = Rsa1024SignData | Rsa2048SignData | EccSignData;

// 测试用例
function test(s: SignData) {
    s.match({
        Rsa1024SignData: (obj): void => {
            base_trace("sign data type is Rsa1024SignData, value:{}, type:{}", obj.value, obj.type);
        },
        Rsa2048SignData: (obj): void => {
            base_trace("sign data type is Rsa2048SignData, value:{}, type:{}", obj.value, obj.type);
        },
        EccSignData: (obj): void => {
            base_trace("sign data type is EccSignData, value:{}, type:{}", obj.value, obj.type);
        }
    });
}

//
// SignatureSource
//
export interface SignatureSourcePattern<T> {
    RefIndex: (s: number) => T;
    Object: (s: ObjectLink) => T;
    Key: (s: PublicKeyValue) => T;
}

export interface SignatureSourceMatch {
    match<T>(p: SignatureSourcePattern<T>): T;
}

export class SignatureRefIndex implements SignatureSourceMatch {
    s: number;
    constructor(s: number) {
        this.s = s;
    }
    match<T>(p: SignatureSourcePattern<T>): T {
        return p.RefIndex(this.s);
    }
}

export class SignatureObject implements SignatureSourceMatch {
    s: ObjectLink;
    constructor(s: ObjectLink) {
        this.s = s;
    }
    match<T>(p: SignatureSourcePattern<T>): T {
        return p.Object(this.s);
    }
}

export class SignatureKey implements SignatureSourceMatch {
    s: PublicKeyValue;
    constructor(s: PublicKeyValue) {
        this.s = s;
    }
    match<T>(p: SignatureSourcePattern<T>): T {
        return p.Key(this.s);
    }
}

// visitor 模式， 重型
export type SignatureSource = SignatureRefIndex | SignatureObject | SignatureKey;

// 轻量级，直接裸组合内部类型，要怎么区分类型？装箱成vistor类型？
export type SignatureSourceLite = number | ObjectLink | PublicKeyValue;

//
// Signature
//
export class Signature implements RawEncode {
    m_sign_source: SignatureSource;
    m_sign_key_index: number; // u8
    m_sign_time: JSBI; // u64;
    m_sign: SignData;

    constructor(sign_source: SignatureSource, sign_key_index: number, sign_time: JSBI, sign: SignData) {
        this.m_sign_source = sign_source;
        this.m_sign_key_index = sign_key_index;
        this.m_sign_time = sign_time;
        this.m_sign = sign;
    }

    get sign_key_index(): number {
        return this.m_sign_key_index!;
    }

    get sign_time(): JSBI {
        return this.m_sign_time;
    }

    get sign_source(): SignatureSource {
        return this.m_sign_source;
    }

    get sign(): SignData {
        return this.m_sign;
    }

    sign_source_with_ref_index(): number {
        return this.sign_source.match<number>({
            RefIndex: (_obj) => {
                // sign_key_index[. . . . . . x x] type[. .]
                return SIGNATURE_REF_INDEX | (this.sign_key_index << 2);
            },
            Object: (obj) => {
                return SIGNATURE_OBJECT | (this.sign_key_index << 2);
            },
            Key: (obj) => {
                return SIGNATURE_KEY;
            }
        });
    }

    raw_measure(): BuckyResult<number> {
        // sign_source_with_ref_index: u8
        let bytes = 1;

        // signatory: Option<SignatureSource>
        const r = this.sign_source.match<BuckyResult<number>>({
            RefIndex: (_obj) => {
                return Ok(1);
            },
            Object: (obj) => {
                const r = obj.raw_measure();
                if (r.err) {
                    console.error("raw_measure SignatureSource Object Type failed， err:", r.val);
                    return r;
                }
                return r;
            },
            Key: (obj) => {
                const r = obj.raw_measure();
                if (r.err) {
                    console.error("raw_measure SignatureSource Object Type failed， err:", r.val);
                    return r;
                }
                return r;
            }
        });
        if (r.err) {
            return r;
        }
        bytes += r.unwrap();

        // sign_time: u64
        bytes += 8;

        // sign_data_flag: u8
        bytes += 1;

        // sign_data: Vec<u8>
        const dr = this.sign.match<BuckyResult<number>>({
            Rsa1024SignData: (_) => {
                return Ok(SIGN_DATA_SIZE_RSA1024);
            },
            Rsa2048SignData: (_) => {
                return Ok(SIGN_DATA_SIZE_RSA2048);
            },
            EccSignData: (_) => {
                return Ok(SIGN_DATA_SIZE_ECC);
            }
        });
        bytes += dr.unwrap();

        return Ok(bytes);

    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        // sign_source_with_ref_index: u8
        {
            const index = this.sign_source_with_ref_index();
            buf[0] = index;
            buf = buf.offset(1);
        }

        // signatory: Option<SignatureSource>
        {
            const r = this.sign_source.match<BuckyResult<Uint8Array>>({
                RefIndex: (ref_index) => {
                    buf[0] = ref_index;
                    buf = buf.offset(1);
                    return Ok(buf);
                },
                Object: (obj) => {
                    return obj.raw_encode(buf);
                },
                Key: (obj) => {
                    return obj.raw_encode(buf);
                }
            });
            if (r.err) {
                console.error("encode signature sign_source failed, err:", r.val);
                return r;
            }
            buf = r.unwrap();
        }

        // sign_time: u64
        {
            const r = new BuckyNumber("u64", this.sign_time).raw_encode(buf);
            if (r.err) {
                console.error("encode signature sign_time failed, err:", r.val);
                return r;
            }
            buf = r.unwrap();
        }

        // sign_data
        this.sign.match<void>({
            Rsa1024SignData: (data) => {
                // flag
                buf[0] = KEY_TYPE_RSA;
                buf = buf.offset(1);

                // data
                const slice = data.as_slice();
                buf.set(slice);
                buf = buf.offset(slice.length);
            },
            Rsa2048SignData: (data) => {
                // flag
                buf[0] = KEY_TYPE_RSA2048;
                buf = buf.offset(1);

                // data
                let slice = data.as_slice();
                buf.set(slice);
                buf = buf.offset(slice.length);
            },
            EccSignData: (data) => {
                // flag
                buf[0] = KEY_TYPE_SECP256K1;
                buf = buf.offset(1);

                // data
                let slice = data.as_slice();
                buf.set(slice);
                buf = buf.offset(slice.length);
            }
        });

        return Ok(buf);
    }
}

export class SignatureDecoder implements RawDecode<Signature>{
    raw_decode(buf: Uint8Array): BuckyResult<[Signature, Uint8Array]> {
        // [. . . . . . ]  [. .]
        // ref_index     | real_type_code
        let sign_source_with_ref_index = buf[0];
        buf = buf.offset(1);

        let sign_source_code = sign_source_with_ref_index << 6 >> 6;
        let sign_key_index = sign_source_with_ref_index >> 2;

        // sign_source
        let sign_source;
        switch (sign_source_code) {
            case SIGNATURE_REF_INDEX: {
                let ref_index = buf[0];
                buf = buf.offset(1);
                sign_source = new SignatureRefIndex(ref_index);
                break;
            }
            case SIGNATURE_OBJECT: {
                const r = new ObjectLinkDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("Signature decode soruce object failed, err:", r.val);
                    return r;
                }
                let link: ObjectLink;
                [link, buf] = r.unwrap();
                sign_source = new SignatureObject(link);
                break;
            }
            case SIGNATURE_KEY: {
                const r = new PublicKeyValueDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("Signature decode soruce key failed, err:", r.val);
                    return r;
                }
                let key: PublicKeyValue;
                [key, buf] = r.unwrap();
                sign_source = new SignatureKey(key);
                break;
            }
            default: {
                return Err(new BuckyError(BuckyErrorCode.InvalidData, `invalid sign_source_code:${sign_source_code}`));
            }
        }

        // sign_time: u64
        let sign_time;
        {
            const r = new BuckyNumberDecoder("u64").raw_decode(buf);
            if (r.err) {
                console.error("Signature decode sign_time failed, err:", r.val);
                return r;
            }
            [sign_time, buf] = r.unwrap();
        }

        // key_type: u8
        let key_type = buf[0];
        buf = buf.offset(1);


        // sign data
        let sign;
        switch (key_type) {
            case KEY_TYPE_RSA: {
                const data = buf.slice(0, SIGN_DATA_SIZE_RSA1024);
                sign = new Rsa1024SignData(data);
                buf = buf.offset(SIGN_DATA_SIZE_RSA1024);
                break;
            }
            case KEY_TYPE_RSA2048: {
                const data = buf.slice(0, SIGN_DATA_SIZE_RSA2048);
                sign = new Rsa2048SignData(data);
                buf = buf.offset(SIGN_DATA_SIZE_RSA2048);
                break;
            }
            case KEY_TYPE_SECP256K1: {
                const data = buf.slice(0, SIGN_DATA_SIZE_ECC);
                sign = new EccSignData(data);
                buf = buf.offset(SIGN_DATA_SIZE_ECC);
                break;
            }
            default: {
                return Err(new BuckyError(BuckyErrorCode.InvalidData, `invalid key_type:${key_type}`));
            }
        }

        const s = new Signature(sign_source, sign_key_index, sign_time.toBigInt(), sign);

        const result: [Signature, Uint8Array] = [s, buf];

        return Ok(result);
    }
}

/*************************************
 * 公玥
 *************************************/

// RSA
export const RAW_PUBLIC_KEY_RSA_1024_CODE = 0;
export const RAW_PUBLIC_KEY_RSA_1024_LENGTH = 162;

export const RAW_PUBLIC_KEY_RSA_2048_CODE = 1;
export const RAW_PUBLIC_KEY_RSA_2048_LENGTH = 294;

export const RAW_PUBLIC_KEY_RSA_3072_CODE = 2;
export const RAW_PUBLIC_KEY_RSA_3072_LENGTH = 422;

// SECP256K1
export const RAW_PUBLIC_KEY_SECP256K1_CODE = 10;
export const RAW_PUBLIC_KEY_SECP256K1_LENGTH = 33;

// 密钥类型的编码
export const KEY_TYPE_RSA = 0;
export const KEY_TYPE_RSA2048 = 1;
export const KEY_TYPE_SECP256K1 = 5;

export interface PublicKeyPattern<T> {
    RSAPublicKey: (obj: RSAPublicKey) => T;
    Secp256k1PublicKey: (obj: Secp256k1PublicKey) => T;
}

export interface PublicKeyMatcher {
    match<T>(p: PublicKeyPattern<T>): T;
}

export abstract class PublicKeyBase implements RawEncode {
    threshold: number;
    code: number;

    constructor(code: number) {
        this.threshold = -1;
        this.code = code;
    }

    abstract key_size(): number;
    abstract encrypt(data: Uint8Array, output: Uint8Array): BuckyResult<number>;
    abstract gen_aeskey_and_encrypt(): BuckyResult<[AesKey, Uint8Array]>;
    abstract verify(data: Uint8Array, sign: Signature): boolean;
    abstract raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>;

    toJSON(): string {
        const size = this.raw_measure().unwrap();
        const buf = new Uint8Array(size);
        const _ = this.raw_encode(buf).unwrap();
        return bs58.encode(buf);
    }

    raw_measure(): BuckyResult<number> {
        switch (this.code) {
            case RAW_PUBLIC_KEY_RSA_1024_CODE: {
                return Ok(RAW_PUBLIC_KEY_RSA_1024_LENGTH + 1);
            }
            case RAW_PUBLIC_KEY_RSA_2048_CODE: {
                return Ok(RAW_PUBLIC_KEY_RSA_2048_LENGTH + 1);
            }
            case RAW_PUBLIC_KEY_RSA_3072_CODE: {
                return Ok(RAW_PUBLIC_KEY_RSA_3072_LENGTH + 1);
            }
            case RAW_PUBLIC_KEY_SECP256K1_CODE: {
                return Ok(RAW_PUBLIC_KEY_SECP256K1_LENGTH + 1);
            }
            default: {
                throw Error("should not come here");
            }
        }
    }

    abstract as_public_value(): PublicKeyValue;
}

export class RSAPublicKey extends PublicKeyBase implements PublicKeyMatcher {
    constructor(code: number, private public_key: pki.rsa.PublicKey) {
        super(code);
    }

    static from_buffer(code: number, buffer: Uint8Array): RSAPublicKey {
        let key = pki.publicKeyFromAsn1(asn1.fromDer(util.binary.raw.encode(buffer), {parseAllBytes: false}));
        return new RSAPublicKey(code, key as pki.rsa.PublicKey);
    }

    key_size(): number {
        return this.public_key.n.bitLength() / 8;
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        let len = this.raw_measure().unwrap();
        let r = new BuckyNumber('u8', this.code).raw_encode(buf);
        if (r.err) {
            return r;
        }
        buf = r.unwrap();

        const der_key = asn1.toDer(pki.publicKeyToRSAPublicKey(this.public_key))

        buf.set(util.binary.raw.decode(der_key.bytes()) as Uint8Array);

        buf = buf.offset(der_key.length())
        const padding_len = len - 1 - der_key.length();
        if (padding_len > 0) {
            buf.fill(0, 0, padding_len)
            buf = buf.offset(padding_len);
        }
        return Ok(buf)
    }

    encrypt(data: Uint8Array, output: Uint8Array): BuckyResult<number> {
        let msg = this.public_key.encrypt(util.binary.raw.encode(data), 'RSAES-PKCS1-V1_5');
        return Ok(util.binary.raw.decode(msg, output) as unknown as number)
    }

    gen_aeskey_and_encrypt(): BuckyResult<[AesKey, Uint8Array]> {
        // 先产生一个临时的aes_key
        let key = AesKey.random();

        // 使用publicKey对aes_key加密
        let output = new Uint8Array(this.key_size());
        let r = this.encrypt(key.as_slice(), output);
        if (r.err) {
            return r
        }

        return Ok([key, output])
    }

    verify(data: Uint8Array, sign: Signature): boolean {
        let sign_time = new BuckyNumber('u64', sign.sign_time);
        let final_data = new Uint8Array(data.length + sign_time.raw_measure().unwrap());
        final_data.set(data);
        sign_time.raw_encode(final_data.offset(data.length)).unwrap();

        let hash = HashValue.hash_data(final_data);
        return this.public_key.verify(util.binary.raw.encode(hash.as_slice()), util.binary.raw.encode(sign.sign.as_slice()), 'RSAES-PKCS1-V1_5')
    }

    match<T>(p: PublicKeyPattern<T>): T {
        return p.RSAPublicKey(this);
    }

    as_public_value(): PublicKeyValue {
        return new PublicKeyWithTag(this);
    }
}

export class Secp256k1PublicKey extends PublicKeyBase implements PublicKeyMatcher {
    constructor(public buffer: Uint8Array) {
        super(RAW_PUBLIC_KEY_SECP256K1_CODE);

        // TODO: 转换buffer到具体的公玥对象
    }

    key_size(): number {
        throw Error("not implemented");
    }

    encrypt(data: Uint8Array, output: Uint8Array): BuckyResult<number> {
        throw Error("not implemented");
    }

    gen_aeskey_and_encrypt(): BuckyResult<[AesKey, Uint8Array]> {
        throw Error("not implemented");
    }

    verify(data: Uint8Array, sign: Signature): boolean {
        throw Error("not implemented");
    }

    match<T>(p: PublicKeyPattern<T>): T {
        return p.Secp256k1PublicKey(this);
    }

    as_public_value(): PublicKeyValue {
        return new PublicKeyWithTag(this);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        let len = this.raw_measure().unwrap();
        let r = new BuckyNumber('u8', this.code).raw_encode(buf);
        if (r.err) {
            return r;
        }
        buf = r.unwrap();

        buf.set(this.buffer);

        buf = buf.offset(this.buffer.length)
        return Ok(buf)
    }
}

export type PublicKey = RSAPublicKey | Secp256k1PublicKey;

export class PublicKeyDecoder implements RawDecode<PublicKey>{
    constructor() {
        //
    }

    raw_decode(buf: Uint8Array): BuckyResult<[PublicKey, Uint8Array]> {
        const code = buf[0];
        base_trace("public_key code:", code);
        buf = buf.offset(1);
        switch (code) {
            case RAW_PUBLIC_KEY_RSA_1024_CODE: {
                const len = RAW_PUBLIC_KEY_RSA_1024_LENGTH;
                const buffer = buf.slice(0, len);
                const pk = RSAPublicKey.from_buffer(code, buffer);
                buf = buf.offset(len);
                const ret: [PublicKey, Uint8Array] = [pk, buf];
                return Ok(ret);
            }
            case RAW_PUBLIC_KEY_RSA_2048_CODE: {
                const len = RAW_PUBLIC_KEY_RSA_2048_LENGTH;
                const buffer = buf.slice(0, len);
                const pk = RSAPublicKey.from_buffer(code, buffer);
                buf = buf.offset(len);
                const ret: [PublicKey, Uint8Array] = [pk, buf];
                return Ok(ret);
            }
            case RAW_PUBLIC_KEY_RSA_3072_CODE: {
                const len = RAW_PUBLIC_KEY_RSA_3072_LENGTH;
                const buffer = buf.slice(0, len);
                const pk = RSAPublicKey.from_buffer(code, buffer);
                buf = buf.offset(len);
                const ret: [PublicKey, Uint8Array] = [pk, buf];
                return Ok(ret);
            }
            case RAW_PUBLIC_KEY_SECP256K1_CODE: {
                const len = RAW_PUBLIC_KEY_SECP256K1_LENGTH;
                const buffer = buf.slice(0, len);
                const pk = new Secp256k1PublicKey(buffer);
                buf = buf.offset(len);
                const ret: [PublicKey, Uint8Array] = [pk, buf];
                return Ok(ret);
            }
            default: {
                throw Error("should not come here");
            }
        }
    }
}

export class MNPublicKey implements RawEncode {
    threshold: number;
    keys: Vec<PublicKey>;

    constructor(threshold: number, keys: Vec<PublicKey>) {
        if (threshold < 0) {
            throw Error("mnkey threshold should not be negative");
        }
        this.threshold = threshold;
        this.keys = keys;
    }

    raw_measure(): BuckyResult<number> {
        let bytes = 0;

        // measure threshold: u8
        {
            bytes += 1;
        }

        // measure keys
        {
            const ret = this.keys.raw_measure();
            if (ret.err) {
                return ret;
            }
            bytes += ret.unwrap();
        }

        return Ok(bytes);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        const size = this.raw_measure().unwrap();
        if (buf.length < size) {
            return Err(new BuckyError(BuckyErrorCode.OutOfLimit, "not enought for MNPublicKey"));
        }

        // encode threshold
        {
            buf[0] = this.threshold;
            buf = buf.offset(1);
        }

        // encode keys
        {
            const ret = this.keys.raw_encode(buf);
            if (ret.err) {
                return ret;
            }
            buf = ret.unwrap();
        }

        return Ok(buf);
    }

    as_public_value(): PublicKeyValue {
        return new MNPublicKeyWithTag(this);
    }
}

export class MNPublicKeyDecoder implements RawDecode<MNPublicKey>{
    constructor() {
        //
    }

    raw_decode(buf: Uint8Array): BuckyResult<[MNPublicKey, Uint8Array]> {
        // decode threshold
        let threshold = buf[0];
        buf = buf.offset(1);

        // decode keys
        let keys;
        {
            const d = new VecDecoder<PublicKey>(new PublicKeyDecoder());
            const ret = d.raw_decode(buf);
            if (ret.err) {
                return ret;
            }
            [keys, buf] = ret.unwrap();
        }

        const mn_keys = new MNPublicKey(threshold, keys);

        const result: [MNPublicKey, Uint8Array] = [mn_keys, buf];

        return Ok(result);
    }
}

export interface PublicKeyValuePattern<T> {
    PublicKey: (key: PublicKey) => T;
    MNPublicKey: (key: MNPublicKey) => T;
}

export interface PublicKeyValueMatch {
    match<T>(p: PublicKeyValuePattern<T>): T;
}

export class PublicKeyWithTag implements PublicKeyValueMatch, RawEncode {
    key: PublicKey;

    constructor(key: PublicKey) {
        this.key = key;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(1 + this.key.raw_measure().unwrap());
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        buf[0] = 0;
        buf = buf.offset(1);

        return this.key.raw_encode(buf);
    }

    match<T>(p: PublicKeyValuePattern<T>): T {
        return p.PublicKey(this.key);
    }
}

export class MNPublicKeyWithTag implements PublicKeyValueMatch, RawEncode {
    key: MNPublicKey;

    constructor(key: MNPublicKey) {
        this.key = key;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(1 + this.key.raw_measure().unwrap());
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        buf[0] = 0;
        buf = buf.offset(1);

        return this.key.raw_encode(buf);
    }

    match<T>(p: PublicKeyValuePattern<T>): T {
        return p.MNPublicKey(this.key);
    }
}

export type PublicKeyValue = PublicKeyWithTag | MNPublicKeyWithTag;

export class PublicKeyValueDecoder implements RawDecode<PublicKeyValue>{
    constructor() {
        //
    }

    raw_decode(buf: Uint8Array): BuckyResult<[PublicKeyValue, Uint8Array]> {
        const tag = buf[0];
        buf = buf.offset(1);

        switch (tag) {
            case 0: {
                const d = new PublicKeyDecoder();
                const ret = d.raw_decode(buf);
                if (ret.err) {
                    return ret;
                }

                let key;
                [key, buf] = ret.unwrap();

                const result: [PublicKeyValue, Uint8Array] = [key.as_public_value(), buf];
                return Ok(result);
            }
            case 1: {
                const d = new MNPublicKeyDecoder();
                const ret = d.raw_decode(buf);
                if (ret.err) {
                    return ret;
                }

                let key;
                [key, buf] = ret.unwrap();

                const result: [PublicKeyValue, Uint8Array] = [key.as_public_value(), buf];
                return Ok(result);
            }
            default: {
                return Err(new BuckyError(BuckyErrorCode.NotSupport, "invalid public key value tag"));
            }
        }
    }
}