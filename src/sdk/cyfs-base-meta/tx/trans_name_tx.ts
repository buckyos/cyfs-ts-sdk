/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { Option, OptionDecoder, OptionEncoder, } from "../../cyfs-base/base/option";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";



export class TransNameTx implements RawEncode {
    constructor(
        public sub_name: Option<string>,
        public new_owner: ObjectId,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += OptionEncoder.from(this.sub_name, (v:string)=>new BuckyString(v)).raw_measure().unwrap();
        size += this.new_owner.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = OptionEncoder.from(this.sub_name, (v:string)=>new BuckyString(v)).raw_encode(buf).unwrap();
        buf = this.new_owner.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class TransNameTxDecoder implements RawDecode<TransNameTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[TransNameTx, Uint8Array]>{
        let sub_name;
        {
            const r = new OptionDecoder(new BuckyStringDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [sub_name, buf] = r.unwrap();
        }

        let new_owner;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [new_owner, buf] = r.unwrap();
        }

        const ret:[TransNameTx, Uint8Array] = [new TransNameTx(sub_name.to((v:BuckyString)=>v.value()), new_owner), buf];
        return Ok(ret);
    }

}
