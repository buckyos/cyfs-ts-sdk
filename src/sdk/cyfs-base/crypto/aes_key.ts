import { Ok, BuckyResult} from "../base/results";
import { RawEncode, RawDecode } from "../base/raw_encode";
import {} from "../base/buffer";
import { Option } from "../base/option";
// import {sha256} from "js-sha256";
import JSBI from 'jsbi';
import { DataViewJSBIHelper } from '../../platform-spec';
import {md, util} from 'node-forge'

/**
 * KeyMixHash
 */

export const KEY_MIX_LEN = 8;

export class KeyMixHash implements RawEncode {
    m_buf: Uint8Array;

    constructor(buf: Uint8Array){
        if(buf.length!==KEY_MIX_LEN){
            throw new Error(`invalid hash length:${buf.length}`);
        }

        this.m_buf = buf;
    }

    as_slice(): Uint8Array {
        return this.m_buf;
    }

    length(): number {
        return KEY_MIX_LEN;
    }

    static default(): KeyMixHash{
        return new KeyMixHash(new Uint8Array(KEY_MIX_LEN));
    }

    static copy_from_slice(buf:Uint8Array): KeyMixHash{
        return new KeyMixHash(buf.slice(0,KEY_MIX_LEN));
    }

    raw_measure(): BuckyResult<number>{
        return Ok(KEY_MIX_LEN);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf.set(this.as_slice());
        return Ok(buf.offset(this.as_slice().length));
    }
}

export class KeyMixHashDecoder implements RawDecode<KeyMixHash>{
    raw_decode(buf: Uint8Array): BuckyResult<[KeyMixHash, Uint8Array]>{
        const buffer = buf.slice(0, KEY_MIX_LEN);
        buf = buf.offset(KEY_MIX_LEN);

        const ret:[KeyMixHash, Uint8Array] = [new KeyMixHash(buffer), buf];

        return Ok(ret);
    }
}

/**
 * AesKey
 */

export const AES_KEY_LEN = 32;

export class AesKey implements RawEncode {
    m_buf: Uint8Array;

    constructor(buf: Uint8Array){
        if(buf.length!==AES_KEY_LEN){
            throw new Error(`invalid hash length:${buf.length}`);
        }

        this.m_buf = buf;
    }

    as_slice(): Uint8Array {
        return this.m_buf;
    }

    length(): number {
        return AES_KEY_LEN;
    }

    static default(): AesKey{
        return new AesKey(new Uint8Array(AES_KEY_LEN));
    }

    static random(): AesKey {
        const buf = new Uint8Array(32);
        window.crypto.getRandomValues(buf);
        return new AesKey(buf);
    }

    static mix_hash(salt: Option<JSBI>): KeyMixHash {
        //const hash = sha256.create();
        const hash = md.sha256.create()
        if(salt.is_some()){
            const buf = new Uint8Array(4);
            const view = buf.offsetView(0);
            DataViewJSBIHelper.setBigUint64(view, 0, salt.unwrap());
            // view.setBigUint64(0, salt.unwrap());
            hash.update(util.binary.raw.encode(new Uint8Array(view.buffer)));
        }
        // const val = hash.arrayBuffer();
        const val = util.binary.raw.decode(hash.digest().bytes());
        return new KeyMixHash(val);
    }

    static copy_from_slice(buf:Uint8Array): AesKey{
        return new AesKey(buf.slice(0,AES_KEY_LEN));
    }

    raw_measure(): BuckyResult<number>{
        return Ok(AES_KEY_LEN);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf.set(this.as_slice());
        return Ok(buf.offset(this.as_slice().length));
    }
}

export class AesKeyDecoder implements RawDecode<AesKey>{
    raw_decode(buf: Uint8Array): BuckyResult<[AesKey, Uint8Array]>{
        const buffer = buf.slice(0, AES_KEY_LEN);
        buf = buf.offset(AES_KEY_LEN);

        const ret:[AesKey, Uint8Array] = [new AesKey(buffer), buf];

        return Ok(ret);
    }
}