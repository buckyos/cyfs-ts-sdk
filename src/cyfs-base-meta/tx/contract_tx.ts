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



export class ContractTx implements RawEncode {
    constructor(
        public instance_id: ObjectId,
        public func_name: string,
        public parm_body: Uint8Array,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.instance_id.raw_measure().unwrap();
        size += new BuckyString(this.func_name).raw_measure().unwrap();
        size += new BuckyBuffer(this.parm_body).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.instance_id.raw_encode(buf).unwrap();
        buf = new BuckyString(this.func_name).raw_encode(buf).unwrap();
        buf = new BuckyBuffer(this.parm_body).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ContractTxDecoder implements RawDecode<ContractTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ContractTx, Uint8Array]>{
        let instance_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [instance_id, buf] = r.unwrap();
        }

        let func_name;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [func_name, buf] = r.unwrap();
        }

        let parm_body;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [parm_body, buf] = r.unwrap();
        }

        const ret:[ContractTx, Uint8Array] = [new ContractTx(instance_id, func_name.value(), parm_body.value()), buf];
        return Ok(ret);
    }

}
