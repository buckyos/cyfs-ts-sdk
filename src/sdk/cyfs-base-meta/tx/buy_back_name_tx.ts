/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";



export class BuyBackNameTx implements RawEncode {
    constructor(
        public name: string,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyString(this.name).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyString(this.name).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class BuyBackNameTxDecoder implements RawDecode<BuyBackNameTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[BuyBackNameTx, Uint8Array]>{
        let name;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [name, buf] = r.unwrap();
        }

        const ret:[BuyBackNameTx, Uint8Array] = [new BuyBackNameTx(name.value()), buf];
        return Ok(ret);
    }

}
