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



export class BTCTxRecord implements RawEncode {
    constructor(
        public txid: string,
        public blockHash: string,
        public blockNumber: bigint,
        public confirmed: bigint,
        public received: bigint,
        public exodusAddress: string,
        public btcValue: bigint,
        public version: number,
        public propertyID: number,
        public op: number,
        public address: string,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyString(this.txid).raw_measure().unwrap();
        size += new BuckyString(this.blockHash).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.blockNumber).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.confirmed).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.received).raw_measure().unwrap();
        size += new BuckyString(this.exodusAddress).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.btcValue).raw_measure().unwrap();
        size += new BuckyNumber('u32', this.version).raw_measure().unwrap();
        size += new BuckyNumber('u32', this.propertyID).raw_measure().unwrap();
        size += new BuckyNumber('u32', this.op).raw_measure().unwrap();
        size += new BuckyString(this.address).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyString(this.txid).raw_encode(buf).unwrap();
        buf = new BuckyString(this.blockHash).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.blockNumber).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.confirmed).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.received).raw_encode(buf).unwrap();
        buf = new BuckyString(this.exodusAddress).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.btcValue).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.version).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.propertyID).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.op).raw_encode(buf).unwrap();
        buf = new BuckyString(this.address).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class BTCTxRecordDecoder implements RawDecode<BTCTxRecord> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[BTCTxRecord, Uint8Array]>{
        let txid;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [txid, buf] = r.unwrap();
        }

        let blockHash;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [blockHash, buf] = r.unwrap();
        }

        let blockNumber;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [blockNumber, buf] = r.unwrap();
        }

        let confirmed;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [confirmed, buf] = r.unwrap();
        }

        let received;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [received, buf] = r.unwrap();
        }

        let exodusAddress;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [exodusAddress, buf] = r.unwrap();
        }

        let btcValue;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [btcValue, buf] = r.unwrap();
        }

        let version;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [version, buf] = r.unwrap();
        }

        let propertyID;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [propertyID, buf] = r.unwrap();
        }

        let op;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [op, buf] = r.unwrap();
        }

        let address;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [address, buf] = r.unwrap();
        }

        const ret:[BTCTxRecord, Uint8Array] = [new BTCTxRecord(txid.value(), blockHash.value(), blockNumber.toBigInt(), confirmed.toBigInt(), received.toBigInt(), exodusAddress.value(), btcValue.toBigInt(), version.toNumber(), propertyID.toNumber(), op.toNumber(), address.value()), buf];
        return Ok(ret);
    }

}
