/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../base/results";
import { Option, OptionDecoder, OptionEncoder, } from "../../base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../base/bucky_number";
import { RawDecode, RawEncode } from "../../base/raw_encode";
import JSBI from 'jsbi';


export class TrafficReceipt implements RawEncode {
    constructor(
        public up_bytes: JSBI,
        public down_bytes: JSBI,
        public total_package: JSBI,
        public max_speed: Option<number>,
        public min_speed: Option<number>,
        public avg_ping_ms: Option<number>,
        public stream_count: Option<number>,
        public failed_stream_count: Option<number>,
        public break_stream_count: Option<number>,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('u64', this.up_bytes).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.down_bytes).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.total_package).raw_measure().unwrap();
        size += OptionEncoder.from(this.max_speed, (v: number) => new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.min_speed, (v: number) => new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.avg_ping_ms, (v: number) => new BuckyNumber('u16', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.stream_count, (v: number) => new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.failed_stream_count, (v: number) => new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.break_stream_count, (v: number) => new BuckyNumber('u32', v)).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('u64', this.up_bytes).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.down_bytes).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.total_package).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_speed, (v: number) => new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.min_speed, (v: number) => new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.avg_ping_ms, (v: number) => new BuckyNumber('u16', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.stream_count, (v: number) => new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.failed_stream_count, (v: number) => new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.break_stream_count, (v: number) => new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class TrafficReceiptDecoder implements RawDecode<TrafficReceipt> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[TrafficReceipt, Uint8Array]> {
        let up_bytes;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [up_bytes, buf] = r.unwrap();
        }

        let down_bytes;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [down_bytes, buf] = r.unwrap();
        }

        let total_package;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [total_package, buf] = r.unwrap();
        }

        let max_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [max_speed, buf] = r.unwrap();
        }

        let min_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [min_speed, buf] = r.unwrap();
        }

        let avg_ping_ms;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u16')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [avg_ping_ms, buf] = r.unwrap();
        }

        let stream_count;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [stream_count, buf] = r.unwrap();
        }

        let failed_stream_count;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [failed_stream_count, buf] = r.unwrap();
        }

        let break_stream_count;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [break_stream_count, buf] = r.unwrap();
        }

        const ret: [TrafficReceipt, Uint8Array] = [new TrafficReceipt(up_bytes.toBigInt(), down_bytes.toBigInt(), total_package.toBigInt(), max_speed.to((v) => v.toNumber()), min_speed.to((v) => v.toNumber()), avg_ping_ms.to((v) => v.toNumber()), stream_count.to((v) => v.toNumber()), failed_stream_count.to((v) => v.toNumber()), break_stream_count.to((v) => v.toNumber())), buf];
        return Ok(ret);
    }

}
