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



export class ChunkTransContract implements RawEncode {
    constructor(
        public price_per_kbytes: number,
        public obj_list: Option<ObjectId[]>,
        public min_speed: Option<number>,
        public max_speed: Option<number>,
        public avg_speed: Option<number>,
        public max_bytes: Option<bigint>,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyNumber('u32', this.price_per_kbytes).raw_measure().unwrap();
        size += OptionEncoder.from(this.obj_list, (v:ObjectId[])=>new Vec(v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.min_speed, (v:number)=>new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.max_speed, (v:number)=>new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.avg_speed, (v:number)=>new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.max_bytes, (v:bigint)=>new BuckyNumber('u64', v)).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u32', this.price_per_kbytes).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.obj_list, (v:ObjectId[])=>new Vec(v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.min_speed, (v:number)=>new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_speed, (v:number)=>new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.avg_speed, (v:number)=>new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_bytes, (v:bigint)=>new BuckyNumber('u64', v)).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ChunkTransContractDecoder implements RawDecode<ChunkTransContract> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ChunkTransContract, Uint8Array]>{
        let price_per_kbytes;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [price_per_kbytes, buf] = r.unwrap();
        }

        let obj_list;
        {
            const r = new OptionDecoder(new VecDecoder(new ObjectIdDecoder())).raw_decode(buf);
            if(r.err){
                return r;
            }
            [obj_list, buf] = r.unwrap();
        }

        let min_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [min_speed, buf] = r.unwrap();
        }

        let max_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [max_speed, buf] = r.unwrap();
        }

        let avg_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [avg_speed, buf] = r.unwrap();
        }

        let max_bytes;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u64')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [max_bytes, buf] = r.unwrap();
        }

        const ret:[ChunkTransContract, Uint8Array] = [new ChunkTransContract(price_per_kbytes.toNumber()
            , obj_list.to((v:Vec<ObjectId>)=>v.value())
            , min_speed.to((v)=>v.toNumber())
            , max_speed.to((v)=>v.toNumber())
            , avg_speed.to((v)=>v.toNumber())
            , max_bytes.to((v)=>v.toBigInt())), buf];
        return Ok(ret);
    }

}
