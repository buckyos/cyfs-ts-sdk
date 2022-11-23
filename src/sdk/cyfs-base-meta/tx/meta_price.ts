/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";



export class MetaPrice implements RawEncode {
    constructor(
        public coin_id: number,
        public price: number,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyNumber('u8', this.coin_id).raw_measure().unwrap();
        size += new BuckyNumber('u32', this.price).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.coin_id).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.price).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class MetaPriceDecoder implements RawDecode<MetaPrice> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[MetaPrice, Uint8Array]>{
        let coin_id;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [coin_id, buf] = r.unwrap();
        }

        let price;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [price, buf] = r.unwrap();
        }

        const ret:[MetaPrice, Uint8Array] = [new MetaPrice(coin_id.toNumber(), price.toNumber()), buf];
        return Ok(ret);
    }

}
