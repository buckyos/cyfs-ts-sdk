/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";

import { CoinTokenId } from './coin_token_id';
import { CoinTokenIdDecoder } from './coin_token_id';
import JSBI from 'jsbi';

export class DeviateUnionBody implements RawEncode {
    constructor(
        public ctid: CoinTokenId,
        public seq: JSBI,
        public deviation: JSBI,
        public union: ObjectId,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.ctid.raw_measure().unwrap();
        size += new BuckyNumber('i64', this.seq).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.deviation).raw_measure().unwrap();
        size += this.union.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.ctid.raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.seq).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.deviation).raw_encode(buf).unwrap();
        buf = this.union.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class DeviateUnionBodyDecoder implements RawDecode<DeviateUnionBody> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[DeviateUnionBody, Uint8Array]> {
        let ctid;
        {
            const r = new CoinTokenIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [ctid, buf] = r.unwrap();
        }

        let seq;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [seq, buf] = r.unwrap();
        }

        let deviation;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [deviation, buf] = r.unwrap();
        }

        let union;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [union, buf] = r.unwrap();
        }

        const ret: [DeviateUnionBody, Uint8Array] = [new DeviateUnionBody(ctid, seq.toBigInt(), deviation.toBigInt(), union), buf];
        return Ok(ret);
    }

}
