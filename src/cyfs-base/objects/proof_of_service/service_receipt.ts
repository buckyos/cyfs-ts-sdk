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

import{ ServiceReceiptBody, ServiceReceiptBodyDecoder } from './service_receipt_body'


export class ServiceReceipt implements RawEncode {
    constructor(
        public customer: ObjectId,
        public service_type: number,
        public service_start: bigint,
        public service_end: bigint,
        public receipt_body: ServiceReceiptBody,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.customer.raw_measure().unwrap();
        size += new BuckyNumber('u32', this.service_type).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.service_start).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.service_end).raw_measure().unwrap();
        size += this.receipt_body.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.customer.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.service_type).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.service_start).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.service_end).raw_encode(buf).unwrap();
        buf = this.receipt_body.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ServiceReceiptDecoder implements RawDecode<ServiceReceipt> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ServiceReceipt, Uint8Array]>{
        let customer;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
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

        let receipt_body;
        {
            const r = new ServiceReceiptBodyDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [receipt_body, buf] = r.unwrap();
        }

        const ret:[ServiceReceipt, Uint8Array] = [new ServiceReceipt(customer, service_type.toNumber(), service_start.toBigInt(), service_end.toBigInt(), receipt_body), buf];
        return Ok(ret);
    }

}
