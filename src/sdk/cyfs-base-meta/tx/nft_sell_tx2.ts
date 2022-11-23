/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: weiqiushi@buckyos.com
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";
import JSBI from 'jsbi';
import { CoinTokenId, CoinTokenIdDecoder } from "./coin_token_id";
import { BuckyTuple, BuckyTupleDecoder } from "../../cyfs-base/base";



export class NFTSellTx2 implements RawEncode {
    constructor(
        public nft_id: ObjectId,
        public price: JSBI,
        public coin_id: CoinTokenId,
        public sub_sell_infos: [CoinTokenId, JSBI][],
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.nft_id.raw_measure().unwrap();
        size += new BuckyNumber('u64', this.price).raw_measure().unwrap();
        size += this.coin_id.raw_measure().unwrap();
        size += Vec.from(this.sub_sell_infos, (v: [CoinTokenId, JSBI]) => {
            return new BuckyTuple([v[0], new BuckyNumber('u64', v[1])]);
        }).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.nft_id.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.price).raw_encode(buf).unwrap();
        buf = this.coin_id.raw_encode(buf).unwrap();
        buf = Vec.from(this.sub_sell_infos, (v: [CoinTokenId, JSBI]) => {
            return new BuckyTuple([v[0], new BuckyNumber('u64', v[1])]);
        }).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class NFTSellTx2Decoder implements RawDecode<NFTSellTx2> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[NFTSellTx2, Uint8Array]> {
        let nft_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [nft_id, buf] = r.unwrap();
        }

        let price;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [price, buf] = r.unwrap();
        }

        let coin_id;
        {
            const r = new CoinTokenIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [coin_id, buf] = r.unwrap();
        }

        let sub_sell_infos;
        {
            const r = new VecDecoder(new BuckyTupleDecoder([new CoinTokenIdDecoder(), new BuckyNumberDecoder('u64')])).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [sub_sell_infos, buf] = r.unwrap();
        }

        const ret: [NFTSellTx2, Uint8Array] = [new NFTSellTx2(nft_id, price.toBigInt(), coin_id, sub_sell_infos.to((v) => {
            return [v.index(0), v.index<BuckyNumber>(1).toBigInt()]
        })), buf];
        return Ok(ret);
    }

}
