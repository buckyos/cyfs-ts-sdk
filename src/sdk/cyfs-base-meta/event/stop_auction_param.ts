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


export class StopAuctionParam implements RawEncode {
    constructor(
        public name: string,
        public stop_block: JSBI,
        public starting_price: JSBI,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += new BuckyString(this.name).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.stop_block).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.starting_price).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyString(this.name).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.stop_block).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.starting_price).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class StopAuctionParamDecoder implements RawDecode<StopAuctionParam> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[StopAuctionParam, Uint8Array]> {
        let name;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [name, buf] = r.unwrap();
        }

        let stop_block;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [stop_block, buf] = r.unwrap();
        }

        let starting_price;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [starting_price, buf] = r.unwrap();
        }

        const ret: [StopAuctionParam, Uint8Array] = [new StopAuctionParam(name.value(), stop_block.toBigInt(), starting_price.toBigInt()), buf];
        return Ok(ret);
    }

}
