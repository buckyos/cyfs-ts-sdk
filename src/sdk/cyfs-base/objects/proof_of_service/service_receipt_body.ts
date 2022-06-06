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

import{ SNReceipt, SNReceiptDecoder } from './sn_receipt'
import{ TrafficReceipt, TrafficReceiptDecoder } from './traffic_receipt'
import{ ChunkTransReceipt, ChunkTransReceiptDecoder } from './chunk_trans_receipt'
import{ DSGReceipt, DSGReceiptDecoder } from './dsg_receipt'

export class ServiceReceiptBody implements RawEncode {
    private readonly tag: number;
    private constructor(
        private sn?: SNReceipt,
        private traffic?: TrafficReceipt,
        private chunktrans?: ChunkTransReceipt,
        private dsg?: DSGReceipt,
    ){
        if(sn) {
            this.tag = 0;
        } else if(traffic) {
            this.tag = 1;
        } else if(chunktrans) {
            this.tag = 2;
        } else if(dsg) {
            this.tag = 3;
        } else {
            this.tag = -1;
        }
    }

    static SN(sn: SNReceipt): ServiceReceiptBody {
        return new ServiceReceiptBody(sn);
    }

    static Traffic(traffic: TrafficReceipt): ServiceReceiptBody {
        return new ServiceReceiptBody(undefined, traffic);
    }

    static ChunkTrans(chunktrans: ChunkTransReceipt): ServiceReceiptBody {
        return new ServiceReceiptBody(undefined, undefined, chunktrans);
    }

    static DSG(dsg: DSGReceipt): ServiceReceiptBody {
        return new ServiceReceiptBody(undefined, undefined, undefined, dsg);
    }

    match<T>(visitor: {
        SN?: (sn: SNReceipt)=>T,
        Traffic?: (traffic: TrafficReceipt)=>T,
        ChunkTrans?: (chunktrans: ChunkTransReceipt)=>T,
        DSG?: (dsg: DSGReceipt)=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.SN?.(this.sn!);
            case 1: return visitor.Traffic?.(this.traffic!);
            case 2: return visitor.ChunkTrans?.(this.chunktrans!);
            case 3: return visitor.DSG?.(this.dsg!);
            default: break;
        }
    }

    eq_type(rhs: ServiceReceiptBody):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            SN:(sn)=>{ return this.sn!.raw_measure().unwrap();},
            Traffic:(traffic)=>{ return this.traffic!.raw_measure().unwrap();},
            ChunkTrans:(chunktrans)=>{ return this.chunktrans!.raw_measure().unwrap();},
            DSG:(dsg)=>{ return this.dsg!.raw_measure().unwrap();},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            SN:(sn)=>{return this.sn!.raw_encode(buf).unwrap();},
            Traffic:(traffic)=>{return this.traffic!.raw_encode(buf).unwrap();},
            ChunkTrans:(chunktrans)=>{return this.chunktrans!.raw_encode(buf).unwrap();},
            DSG:(dsg)=>{return this.dsg!.raw_encode(buf).unwrap();},
        })!;
        return Ok(buf);
    }
}

export class ServiceReceiptBodyDecoder implements RawDecode<ServiceReceiptBody> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ServiceReceiptBody, Uint8Array]>{
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
                const r = new SNReceiptDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let sn;
                [sn, buf] = r.unwrap();
                const ret:[ServiceReceiptBody, Uint8Array] =  [ServiceReceiptBody.SN(sn), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new TrafficReceiptDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let traffic;
                [traffic, buf] = r.unwrap();
                const ret:[ServiceReceiptBody, Uint8Array] =  [ServiceReceiptBody.Traffic(traffic), buf];
                return Ok(ret);
            }
            case 2:{
                const r = new ChunkTransReceiptDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let chunktrans;
                [chunktrans, buf] = r.unwrap();
                const ret:[ServiceReceiptBody, Uint8Array] =  [ServiceReceiptBody.ChunkTrans(chunktrans), buf];
                return Ok(ret);
            }
            case 3:{
                const r = new DSGReceiptDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let dsg;
                [dsg, buf] = r.unwrap();
                const ret:[ServiceReceiptBody, Uint8Array] =  [ServiceReceiptBody.DSG(dsg), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
