/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/
import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";

import { ViewBalanceMethod } from './method/view_balance_method';
import { ViewBalanceMethodDecoder } from './method/view_balance_method';
import { ViewNameMethod } from './method/view_name_method';
import { ViewNameMethodDecoder } from './method/view_name_method';
import { ViewDescMethod } from './method/view_desc_method';
import { ViewDescMethodDecoder } from './method/view_desc_method';
import { ViewRawMethod } from './method/view_raw_method';
import { ViewRawMethodDecoder } from './method/view_raw_method';
import { ViewContract, ViewContractDecoder } from "./method/view_contract";

export class ViewMethodEnum implements RawEncode {
    private readonly tag: number;
    private constructor(
        private viewbalance?: ViewBalanceMethod,
        private viewname?: ViewNameMethod,
        private viewdesc?: ViewDescMethod,
        private viewraw?: ViewRawMethod,
        private viewstatus?: number,
        private viewblock?: number,
        private viewtx?: ObjectId,
        private viewcontract?: ViewContract,
    ){
        if(viewbalance) {
            this.tag = 0;
        } else if(viewname) {
            this.tag = 1;
        } else if(viewdesc) {
            this.tag = 2;
        } else if(viewraw) {
            this.tag = 3;
        } else if(viewstatus) {
            this.tag = 4;
        } else if(viewblock) {
            this.tag = 5;
        } else if(viewtx) {
            this.tag = 6;
        } else if(viewcontract) {
            this.tag = 7;
        } else {
            this.tag = -1;
        }
    }

    static ViewBalance(viewbalance: ViewBalanceMethod): ViewMethodEnum {
        return new ViewMethodEnum(viewbalance);
    }

    static ViewName(viewname: ViewNameMethod): ViewMethodEnum {
        return new ViewMethodEnum(undefined, viewname);
    }

    static ViewDesc(viewdesc: ViewDescMethod): ViewMethodEnum {
        return new ViewMethodEnum(undefined, undefined, viewdesc);
    }

    static ViewRaw(viewraw: ViewRawMethod): ViewMethodEnum {
        return new ViewMethodEnum(undefined, undefined, undefined, viewraw);
    }

    static ViewStatus(): ViewMethodEnum {
        return new ViewMethodEnum(undefined, undefined, undefined, undefined, 1);
    }

    static ViewBlock(): ViewMethodEnum {
        return new ViewMethodEnum(undefined, undefined, undefined, undefined, undefined, 1);
    }

    static ViewTx(viewtx: ObjectId): ViewMethodEnum {
        return new ViewMethodEnum(undefined, undefined, undefined, undefined, undefined, undefined, viewtx);
    }

    static ViewContract(viewtx: ViewContract): ViewMethodEnum {
        return new ViewMethodEnum(undefined, undefined, undefined, undefined, undefined, undefined, undefined, viewtx);
    }

    match<T>(visitor: {
        ViewBalance?: (viewbalance: ViewBalanceMethod)=>T,
        ViewName?: (viewname: ViewNameMethod)=>T,
        ViewDesc?: (viewdesc: ViewDescMethod)=>T,
        ViewRaw?: (viewraw: ViewRawMethod)=>T,
        ViewStatus?: ()=>T,
        ViewBlock?: ()=>T,
        ViewTx?: (viewtx: ObjectId)=>T,
        ViewContract?: (tx: ViewContract)=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.ViewBalance?.(this.viewbalance!);
            case 1: return visitor.ViewName?.(this.viewname!);
            case 2: return visitor.ViewDesc?.(this.viewdesc!);
            case 3: return visitor.ViewRaw?.(this.viewraw!);
            case 4: return visitor.ViewStatus?.();
            case 5: return visitor.ViewBlock?.();
            case 6: return visitor.ViewTx?.(this.viewtx!);
            case 7: return visitor.ViewContract?.(this.viewcontract!);
            default: break;
        }
    }

    eq_type(rhs: ViewMethodEnum):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            ViewBalance:(viewbalance)=>{ return this.viewbalance!.raw_measure().unwrap();},
            ViewName:(viewname)=>{ return this.viewname!.raw_measure().unwrap();},
            ViewDesc:(viewdesc)=>{ return this.viewdesc!.raw_measure().unwrap();},
            ViewRaw:(viewraw)=>{ return this.viewraw!.raw_measure().unwrap();},
            ViewStatus:()=>{ return 0;},
            ViewBlock:()=>{ return 0;},
            ViewTx:(viewtx)=>{ return this.viewtx!.raw_measure().unwrap();},
            ViewContract:(viewtx)=>{ return this.viewcontract!.raw_measure().unwrap();},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            ViewBalance:(viewbalance)=>{return this.viewbalance!.raw_encode(buf).unwrap();},
            ViewName:(viewname)=>{return this.viewname!.raw_encode(buf).unwrap();},
            ViewDesc:(viewdesc)=>{return this.viewdesc!.raw_encode(buf).unwrap();},
            ViewRaw:(viewraw)=>{return this.viewraw!.raw_encode(buf).unwrap();},
            ViewStatus:()=>{return buf;},
            ViewBlock:()=>{return buf;},
            ViewTx:(viewtx)=>{return this.viewtx!.raw_encode(buf).unwrap();},
            ViewContract:(viewtx)=>{return this.viewcontract!.raw_encode(buf).unwrap();},
        })!;
        return Ok(buf);
    }
}

export class ViewMethodEnumDecoder implements RawDecode<ViewMethodEnum> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ViewMethodEnum, Uint8Array]>{
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
                const r = new ViewBalanceMethodDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewbalance;
                [viewbalance, buf] = r.unwrap();
                const ret:[ViewMethodEnum, Uint8Array] =  [ViewMethodEnum.ViewBalance(viewbalance), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new ViewNameMethodDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewname;
                [viewname, buf] = r.unwrap();
                const ret:[ViewMethodEnum, Uint8Array] =  [ViewMethodEnum.ViewName(viewname), buf];
                return Ok(ret);
            }
            case 2:{
                const r = new ViewDescMethodDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewdesc;
                [viewdesc, buf] = r.unwrap();
                const ret:[ViewMethodEnum, Uint8Array] =  [ViewMethodEnum.ViewDesc(viewdesc), buf];
                return Ok(ret);
            }
            case 3:{
                const r = new ViewRawMethodDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewraw;
                [viewraw, buf] = r.unwrap();
                const ret:[ViewMethodEnum, Uint8Array] =  [ViewMethodEnum.ViewRaw(viewraw), buf];
                return Ok(ret);
            }
            case 4:{
                const ret:[ViewMethodEnum, Uint8Array] =  [ViewMethodEnum.ViewStatus(), buf];
                return Ok(ret);
            }
            case 5:{
                const ret:[ViewMethodEnum, Uint8Array] =  [ViewMethodEnum.ViewBlock(), buf];
                return Ok(ret);
            }
            case 6:{
                const r = new ObjectIdDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewtx;
                [viewtx, buf] = r.unwrap();
                const ret:[ViewMethodEnum, Uint8Array] =  [ViewMethodEnum.ViewTx(viewtx), buf];
                return Ok(ret);
            }
            case 7:{
                const r = new ViewContractDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewtx;
                [viewtx, buf] = r.unwrap();
                const ret:[ViewMethodEnum, Uint8Array] =  [ViewMethodEnum.ViewContract(viewtx), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE, ViewMethodEnumDecoder"));
        }
    }

}
