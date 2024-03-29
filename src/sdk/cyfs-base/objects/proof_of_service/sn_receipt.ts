/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../base/results";
import { OptionDecoder, OptionEncoder, } from "../../base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../base/bucky_number";
import { RawDecode, RawEncode } from "../../base/raw_encode";



export class SNReceipt implements RawEncode {
    constructor(
        public ping_count?: number,
        public called_count?: number,
        public success_called_count?: number,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += OptionEncoder.from(this.ping_count, 'u32').raw_measure().unwrap();
        size += OptionEncoder.from(this.called_count, 'u32').raw_measure().unwrap();
        size += OptionEncoder.from(this.success_called_count, 'u32').raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = OptionEncoder.from(this.ping_count, 'u32').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.called_count, 'u32').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.success_called_count, 'u32').raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class SNReceiptDecoder implements RawDecode<SNReceipt> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[SNReceipt, Uint8Array]>{
        let ping_count;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [ping_count, buf] = r.unwrap();
        }

        let called_count;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [called_count, buf] = r.unwrap();
        }

        let success_called_count;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if(r.err){
                return r;
            }
            [success_called_count, buf] = r.unwrap();
        }

        const ret:[SNReceipt, Uint8Array] = [new SNReceipt(ping_count.value()?.toNumber(), called_count.value()?.toNumber(), success_called_count.value()?.toNumber()), buf];
        return Ok(ret);
    }

}
