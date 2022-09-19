/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import { Ok, BuckyResult} from "../../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode } from "../../../cyfs-base/base/raw_encode";

import { CoinTokenId, CoinTokenIdDecoder } from '../../tx/coin_token_id'
import { UnionBalance, UnionBalanceDecoder } from '../../types'
import JSBI from 'jsbi';


export class ViewUnionBalanceResultItem implements RawEncode {
    constructor(
        public id: CoinTokenId,
        public union_balance: UnionBalance,
        public result: JSBI,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.id.raw_measure().unwrap();
        size += this.union_balance.raw_measure().unwrap();
        size += new BuckyNumber('i64', this.result).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.id.raw_encode(buf).unwrap();
        buf = this.union_balance.raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.result).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ViewUnionBalanceResultItemDecoder implements RawDecode<ViewUnionBalanceResultItem> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ViewUnionBalanceResultItem, Uint8Array]> {
        let id;
        {
            const r = new CoinTokenIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [id, buf] = r.unwrap();
        }

        let union_balance;
        {
            const r = new UnionBalanceDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [union_balance, buf] = r.unwrap();
        }

        let result;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [result, buf] = r.unwrap();
        }

        const ret: [ViewUnionBalanceResultItem, Uint8Array] = [new ViewUnionBalanceResultItem(id, union_balance, result.toBigInt()), buf];
        return Ok(ret);
    }

}
