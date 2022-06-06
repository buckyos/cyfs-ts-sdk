import { BuckyResult, Ok } from "./results";
import { } from "./buffer";
import { HashValue } from '../crypto/hash';

/**
 * 编码接口
 */
export enum RawEncodePurpose {
    Serialize,
    Hash
}

export interface RawEncode {
    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number>;
    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array>;

    // 两个优化可选函数
    encode_to_buf?: (purpose?: RawEncodePurpose) => BuckyResult<Uint8Array>;
    raw_hash_encode?: () => BuckyResult<HashValue>;
}

/**
 * 编码类型构造器
 */
export type EncodeBuilder<T extends RawEncode> = new (...constructorArgs: any[]) => T;

/**
 * 解码接口
 */
// DescContent+BodyContent解码的一些上下文信息
export class ContentRawDecodeContext {
    readonly version: number;
    readonly format: number;

    constructor(version: number, format: number) {
        this.version = version;
        this.format = format;
    }
}

export interface RawDecode<T> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[T, Uint8Array]>;
}

export abstract class RawHexDecode<T> implements RawDecode<T> {
    raw_decode_from_hex(hex: string): BuckyResult<[T, Uint8Array]> {
        const r = Uint8Array.prototype.fromHex(hex);
        if (r.err) {
            return r;
        }
        const buf = r.unwrap();
        return this.raw_decode(buf);
    }

    abstract raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[T, Uint8Array]>;
}

/**
 * 解码类型构造器
 */
export type DecodeBuilder<T extends RawEncode, D extends RawDecode<T>> = new (...constructorArgs: any[]) => D;


export interface Compareable<T> {
    hashCode(): symbol;
    equals(other: T): boolean;
}

export function to_buf<T extends RawEncode>(self: T): BuckyResult<Uint8Array> {
    // tslint:disable-next-line:no-string-literal
    // if (typeof (self as any)["encode_to_buf"] === 'function') {
    //    return (self as any)["encode_to_buf"]();
    // }

    // 如果实现了encode_to_buf方法，那么直接调用
    {
        const r = self.encode_to_buf?.();
        if (r) {
            return r;
        }
    }

    const size = self.raw_measure().unwrap();
    const buf = new Uint8Array(size);
    const ret = self.raw_encode(buf);
    if (ret.err) {
        return ret;
    }
    return Ok(buf);
}

export function to_vec<T extends RawEncode>(self: T): BuckyResult<Uint8Array> {
    return to_buf(self);
}

export function to_hex<T extends RawEncode>(self: T): BuckyResult<string> {
    const ret = to_buf(self);
    if (ret.err) {
        return ret;
    }
    const vec = ret.unwrap();
    return Ok(vec.toHex());
}

export function from_buf<T>(buf: Uint8Array, decoder: RawDecode<T>): BuckyResult<T> {
    const r = decoder.raw_decode(buf);
    if (r.err) {
        console.error("decode buf error:", r);
        return r;
    }

    const [result, left_buf] = r.unwrap();
    console.assert(left_buf.length === 0);

    return Ok(result);
}

export function from_hex<T extends RawEncode, D extends RawDecode<T>>(decoder: D, hex: string): BuckyResult<T> {
    const r = buffer_from_hex(hex);
    if (r.err) {
        return r;
    }

    return from_buf<T>(r.unwrap(), decoder);
}

export function buffer_from_hex(hex: string): BuckyResult<Uint8Array> {
    let buf;
    if (typeof window === 'undefined') {
        const r = Uint8Array.prototype.fromHex(hex);
        if (r.err) {
            return r;
        }
        buf = r.unwrap();
    } else {
        const hexToArrayBuffer = require('hex-to-array-buffer')
        buf = new Uint8Array(hexToArrayBuffer(hex));
    }
    return Ok(buf);
}