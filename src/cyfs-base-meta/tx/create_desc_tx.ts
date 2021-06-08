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



export class CreateDescTx implements RawEncode {
    constructor(
        public coin_id: number,
        public from: Option<ObjectId>,
        public value: bigint,
        public desc_hash: HashValue,
        public price: number,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyNumber('u8', this.coin_id).raw_measure().unwrap();
        size += OptionEncoder.from(this.from, (v:ObjectId)=>v).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.value).raw_measure().unwrap();
        size += this.desc_hash.raw_measure().unwrap();
        size += new BuckyNumber('u32', this.price).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.coin_id).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.from, (v:ObjectId)=>v).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.value).raw_encode(buf).unwrap();
        buf = this.desc_hash.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.price).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class CreateDescTxDecoder implements RawDecode<CreateDescTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[CreateDescTx, Uint8Array]>{
        let coin_id;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [coin_id, buf] = r.unwrap();
        }

        let from;
        {
            const r = new OptionDecoder(new ObjectIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [from, buf] = r.unwrap();
        }

        let value;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [value, buf] = r.unwrap();
        }

        let desc_hash;
        {
            const r = new HashValueDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [desc_hash, buf] = r.unwrap();
        }

        let price;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [price, buf] = r.unwrap();
        }

        const ret:[CreateDescTx, Uint8Array] = [new CreateDescTx(coin_id.toNumber(), from.to((v:ObjectId)=>v), value.toBigInt(), desc_hash, price.toNumber()), buf];
        return Ok(ret);
    }

}
