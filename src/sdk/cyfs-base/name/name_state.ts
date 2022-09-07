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
} from "../objects/object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../base/bucky_buffer";
import { Vec, VecDecoder } from "../base/vec";
import { RawDecode, RawEncode } from "../base/raw_encode";
import { HashValue, HashValueDecoder } from "../crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../objects/object_id";

export enum NameState {
    Normal = 0,
    Lock = 1,
    Auction = 2,            //正常拍卖
    ArrearsAuction = 3,     //欠费拍卖
    ArrearsAuctionWait = 4, //欠费拍卖确认
    ActiveAuction = 5,      //主动拍卖
}

export class NameStateDecoder implements RawDecode<NameState> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[NameState, Uint8Array]>{
        let val;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [val, buf] = r.unwrap();
        }

        return Ok([val as unknown as NameState, buf]);
    }
}
