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

import{ Contract, ContractDecoder } from '../../cyfs-base/objects/contract'
import{ ProofOfService, ProofOfServiceDecoder } from '../../cyfs-base/objects/proof_of_service/proof_of_service'
import { SNService } from '../sn_service/sn_service';
import { SNServiceDecoder } from '../sn_service/sn_service';

export class SNServiceTx implements RawEncode {
    private readonly tag: number;
    private constructor(
        private publish?: SNService,
        private remove?: ObjectId,
        private purchase?: Contract,
        private settle?: ProofOfService,
    ){
        if(publish) {
            this.tag = 0;
        } else if(remove) {
            this.tag = 1;
        } else if(purchase) {
            this.tag = 2;
        } else if(settle) {
            this.tag = 3;
        } else {
            this.tag = -1;
        }
    }

    static Publish(publish: SNService): SNServiceTx {
        return new SNServiceTx(publish);
    }

    static Remove(remove: ObjectId): SNServiceTx {
        return new SNServiceTx(undefined, remove);
    }

    static Purchase(purchase: Contract): SNServiceTx {
        return new SNServiceTx(undefined, undefined, purchase);
    }

    static Settle(settle: ProofOfService): SNServiceTx {
        return new SNServiceTx(undefined, undefined, undefined, settle);
    }

    match<T>(visitor: {
        Publish?: (publish: SNService)=>T,
        Remove?: (remove: ObjectId)=>T,
        Purchase?: (purchase: Contract)=>T,
        Settle?: (settle: ProofOfService)=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.Publish?.(this.publish!);
            case 1: return visitor.Remove?.(this.remove!);
            case 2: return visitor.Purchase?.(this.purchase!);
            case 3: return visitor.Settle?.(this.settle!);
            default: break;
        }
    }

    eq_type(rhs: SNServiceTx):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            Publish:(publish)=>{ return this.publish!.raw_measure().unwrap();},
            Remove:(remove)=>{ return this.remove!.raw_measure().unwrap();},
            Purchase:(purchase)=>{ return this.purchase!.raw_measure().unwrap();},
            Settle:(settle)=>{ return this.settle!.raw_measure().unwrap();},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Publish:(publish)=>{return this.publish!.raw_encode(buf).unwrap();},
            Remove:(remove)=>{return this.remove!.raw_encode(buf).unwrap();},
            Purchase:(purchase)=>{return this.purchase!.raw_encode(buf).unwrap();},
            Settle:(settle)=>{return this.settle!.raw_encode(buf).unwrap();},
        })!;
        return Ok(buf);
    }
}

export class SNServiceTxDecoder implements RawDecode<SNServiceTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[SNServiceTx, Uint8Array]>{
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
                const r = new SNServiceDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let publish;
                [publish, buf] = r.unwrap();
                const ret:[SNServiceTx, Uint8Array] =  [SNServiceTx.Publish(publish), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new ObjectIdDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let remove;
                [remove, buf] = r.unwrap();
                const ret:[SNServiceTx, Uint8Array] =  [SNServiceTx.Remove(remove), buf];
                return Ok(ret);
            }
            case 2:{
                const r = new ContractDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let purchase;
                [purchase, buf] = r.unwrap();
                const ret:[SNServiceTx, Uint8Array] =  [SNServiceTx.Purchase(purchase), buf];
                return Ok(ret);
            }
            case 3:{
                const r = new ProofOfServiceDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let settle;
                [settle, buf] = r.unwrap();
                const ret:[SNServiceTx, Uint8Array] =  [SNServiceTx.Settle(settle), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
