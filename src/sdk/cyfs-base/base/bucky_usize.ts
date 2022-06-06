import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "./results";
import { RawEncode, RawDecode, DecodeBuilder, RawEncodePurpose } from "./raw_encode";
import { } from "./buffer";
import { BuckyNumber, BuckyNumberDecoder } from "./bucky_number";
import JSBI from 'jsbi';

export class BuckySize implements RawEncode {
    private readonly size: JSBI;
    constructor(size: number | JSBI | string) {
        this.size = JSBI.BigInt(size);
    }

    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        const len = this.size;

        let bytes;

        if (JSBI.lessThan(len, JSBI.BigInt(64))) {
            bytes = 1;
        } else if (JSBI.lessThan(len, JSBI.BigInt("16384"))) {
            bytes = 2;
        } else if (JSBI.lessThan(len, JSBI.BigInt("1073741824"))) {
            bytes = 4;
        } else if (JSBI.lessThan(len, JSBI.BigInt("4611686018427387904"))) {
            bytes = 8;
        } else {
            return Err(new BuckyError(BuckyErrorCode.NotSupport, "not enough buffer for size large then u64"));
        }

        return Ok(bytes);
    }

    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        const len = this.size;
        if (JSBI.lessThan(len, JSBI.BigInt(64))) {
            const flag = len;
            const r = new BuckyNumber("u8", flag).raw_encode(buf);
            if (r.err) {
                return r;
            }

            buf = r.unwrap();
        } else if (JSBI.lessThan(len, JSBI.BigInt(16384))) {

            const flag = JSBI.bitwiseOr(len, JSBI.BigInt("0b0100000000000000"));
            const r = new BuckyNumber("u16", flag).raw_encode(buf);
            if (r.err) return r;
            buf = r.unwrap();
        } else if (JSBI.lessThan(len, JSBI.BigInt("1073741824"))) {
            const flag = JSBI.bitwiseOr(len, JSBI.BigInt("0b11000000000000000000000000000000"));
            const r = new BuckyNumber("u32", flag).raw_encode(buf);
            if (r.err) return r;
            buf = r.unwrap();
        } else if (JSBI.lessThan(len, JSBI.BigInt("4611686018427387904"))) {
            const flag = JSBI.bitwiseOr(len, JSBI.BigInt("0b1000000000000000000000000000000000000000000000000000000000000000"));
            const r = new BuckyNumber("u64", flag).raw_encode(buf);
            if (r.err) return r;
            buf = r.unwrap();
        } else {
            return Err(new BuckyError(BuckyErrorCode.NotSupport, "not enough buffer for size large then u64"));
        }

        return Ok(buf);
    }
}

export class BuckySizeDecoder implements RawDecode<number> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[number, Uint8Array]> {
        let _first_byte;
        let _buf;
        let value;
        let len;

        {
            const r = new BuckyNumberDecoder("u8").raw_decode(buf);
            if (r.err) return r;
            [_first_byte, _buf] = r.unwrap();
        }

        const first_byte = _first_byte.toBigInt();

        if (JSBI.equal(JSBI.bitwiseAnd(first_byte, JSBI.BigInt("0b11000000")), JSBI.BigInt("0b00000000"))) {
            len = first_byte;
            buf = _buf;
        } else if (JSBI.equal(JSBI.bitwiseAnd(first_byte, JSBI.BigInt("0b11000000")), JSBI.BigInt("0b01000000"))) {
            const r = new BuckyNumberDecoder("u16").raw_decode(buf);
            if (r.err) return r;
            [value, buf] = r.unwrap();
            len = JSBI.bitwiseAnd(value.toBigInt(), JSBI.BigInt("0b0011111111111111"));

        } else if (JSBI.equal(JSBI.bitwiseAnd(first_byte, JSBI.BigInt("0b11000000")), JSBI.BigInt("0b11000000"))) {
            const r = new BuckyNumberDecoder("u32").raw_decode(buf);
            if (r.err) return r;
            [value, buf] = r.unwrap();
            len = JSBI.bitwiseAnd(value.toBigInt(), JSBI.BigInt("0b00111111111111111111111111111111"));
        } else if (JSBI.equal(JSBI.bitwiseAnd(first_byte, JSBI.BigInt("0b11000000")), JSBI.BigInt("0b10000000"))) {
            const r = new BuckyNumberDecoder("u64").raw_decode(buf);
            if (r.err) return r;
            [value, buf] = r.unwrap();
            len = JSBI.bitwiseAnd(value.toBigInt(), JSBI.BigInt("0b0011111111111111111111111111111111111111111111111111111111111111"));
        } else {
            return Err(new BuckyError(BuckyErrorCode.NotSupport, `invalid size first byte: ${first_byte}`));
        };

        const ret: [number, Uint8Array] = [Number(len), buf];

        return Ok(ret);
    }
}