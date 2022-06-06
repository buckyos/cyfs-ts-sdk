import {
    BuckyNumber, BuckyNumberDecoder,
    BuckyResult,
    ObjectId,
    ObjectIdDecoder,
    Ok,
    RawDecode,
    RawEncode,
    RawEncodePurpose
} from "../../../cyfs-base";
import {CoinTokenIdDecoder} from "../../tx/coin_token_id";

export class ViewNFTBuyList implements RawEncode {
    constructor(
        public object_id: ObjectId,
        public offset: number,
        public length: number
    ) {
    }

    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        buf = this.object_id.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.offset).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u8', this.length).raw_encode(buf).unwrap();
        return Ok(buf);
    }

    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        let size = 0;
        size += this.object_id.raw_measure().unwrap();
        size += new BuckyNumber('u32', this.offset).raw_measure().unwrap();
        size += new BuckyNumber('u8', this.length).raw_measure().unwrap();
        return Ok(size);
    }
}

export class ViewNFTBuyListDecoder implements RawDecode<ViewNFTBuyList> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ViewNFTBuyList, Uint8Array]> {
        let nft_id;
        {
            const ret = new ObjectIdDecoder().raw_decode(buf);
            if (ret.err) {
                return ret;
            }
            [nft_id, buf] = ret.unwrap();
        }

        let offset;
        {
            const ret = new BuckyNumberDecoder('u32').raw_decode(buf);
            if (ret.err) {
                return ret;
            }
            [offset, buf] = ret.unwrap();
        }

        let length;
        {
            const ret = new BuckyNumberDecoder("u8").raw_decode(buf);
            if (ret.err) {
                return ret;
            }
            [length, buf] = ret.unwrap();
        }

        return Ok([new ViewNFTBuyList(nft_id, offset.toNumber(), length.toNumber()), buf]);
    }
}
