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

import{ ServiceContractBody, ServiceContractBodyDecoder } from './service_contract_body'


export class ServiceContract implements RawEncode {
    constructor(
        public buyer: ObjectId,
        public seller: ObjectId,
        public customer: Option<ObjectId>,
        public service_type: number,
        public service_start: bigint,
        public service_end: bigint,
        public coin_id: Option<number>,
        public total_price: Option<bigint>,
        public advance_payment: Option<bigint>,
        public contract_body: ServiceContractBody,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.buyer.raw_measure().unwrap();
        size += this.seller.raw_measure().unwrap();
        size += OptionEncoder.from(this.customer, (v:ObjectId)=>v).raw_measure().unwrap();
        size += new BuckyNumber('u32', this.service_type).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.service_start).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.service_end).raw_measure().unwrap();
        size += OptionEncoder.from(this.coin_id, (v:number)=>new BuckyNumber('u8', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.total_price, (v:bigint)=>new BuckyNumber('u64', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.advance_payment, (v:bigint)=>new BuckyNumber('u64', v)).raw_measure().unwrap();
        size += this.contract_body.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.buyer.raw_encode(buf).unwrap();
        buf = this.seller.raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.customer, (v:ObjectId)=>v).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.service_type).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.service_start).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.service_end).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.coin_id, (v:number)=>new BuckyNumber('u8', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.total_price, (v:bigint)=>new BuckyNumber('u64', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.advance_payment, (v:bigint)=>new BuckyNumber('u64', v)).raw_encode(buf).unwrap();
        buf = this.contract_body.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ServiceContractDecoder implements RawDecode<ServiceContract> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ServiceContract, Uint8Array]>{
        let buyer;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [buyer, buf] = r.unwrap();
        }

        let seller;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [seller, buf] = r.unwrap();
        }

        let customer;
        {
            const r = new OptionDecoder(new ObjectIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [customer, buf] = r.unwrap();
        }

        let service_type;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [service_type, buf] = r.unwrap();
        }

        let service_start;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [service_start, buf] = r.unwrap();
        }

        let service_end;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [service_end, buf] = r.unwrap();
        }

        let coin_id;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u8')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [coin_id, buf] = r.unwrap();
        }

        let total_price;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u64')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [total_price, buf] = r.unwrap();
        }

        let advance_payment;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u64')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [advance_payment, buf] = r.unwrap();
        }

        let contract_body;
        {
            const r = new ServiceContractBodyDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [contract_body, buf] = r.unwrap();
        }

        const ret:[ServiceContract, Uint8Array] = [new ServiceContract(buyer, seller, customer.to((v:ObjectId)=>v), service_type.toNumber(), service_start.toBigInt(), service_end.toBigInt(), coin_id.to((v)=>v.toNumber()), total_price.to((v)=>v.toBigInt()), advance_payment.to((v)=>v.toBigInt()), contract_body), buf];
        return Ok(ret);
    }

}
