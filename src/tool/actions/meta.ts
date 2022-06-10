import * as cyfs from "../../sdk";
import { Command, InvalidArgumentError } from "commander";
import { CyfsToolConfig, get_owner_path, load_desc_and_sec } from "../lib/util";
import { CyfsToolContext } from "../lib/ctx";
import JSBI from "jsbi";

import fs from 'fs';

function myParseInt(value: string, dummyPrevious: string) {
    // parseInt 参数为字符串和进制数
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
        throw new InvalidArgumentError('Not a number.');
    }
    return parsedValue;
}

export function makeCommand(config: CyfsToolConfig) {
    return new Command("meta")
        .option("-e, --endpoint <endpoint>", "meta endpoint")
        .addCommand(new Command("receipt")
            .argument("<txid>", "transcation id to see receipt")
            .action(async (options) => {
                const meta_client = cyfs.create_meta_client(options.endpoint)
                await get_receipt(meta_client, options.txid)
            })
        )
        .addCommand(new Command("putdesc")
            .description("create or update desc on meta")
            .argument("[price]", "desc rent price", myParseInt)
            .argument("[coinid]", "desc rent coinid", myParseInt)
            .option("-d, --desc <desc file>", "desc file send to meta, default caller`s desc")
            .option("-c, --caller <caller file path>", "desc and sec file path, exclude extension")
            .option("-v, --value <balance>", "balance from caller to desc account", JSBI.BigInt, JSBI.BigInt(0))
            .option("-u, --update", "force update body time on put")
            .action(async (options) => {
                const ctx = new CyfsToolContext(process.cwd());
                ctx.init();
                const meta_client = cyfs.create_meta_client(options.endpoint) 
                await put_desc(meta_client, options, config, ctx);
            })
        )
}

async function put_desc(client: cyfs.MetaClient, options: any, config: CyfsToolConfig, ctx: CyfsToolContext) {
    let path = get_owner_path(options.caller, config, ctx);
    console.log(`use caller at ${path}`);
    let [caller, sec] = load_desc_and_sec(path);
    let send_desc: cyfs.AnyNamedObject;
    if (options.desc) {
        send_desc = new cyfs.AnyNamedObjectDecoder().raw_decode(new Uint8Array(fs.readFileSync(options.desc))).unwrap()[0];
    } else {
        send_desc = caller;
    }

    if (options.update) {
        send_desc.body().unwrap().increase_update_time(cyfs.bucky_time_now());
    }

    let desc_id = send_desc.desc().calculate_id();

    let send_meta_desc;
    if (send_desc.desc().is_standard_object()) {
        let r = cyfs.SavedMetaObject.try_from(send_desc as cyfs.StandardObject);
        if (r.ok) {
            send_meta_desc = r.unwrap();
        }
    }
    
    if (send_meta_desc === undefined) {
        send_meta_desc = cyfs.SavedMetaObject.Data(new cyfs.Data(desc_id, send_desc.encode_to_buf().unwrap()))
    }

    let update = (await client.getDesc(desc_id)).ok;
    let price = options.price?cyfs.Some(options.price):cyfs.None;
    let coinid = options.coinid?cyfs.Some(options.coinid):cyfs.None;
    let r;
    if (update) {
        r = await client.update_desc(caller, send_meta_desc, price, coinid, sec);
    } else {
        r = await client.create_desc(caller, send_meta_desc, options.value, price.is_some()?price.unwrap():0, coinid.is_some()?coinid.unwrap():0, sec);
    }

    console.log("put desc success, TxId", r.unwrap().to_base_58());
    
}

async function get_receipt(client: cyfs.MetaClient, id: string) {
    let ret = await client.getReceipt(cyfs.TxId.from_base_58(id).unwrap());
    if (ret.err) {
        console.error(`get receipt ${id} err ${ret.val}`);
    } else {
        let receipt_ret = ret.unwrap();
        if (receipt_ret.is_none()) {
            console.error(`cannot get receipt ${id}`)
        } else {
            let [receipt, height] = receipt_ret.unwrap();
            console.log(`get receipt ${id} on height ${height}, ret ${receipt.result}`);
            if (receipt.address.is_some()) {
                console.log(`receipt return contract address ${receipt.address.unwrap().to_base_58()}`)
            }
            if (receipt.return_value.is_some()) {
                let value = receipt.return_value.unwrap();
                console.log(`return value ${value.toHex()}`);
            }
        }
    }
}