import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyBuffer, BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import JSBI from 'jsbi';

export class CreateContractTx implements RawEncode {
    constructor(
        public value: JSBI,
        public init_data: Uint8Array
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('u64', this.value).raw_measure().unwrap();
        size += new BuckyBuffer(this.init_data).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('u64', this.value).raw_encode(buf).unwrap();
        buf = new BuckyBuffer(this.init_data).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class CreateContractTxDecoder implements RawDecode<CreateContractTx> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[CreateContractTx, Uint8Array]> {
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

        const ret: [CreateContractTx, Uint8Array] = [new CreateContractTx(value.toBigInt(), init_data.value()), buf];
        return Ok(ret);
    }

}