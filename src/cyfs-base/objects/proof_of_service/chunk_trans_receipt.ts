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
} from "../../objects/object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../base/bucky_buffer";
import { Vec, VecDecoder } from "../../base/vec";
import { RawDecode, RawEncode } from "../../base/raw_encode";
import { HashValue, HashValueDecoder } from "../../crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../../objects/object_id";

import{ ChunkId, ChunkIdDecoder } from '../../objects/chunk'


export class ChunkTransReceipt implements RawEncode {
    constructor(
        public chunk_id: ChunkId,
        public crypto_chunk_id: ChunkId,
        public valid_length: Option<bigint>,
        public max_speed: Option<number>,
        public min_speed: Option<number>,
        public crypto_key: Option<bigint>,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.chunk_id.raw_measure().unwrap();
        size += this.crypto_chunk_id.raw_measure().unwrap();
        size += OptionEncoder.from(this.valid_length, (v:bigint)=>new BuckyNumber('u64', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.max_speed, (v:number)=>new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.min_speed, (v:number)=>new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.crypto_key, (v:bigint)=>new BuckyNumber('u64', v)).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.chunk_id.raw_encode(buf).unwrap();
        buf = this.crypto_chunk_id.raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.valid_length, (v:bigint)=>new BuckyNumber('u64', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_speed, (v:number)=>new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.min_speed, (v:number)=>new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.crypto_key, (v:bigint)=>new BuckyNumber('u64', v)).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ChunkTransReceiptDecoder implements RawDecode<ChunkTransReceipt> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ChunkTransReceipt, Uint8Array]>{
        let chunk_id;
        {
            const r = new ChunkIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [chunk_id, buf] = r.unwrap();
        }

        let crypto_chunk_id;
        {
            const r = new ChunkIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [crypto_chunk_id, buf] = r.unwrap();
        }

        let valid_length;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u64')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [valid_length, buf] = r.unwrap();
        }

        let max_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [max_speed, buf] = r.unwrap();
        }

        let min_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [min_speed, buf] = r.unwrap();
        }

        let crypto_key;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u64')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [crypto_key, buf] = r.unwrap();
        }

        const ret:[ChunkTransReceipt, Uint8Array] = [new ChunkTransReceipt(chunk_id, crypto_chunk_id, valid_length.to((v)=>v.toBigInt()), max_speed.to((v)=>v.toNumber()), min_speed.to((v)=>v.toNumber()), crypto_key.to((v)=>v.toBigInt())), buf];
        return Ok(ret);
    }

}
