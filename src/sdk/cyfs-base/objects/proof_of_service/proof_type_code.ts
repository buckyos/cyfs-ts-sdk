/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../base/bucky_number";
import { RawDecode, RawEncode } from "../../base/raw_encode";

import { ProofTypeCodeExt } from './proof_type_code_ext'

export class ProofTypeCode implements RawEncode {
    private readonly tag: number;
    private m_ext?: ProofTypeCodeExt;

    private constructor(
        private dsgstorage?: number,
        private dsgstoragecheck?: number,
        private dsgmerkleproof?: number,
    ){
        if(dsgstorage) {
            this.tag = 0;
        } else if(dsgstoragecheck) {
            this.tag = 1;
        } else if(dsgmerkleproof) {
            this.tag = 2;
        } else {
            this.tag = -1;
        }
    }

    static DSGStorage(): ProofTypeCode {
        return new ProofTypeCode(1);
    }

    static DSGStorageCheck(): ProofTypeCode {
        return new ProofTypeCode(undefined, 1);
    }

    static DSGMerkleProof(): ProofTypeCode {
        return new ProofTypeCode(undefined, undefined, 1);
    }

    match<T>(visitor: {
        DSGStorage?: ()=>T,
        DSGStorageCheck?: ()=>T,
        DSGMerkleProof?: ()=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.DSGStorage?.();
            case 1: return visitor.DSGStorageCheck?.();
            case 2: return visitor.DSGMerkleProof?.();
            default: break;
        }
    }

    eq_type(rhs: ProofTypeCode):boolean{
        return this.tag===rhs.tag;
    }

    ext():ProofTypeCodeExt{
        if(this.m_ext==null){
            this.m_ext = new ProofTypeCodeExt(this);
        }
        return this.m_ext;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            DSGStorage:()=>{ return 0;},
            DSGStorageCheck:()=>{ return 0;},
            DSGMerkleProof:()=>{ return 0;},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            DSGStorage:()=>{return buf;},
            DSGStorageCheck:()=>{return buf;},
            DSGMerkleProof:()=>{return buf;},
        })!;
        return Ok(buf);
    }
}

export class ProofTypeCodeDecoder implements RawDecode<ProofTypeCode> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ProofTypeCode, Uint8Array]>{
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
                const ret:[ProofTypeCode, Uint8Array] =  [ProofTypeCode.DSGStorage(), buf];
                return Ok(ret);
            }
            case 1:{
                const ret:[ProofTypeCode, Uint8Array] =  [ProofTypeCode.DSGStorageCheck(), buf];
                return Ok(ret);
            }
            case 2:{
                const ret:[ProofTypeCode, Uint8Array] =  [ProofTypeCode.DSGMerkleProof(), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
