import { Err, Ok, Result } from "ts-results";
import { BuckyError, BuckyErrorCode } from "../..";
import { BuckyNumber, BuckyNumberDecoder } from "./bucky_number";
import { RawDecode, RawEncode } from "./raw_encode";
import { BuckyResult } from "./results";


export class BuckyResultEncoder<T extends RawEncode, E extends RawEncode> implements RawEncode {
    private tag: number;
    constructor(public result: Result<T,E>){
        if(result.err){
            this.tag = 0;
        }else{
            this.tag = 1;
        }
    }
    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 1; // tag
        if(this.result.err){
            this.result.mapErr((e: E)=>{
                size += e.raw_measure().unwrap();
                return e;
            }).unwrap();
        }else{
            size += this.result.map((v: T)=>{
                return v.raw_measure().unwrap();
            }).unwrap();
        }
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap();
        if(this.result.err){
            this.result.mapErr((e: E)=>{
                buf = e.raw_encode(buf).unwrap();
                return e;
            }).unwrap();
        }else{
            buf = this.result.unwrap().raw_encode(buf).unwrap();
        }
        return Ok(buf);
    }
}

export class BuckyResultDecoder<T extends RawEncode, D extends RawDecode<T>, E extends RawEncode, ED extends RawDecode<E>> implements RawDecode<Result<T,E>>{
    constructor(public decoder: D, public error_decoder: ED){
        //
    }
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[Result<T,E>, Uint8Array]>{
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
                let obj;
                {
                    const r = this.decoder.raw_decode(buf);
                    if(r.err){
                        return r;
                    }
                    [obj, buf] = r.unwrap();
                }

                const ret:[Result<T, E>, Uint8Array] = [Ok(obj), buf];

                return Ok(ret);
            }
            case 1:{
                let err;
                {
                    const r = this.error_decoder.raw_decode(buf);
                    if(r.err){
                        return r;
                    }
                    [err, buf] = r.unwrap();
                }
                const ret:[Result<T, E>, Uint8Array] = [Err(err), buf];
                return Ok(ret);
            }
            default:{
                return Err(new BuckyError(BuckyErrorCode.Failed, "Decode BuckyResult failed"));
            }
        }
    }
}