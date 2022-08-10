import { BuckyError, BuckyErrorCode, BuckyResult, Err, Ok, PrivateKey } from "../cyfs-base";
import { Seed } from "./seed";
import { CyfsChainBipPath } from "./path";
import { ExtendedPrivateKey } from "./bip32";
import { DerivationPath } from "./bip44";

export class CyfsSeedKeyBip {
    constructor(private seed: Uint8Array){
        console.assert(this.seed.length === 64);
    }

    static fix_mnemonic(mnemonic: string): BuckyResult<string> {
        let words = mnemonic.split(" ");
        if (words.length !== 12) {
            const msg = `invalid mnemonic words: len=${words.length}`;
            console.error(msg);

            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        words = words.map((value) => {
            return value.trim();
        })
        const new_mnemonic = words.join(" ");

        return Ok(new_mnemonic)
    }

    static from_mnemonic(mnemonic_str: string, password?: string): BuckyResult<CyfsSeedKeyBip> {
        let mnemonic_r = CyfsSeedKeyBip.fix_mnemonic(mnemonic_str);
        if (mnemonic_r.err) {
            return mnemonic_r;
        }

        password = password || "";

        let seed_key = Seed.new(mnemonic_r.unwrap(), password);

        // 64bytes
        console.assert(seed_key.bytes.length === 64, "invalid seed key length!");

        return Ok(new CyfsSeedKeyBip(seed_key.bytes))
    }

    static from_private_key(private_key: string, people_id: string): BuckyResult<CyfsSeedKeyBip> {
        // device的密钥使用peopleId作为password
        let seed_key = Seed.new_from_private_key(private_key, people_id);

        // 64bytes
        console.assert(seed_key.bytes.length === 64, "invalid seed key length!");

        return Ok(new CyfsSeedKeyBip(seed_key.bytes))
    }

    static from_string(s: string, password?: string): BuckyResult<CyfsSeedKeyBip> {
        password = password || "";

        let seed_key = Seed.new_from_string(s, password);

        // 64bytes
        console.assert(seed_key.bytes.length === 64, "invalid seed key length!");

        return Ok(new CyfsSeedKeyBip(seed_key.bytes))
    }

    sub_key(path: CyfsChainBipPath): BuckyResult<PrivateKey> {
        const path_str = path.to_string();

        let dpath = DerivationPath.from_str(path_str);
        if (dpath.err) {
            return dpath;
        }

        let epk = ExtendedPrivateKey.derive(this.seed, dpath.unwrap());
        if (epk.err) {
            return epk;
        }

        return Ok(epk.unwrap().secret())
    }

    // 直接从path来生成子密钥, 对path合法性不做检测
    sub_key_direct_by_path(path: string): BuckyResult<PrivateKey> {
        console.debug(`will derive direct by path=${path}`);

        let dpath = DerivationPath.from_str(path);
        if (dpath.err) {
            return dpath;
        }

        let epk = ExtendedPrivateKey.derive(this.seed, dpath.unwrap());
        if (epk.err) {
            return epk;
        }
        return Ok(epk.unwrap().secret())
    }
}