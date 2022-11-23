/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: weiqiushi@buckyos.com
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";



export class SetBenefiTx implements RawEncode {
    constructor(
        public address: ObjectId,
        public to: ObjectId,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.address.raw_measure().unwrap();
        size += this.to.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.address.raw_encode(buf).unwrap();
        buf = this.to.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class SetBenefiTxDecoder implements RawDecode<SetBenefiTx> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[SetBenefiTx, Uint8Array]> {
        let address;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [address, buf] = r.unwrap();
        }

        let to;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [to, buf] = r.unwrap();
        }

        const ret: [SetBenefiTx, Uint8Array] = [new SetBenefiTx(address, to), buf];
        return Ok(ret);
    }

}
