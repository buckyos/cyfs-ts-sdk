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

import { FlowService } from './flow_service';
import { FlowServiceDecoder } from './flow_service';

export class FlowServiceTx implements RawEncode {
    private readonly tag: number;
    private constructor(
        private create?: FlowService,
        private purchase?: number,
        private settle?: number,
    ){
        if(create) {
            this.tag = 0;
        } else if(purchase) {
            this.tag = 1;
        } else if(settle) {
            this.tag = 2;
        } else {
            this.tag = -1;
        }
    }

    static Create(create: FlowService): FlowServiceTx {
        return new FlowServiceTx(create);
    }

    static Purchase(purchase: number): FlowServiceTx {
        return new FlowServiceTx(undefined, purchase);
    }

    static Settle(): FlowServiceTx {
        return new FlowServiceTx(undefined, undefined, 1);
    }

    match<T>(visitor: {
        Create?: (create: FlowService)=>T,
        Purchase?: (purchase: number)=>T,
        Settle?: ()=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.Create?.(this.create!);
            case 1: return visitor.Purchase?.(this.purchase!);
            case 2: return visitor.Settle?.();
            default: break;
        }
    }

    eq_type(rhs: FlowServiceTx):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            Create:(create)=>{ return this.create!.raw_measure().unwrap();},
            Purchase:(purchase)=>{ return new BuckyNumber('u32', this.purchase!).raw_measure().unwrap();},
            Settle:()=>{ return 0;},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Create:(create)=>{return this.create!.raw_encode(buf).unwrap();},
            Purchase:(purchase)=>{return new BuckyNumber('u32', this.purchase!).raw_encode(buf).unwrap();},
            Settle:()=>{return buf;},
        })!;
        return Ok(buf);
    }
}

export class FlowServiceTxDecoder implements RawDecode<FlowServiceTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[FlowServiceTx, Uint8Array]>{
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
                const r = new FlowServiceDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let create;
                [create, buf] = r.unwrap();
                const ret:[FlowServiceTx, Uint8Array] =  [FlowServiceTx.Create(create), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new BuckyNumberDecoder('u32').raw_decode(buf);
                if(r.err){
                    return r;
                }
                let purchase;
                [purchase, buf] = r.unwrap();
                const ret:[FlowServiceTx, Uint8Array] =  [FlowServiceTx.Purchase(purchase.toNumber()), buf];
                return Ok(ret);
            }
            case 2:{
                const ret:[FlowServiceTx, Uint8Array] =  [FlowServiceTx.Settle(), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
