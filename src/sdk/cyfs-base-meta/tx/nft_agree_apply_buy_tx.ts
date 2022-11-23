/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: weiqiushi@buckyos.com
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";



export class NFTAgreeApplyTx implements RawEncode {
    constructor(
        public nft_id: ObjectId,
        public user_id: ObjectId,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.nft_id.raw_measure().unwrap();
        size += this.user_id.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.nft_id.raw_encode(buf).unwrap();
        buf = this.user_id.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class NFTAgreeApplyTxDecoder implements RawDecode<NFTAgreeApplyTx> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[NFTAgreeApplyTx, Uint8Array]> {
        let nft_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [nft_id, buf] = r.unwrap();
        }

        let user_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [user_id, buf] = r.unwrap();
        }

        const ret: [NFTAgreeApplyTx, Uint8Array] = [new NFTAgreeApplyTx(nft_id, user_id), buf];
        return Ok(ret);
    }

}
