/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../base/results";
import { RawDecode, RawEncode } from "../../base/raw_encode";



export class DSGReceipt implements RawEncode {
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

export class DSGReceiptDecoder implements RawDecode<DSGReceipt> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[DSGReceipt, Uint8Array]>{
        const ret:[DSGReceipt, Uint8Array] = [new DSGReceipt(), buf];
        return Ok(ret);
    }

}
