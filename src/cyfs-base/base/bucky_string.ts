
import {Ok, Err, Result, BuckyResult, BuckyError, BuckyErrorCode} from "./results";
import {RawEncode, RawDecode, DecodeBuilder, Compareable} from "./raw_encode";
import {} from "./buffer";
import { BuckySize, BuckySizeDecoder} from "./bucky_usize";

export class BuckyString implements RawEncode, Compareable<BuckyString>{
    private readonly s: string;

    constructor(value: string){
        this.s = value;
    }

    hashCode(): symbol{
        return Symbol.for(this.s);
    }

    equals(other: BuckyString): boolean{
        return this.s===other.s;
    }

    value():string{
        return this.s;
    }

    toString():string{
        return this.s;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        // length:u16 + string_bytes: []utf8
        // 最大长度支持u16::MAX
        const bytes_len = new TextEncoder().encode(this.s).length;
        if (bytes_len > 65535) {
            const msg = `BuckyString extend max bytes limit! len bytes=${bytes_len}, max bytes=65535`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.OutOfLimit, msg));
        }

        return Ok(2 + bytes_len);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        // reserve length:u16
        const pre_buf = buf.offsetView(0);
        buf = buf.offset(2);

        // string_bytes: []utf8
        const info:TextEncoderEncodeIntoResult = new TextEncoder().encodeInto(this.s, buf);
        const utf8_len = info.written!;

        // write length
        pre_buf.setUint16(0,utf8_len);

        // step
        buf = buf.offset(utf8_len);

        return Ok(buf);
    }
}

export class BuckyStringDecoder implements RawDecode<BuckyString>{
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[BuckyString, Uint8Array]>{
        if (buf.byteLength < 2) {
            const msg = `decode string but invalid buf size! len bytes=2, buf bytes=${buf.byteLength}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.OutOfLimit, msg));
        }

        // read length: u16
        const pre_buf = buf.offsetView(0);
        const utf8_len:number = pre_buf.getUint16(0);
        buf = buf.offset(2);
        if (buf.byteLength < utf8_len) {
            const msg = `decode string but invalid buf size! len bytes=${utf8_len}, left buf bytes=${buf.byteLength}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.OutOfLimit, msg));
        }

        // read string_bytes
        const buffer = buf.slice(0, utf8_len);

        const decoder = new TextDecoder();
        const s = decoder.decode(buffer);
        buf = buf.offset(utf8_len);
        const ret:[BuckyString, Uint8Array] = [new BuckyString(s), buf];
        return Ok(ret);
    }
}


export class BuckyVarString implements RawEncode, Compareable<BuckyVarString>{
    private readonly s: string;
    private bytes!: number;

    constructor(value: string){
        this.s = value;
    }

    hashCode(): symbol{
        return Symbol.for(this.s);
    }

    equals(other: BuckyVarString): boolean{
        return this.s===other.s;
    }

    value():string{
        return this.s;
    }

    toString():string{
        return this.s;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        // length:USize + string_bytes: []utf8
        this.bytes = new TextEncoder().encode(this.s).length;
        const size = new BuckySize(this.bytes);
        const bytes = size.raw_measure().unwrap() + this.bytes;

        return Ok(bytes);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        console.assert(this.bytes != null);

        const size = new BuckySize(this.bytes);
        const r = size.raw_encode(buf);
        if(r.err){
            return r;
        }
        buf = r.unwrap();
        
        // string_bytes: []utf8
        const info:TextEncoderEncodeIntoResult = new TextEncoder().encodeInto(this.s, buf);
        if (info.written! !== this.bytes) {
            const msg = `encode string but invalid buf size! s=${this.s}, encoded bytes=${info.written}, real bytes=${this.bytes}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.OutOfLimit, msg));
        }

        // step
        buf = buf.offset(this.bytes);

        return Ok(buf);
    }
}

export class BuckyVarStringDecoder implements RawDecode<BuckyVarString>{
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[BuckyVarString, Uint8Array]>{
        // read length: USize
        let utf8_len;
        {
            const r = new BuckySizeDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [utf8_len, buf] = r.unwrap();
        }


        // read string_bytes
        const buffer = buf.slice(0, utf8_len);

        const decoder = new TextDecoder();
        const s = decoder.decode(buffer);
        buf = buf.offset(utf8_len);
        const ret:[BuckyVarString, Uint8Array] = [new BuckyVarString(s), buf];
        return Ok(ret);
    }
}