/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import {
    SubDescType,
    DescTypeInfo, DescContent, DescContentDecoder,
    BodyContent, BodyContentDecoder,
    NamedObjectId, NamedObjectIdDecoder,
    NamedObjectDesc, NamedObjectDescDecoder,
    NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "../../cyfs-base/objects/object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../cyfs-base/base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { HashValue, HashValueDecoder } from "../../cyfs-base/crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";



export class InstanceContractTx implements RawEncode {
    constructor(
        public contract_id: ObjectId,
        public template_parms: Uint8Array,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.contract_id.raw_measure().unwrap();
        size += new BuckyBuffer(this.template_parms).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.contract_id.raw_encode(buf).unwrap();
        buf = new BuckyBuffer(this.template_parms).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class InstanceContractTxDecoder implements RawDecode<InstanceContractTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[InstanceContractTx, Uint8Array]>{
        let contract_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [contract_id, buf] = r.unwrap();
        }

        let template_parms;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [template_parms, buf] = r.unwrap();
        }

        const ret:[InstanceContractTx, Uint8Array] = [new InstanceContractTx(contract_id, template_parms.value()), buf];
        return Ok(ret);
    }

}
