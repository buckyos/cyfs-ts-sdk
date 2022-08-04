import * as bip39 from 'bip39'
import {pbkdf2Sync} from 'pbkdf2'

const PBKDF2_ROUNDS = 2048;
const PBKDF2_BYTES = 64;

function pbkdf2(input: Uint8Array, salt: string): Uint8Array {
    const seed = pbkdf2Sync(input, salt, PBKDF2_ROUNDS, PBKDF2_BYTES, 'sha512');
    
    return new Uint8Array(seed)
}

export class Seed {
    constructor(public bytes: Uint8Array) {}

    static new(mnemonic: string, password: string): Seed {
        const salt = `cyfs-mnemonic-${password}`

        const en = Uint8Array.prototype.fromHex(bip39.mnemonicToEntropy(mnemonic)).unwrap()
        const bytes = pbkdf2(en, salt);

        return new Seed(bytes)
    }

    static new_from_private_key(private_key: string, password: string): Seed {
        const salt = `cyfs-mnemonic-${password}`
        const pk = Uint8Array.prototype.fromHex(private_key).expect("invalid hex private_key string!");

        const bytes = pbkdf2(pk, salt);

        return new Seed(bytes)
    }

    static new_from_string(s: string, password: string): Seed {
        const salt = `cyfs-mnemonic-${password}`
        
        const bytes = pbkdf2(new TextEncoder().encode(s), salt);

        return new Seed(bytes)
    }
}