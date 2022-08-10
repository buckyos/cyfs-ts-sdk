import { Err, Ok, BuckyResult} from "../base/results";
import { RawEncode, RawDecode, RawEncodePurpose } from "../base/raw_encode";
import {} from "../base/buffer";
import { BuckyNumber, BuckyNumberDecoder } from "../base/bucky_number";

import {pki, asn1, util, random, md} from 'node-forge'
import { KEY_TYPE_RSA, KEY_TYPE_SECP256K1, PublicKey, RAW_PUBLIC_KEY_RSA_1024_CODE, RAW_PUBLIC_KEY_RSA_2048_CODE, RAW_PUBLIC_KEY_RSA_3072_CODE, Rsa1024SignData, Rsa2048SignData, RSAPublicKey, Signature, SignatureSource } from "./public_key";
import { bucky_time_now } from "../base/time";
import { HashValue } from "./hash";
import {generate_rsa_by_rng, RsaRng} from './key_generator'

function bits_2_keysize(bits: number): number {
    let code;
    switch (bits){
        case 1024: {
            code = RAW_PUBLIC_KEY_RSA_1024_CODE;
            break;
        }
        case 2048: {
            code = RAW_PUBLIC_KEY_RSA_2048_CODE;
            break;
        }
        case 3072: {
            code = RAW_PUBLIC_KEY_RSA_3072_CODE;
            break;
        }
        default: {
            throw new Err("unsupport privice key bits");
        }
    }

    return code;
}

class NodeForgeRandom {
    getBytesSync(length: number): Uint8Array {
        return util.binary.raw.decode(random.getBytesSync(length))
    }
}

export abstract class PrivateKey implements RawEncode{
    constructor(readonly type: number){
    }
    abstract raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number>;
    abstract raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array>;

    toString(): string {
        return "[Protected PrivateKey]";
    }

    static generate_rsa(bits: number): BuckyResult<PrivateKey> {
        return PrivateKey.generate_rsa_by_rng(new NodeForgeRandom(), bits);
    }

    static generate_rsa_by_rng(rng: RsaRng, bits: number): BuckyResult<PrivateKey> {
        const pk = generate_rsa_by_rng(rng, bits);
        //const keypair = pki.rsa.generateKeyPair({bits: bits, prng: rng});
        const code = bits_2_keysize(bits);
        return Ok(new RSAPrivateKey(code, pk))
    }

    static generate_secp256k1(): BuckyResult<PrivateKey> {
        throw new Error("secp256k1 not supported.");
    }

    abstract public(): PublicKey;
    abstract sign(data: Uint8Array, sign_source: SignatureSource): Signature;
    abstract decrypt(input: Uint8Array, out: Uint8Array): BuckyResult<number>;

    to_vec(): BuckyResult<Uint8Array>{
        const size = this.raw_measure().unwrap();
        const buf = new Uint8Array(size);

        const ret = this.raw_encode(buf);
        if (ret.err) {
            return ret;
        }
        return Ok(buf);
    }
}

export class RSAPrivateKey extends PrivateKey{
    constructor(public code: number, public value: pki.rsa.PrivateKey) {
        super(KEY_TYPE_RSA)
    }
    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        const der_key = asn1.toDer(pki.privateKeyToAsn1(this.value))
        return Ok(der_key.length() + 3);
    }
    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        let r = new BuckyNumber('u8', this.type).raw_encode(buf);
        if (r.err) {
            return r;
        }
        buf = r.unwrap();
        const der_key = asn1.toDer(pki.privateKeyToAsn1(this.value))
        r = new BuckyNumber('u16', der_key.length()).raw_encode(buf);
        if (r.err) {
            return r;
        }
        buf = r.unwrap();

        buf.set(util.binary.raw.decode(der_key.bytes()) as Uint8Array);
        return Ok(buf.offset(der_key.length()));
    }
    public(): PublicKey {
        let pub_key = pki.rsa.setPublicKey(this.value.n, this.value.e)
        return new RSAPublicKey(this.code, pub_key);
    }
    sign(data: Uint8Array, sign_source: SignatureSource): Signature {
        let create_time = new BuckyNumber('u64', bucky_time_now());
        let data_new = new Uint8Array(data.length + create_time.raw_measure().unwrap());
        data_new.set(data);
        create_time.raw_encode(data_new.offset(data.length)).unwrap();
        let digest = md.sha256.create().update(util.binary.raw.encode(data_new));
        // let hash = HashValue.hash_data(data_new);
        let sign_buf = this.value.sign(digest, 'RSASSA-PKCS1-V1_5');
        let sign_data;
        switch (this.code){
            case RAW_PUBLIC_KEY_RSA_1024_CODE: {
                sign_data = new Rsa1024SignData(util.binary.raw.decode(sign_buf));
                break;
            }
            case RAW_PUBLIC_KEY_RSA_2048_CODE: {
                sign_data = new Rsa2048SignData(util.binary.raw.decode(sign_buf));
                break;
            }
            default: {
                throw new Err("unsupport privice key bits");
            }
        }
        let sign = new Signature(sign_source, 0, create_time.val, sign_data);
        return sign;
    }
    decrypt(input: Uint8Array, out: Uint8Array): BuckyResult<number> {
        let ret = this.value.decrypt(util.binary.raw.encode(input), 'RSAES-PKCS1-V1_5');
        out.set(util.binary.raw.decode(ret));
        return Ok(ret.length);
    }
}

export class Secp256k1PrivateKey extends PrivateKey{
    constructor(){
        super(KEY_TYPE_SECP256K1)
    }
    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        return Ok(32);
    }
    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        throw new Error("secp256k1 not supported.");
    }
    public(): PublicKey {
        throw new Error("Method not implemented.");
    }
    sign(data: Uint8Array, sign_source: SignatureSource): Signature {
        throw new Error("Method not implemented.");
    }
    decrypt(input: Uint8Array, out: Uint8Array): BuckyResult<number> {
        throw new Error("Method not implemented.");
    }
}

// export type PrivateKey = RSAPrivateKey | Secp256k1PrivateKey

export class PrivatekeyDecoder implements RawDecode<PrivateKey> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[PrivateKey, Uint8Array]> {
        const code = buf[0];
        buf = buf.offset(1);
        switch (code) {
            case KEY_TYPE_RSA:
                {
                    let len;
                    {
                        let r = new BuckyNumberDecoder('u16').raw_decode(buf);
                        if (r.err) {
                            return r;
                        }
                        [len, buf] = r.unwrap();
                    }
                    let der_buf = buf.slice(0, len.toNumber());
                    let pk = pki.privateKeyFromAsn1(asn1.fromDer(util.binary.raw.encode(der_buf))) as pki.rsa.PrivateKey
                    buf = buf.offset(len.toNumber());

                    let keySize = pk.n.bitLength();
                    let rsa = new RSAPrivateKey(bits_2_keysize(keySize), pk);
                    return Ok([rsa, buf] as [PrivateKey, Uint8Array]);
                }
            default:
                throw new Error("decode not rsa private key not implemented.");
        }
    }

}