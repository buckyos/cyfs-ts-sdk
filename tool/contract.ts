#!/usr/bin/env node

import * as path from 'path';
import * as fs from 'fs-extra';
import * as cyfs from '../src';

import { Command, InvalidOptionArgumentError } from 'commander';

function OptionParseInt(value:string, prev: any): number {
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
        throw new InvalidOptionArgumentError('Not a number.');
    }
    return parsedValue;
}

async function main() {
    const package_json = fs.readJSONSync(path.join(__dirname, "../package.json"));
    console.log("[cyfs], 工具目录：", __dirname);
    console.log("[cyfs], 版本号：", package_json.version);

    const program = new Command("cyfs-contract");
    program
        .version(package_json.version)
        .requiredOption("-e, --meta-endpoint <endpoint>", "meta chain endpoint", "test")
        .requiredOption("-b, --bin <bin_file>", "contract bin file path")
        .requiredOption("-o, --owner <owner_path>", "owner keypair path, exclude extension")
        .requiredOption("-g, --gas-price <gas_parce>", "gas price", OptionParseInt)
        .requiredOption("-m, --max-fee <max_fee>", "max fee", OptionParseInt)
        .option("-a, --abi <abi_path>", "abi file path when contract has constrator params")
        .option("-p, --params <params...>", "contract`s constrator params")
        .parse();

    let option = program.opts();

    let meta_client = cyfs.create_meta_client(option.metaEndpoint);
    let bin_code = Uint8Array.prototype.fromHex(fs.readFileSync(option.bin, 'utf-8')).unwrap();

    let [caller, buf1] = new cyfs.StandardObjectDecoder().raw_decode(new Uint8Array(fs.readFileSync(option.owner+".desc"))).unwrap();
    let [secret, buf2] = new cyfs.PrivatekeyDecoder().raw_decode(new Uint8Array(fs.readFileSync(option.owner+".sec"))).unwrap();

    if (option.abi && option.params) {
        let abi = fs.readFileSync(option.abi, 'utf-8');
        bin_code = cyfs.encode_constructor(abi, bin_code, option.params);
    }

    let ret = await meta_client.create_contract(caller, secret, 0n, bin_code, option.gasPrice, option.maxFee);
    if (ret.err) {
        console.error("deploy contract err ", ret.val);
    } else {
        console.log("deploy contract success, TxId ", ret.unwrap().to_base_58());
    }
}

main().then(()=>{
    process.exit(0)
});