import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyBuffer, BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";
import JSBI from 'jsbi';

export class CallContractTx implements RawEncode {
    constructor(
        public address: ObjectId,
        public value: JSBI,
        public data: Uint8Array
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.address.raw_measure().unwrap();
        size += new BuckyNumber('u64', this.value).raw_measure().unwrap();
        size += new BuckyBuffer(this.data).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.address.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.value).raw_encode(buf).unwrap();
        buf = new BuckyBuffer(this.data).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class CallContractTxDecoder implements RawDecode<CallContractTx> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[CallContractTx, Uint8Array]> {
        let address;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [address, buf] = r.unwrap();
        }

        let value;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [value, buf] = r.unwrap();
        }

        let data;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [data, buf] = r.unwrap();
        }

        const ret: [CallContractTx, Uint8Array] = [new CallContractTx(address, value.toBigInt(), data.value()), buf];
        return Ok(ret);
    }

}