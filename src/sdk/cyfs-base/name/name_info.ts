import { Ok, BuckyResult } from "../base/results";
import { RawDecode } from "../base/raw_encode";
import {} from "../base/buffer";
import {ObjectId, ObjectIdDecoder} from "../objects/object_id";
import { NameRecord, NameRecordDecoder } from "./name_record";
import { BuckyMap, BuckyMapDecoder } from "../base/bucky_map";
import { BuckyString, BuckyStringDecoder } from "../base/bucky_string";
import { Option, OptionDecoder, OptionEncoder } from "../base/option";

// #[derive(Clone, Debug, RawEncode, RawDecode)]
// #[cyfs(optimize_option)]
// pub struct NameInfo {
//     //子域名记录
//     pub sub_records : HashMap<String,NameRecord>,
//     //直接记录
//     pub record : NameRecord,
//     pub owner: Option<ObjectId>,
// }

export class NameInfo {
    constructor(
        //子域名记录
        public sub_records : BuckyMap<BuckyString, NameRecord>,
        //直接记录
        public record : NameRecord,
        public owner: Option<ObjectId>,
    ){
        //
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.sub_records.raw_measure().unwrap();
        size += this.record.raw_measure().unwrap();
        size += new OptionEncoder(this.owner).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.sub_records.raw_encode(buf).unwrap();
        buf = this.record.raw_encode(buf).unwrap();
        buf = new OptionEncoder(this.owner).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class NameInfoDecoder implements RawDecode<NameInfo>{
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[NameInfo, Uint8Array]>{
        let sub_records;
        {
            const r = new BuckyMapDecoder(new BuckyStringDecoder(), new NameRecordDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [sub_records, buf] = r.unwrap();
        }

        let record;
        {
            const r = new NameRecordDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [record, buf] = r.unwrap();
        }

        let owner;
        {
            const r = new OptionDecoder(new ObjectIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [owner, buf] = r.unwrap();
        }

        const ret:[NameInfo, Uint8Array] = [new NameInfo(sub_records, record, owner.value()), buf];
        return Ok(ret);
    }
}