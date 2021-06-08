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

import { MetaPrice } from './meta_price';
import { MetaPriceDecoder } from './meta_price';


export class UpdateDescTx implements RawEncode {
    constructor(
        public write_flag: number,
        public price: Option<MetaPrice>,
        public desc_hash: HashValue,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyNumber('u8', this.write_flag).raw_measure().unwrap();
        size += OptionEncoder.from(this.price, (v:MetaPrice)=>v).raw_measure().unwrap();
        size += this.desc_hash.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.write_flag).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.price, (v:MetaPrice)=>v).raw_encode(buf).unwrap();
        buf = this.desc_hash.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class UpdateDescTxDecoder implements RawDecode<UpdateDescTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[UpdateDescTx, Uint8Array]>{
        let write_flag;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [write_flag, buf] = r.unwrap();
        }

        let price;
        {
            const r = new OptionDecoder(new MetaPriceDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [price, buf] = r.unwrap();
        }

        let desc_hash;
        {
            const r = new HashValueDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [desc_hash, buf] = r.unwrap();
        }

        const ret:[UpdateDescTx, Uint8Array] = [new UpdateDescTx(write_flag.toNumber(), price.to((v:MetaPrice)=>v), desc_hash), buf];
        return Ok(ret);
    }

}
