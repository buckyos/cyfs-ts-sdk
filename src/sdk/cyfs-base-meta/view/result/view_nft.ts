import {
    BuckyNumber, BuckyNumberDecoder,
    BuckyResult,
    ObjectId,
    ObjectIdDecoder,
    Ok,
    RawDecode,
    RawEncode,
    RawEncodePurpose, Vec, VecDecoder
} from "../../../cyfs-base";
import {CoinTokenId, CoinTokenIdDecoder} from "../../tx/coin_token_id";
import { OptionDecoder, OptionEncoder, } from "../../../cyfs-base/base/option";

export class NFTBuyItem implements RawEncode {
    constructor(
        public buyer_id: ObjectId,
        public price: number,
        public coin_id: CoinTokenId) {
    }

    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        buf = this.buyer_id.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.price).raw_encode(buf).unwrap();
        buf = this.coin_id.raw_encode(buf).unwrap();
        return Ok(buf);
    }

    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        let size = 0;
        size += this.buyer_id.raw_measure().unwrap();
        size += new BuckyNumber('u64', this.price).raw_measure().unwrap();
        size += this.coin_id.raw_measure().unwrap();
        return Ok(size);
    }
}

export class NFTBuyItemDecoder implements RawDecode<NFTBuyItem> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[NFTBuyItem, Uint8Array]> {
        let buyer_id;
        {
            const ret = new ObjectIdDecoder().raw_decode(buf);
            if (ret.err) {
                return ret;
            }
            [buyer_id, buf] = ret.unwrap();
        }

        let price;
        {
            const ret = new BuckyNumberDecoder("u64").raw_decode(buf);
            if (ret.err) {
                return ret;
            }
            [price, buf] = ret.unwrap();
        }

        let coin_id;
        {
            const ret = new CoinTokenIdDecoder().raw_decode(buf);
            if (ret.err) {
                return ret;
            }
            [coin_id, buf] = ret.unwrap();
        }

        return Ok([new NFTBuyItem(buyer_id, price.toNumber(), coin_id), buf]);
    }
}

export class ViewNFTBuyListResult implements RawEncode {
    constructor(public sum: number, public list: NFTBuyItem[]) {
    }

    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('u32', this.sum).raw_encode(buf).unwrap();
        buf = new Vec(this.list).raw_encode(buf).unwrap();
        return Ok(buf);
    }

    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('u32', this.sum).raw_measure().unwrap();
        size += new Vec(this.list).raw_measure().unwrap();
        return Ok(size);
    }


}

export class ViewNFTBuyListResultDecoder implements RawDecode<ViewNFTBuyListResult> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ViewNFTBuyListResult, Uint8Array]> {
        let sum;
        {
            const ret = new BuckyNumberDecoder('u32').raw_decode(buf);
            if (ret.err) {
                return ret;
            }
            [sum, buf] = ret.unwrap();
        }
        let list;
        {
            const ret = new VecDecoder(new NFTBuyItemDecoder()).raw_decode(buf);
            if (ret.err) {
                return ret;
            }
            [list, buf] = ret.unwrap();
        }

        return Ok([new ViewNFTBuyListResult(sum.toNumber(), list.to(v => {
            return v;
        })), buf]);
    }

}

export class NFTLargestBuyValueData implements RawEncode {
    constructor(
        public buyer_id: ObjectId,
        public coin_id: CoinTokenId,
        public price: number) {
    }

    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        buf = this.buyer_id.raw_encode(buf).unwrap();
        buf = this.coin_id.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.price).raw_encode(buf).unwrap();
        return Ok(buf);
    }

    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        let size = 0;
        size += this.buyer_id.raw_measure().unwrap();
        size += this.coin_id.raw_measure().unwrap();
        size += new BuckyNumber('u64', this.price).raw_measure().unwrap();
        return Ok(size);
    }
}

export class NFTLargestBuyValueDataDecoder implements RawDecode<NFTLargestBuyValueData> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[NFTLargestBuyValueData, Uint8Array]> {
        let buyer_id;
        {
            const ret = new ObjectIdDecoder().raw_decode(buf);
            if (ret.err) {
                return ret;
            }
            [buyer_id, buf] = ret.unwrap();
        }

        let coin_id;
        {
            const ret = new CoinTokenIdDecoder().raw_decode(buf);
            if (ret.err) {
                return ret;
            }
            [coin_id, buf] = ret.unwrap();
        }

        let price;
        {
            const ret = new BuckyNumberDecoder("u64").raw_decode(buf);
            if (ret.err) {
                return ret;
            }
            [price, buf] = ret.unwrap();
        }

        return Ok([new NFTLargestBuyValueData(buyer_id, coin_id, price.toNumber()), buf]);
    }
}

export class NFTLargestBuyValue implements RawEncode {
    constructor(public value?: NFTLargestBuyValueData) {
    }

    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        buf = OptionEncoder.from(this.value).raw_encode(buf).unwrap();
        return Ok(buf);
    }

    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        let size = 0;
        size += OptionEncoder.from(this.value).raw_measure().unwrap();
        return Ok(size);
    }

}

export class NFTLargestBuyValueDecoder implements RawDecode<NFTLargestBuyValue> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[NFTLargestBuyValue, Uint8Array]> {
            let results;
        {
            const r = new OptionDecoder(new NFTLargestBuyValueDataDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [results, buf] = r.unwrap();
        }

        const ret:[NFTLargestBuyValue, Uint8Array] = [new NFTLargestBuyValue(results.value()), buf];
        return Ok(ret);
    }

}
