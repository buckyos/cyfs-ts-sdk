import { BuckyFixedBuffer } from "../../../cyfs-base/base/bucky_buffer";
import { BuckyNumber} from "../../../cyfs-base/base/bucky_number";
import { OptionEncoder } from "../../../cyfs-base/base/option";
import { RawDecode, RawEncode, RawEncodePurpose } from "../../../cyfs-base/base/raw_encode";
import { BuckyResult, Ok } from "../../../cyfs-base/base/results";
import { Vec } from "../../../cyfs-base/base/vec";
import { ObjectId } from "../../../cyfs-base/objects/object_id";

export class ViewLog implements RawEncode {
    public topic: Vec<OptionEncoder<BuckyFixedBuffer>>
    constructor(
        public address: ObjectId,
        public from: number,
        public to: number,
        topics: (Uint8Array|null)[]
    ){
        const inner_topics:(Uint8Array|undefined)[] = [];
        for (const topic of topics) {
            if (topic === null) {
                inner_topics.push(undefined);
            } else {
                inner_topics.push(topic)
            }
        }

        this.topic = Vec.from<OptionEncoder<BuckyFixedBuffer>, Uint8Array|undefined>(inner_topics, (v) =>
            new OptionEncoder(v?new BuckyFixedBuffer(v):undefined)
        )
    }

    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        let ret = 0;
        ret += this.address.raw_measure().unwrap();
        ret += this.topic.raw_measure().unwrap();
        ret += new BuckyNumber("i64", this.from).raw_measure().unwrap();
        ret += new BuckyNumber("i64", this.to).raw_measure().unwrap();
        return Ok(ret);
    }
    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        buf = this.address.raw_encode(buf).unwrap();
        buf = this.topic.raw_encode(buf).unwrap();
        buf = new BuckyNumber("i64", this.from).raw_encode(buf).unwrap();
        buf = new BuckyNumber("i64", this.to).raw_encode(buf).unwrap();

        return Ok(buf)
    }
}

export class ViewLogDecoder implements RawDecode<ViewLog> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ViewLog, Uint8Array]> {
        throw new Error("Method not implemented.");
    }
    
}