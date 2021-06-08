import {BuckyResult, BuckyError, BuckyErrorCode, Ok} from "./results";
import {} from "../base/buffer";

/**
 * 编码接口
 */
export enum RawEncodePurpose {
    Serialize,
    Hash
}

export interface RawEncode {
    raw_measure(ctx?:any, purpose?: RawEncodePurpose): BuckyResult<number>;
    raw_encode(buf: Uint8Array, ctx?:any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array>;
}

/**
 * 编码类型构造器
 */
export type EncodeBuilder<T extends RawEncode> = new(...constructorArgs: any[]) => T;

/**
 * 解码接口
 */
export interface RawDecode<T> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[T, Uint8Array]>;
}

export abstract class RawHexDecode<T> implements RawDecode<T> {
    raw_decode_from_hex(hex: string): BuckyResult<[T, Uint8Array]>{
        const r = Uint8Array.prototype.fromHex(hex);
        if(r.err){
            return r;
        }
        const buf = r.unwrap();
        return this.raw_decode(buf);
    }

    abstract raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[T, Uint8Array]>;
}

/**
 * 解码类型构造器
 */
export type DecodeBuilder<T extends RawEncode, D extends RawDecode<T>> = new(...constructorArgs: any[]) => D;


export interface Compareable<T>{
    hashCode(): symbol;
    equals(other: T): boolean;
}

export function to_buf<T extends RawEncode>(self: T): BuckyResult<Uint8Array>{
    const size = self.raw_measure().unwrap();
    const buf = new Uint8Array(size);
    let ret = self.raw_encode(buf);
    if (ret.err) {
        return ret;
    }
    return Ok(buf);
}

export function to_hex<T extends RawEncode>(self: T): BuckyResult<string>{
    const ret = to_buf(self);
    if(ret.err){
        return ret;
    }
    const vec = ret.unwrap();
    return Ok(vec.toHex());
}

export function from_hex<T extends RawEncode, D extends RawDecode<T>>(self: D, hex: string): BuckyResult<T>{

    let buf;
    if(typeof window ==='undefined'){
        const r = Uint8Array.prototype.fromHex(hex);
        if(r.err){
            return r;
        }
        buf = r.unwrap();
    }else{
        const hexToArrayBuffer = require('hex-to-array-buffer')
        buf = new Uint8Array(hexToArrayBuffer(hex));
    }

    console.log('buf:', buf);
    const dr = self.raw_decode(buf);
    if(dr.err){
        console.log("error:", dr);
        return dr;
    }
    const [obj, _] = dr.unwrap();
    return Ok(obj);
}

export function buffer_from_hex(hex: string): BuckyResult<Uint8Array>{
    let buf;
    if(typeof window ==='undefined'){
        const r = Uint8Array.prototype.fromHex(hex);
        if(r.err){
            return r;
        }
        buf = r.unwrap();
    }else{
        const hexToArrayBuffer = require('hex-to-array-buffer')
        buf = new Uint8Array(hexToArrayBuffer(hex));
    }
    return Ok(buf);
}