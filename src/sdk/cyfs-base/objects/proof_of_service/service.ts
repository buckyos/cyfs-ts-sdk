/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../base/bucky_number";
import { RawDecode, RawEncode } from "../../base/raw_encode";

import{ ServiceContract, ServiceContractDecoder } from './service_contract'
import{ ServiceReceipt, ServiceReceiptDecoder } from './service_receipt'

export class Service implements RawEncode {
    private readonly tag: number;
    private constructor(
        private contract?: ServiceContract,
        private receipt?: ServiceReceipt,
    ){
        if(contract) {
            this.tag = 0;
        } else if(receipt) {
            this.tag = 1;
        } else {
            this.tag = -1;
        }
    }

    static Contract(contract: ServiceContract): Service {
        return new Service(contract);
    }

    static Receipt(receipt: ServiceReceipt): Service {
        return new Service(undefined, receipt);
    }

    match<T>(visitor: {
        Contract?: (contract: ServiceContract)=>T,
        Receipt?: (receipt: ServiceReceipt)=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.Contract?.(this.contract!);
            case 1: return visitor.Receipt?.(this.receipt!);
            default: break;
        }
    }

    eq_type(rhs: Service):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            Contract:(contract)=>{ return this.contract!.raw_measure().unwrap();},
            Receipt:(receipt)=>{ return this.receipt!.raw_measure().unwrap();},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Contract:(contract)=>{return this.contract!.raw_encode(buf).unwrap();},
            Receipt:(receipt)=>{return this.receipt!.raw_encode(buf).unwrap();},
        })!;
        return Ok(buf);
    }
}

export class ServiceDecoder implements RawDecode<Service> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[Service, Uint8Array]>{
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
                const r = new ServiceContractDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let contract;
                [contract, buf] = r.unwrap();
                const ret:[Service, Uint8Array] =  [Service.Contract(contract), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new ServiceReceiptDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let receipt;
                [receipt, buf] = r.unwrap();
                const ret:[Service, Uint8Array] =  [Service.Receipt(receipt), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
