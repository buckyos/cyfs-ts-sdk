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
import JSBI from 'jsbi';


export class BidNameTx implements RawEncode {
    constructor(
        public name: string,
        public owner: Option<ObjectId>,
        public name_price: JSBI,
        public price: number,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += new BuckyString(this.name).raw_measure().unwrap();
        size += OptionEncoder.from(this.owner, (v: ObjectId) => v).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.name_price).raw_measure().unwrap();
        size += new BuckyNumber('u32', this.price).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyString(this.name).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.owner, (v: ObjectId) => v).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.name_price).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.price).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class BidNameTxDecoder implements RawDecode<BidNameTx> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[BidNameTx, Uint8Array]> {
        let name;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [name, buf] = r.unwrap();
        }

        let owner;
        {
            const r = new OptionDecoder(new ObjectIdDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [owner, buf] = r.unwrap();
        }

        let name_price;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [name_price, buf] = r.unwrap();
        }

        let price;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [price, buf] = r.unwrap();
        }

        const ret: [BidNameTx, Uint8Array] = [new BidNameTx(name.value(), owner.to((v: ObjectId) => v), name_price.toBigInt(), price.toNumber()), buf];
        return Ok(ret);
    }

}
