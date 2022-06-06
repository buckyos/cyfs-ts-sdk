
import JSBI from 'jsbi';
import Long from 'long';
import * as jspb from "google-protobuf";
import { protos } from '.';
import { ContentRawDecodeContext, RawDecode, RawEncode, to_buf } from '../../base/raw_encode';
import { BuckyError, BuckyErrorCode, BuckyResult, Err, Ok } from '../../base/results';
import { BodyContent, BodyContentDecoder, ContentCodecInfo, DescContent, DescContentDecoder, NamedObjectBodyContext } from '../../objects/object';
import { OBJECT_CONTENT_CODEC_FORMAT_PROTOBUF } from '../contants';

const OBJECT_CONTENT_DEFAULT_PROTOBUF_CODEC_INFO = new ContentCodecInfo(0, OBJECT_CONTENT_CODEC_FORMAT_PROTOBUF);


class ProtobufCodecImpl {
    static raw_measure(try_to_proto: () => BuckyResult<jspb.Message>): BuckyResult<number> {
        let value: jspb.Message;
        try {
            const r = try_to_proto();
            if (r.err) {
                return r;
            }

            value = r.unwrap();
        } catch (error) {
            const msg = `encode content to proto error! err=${error.message}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        const size = value.serializeBinary().length;
        return Ok(size);
    }

    static raw_encode(buf: Uint8Array, try_to_proto: () => BuckyResult<jspb.Message>): BuckyResult<Uint8Array> {
        let value: jspb.Message;
        try {
            const r = try_to_proto();
            if (r.err) {
                return r;
            }

            value = r.unwrap();
        } catch (error) {
            const msg = `encode content to proto error! err=${JSON.stringify(error)}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        let encoded_buf;
        try {
            encoded_buf = value.serializeBinary();
        } catch (error) {
            const msg = `encode proto to buf error! err=${JSON.stringify(error)}`;
            console.error(msg);

            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        console.assert(buf.length >= encoded_buf.length);
        buf.set(encoded_buf);
        buf = buf.offset(encoded_buf.length);

        return Ok(buf);
    }

    static raw_decode<T, P extends jspb.Message>(
        buf: Uint8Array,
        ctx: ContentRawDecodeContext,
        try_from_proto: (value: P) => BuckyResult<T>,
        decode: (reader: Uint8Array) => P
    ): BuckyResult<[T, Uint8Array]> {

        console.assert(ctx.format === OBJECT_CONTENT_CODEC_FORMAT_PROTOBUF);

        let content;
        try {
            content = decode(buf);
        } catch (error) {
            const msg = `decode device proto error! err=${error.message}`;
            console.error(msg);

            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        let result: T;
        try {
            const r = try_from_proto(content);
            if (r.err) {
                return r;
            }

            result = r.unwrap();
        } catch (error) {
        const msg = `decode content from proto error! err=${error.message}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        buf = buf.offset(buf.length);

        return Ok([result, buf] as [T, Uint8Array]);
    }
}

export abstract class ProtobufDescContent extends DescContent {
    constructor() {
        super();
    }

    abstract try_to_proto(): BuckyResult<jspb.Message>;

    // 子类如果需要自定义非零版本，那么需要在覆盖此方法
    codec_info(): ContentCodecInfo {
        return OBJECT_CONTENT_DEFAULT_PROTOBUF_CODEC_INFO;
    }

    raw_measure(ctx?: any, purpose?: any): BuckyResult<number> {
        return ProtobufCodecImpl.raw_measure(this.try_to_proto.bind(this));
    }

    raw_encode(buf: Uint8Array, ctx?: any, purpose?: any): BuckyResult<Uint8Array> {
        return ProtobufCodecImpl.raw_encode(buf, this.try_to_proto.bind(this));
    }
}

export abstract class ProtobufDescContentDecoder<T extends DescContent, P extends jspb.Message> extends DescContentDecoder<T> {
    constructor(private decode: (reader: Uint8Array) => P) {
        super();
    }

    abstract try_from_proto(value: P): BuckyResult<T>;

    raw_decode(buf: Uint8Array, ctx: ContentRawDecodeContext): BuckyResult<[T, Uint8Array]> {
        return ProtobufCodecImpl.raw_decode(buf, ctx, this.try_from_proto.bind(this), this.decode);
    }
}

export abstract class ProtobufBodyContent extends BodyContent {
    constructor() {
        super();
    }

    abstract try_to_proto(): BuckyResult<jspb.Message>;

    // 子类如果需要自定义非零版本，那么需要在覆盖此方法
    codec_info(): ContentCodecInfo {
        return OBJECT_CONTENT_DEFAULT_PROTOBUF_CODEC_INFO;
    }

    raw_measure(ctx?: any, purpose?: any): BuckyResult<number> {
        return ProtobufCodecImpl.raw_measure(this.try_to_proto.bind(this));
    }

    raw_encode(buf: Uint8Array, ctx?: any, purpose?: any): BuckyResult<Uint8Array> {
        return ProtobufCodecImpl.raw_encode(buf, this.try_to_proto.bind(this));
    }
}

export abstract class ProtobufBodyContentDecoder<T extends BodyContent, P extends jspb.Message> extends BodyContentDecoder<T> {
    constructor(private decode: (reader: Uint8Array) => P) {
        super();
    }

    abstract try_from_proto(value: P): BuckyResult<T>;

    raw_decode(buf: Uint8Array, ctx: ContentRawDecodeContext): BuckyResult<[T, Uint8Array]> {
        return ProtobufCodecImpl.raw_decode(buf, ctx, this.try_from_proto.bind(this), this.decode);
    }
}


export class ProtobufCodecHelper {
    // 确保值存在不为空
    static ensure_not_null<T>(value: T | null | undefined): BuckyResult<T> {
        if (value == null) {
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, 'except value, null or undefined got')); 
        }

        return Ok(value);
    }

    static encode_buf_list<T extends RawEncode>(list: T[]): BuckyResult<Uint8Array[]> {
        const result: Uint8Array[] = [];
        for (const item of list) {
            const r = to_buf(item);
            if (r.err) {
                return r;
            }

            result.push(r.unwrap());
        }

        return Ok(result);
    }

    static encode_multi_buf_list<T extends RawEncode>(...list: T[][]): BuckyResult<Uint8Array[][]> {
        const result: Uint8Array[][] = [];
        for (const item of list) {
            const r = this.encode_buf_list(item);
            if (r.err) {
                return r;
            }

            result.push(r.unwrap());
        }

        return Ok(result);
    }

    static decode_buf_list<T>(list: Uint8Array[], decoder: RawDecode<T>): BuckyResult<T[]> {
        const result: T[] = [];
        for (const item of list) {
            const r = decoder.raw_decode(item);
            if (r.err) {
                return r;
            }

            const [i, left_buf] = r.unwrap();
            result.push(i);
        }

        return Ok(result);
    }

    static encode_buf<T extends RawEncode>(value: T): BuckyResult<Uint8Array> {
        const r = to_buf(value);
        if (r.err) {
            return r;
        }

        return Ok(r.unwrap());
    }

    static decode_buf<T>(item: Uint8Array, decoder: RawDecode<T>): BuckyResult<T> {
        const r = decoder.raw_decode(item);
        if (r.err) {
            return r;
        }

        const [result, left_buf] = r.unwrap();

        return Ok(result);
    }

    static encode_int64(value: JSBI): Long.Long {
        return Long.fromString(value.toString(10));
    }

    static decode_int64(value: string | number): JSBI {
        return JSBI.BigInt(value.toString());
    }
}


export class EmptyProtobufBodyContent extends ProtobufBodyContent {
    constructor() {
        super();
    }
    try_to_proto(): BuckyResult<protos.EmptyContent> {
        return Ok(new protos.EmptyContent())
    }
}

export class EmptyProtobufBodyContentDecoder extends ProtobufBodyContentDecoder<EmptyProtobufBodyContent, protos.EmptyContent> {
    constructor() {
        super(protos.EmptyContent.deserializeBinary);
    }
    try_from_proto(value: protos.EmptyContent): BuckyResult<EmptyProtobufBodyContent> {
        return Ok(new EmptyProtobufBodyContent())
    }
}