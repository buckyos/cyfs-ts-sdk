/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../../cyfs-base/base/results";
import { RawDecode, RawEncode } from "../../../cyfs-base/base/raw_encode";

import{ NameInfo, NameInfoDecoder } from '../../../cyfs-base/name/name_info'
import{ NameState, NameStateDecoder } from '../../../cyfs-base/name/name_state'
import { BuckyNumber } from "../../../cyfs-base/base";


export class ViewNameResultItem implements RawEncode {
    constructor(
        public name_info: NameInfo,
        public name_state: NameState,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.name_info.raw_measure().unwrap();
        size += 1;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.name_info.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u8', this.name_state).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ViewNameResultItemDecoder implements RawDecode<ViewNameResultItem> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ViewNameResultItem, Uint8Array]>{
        let name_info;
        {
            const r = new NameInfoDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [name_info, buf] = r.unwrap();
        }

        let name_state;
        {
            const r = new NameStateDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [name_state, buf] = r.unwrap();
        }

        const ret:[ViewNameResultItem, Uint8Array] = [new ViewNameResultItem(name_info, name_state), buf];
        return Ok(ret);
    }

}
