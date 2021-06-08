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
} from "../../../cyfs-base/objects/object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../../cyfs-base/base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../../cyfs-base/base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../../cyfs-base/base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../../cyfs-base/base/bucky_buffer";
import { Vec, VecDecoder } from "../../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../../cyfs-base/base/raw_encode";
import { HashValue, HashValueDecoder } from "../../../cyfs-base/crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../../../cyfs-base/objects/object_id";

import{ CoinTokenId, CoinTokenIdDecoder } from '../../tx/coin_token_id'


export class ViewBalanceMethod implements RawEncode {
    constructor(
        public account: ObjectId,
        public ctid: CoinTokenId[],
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.account.raw_measure().unwrap();
        size += new Vec(this.ctid).raw_measure().unwrap();
        // size += Vec.from(this.ctid, (v:CoinTokenId)=>v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.account.raw_encode(buf).unwrap();
        buf = Vec.from(this.ctid, (v:CoinTokenId)=>v).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ViewBalanceMethodDecoder implements RawDecode<ViewBalanceMethod> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ViewBalanceMethod, Uint8Array]>{
        let account;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [account, buf] = r.unwrap();
        }

        let ctid;
        {
            const r = new VecDecoder(new CoinTokenIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [ctid, buf] = r.unwrap();
        }

        const ret:[ViewBalanceMethod, Uint8Array] = [new ViewBalanceMethod(account, ctid.to((v:CoinTokenId)=>v)), buf];
        return Ok(ret);
    }

}
