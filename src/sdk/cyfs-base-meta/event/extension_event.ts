/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyBuffer, BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";

import { MetaExtensionType } from '../extension/meta_extension_type';
import { MetaExtensionTypeDecoder } from '../extension/meta_extension_type';


export class ExtensionEvent implements RawEncode {
    constructor(
        public extension_type: MetaExtensionType,
        public data: Uint8Array,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.extension_type.raw_measure().unwrap();
        size += new BuckyBuffer(this.data).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.extension_type.raw_encode(buf).unwrap();
        buf = new BuckyBuffer(this.data).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ExtensionEventDecoder implements RawDecode<ExtensionEvent> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ExtensionEvent, Uint8Array]>{
        let extension_type;
        {
            const r = new MetaExtensionTypeDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [extension_type, buf] = r.unwrap();
        }

        let data;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [data, buf] = r.unwrap();
        }

        const ret:[ExtensionEvent, Uint8Array] = [new ExtensionEvent(extension_type, data.value()), buf];
        return Ok(ret);
    }

}
