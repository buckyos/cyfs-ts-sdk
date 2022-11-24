/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../base/results";
import { OptionDecoder, OptionEncoder, } from "../../base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../base/bucky_number";
import { Vec, VecDecoder } from "../../base/vec";
import { RawDecode, RawEncode } from "../../base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../object_id";
import JSBI from 'jsbi';


export class ChunkTransContract implements RawEncode {
    constructor(
        public price_per_kbytes: number,
        public obj_list?: ObjectId[],
        public min_speed?: number,
        public max_speed?: number,
        public avg_speed?: number,
        public max_bytes?: JSBI,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('u32', this.price_per_kbytes).raw_measure().unwrap();
        size += OptionEncoder.from(this.obj_list).raw_measure().unwrap();
        size += OptionEncoder.from(this.min_speed, 'u32').raw_measure().unwrap();
        size += OptionEncoder.from(this.max_speed, 'u32').raw_measure().unwrap();
        size += OptionEncoder.from(this.avg_speed, 'u32').raw_measure().unwrap();
        size += OptionEncoder.from(this.max_bytes, 'u64').raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('u32', this.price_per_kbytes).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.obj_list).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.min_speed, 'u32').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_speed, 'u32').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.avg_speed, 'u32').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_bytes, 'u64').raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ChunkTransContractDecoder implements RawDecode<ChunkTransContract> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ChunkTransContract, Uint8Array]> {
        let price_per_kbytes;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [price_per_kbytes, buf] = r.unwrap();
        }

        let obj_list;
        {
            const r = new OptionDecoder(new VecDecoder(new ObjectIdDecoder())).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [obj_list, buf] = r.unwrap();
        }

        let min_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [min_speed, buf] = r.unwrap();
        }

        let max_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [max_speed, buf] = r.unwrap();
        }

        let avg_speed;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u32')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [avg_speed, buf] = r.unwrap();
        }

        let max_bytes;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u64')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [max_bytes, buf] = r.unwrap();
        }

        const ret: [ChunkTransContract, Uint8Array] = [new ChunkTransContract(price_per_kbytes.toNumber()
            , obj_list.value()?.value()
            , min_speed.value()?.toNumber()
            , max_speed.value()?.toNumber()
            , avg_speed.value()?.toNumber()
            , max_bytes.value()?.toBigInt()), buf];
        return Ok(ret);
    }

}
