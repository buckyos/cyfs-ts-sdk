

import { Err, Ok, BuckyResult} from "./results";
import { RawEncode, RawDecode, RawEncodePurpose} from "./raw_encode";
import { HashValue } from "../crypto/hash";

/**
 * 编码并计算哈希
 * @param t 实现了RawEncode的对象
 */
export function raw_hash_encode<T extends RawEncode>(t: T): BuckyResult<HashValue>{
    // if (typeof (t as any)["raw_hash_encode"] === 'function') {
    //    return (t as any)["raw_hash_encode"]();
    // }

    // 如果实现了raw_hash_encode方法，那么直接调用
    {
        const r = t.raw_hash_encode?.();
        if (r) {
            return r;
        }
    }

    const size = t.raw_measure(undefined, RawEncodePurpose.Hash).unwrap();
    const buf = new Uint8Array(size);

    // base_trace("~~~~");
    const ret = t.raw_encode(buf, undefined, RawEncodePurpose.Hash);
    if(ret.err){
        return Err(ret.val);
    }

    // console.info(`hash_code buf: len=${size}, buf=$`, buf.toString());

    const remain_buf = ret.unwrap();
    const total_length = buf.length;
    const encoded_length = buf.length - remain_buf.length;

    const encoded_buf =  buf.slice(0, encoded_length);

    // base_trace("encoded_buf:", encoded_buf);
    const hash_value = HashValue.hash_data(encoded_buf);
    return new Ok(hash_value);
}

/**
 * 计算哈希并解码
 * @param decoder 解码器
 * @param buf 待解码的Buffer
 */
export function raw_hash_decode<T, D extends RawDecode<T>>(decoder: D, buf: Uint8Array): BuckyResult<[HashValue, Uint8Array]> {
    const ret = decoder.raw_decode(buf);
    if(ret.err){
        return Err(ret.val);
    }

    const [v,next_buf] = ret.unwrap();

    const decoded_buf_length = buf.length - next_buf.length;
    const decoded_buf = buf.slice(0, decoded_buf_length);

    const hash_value = HashValue.hash_data(decoded_buf);

    const val:[HashValue, Uint8Array] = [hash_value, next_buf];

    return Ok(val);
}