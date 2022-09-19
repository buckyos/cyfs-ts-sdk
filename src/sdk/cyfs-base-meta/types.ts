import { BuckyNumber, BuckyNumberDecoder, BuckyResult, Ok, RawDecode, RawEncode } from "../cyfs-base";
import JSBI from 'jsbi';

export class UnionBalance implements RawEncode {
    constructor(
        public total: JSBI,
        public left: JSBI,
        public right: JSBI,
        public deviation: JSBI,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('i64', this.total).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.left).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.right).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.deviation).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('i64', this.total).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.left).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.right).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.deviation).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class UnionBalanceDecoder implements RawDecode<UnionBalance> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[UnionBalance, Uint8Array]> {
        let total;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [total, buf] = r.unwrap();
        }

        let left;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [left, buf] = r.unwrap();
        }

        let right;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [right, buf] = r.unwrap();
        }

        let deviation;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [deviation, buf] = r.unwrap();
        }

        const ret: [UnionBalance, Uint8Array] = [new UnionBalance(total.toBigInt(), left.toBigInt(), right.toBigInt(), deviation.toBigInt()), buf];
        return Ok(ret);
    }

}