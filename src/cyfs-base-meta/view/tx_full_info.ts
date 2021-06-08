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

import { MetaTx } from '../tx/meta_tx';
import { MetaTxDecoder } from '../tx/meta_tx';
import { Receipt } from '../tx/receipt';
import { ReceiptDecoder } from '../tx/receipt';


export class TxFullInfo implements RawEncode {
    constructor(
        public status: number,
        public block_number: bigint,
        public tx: MetaTx,
        public receipt: Option<Receipt>,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyNumber('u8', this.status).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.block_number).raw_measure().unwrap();
        size += this.tx.raw_measure().unwrap();
        size += OptionEncoder.from(this.receipt, (v:Receipt)=>v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.status).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.block_number).raw_encode(buf).unwrap();
        buf = this.tx.raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.receipt, (v:Receipt)=>v).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class TxFullInfoDecoder implements RawDecode<TxFullInfo> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[TxFullInfo, Uint8Array]>{
        let status;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [status, buf] = r.unwrap();
        }

        let block_number;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [block_number, buf] = r.unwrap();
        }

        let tx;
        {
            const r = new MetaTxDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [tx, buf] = r.unwrap();
        }

        let receipt;
        {
            const r = new OptionDecoder(new ReceiptDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [receipt, buf] = r.unwrap();
        }

        const ret:[TxFullInfo, Uint8Array] = [new TxFullInfo(status.toNumber(), block_number.toBigInt(), tx, receipt.to((v:Receipt)=>v)), buf];
        return Ok(ret);
    }

}
