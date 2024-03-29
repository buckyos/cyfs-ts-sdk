/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import JSBI from 'jsbi';


export class GasPrice implements RawEncode {
    constructor(
        public low: JSBI,
        public medium: JSBI,
        public high: JSBI,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('i64', this.low).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.medium).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.high).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('i64', this.low).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.medium).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.high).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class GasPriceDecoder implements RawDecode<GasPrice> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[GasPrice, Uint8Array]> {
        let low;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [low, buf] = r.unwrap();
        }

        let medium;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [medium, buf] = r.unwrap();
        }

        let high;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [high, buf] = r.unwrap();
        }

        const ret: [GasPrice, Uint8Array] = [new GasPrice(low.toBigInt(), medium.toBigInt(), high.toBigInt()), buf];
        return Ok(ret);
    }

}
