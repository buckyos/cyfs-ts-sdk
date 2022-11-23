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
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";
import JSBI from 'jsbi';


export class BidName implements RawEncode {
    constructor(
        public name: string,
        public price: JSBI,
        public bid_id: ObjectId,
        public coin_id: number,
        public take_effect_block: JSBI,
        public rent_price: JSBI,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += new BuckyString(this.name).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.price).raw_measure().unwrap();
        size += this.bid_id.raw_measure().unwrap();
        size += new BuckyNumber('u8', this.coin_id).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.take_effect_block).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.rent_price).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyString(this.name).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.price).raw_encode(buf).unwrap();
        buf = this.bid_id.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u8', this.coin_id).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.take_effect_block).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.rent_price).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class BidNameDecoder implements RawDecode<BidName> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[BidName, Uint8Array]> {
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
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [price, buf] = r.unwrap();
        }

        let bid_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [bid_id, buf] = r.unwrap();
        }

        let coin_id;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [coin_id, buf] = r.unwrap();
        }

        let take_effect_block;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [take_effect_block, buf] = r.unwrap();
        }

        let rent_price;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [rent_price, buf] = r.unwrap();
        }

        const ret: [BidName, Uint8Array] = [new BidName(name.value(), price.toBigInt(), bid_id, coin_id.toNumber(), take_effect_block.toBigInt(), rent_price.toBigInt()), buf];
        return Ok(ret);
    }

}
