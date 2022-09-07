/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";

import{ NameState, NameStateDecoder } from '../../cyfs-base/name/name_state'


export class ChangeNameParam implements RawEncode {
    constructor(
        public name: string,
        public to: NameState,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyString(this.name).raw_measure().unwrap();
        size += 1;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyString(this.name).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u8', this.to).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ChangeNameParamDecoder implements RawDecode<ChangeNameParam> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ChangeNameParam, Uint8Array]>{
        let name;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [name, buf] = r.unwrap();
        }

        let to;
        {
            const r = new NameStateDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [to, buf] = r.unwrap();
        }

        const ret:[ChangeNameParam, Uint8Array] = [new ChangeNameParam(name.value(), to), buf];
        return Ok(ret);
    }

}
