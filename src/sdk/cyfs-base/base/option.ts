import { Ok, Err, BuckyResult, BuckyError, BuckyErrorCode } from "./results";
import { BuckyNumber, BuckyNumberType } from "./bucky_number";
import { RawEncode, RawDecode } from "./raw_encode";
import JSBI from "jsbi";
import { BuckyString } from "./bucky_string";
import { Vec } from "./vec";
import { BuckyBuffer } from "./bucky_buffer";
// Codec

export class OptionEncoder<T extends RawEncode> implements RawEncode {
    // private val?: T;
    constructor(private val?: T) {
    }

    static from<T extends RawEncode>(val?: T|number|JSBI|string|T[]|Uint8Array, number_type?: BuckyNumberType): OptionEncoder<T>|OptionEncoder<BuckyNumber>|OptionEncoder<BuckyString>|OptionEncoder<Vec<T>>|OptionEncoder<BuckyBuffer> {
        if (typeof val === "number") {
            return new OptionEncoder(new BuckyNumber(number_type!, val));
        } else if (typeof val === "string") {
            return new OptionEncoder(new BuckyString(val));
        } else if (val instanceof JSBI) {
            return new OptionEncoder(new BuckyNumber(number_type!, val));
        } else if (val instanceof Uint8Array) {
            return new OptionEncoder(new BuckyBuffer(val));
        } else if (val instanceof Array) {
            return new OptionEncoder(new Vec(val));
        } else {
            return new OptionEncoder(val)
        }
    }

    raw_measure(): BuckyResult<number> {
        if (this.val !== undefined) {
            return Ok(1 + this.val.raw_measure().unwrap());
        } else {
            return Ok(1);
        }
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        if (this.val !== undefined) {
            buf[0] = 1;
            buf = buf.offset(1);
            return this.val.raw_encode(buf);
        } else {
            buf[0] = 0;
            buf = buf.offset(1);
            return Ok(buf);
        }
    }

    value(): T|undefined {
        return this.val
    }
}

// DB用来构造D
// D用来解码出T
export class OptionDecoder<T extends RawEncode> implements RawDecode<OptionEncoder<T>> {
    readonly decoder: RawDecode<T>;

    constructor(decoder: RawDecode<T>) {
        this.decoder = decoder;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[OptionEncoder<T>, Uint8Array]> {
        // decode length
        const tag = buf[0];
        buf = buf.offset(1);

        // buffer
        switch (tag) {
            case 0: {
                return Ok([new OptionEncoder(), buf]);
            }
            case 1: {
                const ret = this.decoder.raw_decode(buf);
                if (ret.err) {
                    return ret;
                }
                return Ok([new OptionEncoder(ret.unwrap()[0]), ret.unwrap()[1]]);
            }
            default: {
                return Err(new BuckyError(BuckyErrorCode.NotSupport, "not support option flag"));
            }
        }
    }
}