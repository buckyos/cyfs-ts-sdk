import { Ok, Err, Result, BuckyResult, BuckyError, BuckyErrorCode } from "./results";
import { RawEncode, RawDecode, DecodeBuilder, RawEncodePurpose } from "./raw_encode";
import { } from "./buffer";

export interface BaseOption<T> {
    is_some(): boolean;
    is_none(): boolean;
    unwrap(): T;
    ok_or(): BuckyResult<T>;
    to<V1>(ve: (v: T) => V1): Option<V1>;
    map(mapper: (obj: T) => T): void;
}

export class SomeOption<T> implements BaseOption<T> {
    private value: T;

    constructor(value: T) {
        this.value = value;
    }

    is_some(): boolean {
        return true;
    }

    is_none(): boolean {
        return false;
    }

    unwrap(): T {
        return this.value;
    }


    ok_or(): BuckyResult<T> {
        const v = this.value;
        return Ok(v);
    }

    to<V1>(ve: (v: T) => V1): Option<V1> {
        return Some(ve(this.value));
    }

    map(mapper: (obj: T) => T): void {
        this.value = mapper(this.value);
    }
}

export class NoneOption implements BaseOption<never> {
    private value: never;

    constructor() {
        //
    }

    is_some(): boolean {
        return false;
    }

    is_none(): boolean {
        return true;
    }

    unwrap(): never {
        throw new Error('option is none');
    }

    ok_or(): BuckyResult<never> {
        return Err(new BuckyError(BuckyErrorCode.NotFound, "option is none"));
    }

    to<V1>(ve: (v: never) => V1): NoneOption {
        return None;
    }

    map(mapper: (obj: never) => never): void {
        // ignore
    }
}

export type Option<T> = (SomeOption<T> | NoneOption) & BaseOption<T>;

export function Some<T>(val: T): Option<T> {
    return new SomeOption(val);
}

export const None = new NoneOption();

// Codec

export class OptionEncoder<T extends RawEncode> implements RawEncode {
    val: Option<T>;

    constructor(val: Option<T>) {
        this.val = val;
    }

    value(): Option<T> {
        return this.val!;
    }

    static from<V extends RawEncode, V1>(val: Option<V1>, ve: (v: V1) => V): OptionEncoder<V> {
        if (val.is_some()) {
            return new OptionEncoder(Some(ve(val.unwrap())));
        } else {
            return new OptionEncoder(None);
        }
    }

    raw_measure(): BuckyResult<number> {
        const val = this.val;

        if (val.is_some()) {
            return Ok(1 + val.unwrap().raw_measure().unwrap());
        } else {
            return Ok(1);
        }
    };

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        const val = this.val!;

        if (val.is_some()) {
            buf[0] = 1;
            buf = buf.offset(1);
            return val.unwrap().raw_encode(buf);
        } else {
            buf[0] = 0;
            buf = buf.offset(1);
            return Ok(buf);
        }
    };
}

export class OptionWrapper<T extends RawEncode> implements RawEncode {
    constructor(private v: Option<T>) {
    }

    public value(): Option<T> {
        return this.v;
    }

    public to<V1>(ve: (v: T) => V1): Option<V1> {
        return this.v.to(ve);
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        return new OptionEncoder(this.v).raw_measure();
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        return new OptionEncoder(this.v).raw_encode(buf);
    }
}

// DB用来构造D
// D用来解码出T
export class OptionDecoder<
    T extends RawEncode,
    > implements RawDecode<OptionWrapper<T>> {
    readonly decoder: RawDecode<T>;

    constructor(decoder: RawDecode<T>) {
        this.decoder = decoder;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[OptionWrapper<T>, Uint8Array]> {
        // decode length
        const tag = buf[0];
        buf = buf.offset(1);

        // buffer
        let val: Option<T>;
        switch (tag) {
            case 0: {
                val = None;
                const ret: [OptionWrapper<T>, Uint8Array] = [new OptionWrapper(val), buf];
                return Ok(ret);
            }
            case 1: {
                const element_ret = this.decoder.raw_decode(buf);
                if (element_ret.err) {
                    return element_ret;
                }
                let element;
                [element, buf] = element_ret.unwrap();

                val = Some(element);
                const ret: [OptionWrapper<T>, Uint8Array] = [new OptionWrapper(val), buf];

                return Ok(ret);
            }
            default: {
                return Err(new BuckyError(BuckyErrorCode.NotSupport, "not support option flag"));
            }
        }
    }
}