import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "./results";
import { RawEncode, RawDecode, DecodeBuilder} from "./raw_encode";
import {} from "./buffer";
import { BuckySize, BuckySizeDecoder} from "./bucky_usize";


export class BuckyMap<K extends RawEncode, V extends RawEncode> implements RawEncode {

    private readonly dict: Map<K,V>;
    private readonly size: BuckySize;

    constructor(val: Map<K,V>){
        this.dict = val;
        this.size = new BuckySize(val.size);
    }

    static from<K extends RawEncode, V extends RawEncode, K1, V1>(val: Map<K1,V1>, ke:(k:K1)=>K, ve: (v:V1)=>V): BuckyMap<K,V>{
        const map = new Map<K,V>();
        for(const [k,v] of val.entries()){
            map.set(ke(k), ve(v));
        }
        return new BuckyMap(map);
    }

    value(): Map<K,V>{
        return this.dict;
    }

    to<K1,V1>(ke:(k:K)=>K1, ve:(v:V)=>V1):Map<K1,V1>{
        const map = new Map<K1,V1>();
        for(const [k,v] of this.dict.entries()){
            map.set(ke(k),ve(v));
        }
        return map;
    }

    raw_measure():BuckyResult<number>{
        let bytes = 0;

        bytes += this.size.raw_measure().unwrap();

        for(const [k,v] of this.dict.entries()){
            // key
            {
                const r = k.raw_measure();
                if(r.err){
                    return r;
                }
                bytes += r.unwrap();
            }

            // value
            {
                const r = v.raw_measure();
                if(r.err){
                    return r;
                }
                bytes += r.unwrap();
            }
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
        const keys = [...this.dict.keys()];
        keys.sort();

        for(const k of keys){
            // key
            {
                const r = k.raw_encode(buf);
                if(r.err){
                    return r;
                }
                buf = r.unwrap();
            }

            // value
            {
                const v = this.dict.get(k)!;
                const r = v.raw_encode(buf);
                if(r.err){
                    return r;
                }
                buf = r.unwrap();
            }
        }

        return Ok(buf);
    };
}

export class BuckyMapDecoder< K extends RawEncode, V extends RawEncode > implements RawDecode<BuckyMap<K,V>> {

    readonly size_decoder: BuckySizeDecoder;
    readonly key_decoder: RawDecode<K>;
    readonly value_decoder: RawDecode<V>;

    constructor(key_decoder: RawDecode<K>, value_decoder: RawDecode<V>){
        this.size_decoder = new BuckySizeDecoder();
        this.key_decoder = key_decoder;
        this.value_decoder = value_decoder;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[BuckyMap<K,V>, Uint8Array]>{
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
        const dict = new Map<K,V>();
        for(let i=0;i<length;i++){
            let key;
            {
                const r = this.key_decoder.raw_decode(buf);
                if(r.err){
                    return r;
                }else{
                    [key, buf] = r.unwrap();
                }
            }

            let value;
            {
                const r = this.value_decoder.raw_decode(buf);
                if(r.err){
                    return r;
                }else{
                    [value, buf] = r.unwrap();
                }
            }

            // base_trace('key:', key);
            dict.set(key,value);
        }

        const map = new BuckyMap(dict);
        const ret:[BuckyMap<K,V>, Uint8Array] = [map, buf];

        return Ok(ret);
    }
}