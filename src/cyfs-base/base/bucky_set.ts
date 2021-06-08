import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "./results";
import { RawEncode, RawDecode, DecodeBuilder} from "./raw_encode";
import {} from "./buffer";
import { BuckySize, BuckySizeDecoder} from "./bucky_usize";

export class BuckySet<T extends RawEncode> implements RawEncode {

    private readonly array: Set<T>;
    private readonly size: BuckySize;

    constructor(val: Set<T>){
        this.array = val;
        this.size = new BuckySize(val.size);
    }

    value(): Set<T>{
        return this.array;
    }

    raw_measure():BuckyResult<number>{
        let bytes = 0;

        bytes += this.size.raw_measure().unwrap();

        for(const e of this.array){
            const size = e.raw_measure();
            if(size.err){
                return size;
            }
            bytes += size.unwrap();
        }
        return Ok(bytes);
    };

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        // encode length
        {
            const r = this.size.raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        // encode items
        for(const e of this.array){
            const ret = e.raw_encode(buf);
            if(ret.err){
                return ret;
            }else{
                buf = ret.unwrap();
            }
        }

        return Ok(buf);
    };
}

export class BuckySetDecoder<
    T extends RawEncode,
> implements RawDecode<BuckySet<T>> {

    readonly decoder: RawDecode<T>;
    readonly size_decoder: BuckySizeDecoder;

    constructor(decoder: RawDecode<T>){
        this.size_decoder = new BuckySizeDecoder();
        this.decoder = decoder;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[BuckySet<T>, Uint8Array]>{
        // decode u64 length
        let size;
        {
            const r = this.size_decoder.raw_decode(buf);
            if(r.err){
                return r;
            }
            [size, buf] = r.unwrap();
        }

        // items
        const array = new Set<T>();
        for(let i=0;i<size;i++){
            const result = this.decoder.raw_decode(buf);
            if(result.err){
                return result;
            }else{
                let item;
                [item, buf] = result.unwrap();
                array.add(item);
            }
        }

        const vec = new BuckySet(array);
        const ret:[BuckySet<T>, Uint8Array] = [vec, buf];

        return Ok(ret);
    }
}