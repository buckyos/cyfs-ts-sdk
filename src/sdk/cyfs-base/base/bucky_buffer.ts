import { Ok, BuckyResult } from "./results";
import { RawEncode, RawDecode, RawEncodePurpose} from "./raw_encode";
import {} from "./buffer";
import { BuckySize, BuckySizeDecoder} from "./bucky_usize";

// 加一个固定长度的BuckyBuffer，适配rust的GenericArray格式编码
export class BuckyFixedBuffer implements RawEncode {
    constructor(public buffer: Uint8Array){
    }
    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        return Ok(this.buffer.byteLength)
    }
    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        buf.set(this.buffer);
        buf = buf.offset(this.buffer.byteLength);
        return Ok(buf)
    }
    value(): Uint8Array {
        return this.buffer;
    }
}

export class BuckyFixedBufferDecoder implements RawDecode<BuckyFixedBuffer> {
    constructor(public size: number) {}
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[BuckyFixedBuffer, Uint8Array]> {
        const buffer = buf.slice(0, this.size);
        buf = buf.offset(this.size);

        const ret:[BuckyFixedBuffer, Uint8Array] = [new BuckyFixedBuffer(buffer), buf];

        return Ok(ret);
    }
}

// BuckyBuffer
export class BuckyBuffer implements RawEncode {
    buffer: Uint8Array;
    size: BuckySize;

    constructor(buf: Uint8Array){
        this.buffer = buf;
        this.size = new BuckySize(buf.length);
    }

    value(): Uint8Array {
        return this.buffer;
    }

    raw_measure(): BuckyResult<number> {
        let bytes = 0;

        bytes += this.size.raw_measure().unwrap();

        bytes += this.buffer!.length;

        return Ok(bytes);
    };

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        // encode length
        buf = this.size.raw_encode(buf).unwrap();

        // encode items
        buf.set(this.buffer!);
        buf = buf.offset(this.buffer.byteLength);

        return Ok(buf);
    };
}

export class BuckyBufferDecoder implements RawDecode<BuckyBuffer>{
    raw_decode(buf: Uint8Array): BuckyResult<[BuckyBuffer, Uint8Array]>{
        // decode length
        let length: number;
        const r = new BuckySizeDecoder().raw_decode(buf);
        if(r.err){
            return r;
        }
        [length, buf] = r.unwrap();

        // buffer
        const buffer = buf.slice(0, length);
        buf = buf.offset(length);

        const ret:[BuckyBuffer, Uint8Array] = [new BuckyBuffer(buffer), buf];

        return Ok(ret);
    }
}

export function fromHexString(hexString:string):Uint8Array{
    return new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}

export function toHexString(bytes:Uint8Array):string{
    return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}