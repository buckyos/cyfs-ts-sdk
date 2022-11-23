/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";



export class SetConfigTx implements RawEncode {
    constructor(
        public key: string,
        public value: string,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyString(this.key).raw_measure().unwrap();
        size += new BuckyString(this.value).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyString(this.key).raw_encode(buf).unwrap();
        buf = new BuckyString(this.value).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class SetConfigTxDecoder implements RawDecode<SetConfigTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[SetConfigTx, Uint8Array]>{
        let key;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [key, buf] = r.unwrap();
        }

        let value;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [value, buf] = r.unwrap();
        }

        const ret:[SetConfigTx, Uint8Array] = [new SetConfigTx(key.value(), value.value()), buf];
        return Ok(ret);
    }

}
