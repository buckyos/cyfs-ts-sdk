/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyBuffer, BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";

import { MetaExtensionType } from './meta_extension_type';
import { MetaExtensionTypeDecoder } from './meta_extension_type';


export class MetaExtensionTx implements RawEncode {
    constructor(
        public extension_id: MetaExtensionType,
        public tx_data: Uint8Array,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.extension_id.raw_measure().unwrap();
        size += new BuckyBuffer(this.tx_data).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.extension_id.raw_encode(buf).unwrap();
        buf = new BuckyBuffer(this.tx_data).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class MetaExtensionTxDecoder implements RawDecode<MetaExtensionTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[MetaExtensionTx, Uint8Array]>{
        let extension_id;
        {
            const r = new MetaExtensionTypeDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [extension_id, buf] = r.unwrap();
        }

        let tx_data;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [tx_data, buf] = r.unwrap();
        }

        const ret:[MetaExtensionTx, Uint8Array] = [new MetaExtensionTx(extension_id, tx_data.value()), buf];
        return Ok(ret);
    }

}
