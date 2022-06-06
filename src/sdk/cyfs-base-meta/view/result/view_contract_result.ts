import { Ok, BuckyResult } from "../../../cyfs-base/base/results";
import { BuckyBuffer, BuckyBufferDecoder } from "../../../cyfs-base/base/bucky_buffer";
import { RawDecode, RawEncode } from "../../../cyfs-base/base/raw_encode";
import { BuckyNumber, BuckyNumberDecoder } from "../../../cyfs-base/base/bucky_number";


export class ViewContractResult implements RawEncode {
    constructor(
        public ret: number,
        public value: Uint8Array,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyNumber('u32', this.ret).raw_measure().unwrap();
        size += new BuckyBuffer(this.value).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u32', this.ret).raw_encode(buf).unwrap();
        buf = new BuckyBuffer(this.value).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ViewContractResultDecoder implements RawDecode<ViewContractResult> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ViewContractResult, Uint8Array]>{
        let ret_value;
        {
            const r = new BuckyNumberDecoder("u32").raw_decode(buf);
            if(r.err){
                return r;
            }
            [ret_value, buf] = r.unwrap();
        }

        let value;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [value, buf] = r.unwrap();
        }

        const ret:[ViewContractResult, Uint8Array] = [new ViewContractResult(ret_value.toNumber(), value.value()), buf];
        return Ok(ret);
    }
}
