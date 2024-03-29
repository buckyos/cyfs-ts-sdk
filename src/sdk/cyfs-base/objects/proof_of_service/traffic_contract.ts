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
import JSBI from 'jsbi';


export class TrafficContract implements RawEncode {
    constructor(
        public price_per_kbytes: number,
        public avg_ping_ms?: number,
        public max_up_bytes?: JSBI,
        public max_up_speed?: number,
        public min_up_speed?: number,
        public max_down_bytes?: JSBI,
        public max_down_speed?: number,
        public min_down_speed?: number,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('u32', this.price_per_kbytes).raw_measure().unwrap();
        size += OptionEncoder.from(this.avg_ping_ms, 'u16').raw_measure().unwrap();
        size += OptionEncoder.from(this.max_up_bytes, 'u64').raw_measure().unwrap();
        size += OptionEncoder.from(this.max_up_speed, 'u32').raw_measure().unwrap();
        size += OptionEncoder.from(this.min_up_speed, 'u32').raw_measure().unwrap();
        size += OptionEncoder.from(this.max_down_bytes, 'u64').raw_measure().unwrap();
        size += OptionEncoder.from(this.max_down_speed, 'u32').raw_measure().unwrap();
        size += OptionEncoder.from(this.min_down_speed, 'u32').raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('u32', this.price_per_kbytes).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.avg_ping_ms, 'u16').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_up_bytes, 'u64').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_up_speed, 'u32').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.min_up_speed, 'u32').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_down_bytes, 'u64').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_down_speed, 'u32').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.min_down_speed, 'u32').raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class TrafficContractDecoder implements RawDecode<TrafficContract> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[TrafficContract, Uint8Array]> {
        let price_per_kbytes;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [price_per_kbytes, buf] = r.unwrap();
        }

        let avg_ping_ms;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u16')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [avg_ping_ms, buf] = r.unwrap();
        }

        let max_up_bytes;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u64')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [max_up_bytes, buf] = r.unwrap();
        }

        let max_up_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [max_up_speed, buf] = r.unwrap();
        }

        let min_up_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [min_up_speed, buf] = r.unwrap();
        }

        let max_down_bytes;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u64')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [max_down_bytes, buf] = r.unwrap();
        }

        let max_down_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [max_down_speed, buf] = r.unwrap();
        }

        let min_down_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [min_down_speed, buf] = r.unwrap();
        }

        const ret: [TrafficContract, Uint8Array] = [new TrafficContract(price_per_kbytes.toNumber(), avg_ping_ms.value()?.toNumber(), max_up_bytes.value()?.toBigInt(), max_up_speed.value()?.toNumber(), min_up_speed.value()?.toNumber(), max_down_bytes.value()?.toBigInt(), max_down_speed.value()?.toNumber(), min_down_speed.value()?.toNumber()), buf];
        return Ok(ret);
    }

}
