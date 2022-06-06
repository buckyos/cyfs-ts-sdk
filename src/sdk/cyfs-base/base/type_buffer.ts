import { Ok } from "ts-results";
import { BuckySize, BuckySizeDecoder } from "./bucky_usize";
import { RawDecode, RawEncode, RawEncodePurpose } from "./raw_encode";
import { BuckyResult } from "./results";

export class TypeBuffer<T extends RawEncode> implements RawEncode {
    constructor(public obj:T){}
    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        let obj_len = this.obj.raw_measure().unwrap();
        let size = 0;
        size += new BuckySize(obj_len).raw_measure().unwrap();
        size += obj_len;
        return Ok(size);
    }
    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        let obj_len = this.obj.raw_measure().unwrap();
        buf = new BuckySize(obj_len).raw_encode(buf).unwrap();
        buf = this.obj.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class TypeBufferDecoder<T extends RawEncode, D extends RawDecode<T>> implements RawDecode<TypeBuffer<T>> {
    constructor(private inner_decoder: D){}
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[TypeBuffer<T>, Uint8Array]> {
        let obj_size;
        {
            let r = new BuckySizeDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [obj_size, buf] = r.unwrap();
        }

        let obj;
        {
            let r = this.inner_decoder.raw_decode(buf);
            if (r.err) {
                return r;
            }
            [obj, buf] = r.unwrap();
        }

        return Ok([new TypeBuffer(obj), buf] as [TypeBuffer<T>, Uint8Array]);
    }

}