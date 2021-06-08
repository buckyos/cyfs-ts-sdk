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
} from "../../../cyfs-base/objects/object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../../cyfs-base/base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../../cyfs-base/base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../../cyfs-base/base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../../cyfs-base/base/bucky_buffer";
import { Vec, VecDecoder } from "../../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../../cyfs-base/base/raw_encode";
import { HashValue, HashValueDecoder } from "../../../cyfs-base/crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../../../cyfs-base/objects/object_id";

import{ ViewSingleBalanceResult, ViewSingleBalanceResultDecoder } from '../../view/result/view_single_balance_result'
import{ ViewUnionBalanceResult, ViewUnionBalanceResultDecoder } from '../../view/result/view_union_balance_result'

export class ViewBalanceResult implements RawEncode {
    private readonly tag: number;
    private constructor(
        private single?: ViewSingleBalanceResult,
        private union?: ViewUnionBalanceResult,
    ){
        if(single) {
            this.tag = 0;
        } else if(union) {
            this.tag = 1;
        } else {
            this.tag = -1;
        }
    }

    static Single(single: ViewSingleBalanceResult): ViewBalanceResult {
        return new ViewBalanceResult(single);
    }

    static Union(union: ViewUnionBalanceResult): ViewBalanceResult {
        return new ViewBalanceResult(undefined, union);
    }

    match<T>(visitor: {
        Single?: (single: ViewSingleBalanceResult)=>T,
        Union?: (union: ViewUnionBalanceResult)=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.Single?.(this.single!);
            case 1: return visitor.Union?.(this.union!);
            default: break;
        }
    }

    eq_type(rhs: ViewBalanceResult):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            Single:(single)=>{ return this.single!.raw_measure().unwrap();},
            Union:(union)=>{ return this.union!.raw_measure().unwrap();},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Single:(single)=>{return this.single!.raw_encode(buf).unwrap();},
            Union:(union)=>{return this.union!.raw_encode(buf).unwrap();},
        })!;
        return Ok(buf);
    }
}

export class ViewBalanceResultDecoder implements RawDecode<ViewBalanceResult> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ViewBalanceResult, Uint8Array]>{
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
                const r = new ViewSingleBalanceResultDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let single;
                [single, buf] = r.unwrap();
                const ret:[ViewBalanceResult, Uint8Array] =  [ViewBalanceResult.Single(single), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new ViewUnionBalanceResultDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let union;
                [union, buf] = r.unwrap();
                const ret:[ViewBalanceResult, Uint8Array] =  [ViewBalanceResult.Union(union), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE, ViewBalanceResultDecoder"));
        }
    }

}
