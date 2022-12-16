/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../../cyfs-base/base/results";
import { OptionDecoder, OptionEncoder, } from "../../../cyfs-base/base/option";
import { RawDecode, RawEncode } from "../../../cyfs-base/base/raw_encode";

import{ ViewNameResultItem, ViewNameResultItemDecoder } from './view_name_result_item'


export class ViewNameResult implements RawEncode {
    constructor(
        public results?: ViewNameResultItem,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += OptionEncoder.from(this.results).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = OptionEncoder.from(this.results).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ViewNameResultDecoder implements RawDecode<ViewNameResult> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ViewNameResult, Uint8Array]>{
        let results;
        {
            const r = new OptionDecoder(new ViewNameResultItemDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [results, buf] = r.unwrap();
        }

        const ret:[ViewNameResult, Uint8Array] = [new ViewNameResult(results.value()), buf];
        return Ok(ret);
    }

}
