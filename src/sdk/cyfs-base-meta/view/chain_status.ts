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

import { GasPrice, GasPriceDecoder } from './gas_price'
import JSBI from 'jsbi';

export class ChainStatus implements RawEncode {
    constructor(
        public version: number,
        public height: JSBI,
        public gas_price: GasPrice,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('u32', this.version).raw_measure().unwrap();
        size += new BuckyNumber('i64', this.height).raw_measure().unwrap();
        size += this.gas_price.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('u32', this.version).raw_encode(buf).unwrap();
        buf = new BuckyNumber('i64', this.height).raw_encode(buf).unwrap();
        buf = this.gas_price.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ChainStatusDecoder implements RawDecode<ChainStatus> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ChainStatus, Uint8Array]> {
        let version;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [version, buf] = r.unwrap();
        }

        let height;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [height, buf] = r.unwrap();
        }

        let gas_price;
        {
            const r = new GasPriceDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [gas_price, buf] = r.unwrap();
        }

        const ret: [ChainStatus, Uint8Array] = [new ChainStatus(version.toNumber(), height.toBigInt(), gas_price), buf];
        return Ok(ret);
    }

}
