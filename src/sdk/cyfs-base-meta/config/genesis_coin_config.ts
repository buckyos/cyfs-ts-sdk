/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";

import { PreBalance } from './pre_balance';
import { PreBalanceDecoder } from './pre_balance';


export class GenesisCoinConfig implements RawEncode {
    constructor(
        public coin_id: number,
        public pre_balance: PreBalance[],
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyNumber('u8', this.coin_id).raw_measure().unwrap();
        size += Vec.from(this.pre_balance, (v:PreBalance)=>v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.coin_id).raw_encode(buf).unwrap();
        buf = Vec.from(this.pre_balance, (v:PreBalance)=>v).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class GenesisCoinConfigDecoder implements RawDecode<GenesisCoinConfig> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[GenesisCoinConfig, Uint8Array]>{
        let coin_id;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [coin_id, buf] = r.unwrap();
        }

        let pre_balance;
        {
            const r = new VecDecoder(new PreBalanceDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [pre_balance, buf] = r.unwrap();
        }

        const ret:[GenesisCoinConfig, Uint8Array] = [new GenesisCoinConfig(coin_id.toNumber(), pre_balance.to((v:PreBalance)=>v)), buf];
        return Ok(ret);
    }

}
