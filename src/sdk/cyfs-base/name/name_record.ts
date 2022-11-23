import { Ok, BuckyResult } from "../base/results";
import { RawEncode, RawDecode } from "../base/raw_encode";
import {} from "../base/buffer";
import { BuckyString, BuckyStringDecoder } from "../base/bucky_string";
import { NameLink, NameLinkDecoder } from "./name_link";

// #[derive(Clone, Debug, RawEncode, RawDecode)]
// pub struct  NameRecord {
//     pub link:NameLink,
//     pub user_data:String,
// }

export class NameRecord implements RawEncode{
    constructor(
        public link:NameLink,
        public user_data: string
    ){
        //
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.link.raw_measure().unwrap();
        size += new BuckyString(this.user_data).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.link.raw_encode(buf).unwrap();
        buf = new BuckyString(this.user_data).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class NameRecordDecoder implements RawDecode<NameRecord>{
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[NameRecord, Uint8Array]>{
        let link;
        {
            const r = new NameLinkDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [link, buf] = r.unwrap();
        }

        let user_data;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [user_data, buf] = r.unwrap();
        }

        const ret:[NameRecord, Uint8Array] = [new NameRecord(link, user_data.value()), buf];
        return Ok(ret);
    }
}