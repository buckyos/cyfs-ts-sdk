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
        const hmac1 = hmac.create()
        hmac1.start('sha512', "BFC seed");
        hmac1.update(util.binary.raw.encode(seed));
        const result = hmac1.digest().bytes();
        const private_key = result.slice(0, 32);
        const chain_code = result.slice(32);

        const pk = PrivateKeySeedGen.gen(util.binary.raw.decode(private_key));
        if (pk.err) {
            return pk;
        }

        let sk = new ExtendedPrivateKey(pk.unwrap(), util.binary.raw.decode(chain_code));

        for (const child of path.path) {
            const r = sk.child(child);
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
        const hmac1 = hmac.create()
        hmac1.start('sha512', util.binary.raw.encode(this.chain_code));

        if (child.is_normal()) {
            const bytes = to_vec(this.private_key.public())
            if (bytes.err) {
                return bytes;
            }
            hmac1.update(util.binary.raw.encode(bytes.unwrap()));
        } else {
            const bytes = to_vec(this.private_key)
            if (bytes.err) {
                return bytes;
            }
            hmac1.update("\0");
            hmac1.update(util.binary.raw.encode(bytes.unwrap()))
        }

        hmac1.update(util.binary.raw.encode(child.to_bytes()));

        const result = hmac1.digest().bytes()

        const private_key = result.slice(0, 32);
        const chain_code = result.slice(32);

        const pk = PrivateKeySeedGen.gen(util.binary.raw.decode(private_key));
        if (pk.err) {
            return pk;
        }

        const sk = new ExtendedPrivateKey(pk.unwrap(), util.binary.raw.decode(chain_code));

        return Ok(sk)
    }
}