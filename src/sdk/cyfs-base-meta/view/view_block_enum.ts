/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/
import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";
import JSBI from 'jsbi';


export class ViewBlockEnum implements RawEncode {
    private readonly tag: number;
    private constructor(
        private tip?: number,
        private number?: JSBI,
        private hash?: ObjectId,
    ) {
        if (tip) {
            this.tag = 0;
        } else if (number) {
            this.tag = 1;
        } else if (hash) {
            this.tag = 2;
        } else {
            this.tag = -1;
        }
    }

    static Tip(): ViewBlockEnum {
        return new ViewBlockEnum(1);
    }

    static Number(number: JSBI): ViewBlockEnum {
        return new ViewBlockEnum(undefined, number);
    }

    static Hash(hash: ObjectId): ViewBlockEnum {
        return new ViewBlockEnum(undefined, undefined, hash);
    }

    match<T>(visitor: {
        Tip?: () => T,
        Number?: (number: JSBI) => T,
        Hash?: (hash: ObjectId) => T,
    }): T | undefined {
        switch (this.tag) {
            case 0: return visitor.Tip?.();
            case 1: return visitor.Number?.(this.number!);
            case 2: return visitor.Hash?.(this.hash!);
            default: break;
        }
    }

    eq_type(rhs: ViewBlockEnum): boolean {
        return this.tag === rhs.tag;
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += 1; // tag
        size += this.match({
            Tip: () => { return 0; },
            Number: (number) => { return new BuckyNumber('i64', this.number!).raw_measure().unwrap(); },
            Hash: (hash) => { return this.hash!.raw_measure().unwrap(); },
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Tip: () => { return buf; },
            Number: (number) => { return new BuckyNumber('i64', this.number!).raw_encode(buf).unwrap(); },
            Hash: (hash) => { return this.hash!.raw_encode(buf).unwrap(); },
        })!;
        return Ok(buf);
    }
}

export class ViewBlockEnumDecoder implements RawDecode<ViewBlockEnum> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ViewBlockEnum, Uint8Array]> {
        let tag;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [tag, buf] = r.unwrap();
        }

        switch (tag.toNumber()) {
            case 0: {
                const ret: [ViewBlockEnum, Uint8Array] = [ViewBlockEnum.Tip(), buf];
                return Ok(ret);
            }
            case 1: {
                const r = new BuckyNumberDecoder('i64').raw_decode(buf);
                if (r.err) {
                    return r;
                }
                let number;
                [number, buf] = r.unwrap();
                const ret: [ViewBlockEnum, Uint8Array] = [ViewBlockEnum.Number(number.toBigInt()), buf];
                return Ok(ret);
            }
            case 2: {
                const r = new ObjectIdDecoder().raw_decode(buf);
                if (r.err) {
                    return r;
                }
                let hash;
                [hash, buf] = r.unwrap();
                const ret: [ViewBlockEnum, Uint8Array] = [ViewBlockEnum.Hash(hash), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed, "SHOULD NOT COME HERE, ViewBlockEnumDecoder"));
        }
    }

}
