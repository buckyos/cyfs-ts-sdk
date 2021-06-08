/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Fri Mar 12 2021 16:29:18 GMT+0800 (GMT+08:00)
 *****************************************************/
import { Ok, BuckyResult} from "../cyfs-base/base/results";
import { BuckyString, BuckyStringDecoder } from "../cyfs-base/base/bucky_string";
import { RawDecode, RawEncode } from "../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../cyfs-base/objects/object_id";

export class MsgObjectContent implements RawEncode {
    constructor(
        public id: ObjectId,
        public name: string,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.id.raw_measure().unwrap();
        size += new BuckyString(this.name).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.id.raw_encode(buf).unwrap();
        buf = new BuckyString(this.name).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class MsgObjectContentDecoder implements RawDecode<MsgObjectContent> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[MsgObjectContent, Uint8Array]>{
        let id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [id, buf] = r.unwrap();
        }

        let name;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [name, buf] = r.unwrap();
        }

        const ret:[MsgObjectContent, Uint8Array] = [new MsgObjectContent(id, name.value()), buf];
        return Ok(ret);
    }

}
