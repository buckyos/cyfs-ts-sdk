/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";

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
