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
} from "../object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../base/bucky_buffer";
import { Vec, VecDecoder } from "../../base/vec";
import { RawDecode, RawEncode } from "../../base/raw_encode";
import { HashValue, HashValueDecoder } from "../../crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../object_id";


export class SnServiceReceiptVersion implements RawEncode {
    private readonly tag: number;
    private constructor(
        private invalid?: number,
        private current?: number,
    ){
        if(invalid) {
            this.tag = 0;
        } else if(current) {
            this.tag = 1;
        } else {
            this.tag = -1;
        }
    }

    static Invalid(): SnServiceReceiptVersion {
        return new SnServiceReceiptVersion(1);
    }

    static Current(): SnServiceReceiptVersion {
        return new SnServiceReceiptVersion(undefined, 1);
    }

    match<T>(visitor: {
        Invalid?: ()=>T,
        Current?: ()=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.Invalid?.();
            case 1: return visitor.Current?.();
            default: break;
        }
    }

    eq_type(rhs: SnServiceReceiptVersion):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            Invalid:()=>{ return 0;},
            Current:()=>{ return 0;},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Invalid:()=>{return buf;},
            Current:()=>{return buf;},
        })!;
        return Ok(buf);
    }
}

export class SnServiceReceiptVersionDecoder implements RawDecode<SnServiceReceiptVersion> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[SnServiceReceiptVersion, Uint8Array]>{
        let tag;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [tag, buf] = r.unwrap();
        }

        switch(tag.toNumber()){
            case 0:{
                const ret:[SnServiceReceiptVersion, Uint8Array] =  [SnServiceReceiptVersion.Invalid(), buf];
                return Ok(ret);
            }
            case 1:{
                const ret:[SnServiceReceiptVersion, Uint8Array] =  [SnServiceReceiptVersion.Current(), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
