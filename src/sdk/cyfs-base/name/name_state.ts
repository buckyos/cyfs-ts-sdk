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
} from "../objects/object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../base/bucky_buffer";
import { Vec, VecDecoder } from "../base/vec";
import { RawDecode, RawEncode } from "../base/raw_encode";
import { HashValue, HashValueDecoder } from "../crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../objects/object_id";


export class NameState implements RawEncode {
    private readonly tag: number;
    private constructor(
        private normal?: number,
        private lock?: number,
        private auction?: number,
        private arrearsauction?: number,
        private arrearsauctionwait?: number,
        private activeauction?: number,
    ){
        if(normal) {
            this.tag = 0;
        } else if(lock) {
            this.tag = 1;
        } else if(auction) {
            this.tag = 2;
        } else if(arrearsauction) {
            this.tag = 3;
        } else if(arrearsauctionwait) {
            this.tag = 4;
        } else if(activeauction) {
            this.tag = 5;
        } else {
            this.tag = -1;
        }
    }

    static Normal(): NameState {
        return new NameState(1);
    }

    static Lock(): NameState {
        return new NameState(undefined, 1);
    }

    static Auction(): NameState {
        return new NameState(undefined, undefined, 1);
    }

    static ArrearsAuction(): NameState {
        return new NameState(undefined, undefined, undefined, 1);
    }

    static ArrearsAuctionWait(): NameState {
        return new NameState(undefined, undefined, undefined, undefined, 1);
    }

    static ActiveAuction(): NameState {
        return new NameState(undefined, undefined, undefined, undefined, undefined, 1);
    }

    match<T>(visitor: {
        Normal?: ()=>T,
        Lock?: ()=>T,
        Auction?: ()=>T,
        ArrearsAuction?: ()=>T,
        ArrearsAuctionWait?: ()=>T,
        ActiveAuction?: ()=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.Normal?.();
            case 1: return visitor.Lock?.();
            case 2: return visitor.Auction?.();
            case 3: return visitor.ArrearsAuction?.();
            case 4: return visitor.ArrearsAuctionWait?.();
            case 5: return visitor.ActiveAuction?.();
            default: break;
        }
    }

    eq_type(rhs: NameState):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            Normal:()=>{ return 0;},
            Lock:()=>{ return 0;},
            Auction:()=>{ return 0;},
            ArrearsAuction:()=>{ return 0;},
            ArrearsAuctionWait:()=>{ return 0;},
            ActiveAuction:()=>{ return 0;},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Normal:()=>{return buf;},
            Lock:()=>{return buf;},
            Auction:()=>{return buf;},
            ArrearsAuction:()=>{return buf;},
            ArrearsAuctionWait:()=>{return buf;},
            ActiveAuction:()=>{return buf;},
        })!;
        return Ok(buf);
    }
}

export class NameStateDecoder implements RawDecode<NameState> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[NameState, Uint8Array]>{
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
                const ret:[NameState, Uint8Array] =  [NameState.Normal(), buf];
                return Ok(ret);
            }
            case 1:{
                const ret:[NameState, Uint8Array] =  [NameState.Lock(), buf];
                return Ok(ret);
            }
            case 2:{
                const ret:[NameState, Uint8Array] =  [NameState.Auction(), buf];
                return Ok(ret);
            }
            case 3:{
                const ret:[NameState, Uint8Array] =  [NameState.ArrearsAuction(), buf];
                return Ok(ret);
            }
            case 4:{
                const ret:[NameState, Uint8Array] =  [NameState.ArrearsAuctionWait(), buf];
                return Ok(ret);
            }
            case 5:{
                const ret:[NameState, Uint8Array] =  [NameState.ActiveAuction(), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
