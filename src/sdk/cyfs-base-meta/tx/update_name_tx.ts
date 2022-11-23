/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";

import{ NameInfo, NameInfoDecoder } from '../../cyfs-base/name/name_info'


export class UpdateNameTx implements RawEncode {
    constructor(
        public name: string,
        public info: NameInfo,
        public write_flag: number,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyString(this.name).raw_measure().unwrap();
        size += this.info.raw_measure().unwrap();
        size += new BuckyNumber('u8', this.write_flag).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyString(this.name).raw_encode(buf).unwrap();
        buf = this.info.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u8', this.write_flag).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class UpdateNameTxDecoder implements RawDecode<UpdateNameTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[UpdateNameTx, Uint8Array]>{
        let name;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [name, buf] = r.unwrap();
        }

        let info;
        {
            const r = new NameInfoDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [info, buf] = r.unwrap();
        }

        let write_flag;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [write_flag, buf] = r.unwrap();
        }

        const ret:[UpdateNameTx, Uint8Array] = [new UpdateNameTx(name.value(), info, write_flag.toNumber()), buf];
        return Ok(ret);
    }

}
