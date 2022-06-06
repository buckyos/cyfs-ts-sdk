import { BuckyBuffer, BuckyBufferDecoder, BuckyFixedBuffer, BuckyFixedBufferDecoder } from "../../../cyfs-base/base/bucky_buffer";
import { BuckyTuple, BuckyTupleDecoder } from "../../../cyfs-base/base/bucky_tuple";
import { RawDecode, RawEncode, RawEncodePurpose } from "../../../cyfs-base/base/raw_encode";
import { BuckyResult, Ok } from "../../../cyfs-base/base/results";
import { Vec, VecDecoder } from "../../../cyfs-base/base/vec";

export class ViewLogResult implements RawEncode {
    public logs: [Uint8Array[], Uint8Array][]
    constructor(logs: Vec<BuckyTuple>) {
        this.logs = logs.to(v => {
            let topics = v.members[0] as Vec<BuckyFixedBuffer>;
            let data = v.members[1] as BuckyBuffer;
            return [topics.to(v => v.buffer), data.buffer]
        })
    }
    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        throw new Error("Method not implemented.");
    }
    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        throw new Error("Method not implemented.");
    }
}

export class ViewLogResultDecoder implements RawDecode<ViewLogResult> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ViewLogResult, Uint8Array]> {
        let logs;
        {
            const r = new VecDecoder(new BuckyTupleDecoder([new VecDecoder(new BuckyFixedBufferDecoder(32)), new BuckyBufferDecoder()])).raw_decode(buf);
            if(r.err){
                return r;
            }
            [logs, buf] = r.unwrap();
        }

        const ret:[ViewLogResult, Uint8Array] = [new ViewLogResult(logs), buf];
        return Ok(ret);
    }
    
}