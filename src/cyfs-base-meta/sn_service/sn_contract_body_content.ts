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

import { ServiceAuthType } from './service_auth_type';
import { ServiceAuthTypeDecoder } from './service_auth_type';


export class SNContractBodyContent implements RawEncode {
    constructor(
        public auth_type: ServiceAuthType,
        public list: ObjectId[],
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.auth_type.raw_measure().unwrap();
        size += Vec.from(this.list, (v:ObjectId)=>v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.auth_type.raw_encode(buf).unwrap();
        buf = Vec.from(this.list, (v:ObjectId)=>v).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class SNContractBodyContentDecoder implements RawDecode<SNContractBodyContent> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[SNContractBodyContent, Uint8Array]>{
        let auth_type;
        {
            const r = new ServiceAuthTypeDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [auth_type, buf] = r.unwrap();
        }

        let list;
        {
            const r = new VecDecoder(new ObjectIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [list, buf] = r.unwrap();
        }

        const ret:[SNContractBodyContent, Uint8Array] = [new SNContractBodyContent(auth_type, list.to((v:ObjectId)=>v)), buf];
        return Ok(ret);
    }

}
