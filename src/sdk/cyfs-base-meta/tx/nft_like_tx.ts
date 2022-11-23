/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: weiqiushi@buckyos.com
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";



export class NFTLikeTx implements RawEncode {
    constructor(
        public nft_id: ObjectId,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.nft_id.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.nft_id.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class NFTLikeTxDecoder implements RawDecode<NFTLikeTx> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[NFTLikeTx, Uint8Array]> {
        let nft_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [nft_id, buf] = r.unwrap();
        }

        const ret: [NFTLikeTx, Uint8Array] = [new NFTLikeTx(nft_id), buf];
        return Ok(ret);
    }

}
