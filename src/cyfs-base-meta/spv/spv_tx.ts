/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import {
    SubDescType,
    DescTypeInfo, DescContent, DescContentDecoder,
    BodyContent, BodyContentDecoder,
    NamedObjectId, NamedObjectIdDecoder,
    NamedObjectDesc, NamedObjectDescDecoder,
    NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "../../cyfs-base/objects/object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../cyfs-base/base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { HashValue, HashValueDecoder } from "../../cyfs-base/crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";



export class SPVTx implements RawEncode {
    constructor(
        public hash: string,
        public number: bigint,
        public from: string,
        public to: string,
        public coin_id: number,
        public value: bigint,
        public desc: string,
        public create_time: bigint,
        public result: number,
        public use_fee: number,
        public nonce: bigint,
        public gas_coin_id: number,
        public gas_price: number,
        public max_fee: number,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyString(this.hash).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.number).raw_measure().unwrap();
        size += new BuckyString(this.from).raw_measure().unwrap();
        size += new BuckyString(this.to).raw_measure().unwrap();
        size += new BuckyNumber('u8', this.coin_id).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.value).raw_measure().unwrap();
        size += new BuckyString(this.desc).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.create_time).raw_measure().unwrap();
        size += new BuckyNumber('u32', this.result).raw_measure().unwrap();
        size += new BuckyNumber('u32', this.use_fee).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.nonce).raw_measure().unwrap();
        size += new BuckyNumber('u8', this.gas_coin_id).raw_measure().unwrap();
        size += new BuckyNumber('u16', this.gas_price).raw_measure().unwrap();
        size += new BuckyNumber('u32', this.max_fee).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyString(this.hash).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.number).raw_encode(buf).unwrap();
        buf = new BuckyString(this.from).raw_encode(buf).unwrap();
        buf = new BuckyString(this.to).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u8', this.coin_id).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.value).raw_encode(buf).unwrap();
        buf = new BuckyString(this.desc).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.create_time).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.result).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.use_fee).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.nonce).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u8', this.gas_coin_id).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u16', this.gas_price).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.max_fee).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class SPVTxDecoder implements RawDecode<SPVTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[SPVTx, Uint8Array]>{
        let hash;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [hash, buf] = r.unwrap();
        }

        let number;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [number, buf] = r.unwrap();
        }

        let from;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [from, buf] = r.unwrap();
        }

        let to;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [to, buf] = r.unwrap();
        }

        let coin_id;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [coin_id, buf] = r.unwrap();
        }

        let value;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [value, buf] = r.unwrap();
        }

        let desc;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [desc, buf] = r.unwrap();
        }

        let create_time;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [create_time, buf] = r.unwrap();
        }

        let result;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [result, buf] = r.unwrap();
        }

        let use_fee;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [use_fee, buf] = r.unwrap();
        }

        let nonce;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [nonce, buf] = r.unwrap();
        }

        let gas_coin_id;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [gas_coin_id, buf] = r.unwrap();
        }

        let gas_price;
        {
            const r = new BuckyNumberDecoder('u16').raw_decode(buf);
            if(r.err){
                return r;
            }
            [gas_price, buf] = r.unwrap();
        }

        let max_fee;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [max_fee, buf] = r.unwrap();
        }

        const ret:[SPVTx, Uint8Array] = [new SPVTx(hash.value(), number.toBigInt(), from.value(), to.value(), coin_id.toNumber(), value.toBigInt(), desc.value(), create_time.toBigInt(), result.toNumber(), use_fee.toNumber(), nonce.toBigInt(), gas_coin_id.toNumber(), gas_price.toNumber(), max_fee.toNumber()), buf];
        return Ok(ret);
    }

}
