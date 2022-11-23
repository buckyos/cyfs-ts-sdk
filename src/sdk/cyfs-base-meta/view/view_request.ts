/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";

import { ViewBlockEnum } from './view_block_enum';
import { ViewBlockEnumDecoder } from './view_block_enum';
import { ViewMethodEnum } from './view_method_enum';
import { ViewMethodEnumDecoder } from './view_method_enum';


export class ViewRequest implements RawEncode {
    constructor(
        public block: ViewBlockEnum,
        public method: ViewMethodEnum,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.block.raw_measure().unwrap();
        size += this.method.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.block.raw_encode(buf).unwrap();
        buf = this.method.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ViewRequestDecoder implements RawDecode<ViewRequest> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ViewRequest, Uint8Array]>{
        let block;
        {
            const r = new ViewBlockEnumDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [block, buf] = r.unwrap();
        }

        let method;
        {
            const r = new ViewMethodEnumDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [method, buf] = r.unwrap();
        }

        const ret:[ViewRequest, Uint8Array] = [new ViewRequest(block, method), buf];
        return Ok(ret);
    }

}
