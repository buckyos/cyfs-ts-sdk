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
import { ChunkId, ChunkIdDecoder } from '../chunk'
import JSBI from 'jsbi';

export class ChunkTransReceipt implements RawEncode {
    constructor(
        public chunk_id: ChunkId,
        public crypto_chunk_id: ChunkId,
        public valid_length?: JSBI,
        public max_speed?: number,
        public min_speed?: number,
        public crypto_key?: JSBI,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.chunk_id.raw_measure().unwrap();
        size += this.crypto_chunk_id.raw_measure().unwrap();
        size += OptionEncoder.from(this.valid_length, 'u64').raw_measure().unwrap();
        size += OptionEncoder.from(this.max_speed, 'u32').raw_measure().unwrap();
        size += OptionEncoder.from(this.min_speed, 'u32').raw_measure().unwrap();
        size += OptionEncoder.from(this.crypto_key, 'u64').raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.chunk_id.raw_encode(buf).unwrap();
        buf = this.crypto_chunk_id.raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.valid_length, 'u64').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.max_speed, 'u32').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.min_speed, 'u32').raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.crypto_key, 'u64').raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ChunkTransReceiptDecoder implements RawDecode<ChunkTransReceipt> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ChunkTransReceipt, Uint8Array]> {
        let chunk_id;
        {
            const r = new ChunkIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [chunk_id, buf] = r.unwrap();
        }

        let crypto_chunk_id;
        {
            const r = new ChunkIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [crypto_chunk_id, buf] = r.unwrap();
        }

        let valid_length;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u64')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [valid_length, buf] = r.unwrap();
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

        let crypto_key;
        {
            const r = new OptionDecoder(new BuckyNumberDecoder('u64')).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [crypto_key, buf] = r.unwrap();
        }

        const ret: [ChunkTransReceipt, Uint8Array] = [new ChunkTransReceipt(chunk_id, crypto_chunk_id, valid_length.value()?.toBigInt(), max_speed.value()?.toNumber(), min_speed.value()?.toNumber(), crypto_key.value()?.toBigInt()), buf];
        return Ok(ret);
    }

}
