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

import{ Signature, SignatureDecoder } from '../../cyfs-base/crypto/public_key'
import { CreateUnionBody } from './create_union_body';
import { CreateUnionBodyDecoder } from './create_union_body';


export class CreateUnionTx implements RawEncode {
    constructor(
        public body: CreateUnionBody,
        public signs: Signature[],
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.body.raw_measure().unwrap();
        size += Vec.from(this.signs, (v:Signature)=>v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.body.raw_encode(buf).unwrap();
        buf = Vec.from(this.signs, (v:Signature)=>v).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class CreateUnionTxDecoder implements RawDecode<CreateUnionTx> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[CreateUnionTx, Uint8Array]>{
        let body;
        {
            const r = new CreateUnionBodyDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [body, buf] = r.unwrap();
        }

        let signs;
        {
            const r = new VecDecoder(new SignatureDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [signs, buf] = r.unwrap();
        }

        const ret:[CreateUnionTx, Uint8Array] = [new CreateUnionTx(body, signs.to((v:Signature)=>v)), buf];
        return Ok(ret);
    }

}
