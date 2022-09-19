/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import { Ok, BuckyResult} from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";

import { SPVTx, SPVTxDecoder } from '../spv_tx';
import JSBI from 'jsbi';

export class SubChainCoinageRecordTx implements RawEncode {
    constructor(
        public height: JSBI,
        public list: SPVTx[],
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('i64', this.height).raw_measure().unwrap();
        size += Vec.from(this.list, (v: SPVTx) => v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('i64', this.height).raw_encode(buf).unwrap();
        buf = Vec.from(this.list, (v: SPVTx) => v).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class SubChainCoinageRecordTxDecoder implements RawDecode<SubChainCoinageRecordTx> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[SubChainCoinageRecordTx, Uint8Array]> {
        let height;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [height, buf] = r.unwrap();
        }

        let list;
        {
            const r = new VecDecoder(new SPVTxDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [list, buf] = r.unwrap();
        }

        const ret: [SubChainCoinageRecordTx, Uint8Array] = [new SubChainCoinageRecordTx(height.toBigInt(), list.to((v: SPVTx) => v)), buf];
        return Ok(ret);
    }

}
