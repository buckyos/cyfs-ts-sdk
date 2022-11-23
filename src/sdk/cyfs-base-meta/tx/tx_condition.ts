/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";


export class TxCondition implements RawEncode {
    private readonly tag: number;
    private constructor(
        private empty?: number,
    ){
        if(empty) {
            this.tag = 0;
        } else {
            this.tag = -1;
        }
    }

    static Empty(): TxCondition {
        return new TxCondition(1);
    }

    match<T>(visitor: {
        Empty?: ()=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.Empty?.();
            default: break;
        }
    }

    eq_type(rhs: TxCondition):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            Empty:()=>{ return 0;},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Empty:()=>{return buf;},
        })!;
        return Ok(buf);
    }
}

export class TxConditionDecoder implements RawDecode<TxCondition> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[TxCondition, Uint8Array]>{
        let tag;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [tag, buf] = r.unwrap();
        }

        switch(tag.toNumber()){
            case 0:{
                const ret:[TxCondition, Uint8Array] =  [TxCondition.Empty(), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
