import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "./results";
import { RawEncode, RawDecode, DecodeBuilder} from "./raw_encode";
import {} from "./buffer";
import { BuckySize, BuckySizeDecoder} from "./bucky_usize";

export class Vec<T extends RawEncode> implements RawEncode {

    private readonly array: T[];
    private readonly size: BuckySize;

    constructor(val: T[]){
        this.array = val;
        this.size = new BuckySize(val.length);
    }

    value(): T[]{
        return this.array;
    }

    static from<V extends RawEncode,V1>(val: V1[], ve: (v:V1)=>V): Vec<V>{
        const vec = [];
        for(const e of val){
            vec.push(ve(e));
        }
        return new Vec(vec);
    }

    to<V1>(ve: (v:T)=>V1):V1[]{
        const vec = [];
        for(const e of this.array){
            vec.push(ve(e));
        }
        return vec;
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
    }

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

export class VecDecoder<
    T extends RawEncode,
> implements RawDecode<Vec<T>> {

    readonly size_decoder: BuckySizeDecoder;
    readonly decoder: RawDecode<T>;

    constructor(decoder: RawDecode<T>){
        this.size_decoder = new BuckySizeDecoder();
        this.decoder = decoder;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[Vec<T>, Uint8Array]>{
        // decode u64 length
        let length;
        {
            const r = this.size_decoder.raw_decode(buf);
            if(r.err){
                return r;
            }
            [length, buf] = r.unwrap();
        }

        // items
        const array = new Array<T>();
        for(let i=0;i<length;i++){
            const result = this.decoder.raw_decode(buf);
            if(result.err){
                return result;
            }else{
                let item;
                [item, buf] = result.unwrap();
                array.push(item);
            }
        }

        const vec = new Vec(array);
        const ret:[Vec<T>, Uint8Array] = [vec, buf];

        return Ok(ret);
    }
}