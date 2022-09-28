import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../base/results";
import { RawEncode, RawDecode } from "../base/raw_encode";
import { } from "../base/buffer";
import {md, util} from 'node-forge';
import * as basex from '../base/basex';

export const UNIQUE_VALUE_LEN = 16;

export class UniqueId implements RawEncode {
    m_buf: Uint8Array;

    constructor(buf: Uint8Array) {
        if (buf.length !== UNIQUE_VALUE_LEN) {
            throw new Error(`invalid hash length:${buf.length}`);
        }

        this.m_buf = buf;
    }

    as_slice(): Uint8Array {
        return this.m_buf;
    }

    length(): number {
        return UNIQUE_VALUE_LEN;
    }

    toJSON(): string {
        return this.to_base_58();
    }

    static default(): UniqueId {
        return new UniqueId(new Uint8Array(UNIQUE_VALUE_LEN));
    }

    static copy_from_slice(buf: Uint8Array): UniqueId {
        if (buf.length >= UNIQUE_VALUE_LEN) {
            return new UniqueId(buf.slice(0, UNIQUE_VALUE_LEN));
        } else {
            const id_buf = new Uint8Array(UNIQUE_VALUE_LEN);
            id_buf.set(buf);
            return new UniqueId(id_buf);
        }
    }

    static create_with_hash(buf: Uint8Array): UniqueId {
        const sha256 = md.sha256.create();
        sha256.update(util.binary.raw.encode(buf));

        return UniqueId.copy_from_slice(util.binary.raw.decode(sha256.digest().bytes()));
    }

    raw_measure(): BuckyResult<number> {
        return Ok(UNIQUE_VALUE_LEN);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        buf.set(this.as_slice());
        buf = buf.offset(UNIQUE_VALUE_LEN);
        return Ok(buf);
    }

    to_base_58(): string {
        return basex.to_base_58(this.as_slice());
    }

    static from_base_58(s: string): BuckyResult<UniqueId> {
        const r = basex.from_base_58(s, UNIQUE_VALUE_LEN);
        if (r.err) {
            return r;
        }

        return Ok(new UniqueId(r.unwrap()));
    }
}

export class UniqueIdDecoder implements RawDecode<UniqueId> {
    raw_decode(buf: Uint8Array): BuckyResult<[UniqueId, Uint8Array]> {
        const buffer = buf.slice(0, UNIQUE_VALUE_LEN);
        buf = buf.offset(UNIQUE_VALUE_LEN);

        const ret: [UniqueId, Uint8Array] = [new UniqueId(buffer), buf];

        return Ok(ret);
    }
}