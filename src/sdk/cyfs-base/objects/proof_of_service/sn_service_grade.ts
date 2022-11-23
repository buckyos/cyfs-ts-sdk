/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../base/bucky_number";
import { RawDecode, RawEncode } from "../../base/raw_encode";


export class SnServiceGrade implements RawEncode {
    private readonly tag: number;
    private constructor(
        private none?: number,
        private discard?: number,
        private passable?: number,
        private normal?: number,
        private fine?: number,
        private wonderfull?: number,
    ){
        if(none) {
            this.tag = 0;
        } else if(discard) {
            this.tag = 1;
        } else if(passable) {
            this.tag = 2;
        } else if(normal) {
            this.tag = 3;
        } else if(fine) {
            this.tag = 4;
        } else if(wonderfull) {
            this.tag = 5;
        } else {
            this.tag = -1;
        }
    }

    static None(): SnServiceGrade {
        return new SnServiceGrade(1);
    }

    static Discard(): SnServiceGrade {
        return new SnServiceGrade(undefined, 1);
    }

    static Passable(): SnServiceGrade {
        return new SnServiceGrade(undefined, undefined, 1);
    }

    static Normal(): SnServiceGrade {
        return new SnServiceGrade(undefined, undefined, undefined, 1);
    }

    static Fine(): SnServiceGrade {
        return new SnServiceGrade(undefined, undefined, undefined, undefined, 1);
    }

    static Wonderfull(): SnServiceGrade {
        return new SnServiceGrade(undefined, undefined, undefined, undefined, undefined, 1);
    }

    match<T>(visitor: {
        None?: ()=>T,
        Discard?: ()=>T,
        Passable?: ()=>T,
        Normal?: ()=>T,
        Fine?: ()=>T,
        Wonderfull?: ()=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.None?.();
            case 1: return visitor.Discard?.();
            case 2: return visitor.Passable?.();
            case 3: return visitor.Normal?.();
            case 4: return visitor.Fine?.();
            case 5: return visitor.Wonderfull?.();
            default: break;
        }
    }

    eq_type(rhs: SnServiceGrade):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            None:()=>{ return 0;},
            Discard:()=>{ return 0;},
            Passable:()=>{ return 0;},
            Normal:()=>{ return 0;},
            Fine:()=>{ return 0;},
            Wonderfull:()=>{ return 0;},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            None:()=>{return buf;},
            Discard:()=>{return buf;},
            Passable:()=>{return buf;},
            Normal:()=>{return buf;},
            Fine:()=>{return buf;},
            Wonderfull:()=>{return buf;},
        })!;
        return Ok(buf);
    }
}

export class SnServiceGradeDecoder implements RawDecode<SnServiceGrade> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[SnServiceGrade, Uint8Array]>{
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
                const ret:[SnServiceGrade, Uint8Array] =  [SnServiceGrade.None(), buf];
                return Ok(ret);
            }
            case 1:{
                const ret:[SnServiceGrade, Uint8Array] =  [SnServiceGrade.Discard(), buf];
                return Ok(ret);
            }
            case 2:{
                const ret:[SnServiceGrade, Uint8Array] =  [SnServiceGrade.Passable(), buf];
                return Ok(ret);
            }
            case 3:{
                const ret:[SnServiceGrade, Uint8Array] =  [SnServiceGrade.Normal(), buf];
                return Ok(ret);
            }
            case 4:{
                const ret:[SnServiceGrade, Uint8Array] =  [SnServiceGrade.Fine(), buf];
                return Ok(ret);
            }
            case 5:{
                const ret:[SnServiceGrade, Uint8Array] =  [SnServiceGrade.Wonderfull(), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
