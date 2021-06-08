import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "./results";
import { RawEncode, RawDecode, Compareable} from "./raw_encode";
import {} from "./buffer";
import { BuckySize, BuckySizeDecoder} from "./bucky_usize";

export class BuckyHashSetValues<V> implements Iterable<V>{
    constructor(public values: IterableIterator<V>){
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
            return {value: n.value, done: false}
        }
    }
}

export class BuckyHashSetEntries<V> implements Iterable<[V,V]>{
    constructor(public values: IterableIterator<V>){
        // ignore
    }

    [Symbol.iterator](){
        return this;
    }

    next():IteratorResult<[V,V]> {
        const n = this.values.next();
        if(n.done){
            return {value: undefined, done: true};
        }else{
            const v = n.value;
            return {value: [v,v], done: false}
        }
    }
}

export class BuckyHashSet<T extends RawEncode & Compareable<T>> implements RawEncode {

    private readonly hash_map: Map<symbol, T>;

    constructor(){
        this.hash_map = new Map<symbol, T>();
    }

    get size():number {
        return  this.hash_map.size;
    }

    add(v: T): BuckyHashSet<T>{
        const k = v.hashCode();
        if(!this.hash_map.has(k)){
            this.hash_map.set(k, v);
        }
        return this;
    }

    clear(): void{
        this.hash_map.clear();
    }

    delete(v: T):boolean {
        const k = v.hashCode();
        return this.hash_map.delete(k);
    }

    has(v: T):boolean {
        const k = v.hashCode();
        return this.hash_map.has(k);
    }

    keys(): IterableIterator<T> {
        return new BuckyHashSetValues(this.hash_map.values());
    }

    values(): IterableIterator<T> {
        return new BuckyHashSetValues(this.hash_map.values());
    }

    entries(): IterableIterator<[T, T]> {
        const s = new Set();
        return new BuckyHashSetEntries(this.hash_map.values());
    }

    forEach(callback: (value: T, value2: T, set: BuckyHashSet<T>)=>void){
        for(const e of this.entries()){
            callback(e[0], e[1], this);
        }
    }

    to<K1>(ke:(k:T)=>K1):Set<K1>{
        const map = new Set<K1>();
        for(const v of this.values()){
            map.add(ke(v));
        }
        return map;
    }

    array(): T[]{
        return Array.from(this.values());
    }

    raw_measure():BuckyResult<number>{
        let bytes = 0;

        bytes += new BuckySize(this.size).raw_measure().unwrap();

        for(const e of this.values()){
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
            const r = new BuckySize(this.size).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        // encode items
        for(const e of this.values()){
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

export class BuckyHashSetDecoder<
    T extends RawEncode & Compareable<T>,
> implements RawDecode<BuckyHashSet<T>> {

    readonly decoder: RawDecode<T>;
    readonly size_decoder: BuckySizeDecoder;

    constructor(decoder: RawDecode<T>){
        this.size_decoder = new BuckySizeDecoder();
        this.decoder = decoder;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[BuckyHashSet<T>, Uint8Array]>{
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
        const hash_set = new BuckyHashSet<T>();
        for(let i=0;i<size;i++){
            const result = this.decoder.raw_decode(buf);
            if(result.err){
                return result;
            }else{
                let item;
                [item, buf] = result.unwrap();
                hash_set.add(item);
            }
        }

        const ret:[BuckyHashSet<T>, Uint8Array] = [hash_set, buf];

        return Ok(ret);
    }
}