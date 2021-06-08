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

import { CoinTokenId } from '../tx/coin_token_id';
import { CoinTokenIdDecoder } from '../tx/coin_token_id';


export class UnionWithdraw implements RawEncode {
    constructor(
        public union_id: ObjectId,
        public account_id: ObjectId,
        public ctid: CoinTokenId,
        public value: bigint,
        public height: bigint,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.union_id.raw_measure().unwrap();
        size += this.account_id.raw_measure().unwrap();
        size += this.ctid.raw_measure().unwrap();
        size += new BuckyNumber('i64', this.value).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.height).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.union_id.raw_encode(buf).unwrap();
        buf = this.account_id.raw_encode(buf).unwrap();
        buf = this.ctid.raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.value).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.height).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class UnionWithdrawDecoder implements RawDecode<UnionWithdraw> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[UnionWithdraw, Uint8Array]>{
        let union_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [union_id, buf] = r.unwrap();
        }

        let account_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [account_id, buf] = r.unwrap();
        }

        let ctid;
        {
            const r = new CoinTokenIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [ctid, buf] = r.unwrap();
        }

        let value;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [value, buf] = r.unwrap();
        }

        let height;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [height, buf] = r.unwrap();
        }

        const ret:[UnionWithdraw, Uint8Array] = [new UnionWithdraw(union_id, account_id, ctid, value.toBigInt(), height.toBigInt()), buf];
        return Ok(ret);
    }

}
