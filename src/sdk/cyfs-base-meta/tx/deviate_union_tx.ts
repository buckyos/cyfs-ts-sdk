/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";

import{ Signature, SignatureDecoder } from '../../cyfs-base/crypto/public_key'
import { DeviateUnionBody } from './devite_union_body';
import { DeviateUnionBodyDecoder } from './devite_union_body';


export class DeviateUnionTx implements RawEncode {
    constructor(
        public body: DeviateUnionBody,
        public signs: Signature[],
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.body.raw_measure().unwrap();
        size += Vec.from(this.signs, (v:Signature)=>v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.body.raw_encode(buf).unwrap();
        buf = Vec.from(this.signs, (v:Signature)=>v).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class DeviateUnionTxDecoder implements RawDecode<DeviateUnionTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[DeviateUnionTx, Uint8Array]>{
        let body;
        {
            const r = new DeviateUnionBodyDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [body, buf] = r.unwrap();
        }

        let signs;
        {
            const r = new VecDecoder(new SignatureDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [signs, buf] = r.unwrap();
        }

        const ret:[DeviateUnionTx, Uint8Array] = [new DeviateUnionTx(body, signs.to((v:Signature)=>v)), buf];
        return Ok(ret);
    }

}
