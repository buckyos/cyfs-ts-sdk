/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";

import { ServiceAuthType } from './service_auth_type';
import { ServiceAuthTypeDecoder } from './service_auth_type';
import JSBI from 'jsbi';

export class SNPurchase implements RawEncode {
    constructor(
        public service_id: ObjectId,
        public start_time: JSBI,
        public stop_time: JSBI,
        public auth_type: ServiceAuthType,
        public auth_list: ObjectId[],
    ) {
        // ignore
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.service_id.raw_measure().unwrap();
        size += new BuckyNumber('u64', this.start_time).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.stop_time).raw_measure().unwrap();
        size += this.auth_type.raw_measure().unwrap();
        size += Vec.from(this.auth_list, (v: ObjectId) => v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.service_id.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.start_time).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.stop_time).raw_encode(buf).unwrap();
        buf = this.auth_type.raw_encode(buf).unwrap();
        buf = Vec.from(this.auth_list, (v: ObjectId) => v).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class SNPurchaseDecoder implements RawDecode<SNPurchase> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[SNPurchase, Uint8Array]> {
        let service_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [service_id, buf] = r.unwrap();
        }

        let start_time;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [start_time, buf] = r.unwrap();
        }

        let stop_time;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [stop_time, buf] = r.unwrap();
        }

        let auth_type;
        {
            const r = new ServiceAuthTypeDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [auth_type, buf] = r.unwrap();
        }

        let auth_list;
        {
            const r = new VecDecoder(new ObjectIdDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [auth_list, buf] = r.unwrap();
        }

        const ret: [SNPurchase, Uint8Array] = [new SNPurchase(service_id, start_time.toBigInt(), stop_time.toBigInt(), auth_type, auth_list.to((v: ObjectId) => v)), buf];
        return Ok(ret);
    }

}
