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

import { TransBalanceTxItem } from './trans_balance_tx_item';
import { TransBalanceTxItemDecoder } from './trans_balance_tx_item';
import { CoinTokenId } from './coin_token_id';
import { CoinTokenIdDecoder } from './coin_token_id';


export class TransBalanceTx implements RawEncode {
    constructor(
        public ctid: CoinTokenId,
        public to: TransBalanceTxItem[],
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.ctid.raw_measure().unwrap();
        size += Vec.from(this.to, (v:TransBalanceTxItem)=>v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.ctid.raw_encode(buf).unwrap();
        buf = Vec.from(this.to, (v:TransBalanceTxItem)=>v).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class TransBalanceTxDecoder implements RawDecode<TransBalanceTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[TransBalanceTx, Uint8Array]>{
        let ctid;
        {
            const r = new CoinTokenIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [ctid, buf] = r.unwrap();
        }

        let to;
        {
            const r = new VecDecoder(new TransBalanceTxItemDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [to, buf] = r.unwrap();
        }

        const ret:[TransBalanceTx, Uint8Array] = [new TransBalanceTx(ctid, to.to((v:TransBalanceTxItem)=>v)), buf];
        return Ok(ret);
    }

}
