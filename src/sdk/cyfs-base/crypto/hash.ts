import { Ok, BuckyResult, Err, BuckyError, BuckyErrorCode } from "../base/results";
import { RawEncode, RawDecode } from "../base/raw_encode";
import { } from "../base/buffer";

import {md, util} from 'node-forge'
import { BASE36, BASE58 } from "../base/basex";

export const HASH_VALUE_LEN = 32;

export class HashValue implements RawEncode {
    m_buf: Uint8Array;

    constructor(buf: Uint8Array) {
        if (buf.length !== HASH_VALUE_LEN) {
            throw new Error(`invalid hash length:${buf.length}`);
        }

        this.m_buf = buf;
    }

    as_slice(): Uint8Array {
        return this.m_buf;
    }

    length(): number {
        return HASH_VALUE_LEN;
    }

    static default(): HashValue {
        return new HashValue(new Uint8Array(HASH_VALUE_LEN));
    }

    static copy_from_slice(buf: Uint8Array): HashValue {
        return new HashValue(buf.slice(0, HASH_VALUE_LEN));
    }

    static hash_data(data: Uint8Array): HashValue {
        // calc hash
        const hash = md.sha256.create()
        hash.update(util.binary.raw.encode(data), 'raw')
        const val = hash.digest();

        // construct
        return new HashValue(util.binary.raw.decode(val.bytes()));
    }

    raw_measure(): BuckyResult<number> {
        return Ok(HASH_VALUE_LEN);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        buf.set(this.as_slice());
        return Ok(buf.offset(this.as_slice().length));
    }

    to_base_58(): string {
        return BASE58.encode(this.as_slice());
    }

    to_base_36(): string {
        return BASE36.encode(this.as_slice());
    }

    to_hex_string(): string {
        return Buffer.from(this.as_slice()).toString('hex');
    }

    static from_hex_string(s: string): BuckyResult<HashValue> {
        const buf = Uint8Array.from(Buffer.from(s, 'hex'));
        if (buf.byteLength !== HASH_VALUE_LEN) {
            const msg = `invalid buf hex string: ${s}, len=${buf.byteLength}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        const ret = new HashValue(buf);
        return Ok(ret);
    }
}

export class HashValueDecoder implements RawDecode<HashValue>{
    raw_decode(buf: Uint8Array): BuckyResult<[HashValue, Uint8Array]> {
        const buffer = buf.slice(0, HASH_VALUE_LEN);
        buf = buf.offset(HASH_VALUE_LEN);

        const ret: [HashValue, Uint8Array] = [new HashValue(buffer), buf];

        return Ok(ret);
    }
}