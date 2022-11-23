/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";


export class ServiceAuthType implements RawEncode {
    private readonly tag: number;
    private constructor(
        private any?: number,
        private whitelist?: number,
        private blacklist?: number,
    ){
        if(any) {
            this.tag = 0;
        } else if(whitelist) {
            this.tag = 1;
        } else if(blacklist) {
            this.tag = 2;
        } else {
            this.tag = -1;
        }
    }

    static Any(): ServiceAuthType {
        return new ServiceAuthType(1);
    }

    static WhiteList(): ServiceAuthType {
        return new ServiceAuthType(undefined, 1);
    }

    static BlackList(): ServiceAuthType {
        return new ServiceAuthType(undefined, undefined, 1);
    }

    match<T>(visitor: {
        Any?: ()=>T,
        WhiteList?: ()=>T,
        BlackList?: ()=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.Any?.();
            case 1: return visitor.WhiteList?.();
            case 2: return visitor.BlackList?.();
            default: break;
        }
    }

    eq_type(rhs: ServiceAuthType):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            Any:()=>{ return 0;},
            WhiteList:()=>{ return 0;},
            BlackList:()=>{ return 0;},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Any:()=>{return buf;},
            WhiteList:()=>{return buf;},
            BlackList:()=>{return buf;},
        })!;
        return Ok(buf);
    }
}

export class ServiceAuthTypeDecoder implements RawDecode<ServiceAuthType> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ServiceAuthType, Uint8Array]>{
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
                const ret:[ServiceAuthType, Uint8Array] =  [ServiceAuthType.Any(), buf];
                return Ok(ret);
            }
            case 1:{
                const ret:[ServiceAuthType, Uint8Array] =  [ServiceAuthType.WhiteList(), buf];
                return Ok(ret);
            }
            case 2:{
                const ret:[ServiceAuthType, Uint8Array] =  [ServiceAuthType.BlackList(), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
