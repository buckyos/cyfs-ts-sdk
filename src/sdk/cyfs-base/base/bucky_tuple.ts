// 实现一个对应rust中() tuple 的编码解码器

import { Ok } from "ts-results";
import { RawDecode, RawEncode, RawEncodePurpose } from "./raw_encode";
import { BuckyResult } from "./results";

export class BuckyTuple implements RawEncode {
    constructor(public members: (RawEncode)[]){}
    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        let size = 0;
        for (const member of this.members) {
            size += member.raw_measure().unwrap();
        }
        return Ok(size);
    }
    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        for (const member of this.members) {
            buf = member.raw_encode(buf).unwrap();
        }
        return Ok(buf);
    }
    index<T extends RawEncode>(index: number): T {
        return this.members[index] as T;
    }
}

export class BuckyTupleDecoder<U extends RawEncode, T extends RawDecode<U>> implements RawDecode<BuckyTuple> {
    constructor(public decoders: T[]){}
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[BuckyTuple, Uint8Array]> {
        const members = [];
        for (const decoder of this.decoders) {
            const r = decoder.raw_decode(buf);
            if (r.err) {
                return r;
            }
            let obj;
            [obj, buf] = r.unwrap();
            members.push(obj)
        }

        const ret: [BuckyTuple, Uint8Array] = [new BuckyTuple(members), buf];
        return Ok(ret);
    }

}