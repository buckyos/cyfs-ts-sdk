/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";



export class GenesisPriceConfig implements RawEncode {
    constructor(
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        const size = 0;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        return Ok(buf);
    }
}

export class GenesisPriceConfigDecoder implements RawDecode<GenesisPriceConfig> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[GenesisPriceConfig, Uint8Array]>{
        const ret:[GenesisPriceConfig, Uint8Array] = [new GenesisPriceConfig(), buf];
        return Ok(ret);
    }

}
