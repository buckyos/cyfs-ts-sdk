import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../base/results";
import { RawEncode, RawDecode } from "../base/raw_encode";
import { } from "../base/buffer";
import bs58 from 'bs58';

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

    raw_measure(): BuckyResult<number> {
        return Ok(UNIQUE_VALUE_LEN);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        buf.set(this.as_slice());
        buf = buf.offset(UNIQUE_VALUE_LEN);
        return Ok(buf);
    }

    to_base_58(): string {
        return bs58.encode(this.as_slice());
    }

    static from_base_58(s: string): BuckyResult<UniqueId> {
        let buf;
        try {
            buf = bs58.decode(s);
        } catch (error) {
            const msg = `convert base58 str to unique id failed, str=${s}, ${error.message}`;
            console.error(`${msg}`);
            return new Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        if (buf.length !== UNIQUE_VALUE_LEN) {
            const msg = `convert base58 str to unique id failed, len unmatch! str=${s}`;
            console.error(`${msg}`);
            return new Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        return Ok(new UniqueId(new Uint8Array(buf)));
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