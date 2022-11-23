/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../base/results";
import { BuckyBuffer, BuckyBufferDecoder } from "../../base/bucky_buffer";
import { RawDecode, RawEncode } from "../../base/raw_encode";



export class ProofData implements RawEncode {
    constructor(
        public data: Uint8Array,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyBuffer(this.data).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyBuffer(this.data).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ProofDataDecoder implements RawDecode<ProofData> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ProofData, Uint8Array]>{
        let data;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [data, buf] = r.unwrap();
        }

        const ret:[ProofData, Uint8Array] = [new ProofData(data.value()), buf];
        return Ok(ret);
    }

}
