/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import JSBI from 'jsbi';


export class AuctionNameTx implements RawEncode {
    constructor(
        public name: string,
        public price: JSBI,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += new BuckyString(this.name).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.price).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyString(this.name).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.price).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class AuctionNameTxDecoder implements RawDecode<AuctionNameTx> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[AuctionNameTx, Uint8Array]> {
        let name;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [name, buf] = r.unwrap();
        }

        let price;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [price, buf] = r.unwrap();
        }

        const ret: [AuctionNameTx, Uint8Array] = [new AuctionNameTx(name.value(), price.toBigInt()), buf];
        return Ok(ret);
    }

}
