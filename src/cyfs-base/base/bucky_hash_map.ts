import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "./results";
import { RawEncode, RawDecode, DecodeBuilder, Compareable} from "./raw_encode";
import {} from "./buffer";
import { BuckySize, BuckySizeDecoder} from "./bucky_usize";


export class BuckyHashMapKeys<K,V> implements Iterable<K>{
    constructor(public values: IterableIterator<[K,V]>){
        // ignore
    }

    [Symbol.iterator](){
        return this;
    }

    next():IteratorResult<K> {
        const n = this.values.next();
        if(n.done){
            return {value: undefined, done: true};
        }else{
            const [k,v] = n.value;
            return {value: k, done: false}
        }
    }
}

export class BuckyHashMapValues<K,V> implements Iterable<V>{
    constructor(public values: IterableIterator<[K,V]>){
        // ignore
    }

    [Symbol.iterator](){
        return this;
    }

    next():IteratorResult<V> {
        const n = this.values.next();
        if(n.done){
            return {value: undefined, done: true};
        }else{
            const [k,v] = n.value;
            return {value: v, done: false}
        }
    }
}

export class BuckyHashMapEntries<K,V> implements Iterable<[K,V]>{
    constructor(public values: IterableIterator<[K,V]>){
        // ignore
    }

    [Symbol.iterator](){
        return this;
    }

    next():IteratorResult<[K,V]> {
        const n = this.values.next();
        if(n.done){
            return {value: undefined, done: true};
        }else{
            const [k,v] = n.value;
            return {value: [k,v], done: false}
        }
    }
}

export class BuckyHashMap<K extends RawEncode & Compareable<K>, V extends RawEncode> implements RawEncode {

    private hash_map: Map<symbol, [K,V]>;

    constructor(){
        this.hash_map = new Map();
    }

    get size(): number{
        return this.hash_map.size;
    }

    clear(){
        this.hash_map.clear();
    }

    delete(key: K){
        const key_s = key.hashCode();
        this.hash_map.delete(key_s);
    }

    has(key: K){
        const key_s = key.hashCode();
        return this.hash_map.has(key_s);
    }

    set(key: K, v: V){
        const key_s = key.hashCode();
        this.hash_map.set(key_s,[key, v]);
    }

    get(key: K): V|undefined {
        const key_s = key.hashCode();
        return this.hash_map.get(key_s)?.[1];
    }

    keys(): IterableIterator<K> {
        return new BuckyHashMapKeys(this.hash_map.values());
    }

    values(): IterableIterator<V> {
        return new BuckyHashMapValues(this.hash_map.values());
    }

    entries(): IterableIterator<[K,V]> {
        return new BuckyHashMapEntries(this.hash_map.values());
    }

    forEach(callback: (value: V, key: K, map: BuckyHashMap<K,V>)=>void){
        for(const [s, [k, v]] of this.hash_map){
            callback(v, k, this);
        }
    }

    to<K1,V1>(ke:(k:K)=>K1, ve:(v:V)=>V1):Map<K1,V1>{
        const map = new Map<K1,V1>();
        for(const [k,v] of this.entries()){
            map.set(ke(k),ve(v));
        }
        return map;
    }

    raw_measure():BuckyResult<number>{
        let bytes = 0;

        bytes += new BuckySize(this.size).raw_measure().unwrap();

        for(const [k,v] of this.entries()){
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
            const r = new BuckySize(this.size).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        // encode items
        const keys = [...this.keys()];
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
                const v = this.get(k)!;
                const r = v.raw_encode(buf);
                if(r.err){
                    return r;
                }
                buf = r.unwrap();
            }
        }

        return Ok(buf);
    }
}

export class BuckyHashMapDecoder< K extends RawEncode & Compareable<K>, V extends RawEncode > implements RawDecode<BuckyHashMap<K,V>> {

    readonly size_decoder: BuckySizeDecoder;
    readonly key_decoder: RawDecode<K>;
    readonly value_decoder: RawDecode<V>;

    constructor(key_decoder: RawDecode<K>, value_decoder: RawDecode<V>){
        this.size_decoder = new BuckySizeDecoder();
        this.key_decoder = key_decoder;
        this.value_decoder = value_decoder;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[BuckyHashMap<K,V>, Uint8Array]>{
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
        const hash_map = new BuckyHashMap<K,V>();
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

            hash_map.set(key, value);
        }

        const ret:[BuckyHashMap<K,V>, Uint8Array] = [hash_map, buf];

        return Ok(ret);
    }
}