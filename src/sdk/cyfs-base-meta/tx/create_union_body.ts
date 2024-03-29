/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";

import { UnionAccount, UnionAccountDecoder } from '../../cyfs-base/objects/union_account'
import { CoinTokenId } from './coin_token_id';
import { CoinTokenIdDecoder } from './coin_token_id';
import JSBI from 'jsbi';

export class CreateUnionBody implements RawEncode {
    constructor(
        public account: UnionAccount,
        public ctid: CoinTokenId,
        public left_balance: JSBI,
        public right_balance: JSBI,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.account.raw_measure().unwrap();
        size += this.ctid.raw_measure().unwrap();
        size += new BuckyNumber('i64', this.left_balance).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.right_balance).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.account.raw_encode(buf).unwrap();
        buf = this.ctid.raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.left_balance).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.right_balance).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class CreateUnionBodyDecoder implements RawDecode<CreateUnionBody> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[CreateUnionBody, Uint8Array]> {
        let account;
        {
            const r = new UnionAccountDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [account, buf] = r.unwrap();
        }

        let ctid;
        {
            const r = new CoinTokenIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [ctid, buf] = r.unwrap();
        }

        let left_balance;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [left_balance, buf] = r.unwrap();
        }

        let right_balance;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [right_balance, buf] = r.unwrap();
        }

        const ret: [CreateUnionBody, Uint8Array] = [new CreateUnionBody(account, ctid, left_balance.toBigInt(), right_balance.toBigInt()), buf];
        return Ok(ret);
    }

}
