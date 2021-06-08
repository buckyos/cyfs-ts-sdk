/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import { Ok, BuckyResult, BuckyError, BuckyErrorCode, Err } from "../../cyfs-base/base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyBuffer, BuckyBufferDecoder, BuckyFixedBuffer, BuckyFixedBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode, RawEncodePurpose } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";

export class ContractLog implements RawEncode {
    constructor (
        public address: ObjectId,
        public topics: Uint8Array[],
        public data: Uint8Array
    ) {}
    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        let size = 0;
        size += this.address.raw_measure().unwrap();
        size += Vec.from(this.topics, (v) => new BuckyFixedBuffer(v)).raw_measure().unwrap();
        size += new BuckyBuffer(this.data).raw_measure().unwrap();
        return Ok(size);
    }
    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        buf = this.address.raw_encode(buf).unwrap();
        buf = Vec.from(this.topics, (v) => new BuckyFixedBuffer(v)).raw_encode(buf).unwrap();
        buf = new BuckyBuffer(this.data).raw_encode(buf).unwrap();
        return Ok(buf)
    }
}

export class ContractLogDecoder implements RawDecode<ContractLog> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ContractLog, Uint8Array]> {
        let address;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [address, buf] = r.unwrap();
        }

        let topics;
        {
            const r = new VecDecoder(new BuckyFixedBufferDecoder(32)).raw_decode(buf);
            if(r.err){
                return r;
            }
            [topics, buf] = r.unwrap();
        }

        let data;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [data, buf] = r.unwrap();
        }

        const ret:[ContractLog, Uint8Array] = [new ContractLog(address, topics.to((v)=>v.value()), data.value()), buf];
        return Ok(ret);
    }

}

export class TxLog implements RawEncode {
    private readonly tag: number;
    private constructor(
        private contractLog?: ContractLog,
    ) {
        if (contractLog) {
            this.tag = 0;
        } else {
            console.error("TxLog create error");
            this.tag = -1;
        }
    }
    static ContractLog(contractLog: ContractLog): TxLog {
        return new TxLog(contractLog);
    }
    match<T>(visitor: {
        ContractLog?: (contractLog: ContractLog)=>T,
    }):T|undefined {
        switch (this.tag) {
            case 0: return visitor.ContractLog?.(this.contractLog!);
            default: break;
        }
    }
    eq_type(rhs: TxLog):boolean{
        return this.tag===rhs.tag;
    }
    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        let size = 0;
        size += 1; // tag
        size += this.match({
            ContractLog: (contractlog) => { return this.contractLog!.raw_measure().unwrap();},
        })!;
        return Ok(size)
    }
    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            ContractLog: (contractlog) => { return this.contractLog!.raw_encode(buf).unwrap();},
        })!;

        return Ok(buf);
    }
}

export class TxLogDecoder implements RawDecode<TxLog> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[TxLog, Uint8Array]> {
        let tag;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [tag, buf] = r.unwrap();
        }

        switch (tag.toNumber()) {
            case 0:
                {
                    const r = new ContractLogDecoder().raw_decode(buf);
                    if(r.err){
                        return r;
                    }
                    let contractLog;
                    [contractLog, buf] = r.unwrap();
                    const ret:[TxLog, Uint8Array] =  [TxLog.ContractLog(contractLog), buf];
                    return Ok(ret);
                }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}

export class Receipt implements RawEncode {
    constructor(
        public result: number,
        public fee_used: number,
        public logs: TxLog[],
        public address: Option<ObjectId>,
        public return_value: Option<Uint8Array>
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += new BuckyNumber('u32', this.result).raw_measure().unwrap();
        size += new BuckyNumber('u32', this.fee_used).raw_measure().unwrap();
        size += new Vec(this.logs).raw_measure().unwrap();
        size += new OptionEncoder(this.address).raw_measure().unwrap();
        size += OptionEncoder.from(this.return_value, (v) => new BuckyBuffer(v)).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u32', this.result).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.fee_used).raw_encode(buf).unwrap();
        buf = new Vec(this.logs).raw_encode(buf).unwrap();
        buf = new OptionEncoder(this.address).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.return_value, (v) => new BuckyBuffer(v)).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ReceiptDecoder implements RawDecode<Receipt> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[Receipt, Uint8Array]>{
        let result;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [result, buf] = r.unwrap();
        }

        let fee_used;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [fee_used, buf] = r.unwrap();
        }

        let logs;
        {
            const r = new VecDecoder(new TxLogDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [logs, buf] = r.unwrap();
        }

        let address;
        {
            const r = new OptionDecoder(new ObjectIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [address, buf] = r.unwrap();
        }

        let return_value;
        {
            const r = new OptionDecoder(new BuckyBufferDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [return_value, buf] = r.unwrap();
        }

        const ret:[Receipt, Uint8Array] = [new Receipt(result.toNumber(), fee_used.toNumber(), logs.value(), address.value(), return_value.to((v) => v.value())), buf];
        return Ok(ret);
    }

}
