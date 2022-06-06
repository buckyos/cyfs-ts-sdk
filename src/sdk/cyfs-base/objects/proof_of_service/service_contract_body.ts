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

import{ TrafficContract, TrafficContractDecoder } from './traffic_contract'
import{ ChunkTransContract, ChunkTransContractDecoder } from './chunk_trans_contract'

export class ServiceContractBody implements RawEncode {
    private readonly tag: number;
    private constructor(
        private traffic?: TrafficContract,
        private chunktrans?: ChunkTransContract,
    ){
        if(traffic) {
            this.tag = 0;
        } else if(chunktrans) {
            this.tag = 1;
        } else {
            this.tag = -1;
        }
    }

    static Traffic(traffic: TrafficContract): ServiceContractBody {
        return new ServiceContractBody(traffic);
    }

    static ChunkTrans(chunktrans: ChunkTransContract): ServiceContractBody {
        return new ServiceContractBody(undefined, chunktrans);
    }

    match<T>(visitor: {
        Traffic?: (traffic: TrafficContract)=>T,
        ChunkTrans?: (chunktrans: ChunkTransContract)=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.Traffic?.(this.traffic!);
            case 1: return visitor.ChunkTrans?.(this.chunktrans!);
            default: break;
        }
    }

    eq_type(rhs: ServiceContractBody):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            Traffic:(traffic)=>{ return this.traffic!.raw_measure().unwrap();},
            ChunkTrans:(chunktrans)=>{ return this.chunktrans!.raw_measure().unwrap();},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Traffic:(traffic)=>{return this.traffic!.raw_encode(buf).unwrap();},
            ChunkTrans:(chunktrans)=>{return this.chunktrans!.raw_encode(buf).unwrap();},
        })!;
        return Ok(buf);
    }
}

export class ServiceContractBodyDecoder implements RawDecode<ServiceContractBody> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ServiceContractBody, Uint8Array]>{
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
                const r = new TrafficContractDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let traffic;
                [traffic, buf] = r.unwrap();
                const ret:[ServiceContractBody, Uint8Array] =  [ServiceContractBody.Traffic(traffic), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new ChunkTransContractDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let chunktrans;
                [chunktrans, buf] = r.unwrap();
                const ret:[ServiceContractBody, Uint8Array] =  [ServiceContractBody.ChunkTrans(chunktrans), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
