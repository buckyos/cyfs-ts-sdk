import { Ok, BuckyResult } from "../../../cyfs-base/base/results";
import { BuckyBuffer, BuckyBufferDecoder } from "../../../cyfs-base/base/bucky_buffer";
import { RawDecode, RawEncode } from "../../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../../cyfs-base/objects/object_id";


export class ViewContract implements RawEncode {
    constructor(
        public address: ObjectId,
        public data: Uint8Array,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.address.raw_measure().unwrap();
        size += new BuckyBuffer(this.data).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.address.raw_encode(buf).unwrap();
        buf = new BuckyBuffer(this.data).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ViewContractDecoder implements RawDecode<ViewContract> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ViewContract, Uint8Array]>{
        let address;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [address, buf] = r.unwrap();
        }

        let data;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [data, buf] = r.unwrap();
        }

        const ret:[ViewContract, Uint8Array] = [new ViewContract(address, data.value()), buf];
        return Ok(ret);
    }
}
