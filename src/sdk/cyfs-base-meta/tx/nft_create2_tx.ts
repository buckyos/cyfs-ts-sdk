/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: weiqiushi@buckyos.com
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { NFTDesc, NFTDescDecoder } from "./nft_desc";
import { NFTState, NFTStateDecoder } from "./nft_state";



export class NFTCreateTx2 implements RawEncode {
    constructor(
        public desc: NFTDesc,
        public name: string,
        public state: NFTState,
        public sub_names: string[],
        public sub_states: NFTState[],
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.desc.raw_measure().unwrap();
        size += new BuckyString(this.name).raw_measure().unwrap();
        size += this.state.raw_measure().unwrap();
        size += Vec.from(this.sub_names, (v: string) => new BuckyString(v)).raw_measure().unwrap();
        size += Vec.from(this.sub_states, (v: NFTState) => v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.desc.raw_encode(buf).unwrap();
        buf = new BuckyString(this.name).raw_encode(buf).unwrap();
        buf = this.state.raw_encode(buf).unwrap();
        buf = Vec.from(this.sub_names, (v: string) => new BuckyString(v)).raw_encode(buf).unwrap();
        buf = Vec.from(this.sub_states, (v: NFTState) => v).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class NFTCreateTx2Decoder implements RawDecode<NFTCreateTx2> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[NFTCreateTx2, Uint8Array]> {
        let desc;
        {
            const r = new NFTDescDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [desc, buf] = r.unwrap();
        }

        let name;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [name, buf] = r.unwrap();
        }

        let state;
        {
            const r = new NFTStateDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [state, buf] = r.unwrap();
        }

        let sub_names;
        {
            const r = new VecDecoder(new BuckyStringDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [sub_names, buf] = r.unwrap();
        }

        let sub_states;
        {
            const r = new VecDecoder(new NFTStateDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [sub_states, buf] = r.unwrap();
        }

        const ret: [NFTCreateTx2, Uint8Array] = [new NFTCreateTx2(desc, name.value(), state, sub_names.to((v: BuckyString) => v.value()), sub_states.to((v: NFTState) => v)), buf];
        return Ok(ret);
    }

}
