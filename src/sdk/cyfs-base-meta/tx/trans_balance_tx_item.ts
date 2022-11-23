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
import JSBI from 'jsbi';


export class TransBalanceTxItem implements RawEncode {
    constructor(
        public id: ObjectId,
        public balance: JSBI,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.id.raw_measure().unwrap();
        size += new BuckyNumber('i64', this.balance).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.id.raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.balance).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class TransBalanceTxItemDecoder implements RawDecode<TransBalanceTxItem> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[TransBalanceTxItem, Uint8Array]> {
        let id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [id, buf] = r.unwrap();
        }

        let balance;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [balance, buf] = r.unwrap();
        }

        const ret: [TransBalanceTxItem, Uint8Array] = [new TransBalanceTxItem(id, balance.toBigInt()), buf];
        return Ok(ret);
    }

}
