/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: weiqiushi@buckyos.com
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { Option, OptionDecoder, OptionEncoder, } from "../../cyfs-base/base/option";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";



export class NFTTransTx implements RawEncode {
    constructor(
        public nft_id: ObjectId,
        public to: ObjectId,
        public nft_cached: Option<ObjectId>,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.nft_id.raw_measure().unwrap();
        size += this.to.raw_measure().unwrap();
        size += new OptionEncoder(this.nft_cached).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.nft_id.raw_encode(buf).unwrap();
        buf = this.to.raw_encode(buf).unwrap();
        buf = new OptionEncoder(this.nft_cached).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class NFTTransTxDecoder implements RawDecode<NFTTransTx> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[NFTTransTx, Uint8Array]> {
        let nft_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [nft_id, buf] = r.unwrap();
        }

        let to;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [to, buf] = r.unwrap();
        }

        let nft_cached;
        {
            const r = new OptionDecoder(new ObjectIdDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [nft_cached, buf] = r.unwrap();
        }

        const ret: [NFTTransTx, Uint8Array] = [new NFTTransTx(nft_id, to, nft_cached.value()), buf];
        return Ok(ret);
    }

}
