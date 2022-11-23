/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: weiqiushi@buckyos.com
 *****************************************************/


import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import JSBI from 'jsbi'
import { CoinTokenId, CoinTokenIdDecoder } from "./coin_token_id";
import { BuckyTuple, BuckyTupleDecoder } from "../../cyfs-base/base";

export class NFTState implements RawEncode {
    private readonly tag: number;
    private constructor(
        private normal?: number,
        private auctioning?: [JSBI, CoinTokenId, JSBI],
        private selling?: [JSBI, CoinTokenId, JSBI],
    ) {
        if (normal) {
            this.tag = 0;
        } else if (auctioning) {
            this.tag = 1;
        } else if (selling) {
            this.tag = 2;
        } else {
            this.tag = -1;
        }
    }

    static Normal(): NFTState {
        return new NFTState(1);
    }

    static Auctioning(auctioning: [JSBI, CoinTokenId, JSBI]): NFTState {
        return new NFTState(undefined, auctioning);
    }

    static Selling(selling: [JSBI, CoinTokenId, JSBI]): NFTState {
        return new NFTState(undefined, undefined, selling);
    }

    match<T>(visitor: {
        Normal?: () => T,
        Auctioning?: (auctioning: [JSBI, CoinTokenId, JSBI]) => T,
        Selling?: (selling: [JSBI, CoinTokenId, JSBI]) => T,
    }):T|undefined{
        switch(this.tag) {
            case 0: return visitor.Normal?.();
            case 1: return visitor.Auctioning?.(this.auctioning!);
            case 2: return visitor.Selling?.(this.selling!);
            default: break;
        }
    }

    eq_type(rhs: NFTState): boolean {
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += 1; // tag
        size += this.match({
            Normal:() => { return 0;},
            Auctioning:(auctioning) => { 
                return new BuckyTuple([new BuckyNumber('u64', auctioning[0]), auctioning[1], new BuckyNumber('u64', auctioning[2])]).raw_measure().unwrap()
            },
            Selling:(selling) => {
                return new BuckyTuple([new BuckyNumber('u64', selling[0]), selling[1], new BuckyNumber('u64', selling[2])]).raw_measure().unwrap()
            },
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Normal:() => {return buf;},
            Auctioning:(auctioning) => {
                return new BuckyTuple([new BuckyNumber('u64', auctioning[0]), auctioning[1], new BuckyNumber('u64', auctioning[2])]).raw_encode(buf).unwrap();
            },
            Selling:(selling) => {
                return new BuckyTuple([new BuckyNumber('u64', selling[0]), selling[1], new BuckyNumber('u64', selling[2])]).raw_encode(buf).unwrap();
            },
        })!;
        return Ok(buf);
    }
}

export class NFTStateDecoder implements RawDecode<NFTState> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[NFTState, Uint8Array]> {
        let tag;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [tag, buf] = r.unwrap();
        }

        switch(tag.toNumber()) {
            case 0:{
                const ret: [NFTState, Uint8Array] =  [NFTState.Normal(), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new BuckyTupleDecoder([new BuckyNumberDecoder('u64'), new CoinTokenIdDecoder(), new BuckyNumberDecoder('u64')]).raw_decode(buf);
                if (r.err) {
                    return r;
                }
                let auctioning;
                [auctioning, buf] = r.unwrap();
                const ret: [NFTState, Uint8Array] =  [NFTState.Auctioning([
                    auctioning.index<BuckyNumber>(0).toBigInt(), 
                    auctioning.index(1), 
                    auctioning.index<BuckyNumber>(2).toBigInt()
                ]), buf];
                return Ok(ret);
            }
            case 2:{
                const r = new BuckyTupleDecoder([new BuckyNumberDecoder('u64'), new CoinTokenIdDecoder(), new BuckyNumberDecoder('u64')]).raw_decode(buf);
                if (r.err) {
                    return r;
                }
                let selling;
                [selling, buf] = r.unwrap();
                const ret: [NFTState, Uint8Array] =  [NFTState.Selling([
                    selling.index<BuckyNumber>(0).toBigInt(), 
                    selling.index(1), 
                    selling.index<BuckyNumber>(2).toBigInt()
                ]), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
