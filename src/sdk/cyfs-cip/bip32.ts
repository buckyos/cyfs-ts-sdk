import { BuckyResult, Ok, PrivateKey, to_vec } from "../cyfs-base";
import { ChildNumber, DerivationPath } from "./bip44";
import { ChaChaRng } from "./chacharng";

import {hmac, util} from 'node-forge'

export class PrivateKeySeedGen {
    static gen(seed: Uint8Array): BuckyResult<PrivateKey> {
        const rng = new ChaChaRng(seed);
        return PrivateKey.generate_rsa_by_rng(rng, 1024);
    }
}

export class ExtendedPrivateKey {
    constructor(private private_key: PrivateKey, private chain_code: Uint8Array) {}

    /// Attempts to derive an extended private key from a path.
    static derive(seed: Uint8Array, path: DerivationPath): BuckyResult<ExtendedPrivateKey>
    {
        let hmac1 = hmac.create()
        hmac1.start('sha512', "BFC seed");
        hmac1.update(util.binary.raw.encode(seed));
        let result = hmac1.digest().bytes();
        let private_key = result.slice(0, 32);
        let chain_code = result.slice(32);

        let pk = PrivateKeySeedGen.gen(util.binary.raw.decode(private_key));
        if (pk.err) {
            return pk;
        }

        let sk = new ExtendedPrivateKey(pk.unwrap(), util.binary.raw.decode(chain_code));

        for (const child of path.path) {
            let r = sk.child(child);
            if (r.err) {
                return r;
            }

            sk = r.unwrap();
        }

        return Ok(sk)
    }

    secret(): PrivateKey {
        return this.private_key
    }

    child(child: ChildNumber): BuckyResult<ExtendedPrivateKey> {
        let hmac1 = hmac.create()
        hmac1.start('sha512', util.binary.raw.encode(this.chain_code));

        if (child.is_normal()) {
            let bytes = to_vec(this.private_key.public())
            if (bytes.err) {
                return bytes;
            }
            hmac1.update(util.binary.raw.encode(bytes.unwrap()));
        } else {
            let bytes = to_vec(this.private_key)
            if (bytes.err) {
                return bytes;
            }
            hmac1.update("\0");
            hmac1.update(util.binary.raw.encode(bytes.unwrap()))
        }

        hmac1.update(util.binary.raw.encode(child.to_bytes()));

        let result = hmac1.digest().bytes()

        let private_key = result.slice(0, 32);
        let chain_code = result.slice(32);

        let pk = PrivateKeySeedGen.gen(util.binary.raw.decode(private_key));
        if (pk.err) {
            return pk;
        }

        let sk = new ExtendedPrivateKey(pk.unwrap(), util.binary.raw.decode(chain_code));

        return Ok(sk)
    }
}