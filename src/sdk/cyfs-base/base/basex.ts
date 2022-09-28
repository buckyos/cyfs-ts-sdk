import bs from 'base-x'
import { BuckyError, BuckyErrorCode, BuckyResult, Err, Ok } from './results'

const BASE58_CHAR = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
const BASE36_CHAR = "0123456789abcdefghijklmnopqrstuvwxyz"

const BASE58_MIN = 43
const BASE58_MAX = 45

const BASE36_MIN = 49
const BASE36_MAX = 51

export const BASE58 = bs(BASE58_CHAR)
export const BASE36 = bs(BASE36_CHAR)

function to_base_x(buf: Uint8Array, conv: bs.BaseConverter): string {
    return conv.encode(buf)
}

export function to_base_58(buf: Uint8Array): string {
    return to_base_x(buf, BASE58)
}

export function to_base_36(buf: Uint8Array): string {
    return to_base_x(buf, BASE36)
}

function from_base_x(s: string, conv: bs.BaseConverter, name: string, expect_len?: number): BuckyResult<Uint8Array> {
    try {
        const buf = conv.decode(s);

        if (expect_len && buf.length !== expect_len) {
            const err_msg = `convert ${name} str failed, len unmatch! str=${s}`;
            console.error(err_msg)
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, err_msg));
        }

        return Ok(buf)
    } catch (error) {
        const err_msg = `convert ${name} str failed, str=${s}, ${(error as any).message}`;
        console.error(err_msg)
        return Err(new BuckyError(BuckyErrorCode.InvalidFormat, err_msg));
    }
}

export function from_base_58(s: string, expect_len?: number): BuckyResult<Uint8Array> {
    return from_base_x(s, BASE58, "base58", expect_len)
}

export function from_base_36(s: string, expect_len?: number): BuckyResult<Uint8Array> {
    return from_base_x(s, BASE36, "base36", expect_len)
}

export function from_base_str(s: string, expect_len?: number): BuckyResult<Uint8Array> {
    let base;
    let base_name: string;
    if (s.length >= BASE58_MIN && s.length < BASE58_MAX) {
        base = BASE58;
        base_name = "base58"
    } else if (s.length >= BASE36_MIN && s.length < BASE36_MAX) {
        base = BASE36
        base_name = "base36"
    }

    if (!base) {
        const err_msg = `${s} not a base36 nor base58 string!`;
        console.error(err_msg)
        return Err(new BuckyError(BuckyErrorCode.InvalidFormat, err_msg));
    }

    const ret = from_base_x(s, base, base_name!, expect_len);
    if (ret.err) {
        return ret;
    }

    return Ok(ret.unwrap())
}