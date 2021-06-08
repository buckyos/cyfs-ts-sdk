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

import { SPVTx } from '../spv/spv_tx';
import { SPVTxDecoder } from '../spv/spv_tx';


export class SubChainCoinageRecordTx implements RawEncode {
    constructor(
        public height: bigint,
        public list: SPVTx[],
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyNumber('i64', this.height).raw_measure().unwrap();
        size += Vec.from(this.list, (v:SPVTx)=>v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('i64', this.height).raw_encode(buf).unwrap();
        buf = Vec.from(this.list, (v:SPVTx)=>v).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class SubChainCoinageRecordTxDecoder implements RawDecode<SubChainCoinageRecordTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[SubChainCoinageRecordTx, Uint8Array]>{
        let height;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [height, buf] = r.unwrap();
        }

        let list;
        {
            const r = new VecDecoder(new SPVTxDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [list, buf] = r.unwrap();
        }

        const ret:[SubChainCoinageRecordTx, Uint8Array] = [new SubChainCoinageRecordTx(height.toBigInt(), list.to((v:SPVTx)=>v)), buf];
        return Ok(ret);
    }

}
