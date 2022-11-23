/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../../cyfs-base/base/results";
import { Vec, VecDecoder } from "../../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../../cyfs-base/base/raw_encode";
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
