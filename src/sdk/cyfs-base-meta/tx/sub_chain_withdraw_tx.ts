/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyBuffer, BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";



export class SubChainWithdrawTx implements RawEncode {
    constructor(
        public subchain_id: ObjectId,
        public withdraw_tx: Uint8Array,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.subchain_id.raw_measure().unwrap();
        size += new BuckyBuffer(this.withdraw_tx).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.subchain_id.raw_encode(buf).unwrap();
        buf = new BuckyBuffer(this.withdraw_tx).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class SubChainWithdrawTxDecoder implements RawDecode<SubChainWithdrawTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[SubChainWithdrawTx, Uint8Array]>{
        let subchain_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [subchain_id, buf] = r.unwrap();
        }

        let withdraw_tx;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [withdraw_tx, buf] = r.unwrap();
        }

        const ret:[SubChainWithdrawTx, Uint8Array] = [new SubChainWithdrawTx(subchain_id, withdraw_tx.value()), buf];
        return Ok(ret);
    }

}
