/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/
import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyBuffer, BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";

import { ViewBalanceResult } from './result/view_balance_result';
import { ViewBalanceResultDecoder } from './result/view_balance_result';
import { ViewNameResult } from './result/view_name_result';
import { ViewNameResultDecoder } from './result/view_name_result';
import { SavedMetaObject } from '../tx/saved_meta_object';
import { SavedMetaObjectDecoder } from '../tx/saved_meta_object';
import { ChainStatus } from './chain_status';
import { ChainStatusDecoder } from './chain_status';
import { Block } from '../block/block';
import { BlockDecoder } from '../block/block';
import { TxFullInfo } from './tx_full_info';
import { TxFullInfoDecoder } from './tx_full_info';
import { ViewContractResult, ViewContractResultDecoder } from "./result/view_contract_result";
import { ViewLogResult, ViewLogResultDecoder } from "./result/view_log_result";
import {
    NFTLargestBuyValue,
    NFTLargestBuyValueDecoder,
    ViewNFTBuyListResult,
    ViewNFTBuyListResultDecoder
} from "./result/view_nft";
import {ViewBenefi} from "./method/view_beneficiary";
import {ViewBenefiResult, ViewBenefiResultDecoder} from "./result/view_beneficiary_result";

export class ViewResponse implements RawEncode {
    private readonly tag: number;
    private constructor(
        private viewbalance?: ViewBalanceResult,
        private viewname?: ViewNameResult,
        private viewdesc?: SavedMetaObject,
        private viewraw?: Uint8Array,
        private viewstatus?: ChainStatus,
        private viewblock?: Block,
        private viewtx?: TxFullInfo,
        private viewcontract?: ViewContractResult,
        private viewBenefi?: ViewBenefi,
        private viewlog?: ViewLogResult,
        private viewNFTApplyBuyList?: ViewNFTBuyListResult,
        private viewNFTBidList?: ViewNFTBuyListResult,
        private viewNFTLargestBuyValue?: NFTLargestBuyValue
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
        } else if(viewBenefi) {
            this.tag = 8;
        } else if(viewlog) {
            this.tag = 9;
        } else if(viewNFTApplyBuyList) {
            this.tag = 11;
        } else if(viewNFTBidList) {
            this.tag = 12;
        } else if(viewNFTLargestBuyValue) {
            this.tag = 13;
        } else {
            this.tag = -1;
        }
    }

    static ViewBalance(viewbalance: ViewBalanceResult): ViewResponse {
        return new ViewResponse(viewbalance);
    }

    static ViewName(viewname: ViewNameResult): ViewResponse {
        return new ViewResponse(undefined, viewname);
    }

    static ViewDesc(viewdesc: SavedMetaObject): ViewResponse {
        return new ViewResponse(undefined, undefined, viewdesc);
    }

    static ViewRaw(viewraw: Uint8Array): ViewResponse {
        return new ViewResponse(undefined, undefined, undefined, viewraw);
    }

    static ViewStatus(viewstatus: ChainStatus): ViewResponse {
        return new ViewResponse(undefined, undefined, undefined, undefined, viewstatus);
    }

    static ViewBlock(viewblock: Block): ViewResponse {
        return new ViewResponse(undefined, undefined, undefined, undefined, undefined, viewblock);
    }

    static ViewTx(viewtx: TxFullInfo): ViewResponse {
        return new ViewResponse(undefined, undefined, undefined, undefined, undefined, undefined, viewtx);
    }

    static ViewContract(viewtx: ViewContractResult): ViewResponse {
        return new ViewResponse(undefined, undefined, undefined, undefined, undefined, undefined, undefined, viewtx);
    }

    static ViewBenefi(viewtx: ViewBenefiResult): ViewResponse {
        return new ViewResponse(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, viewtx);
    }

    static ViewLog(viewtx: ViewLogResult): ViewResponse {
        return new ViewResponse(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, viewtx);
    }

    static ViewNFTApplyBuyList(viewtx: ViewNFTBuyListResult): ViewResponse {
        return new ViewResponse(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            viewtx);
    }

    static ViewNFTBidList(viewtx: ViewNFTBuyListResult): ViewResponse {
        return new ViewResponse(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            viewtx);
    }


    static ViewNFTLargestBuy(viewtx: NFTLargestBuyValue): ViewResponse {
        return new ViewResponse(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            viewtx);
    }

    match<T>(visitor: {
        ViewBalance?: (viewbalance: ViewBalanceResult)=>T,
        ViewName?: (viewname: ViewNameResult)=>T,
        ViewDesc?: (viewdesc: SavedMetaObject)=>T,
        ViewRaw?: (viewraw: Uint8Array)=>T,
        ViewStatus?: (viewstatus: ChainStatus)=>T,
        ViewBlock?: (viewblock: Block)=>T,
        ViewTx?: (viewtx: TxFullInfo)=>T,
        ViewContract?: (viewtx: ViewContractResult)=>T,
        ViewBenefi?: (viewtx: ViewBenefiResult)=>T,
        ViewLog?: (viewtx: ViewLogResult)=>T,
        ViewApplyBuyList?: (viewtx: ViewNFTBuyListResult)=>T,
        ViewBidList?: (viewtx: ViewNFTBuyListResult)=>T,
        ViewLargestBuy?: (viewtx: NFTLargestBuyValue)=>T
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.ViewBalance?.(this.viewbalance!);
            case 1: return visitor.ViewName?.(this.viewname!);
            case 2: return visitor.ViewDesc?.(this.viewdesc!);
            case 3: return visitor.ViewRaw?.(this.viewraw!);
            case 4: return visitor.ViewStatus?.(this.viewstatus!);
            case 5: return visitor.ViewBlock?.(this.viewblock!);
            case 6: return visitor.ViewTx?.(this.viewtx!);
            case 7: return visitor.ViewContract?.(this.viewcontract!);
            case 8: return visitor.ViewBenefi?.(this.viewBenefi!);
            case 9: return visitor.ViewLog?.(this.viewlog!);
            case 11: return visitor.ViewApplyBuyList?.(this.viewNFTApplyBuyList!);
            case 12: return visitor.ViewBidList?.(this.viewNFTBidList!);
            case 13: return visitor.ViewLargestBuy?.(this.viewNFTLargestBuyValue!);
            default: break;
        }
    }

    eq_type(rhs: ViewResponse):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            ViewBalance:(viewbalance)=>{ return this.viewbalance!.raw_measure().unwrap();},
            ViewName:(viewname)=>{ return this.viewname!.raw_measure().unwrap();},
            ViewDesc:(viewdesc)=>{ return this.viewdesc!.raw_measure().unwrap();},
            ViewRaw:(viewraw)=>{ return new BuckyBuffer(this.viewraw!).raw_measure().unwrap();},
            ViewStatus:(viewstatus)=>{ return this.viewstatus!.raw_measure().unwrap();},
            ViewBlock:(viewblock)=>{ return this.viewblock!.raw_measure().unwrap();},
            ViewTx:(viewtx)=>{ return this.viewtx!.raw_measure().unwrap();},
            ViewContract:(viewtx)=>{ return this.viewcontract!.raw_measure().unwrap();},
            ViewBenefi:(viewtx)=>{return this.viewBenefi!.raw_measure().unwrap();},
            ViewLog:(viewtx)=>{ return viewtx.raw_measure().unwrap();},
            ViewApplyBuyList:(viewtx) => {return viewtx.raw_measure().unwrap()},
            ViewBidList:(viewtx) => {return viewtx.raw_measure().unwrap()},
            ViewLargestBuy:(viewtx) => {return viewtx.raw_measure().unwrap()}
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            ViewBalance:(viewbalance)=>{return this.viewbalance!.raw_encode(buf).unwrap();},
            ViewName:(viewname)=>{return this.viewname!.raw_encode(buf).unwrap();},
            ViewDesc:(viewdesc)=>{return this.viewdesc!.raw_encode(buf).unwrap();},
            ViewRaw:(viewraw)=>{return new BuckyBuffer(this.viewraw!).raw_encode(buf).unwrap();},
            ViewStatus:(viewstatus)=>{return this.viewstatus!.raw_encode(buf).unwrap();},
            ViewBlock:(viewblock)=>{return this.viewblock!.raw_encode(buf).unwrap();},
            ViewTx:(viewtx)=>{return this.viewtx!.raw_encode(buf).unwrap();},
            ViewContract:(viewtx)=>{return this.viewcontract!.raw_encode(buf).unwrap();},
            ViewBenefi:(viewtx)=>{return this.viewBenefi!.raw_encode(buf).unwrap();},
            ViewLog:(viewtx)=>{return viewtx.raw_encode(buf).unwrap();},
            ViewApplyBuyList:(viewtx) => {return viewtx.raw_encode(buf).unwrap()},
            ViewBidList:(viewtx) => {return viewtx.raw_encode(buf).unwrap()},
            ViewLargestBuy:(viewtx) => {return viewtx.raw_encode(buf).unwrap()}
        })!;
        return Ok(buf);
    }
}

export class ViewResponseDecoder implements RawDecode<ViewResponse> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ViewResponse, Uint8Array]>{
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
                const r = new ViewBalanceResultDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewbalance;
                [viewbalance, buf] = r.unwrap();
                const ret:[ViewResponse, Uint8Array] =  [ViewResponse.ViewBalance(viewbalance), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new ViewNameResultDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewname;
                [viewname, buf] = r.unwrap();
                const ret:[ViewResponse, Uint8Array] =  [ViewResponse.ViewName(viewname), buf];
                return Ok(ret);
            }
            case 2:{
                const r = new SavedMetaObjectDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewdesc;
                [viewdesc, buf] = r.unwrap();
                const ret:[ViewResponse, Uint8Array] =  [ViewResponse.ViewDesc(viewdesc), buf];
                return Ok(ret);
            }
            case 3:{
                const r = new BuckyBufferDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewraw;
                [viewraw, buf] = r.unwrap();
                const ret:[ViewResponse, Uint8Array] =  [ViewResponse.ViewRaw(viewraw.value()), buf];
                return Ok(ret);
            }
            case 4:{
                const r = new ChainStatusDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewstatus;
                [viewstatus, buf] = r.unwrap();
                const ret:[ViewResponse, Uint8Array] =  [ViewResponse.ViewStatus(viewstatus), buf];
                return Ok(ret);
            }
            case 5:{
                const r = new BlockDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewblock;
                [viewblock, buf] = r.unwrap();
                const ret:[ViewResponse, Uint8Array] =  [ViewResponse.ViewBlock(viewblock), buf];
                return Ok(ret);
            }
            case 6:{
                const r = new TxFullInfoDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewtx;
                [viewtx, buf] = r.unwrap();
                const ret:[ViewResponse, Uint8Array] =  [ViewResponse.ViewTx(viewtx), buf];
                return Ok(ret);
            }
            case 7:{
                const r = new ViewContractResultDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewtx;
                [viewtx, buf] = r.unwrap();
                const ret:[ViewResponse, Uint8Array] =  [ViewResponse.ViewContract(viewtx), buf];
                return Ok(ret);
            }
            case 8:{
                const r = new ViewBenefiResultDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewtx;
                [viewtx, buf] = r.unwrap();
                const ret:[ViewResponse, Uint8Array] =  [ViewResponse.ViewBenefi(viewtx), buf];
                return Ok(ret);
            }
            case 9:{
                const r = new ViewLogResultDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewtx;
                [viewtx, buf] = r.unwrap();
                const ret:[ViewResponse, Uint8Array] =  [ViewResponse.ViewLog(viewtx), buf];
                return Ok(ret);
            }
            case 11:{
                const r = new ViewNFTBuyListResultDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewtx;
                [viewtx, buf] = r.unwrap();
                const ret:[ViewResponse, Uint8Array] =  [ViewResponse.ViewNFTApplyBuyList(viewtx), buf];
                return Ok(ret);
            }
            case 12:{
                const r = new ViewNFTBuyListResultDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewtx;
                [viewtx, buf] = r.unwrap();
                const ret:[ViewResponse, Uint8Array] =  [ViewResponse.ViewNFTBidList(viewtx), buf];
                return Ok(ret);
            }
            case 13:{
                const r = new NFTLargestBuyValueDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let viewtx;
                [viewtx, buf] = r.unwrap();
                const ret:[ViewResponse, Uint8Array] =  [ViewResponse.ViewNFTLargestBuy(viewtx), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE, ViewResponseDecoder"));
        }
    }

}
