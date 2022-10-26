import {util, random} from 'node-forge'
import * as secp256k1 from 'secp256k1'
import { AesKey } from '../cyfs-base'
import * as hkdf from '@noble/hashes/hkdf'
import {sha256} from '@noble/hashes/sha256'

export function generate_keypair(): [Uint8Array, Uint8Array] {
    let privKey
    do {
        privKey = util.binary.raw.decode(random.getBytesSync(32))
    } while (!secp256k1.privateKeyVerify(privKey))

    return [privKey, secp256k1.publicKeyCreate(privKey, false)]
}

export function encapsulate(sk: Uint8Array, peer_pk: Uint8Array): AesKey {
    const full_pk = secp256k1.publicKeyConvert(peer_pk, false);
    const shared_point = secp256k1.publicKeyTweakMul(full_pk, sk, false);
    const master = secp256k1.publicKeyCombine([secp256k1.publicKeyCreate(sk), shared_point])

    return hkdf_sha256(master)
}

export function decapsulate(pk: Uint8Array, peer_sk: Uint8Array): AesKey {
    const full_pk = secp256k1.publicKeyConvert(pk, false);
    const shared_point = secp256k1.publicKeyTweakMul(full_pk, peer_sk, false);
    const master = secp256k1.publicKeyCombine([full_pk, shared_point])

    return hkdf_sha256(master)
}

function hkdf_sha256(master: Uint8Array): AesKey {
    const out = hkdf.hkdf(sha256, master, undefined, undefined, 48)
    return new AesKey(out)
}