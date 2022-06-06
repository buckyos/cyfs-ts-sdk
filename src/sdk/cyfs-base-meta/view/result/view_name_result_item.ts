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
} from "../../../cyfs-base/objects/object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../../cyfs-base/base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../../cyfs-base/base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../../cyfs-base/base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../../cyfs-base/base/bucky_buffer";
import { Vec, VecDecoder } from "../../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../../cyfs-base/base/raw_encode";
import { HashValue, HashValueDecoder } from "../../../cyfs-base/crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../../../cyfs-base/objects/object_id";

import{ NameInfo, NameInfoDecoder } from '../../../cyfs-base/name/name_info'
import{ NameState, NameStateDecoder } from '../../../cyfs-base/name/name_state'


export class ViewNameResultItem implements RawEncode {
    constructor(
        public name_info: NameInfo,
        public name_state: NameState,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += this.name_info.raw_measure().unwrap();
        size += this.name_state.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.name_info.raw_encode(buf).unwrap();
        buf = this.name_state.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ViewNameResultItemDecoder implements RawDecode<ViewNameResultItem> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[ViewNameResultItem, Uint8Array]>{
        let name_info;
        {
            const r = new NameInfoDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [name_info, buf] = r.unwrap();
        }

        let name_state;
        {
            const r = new NameStateDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [name_state, buf] = r.unwrap();
        }

        const ret:[ViewNameResultItem, Uint8Array] = [new ViewNameResultItem(name_info, name_state), buf];
        return Ok(ret);
    }

}
