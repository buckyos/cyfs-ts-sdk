/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyBuffer, BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";



export class TxBody implements RawEncode {
    constructor(
        public body: Uint8Array,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyBuffer(this.body).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyBuffer(this.body).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class TxBodyDecoder implements RawDecode<TxBody> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[TxBody, Uint8Array]>{
        let body;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [body, buf] = r.unwrap();
        }

        const ret:[TxBody, Uint8Array] = [new TxBody(body.value()), buf];
        return Ok(ret);
    }

}
