import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyBuffer, BuckyBufferDecoder, BuckyFixedBuffer, BuckyFixedBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import JSBI from 'jsbi';

export class CreateContract2Tx implements RawEncode {
    constructor(
        public value: JSBI,
        public init_data: Uint8Array,
        public salt: Uint8Array,    // salt大小必须是32位
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        if (this.salt.byteLength != 32) {
            return Err(new BuckyError(BuckyErrorCode.InvalidParam, "salt must be 32 bytes length"));
        }
        let size = 0;
        size += new BuckyNumber('u64', this.value).raw_measure().unwrap();
        size += new BuckyBuffer(this.init_data).raw_measure().unwrap();
        size += 32;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        if (this.salt.byteLength != 32) {
            return Err(new BuckyError(BuckyErrorCode.InvalidParam, "salt must be 32 bytes length"));
        }
        buf = new BuckyNumber('u64', this.value).raw_encode(buf).unwrap();
        buf = new BuckyBuffer(this.init_data).raw_encode(buf).unwrap();
        buf = new BuckyFixedBuffer(this.salt).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class CreateContract2TxDecoder implements RawDecode<CreateContract2Tx> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[CreateContract2Tx, Uint8Array]> {
        let value;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [value, buf] = r.unwrap();
        }

        let init_data;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [init_data, buf] = r.unwrap();
        }

        let salt;
        {
            const r = new BuckyFixedBufferDecoder(32).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [salt, buf] = r.unwrap();
        }

        const ret: [CreateContract2Tx, Uint8Array] = [new CreateContract2Tx(value.toBigInt(), init_data.value(), salt.value()), buf];
        return Ok(ret);
    }

}