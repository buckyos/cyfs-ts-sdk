import { BuckyError, BuckyErrorCode, BuckyResult, Err, Ok } from '../../cyfs-base/base/results';
import JSBI from 'jsbi';

export interface JsonCodecBase<T> {
    encode_string(param: T): string;
    decode_string(s: string): BuckyResult<T>;
}

export abstract class JsonCodec<T> implements JsonCodecBase<T> {
    encode_object(param: T): any {
        return param as T;
    }

    encode_string(param: T): string {
        return JSON.stringify(this.encode_object(param));
    }

    decode_object(o: any): BuckyResult<T> {
        return Ok(o as T);
    }

    decode_string(s: string): BuckyResult<T> {
        let o;
        try {
            o = JSON.parse(s);
        } catch (error) {
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid json format! error=${error.message}`));
        }

        return this.decode_object(o);
    }
}


export class JsonCodecHelper {
    public static decode_number(o: any): BuckyResult<number> {
        if (typeof o === 'number') {
            return Ok(o as number);
        }

        const ret = parseInt(o as string, 10);
        if (isNaN(ret)) {
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid number format! s=${o}`));
        }

        return Ok(ret);
    }

    public static decode_big_int(o: any): BuckyResult<JSBI> {
        try {
            const ret = JSBI.BigInt(o);
            return Ok(ret);
        } catch (error) {
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid JSBI format! s=${o}, err=${error.message}`));
        }
    }

    public static decode_hex_to_buffer(o: any): BuckyResult<Uint8Array> {
        try {
            const ret = Uint8Array.prototype.fromHex(o);
            return ret;
        } catch (error) {
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid hex buffer format! s=${o}, err=${error.message}`));
        }
    }
}

export class BuckyErrorJsonCodec extends JsonCodec<BuckyError> {
    public encode_object(param: BuckyError): any {
        const o: any = {};
        o.code = param.code;
        o.msg = param.msg;

        return o;
    }

    public decode_object(o: any): BuckyResult<BuckyError> {
        if (o.code == null) {
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid bucky error code filed: ${o.code}`));
        }

        const e = new BuckyError(o.code, o.msg);
        return Ok(e);
    }
}

export class BuckyResultJsonCodec<T> extends JsonCodec<BuckyResult<T>> {
    constructor(private codec: JsonCodec<T>) {
        super()
    }

    public encode_object(param: BuckyResult<T>): any {
        const o: any = {};

        if (param.err) {
            o.error = new BuckyErrorJsonCodec().encode_object(param.val);
        } else {
            o.value = this.codec.encode_object(param.unwrap());
        }

        return o;
    }

    public decode_object(o: any): BuckyResult<BuckyResult<T>> {
        if (o.value) {
            const r = this.codec.decode_object(o.value);
            if (r.err) {
                return r;
            }

            return Ok(Ok(r.unwrap()));
        } else if (o.error) {
            const r = new BuckyErrorJsonCodec().decode_object(o.error);
            if (r.err) {
                return r;
            }

            return Ok(Err(r.unwrap()));
        } else {
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid bucky result: ${o}`));
        }
    }
}