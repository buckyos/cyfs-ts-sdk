/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import {
    SubDescType,
    DescTypeInfo, DescContent, DescContentDecoder,
    BodyContent, BodyContentDecoder,
    NamedObjectId, NamedObjectIdDecoder,
    NamedObjectDesc, NamedObjectDescDecoder,
    NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "../object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../base/bucky_buffer";
import { Vec, VecDecoder } from "../../base/vec";
import { RawDecode, RawEncode } from "../../base/raw_encode";
import { HashValue, HashValueDecoder } from "../../crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../object_id";
import JSBI from 'jsbi';


export class TrafficContract implements RawEncode {
    constructor(
        public price_per_kbytes: number,
        public avg_ping_ms: Option<number>,
        public max_up_bytes: Option<JSBI>,
        public max_up_speed: Option<number>,
        public min_up_speed: Option<number>,
        public max_down_bytes: Option<JSBI>,
        public max_down_speed: Option<number>,
        public min_down_speed: Option<number>,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('u32', this.price_per_kbytes).raw_measure().unwrap();
        size += OptionEncoder.from(this.avg_ping_ms, (v: number) => new BuckyNumber('u16', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.max_up_bytes, (v: JSBI) => new BuckyNumber('u64', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.max_up_speed, (v: number) => new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.min_up_speed, (v: number) => new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.max_down_bytes, (v: JSBI) => new BuckyNumber('u64', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.max_down_speed, (v: number) => new BuckyNumber('u32', v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.min_down_speed, (v: number) => new BuckyNumber('u32', v)).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('u32', this.price_per_kbytes).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.avg_ping_ms, (v: number) => new BuckyNumber('u16', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_up_bytes, (v: JSBI) => new BuckyNumber('u64', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_up_speed, (v: number) => new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.min_up_speed, (v: number) => new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_down_bytes, (v: JSBI) => new BuckyNumber('u64', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_down_speed, (v: number) => new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.min_down_speed, (v: number) => new BuckyNumber('u32', v)).raw_encode(buf).unwrap();
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

        const ret: [TrafficContract, Uint8Array] = [new TrafficContract(price_per_kbytes.toNumber(), avg_ping_ms.to((v) => v.toNumber()), max_up_bytes.to((v) => v.toBigInt()), max_up_speed.to((v) => v.toNumber()), min_up_speed.to((v) => v.toNumber()), max_down_bytes.to((v) => v.toBigInt()), max_down_speed.to((v) => v.toNumber()), min_down_speed.to((v) => v.toNumber())), buf];
        return Ok(ret);
    }

}
