import {BuckyResult, ObjectId, ObjectIdDecoder, Ok, RawDecode, RawEncode, RawEncodePurpose} from "../../../cyfs-base";

export class ViewBenefiResult implements RawEncode {
    constructor(public address: ObjectId) {
    }

    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        buf = this.address.raw_encode(buf).unwrap();
        return Ok(buf);
    }

    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        let size = 0;
        size += this.address.raw_measure().unwrap();
        return Ok(size);
    }
}

export class ViewBenefiResultDecoder implements RawDecode<ViewBenefiResult> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ViewBenefiResult, Uint8Array]> {
        let address: ObjectId;
        {
            const ret = new ObjectIdDecoder().raw_decode(buf);
            if (ret.err) {
                return ret;
            }

            [address, buf] = ret.unwrap();
        }

        return Ok([new ViewBenefiResult(address), buf]);
    }
}
