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

import { CoinTokenId, CoinTokenIdDecoder } from '../../tx/coin_token_id'
import JSBI from 'jsbi';


export class ViewSingleBalanceResultItem implements RawEncode {
    constructor(
        public id: CoinTokenId,
        public result: JSBI,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.id.raw_measure().unwrap();
        size += new BuckyNumber('i64', this.result).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.id.raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.result).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ViewSingleBalanceResultItemDecoder implements RawDecode<ViewSingleBalanceResultItem> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ViewSingleBalanceResultItem, Uint8Array]> {
        let id;
        {
            const r = new CoinTokenIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [id, buf] = r.unwrap();
        }

        let result;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [result, buf] = r.unwrap();
        }

        const ret: [ViewSingleBalanceResultItem, Uint8Array] = [new ViewSingleBalanceResultItem(id, result.toBigInt()), buf];
        return Ok(ret);
    }

}
