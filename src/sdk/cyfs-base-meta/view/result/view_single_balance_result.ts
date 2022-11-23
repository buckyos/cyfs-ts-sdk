/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../../cyfs-base/base/results";
import { Vec, VecDecoder } from "../../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../../cyfs-base/base/raw_encode";

import{ ViewSingleBalanceResultItem, ViewSingleBalanceResultItemDecoder } from './view_single_balance_result_item'


export class ViewSingleBalanceResult implements RawEncode {
    constructor(
        public results: ViewSingleBalanceResultItem[],
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += Vec.from(this.results, (v:ViewSingleBalanceResultItem)=>v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = Vec.from(this.results, (v:ViewSingleBalanceResultItem)=>v).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ViewSingleBalanceResultDecoder implements RawDecode<ViewSingleBalanceResult> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ViewSingleBalanceResult, Uint8Array]>{
        let results;
        {
            const r = new VecDecoder(new ViewSingleBalanceResultItemDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [results, buf] = r.unwrap();
        }

        const ret:[ViewSingleBalanceResult, Uint8Array] = [new ViewSingleBalanceResult(results.to((v:ViewSingleBalanceResultItem)=>v)), buf];
        return Ok(ret);
    }

}
