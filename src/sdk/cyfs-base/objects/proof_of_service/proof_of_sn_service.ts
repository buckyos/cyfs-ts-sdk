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
} from "../object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../base/bucky_buffer";
import { Vec, VecDecoder } from "../../base/vec";
import { RawDecode, RawEncode } from "../../base/raw_encode";
import { HashValue, HashValueDecoder } from "../../crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../object_id";

import { SnServiceReceiptVersion, SnServiceReceiptVersionDecoder } from './sn_service_receipt_version'
import { SnServiceGrade, SnServiceGradeDecoder } from './sn_service_grade'

import { ProofOfSNServiceExt } from './proof_of_sn_service_ext'
import JSBI from 'jsbi';

export class ProofOfSNService implements RawEncode {
    constructor(
        public version: SnServiceReceiptVersion,
        public grade: SnServiceGrade,
        public rto: JSBI,
        public duration: JSBI,
        public start_time: JSBI,
        public ping_count: JSBI,
        public ping_resp_count: JSBI,
        public called_count: JSBI,
        public call_peer_count: JSBI,
        public connect_peer_count: JSBI,
        public call_delay: JSBI,
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.version.raw_measure().unwrap();
        size += this.grade.raw_measure().unwrap();
        size += new BuckyNumber('u64', this.rto).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.duration).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.start_time).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.ping_count).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.ping_resp_count).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.called_count).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.call_peer_count).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.connect_peer_count).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.call_delay).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.version.raw_encode(buf).unwrap();
        buf = this.grade.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.rto).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.duration).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.start_time).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.ping_count).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.ping_resp_count).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.called_count).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.call_peer_count).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.connect_peer_count).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.call_delay).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class ProofOfSNServiceDecoder implements RawDecode<ProofOfSNService> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ProofOfSNService, Uint8Array]> {
        let version;
        {
            const r = new SnServiceReceiptVersionDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [version, buf] = r.unwrap();
        }

        let grade;
        {
            const r = new SnServiceGradeDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [grade, buf] = r.unwrap();
        }

        let rto;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [rto, buf] = r.unwrap();
        }

        let duration;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [duration, buf] = r.unwrap();
        }

        let start_time;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [start_time, buf] = r.unwrap();
        }

        let ping_count;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [ping_count, buf] = r.unwrap();
        }

        let ping_resp_count;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [ping_resp_count, buf] = r.unwrap();
        }

        let called_count;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [called_count, buf] = r.unwrap();
        }

        let call_peer_count;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [call_peer_count, buf] = r.unwrap();
        }

        let connect_peer_count;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [connect_peer_count, buf] = r.unwrap();
        }

        let call_delay;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [call_delay, buf] = r.unwrap();
        }

        const ret: [ProofOfSNService, Uint8Array] = [new ProofOfSNService(version, grade, rto.toBigInt(), duration.toBigInt(), start_time.toBigInt(), ping_count.toBigInt(), ping_resp_count.toBigInt(), called_count.toBigInt(), call_peer_count.toBigInt(), connect_peer_count.toBigInt(), call_delay.toBigInt()), buf];
        return Ok(ret);
    }

}
