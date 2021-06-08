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



export class SNReceipt implements RawEncode {
    constructor(
        public ping_count: Option<number>,
        public called_count: Option<number>,
        public success_called_count: Option<number>,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += OptionEncoder.from(this.ping_count, (v:number)=>new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.called_count, (v:number)=>new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.success_called_count, (v:number)=>new BuckyNumber('u32', v)).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = OptionEncoder.from(this.ping_count, (v:number)=>new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.called_count, (v:number)=>new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.success_called_count, (v:number)=>new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class SNReceiptDecoder implements RawDecode<SNReceipt> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[SNReceipt, Uint8Array]>{
        let ping_count;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [ping_count, buf] = r.unwrap();
        }

        let called_count;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [called_count, buf] = r.unwrap();
        }

        let success_called_count;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [success_called_count, buf] = r.unwrap();
        }

        const ret:[SNReceipt, Uint8Array] = [new SNReceipt(ping_count.to((v)=>v.toNumber()), called_count.to((v)=>v.toNumber()), success_called_count.to((v)=>v.toNumber())), buf];
        return Ok(ret);
    }

}
