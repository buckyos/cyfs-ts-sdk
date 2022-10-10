import * as cyfs from "../../sdk";
import { Command, InvalidArgumentError, Option } from "commander";
import { CyfsToolConfig, load_desc_and_sec } from "../lib/util";
import JSBI from "jsbi";

import fs from 'fs';
import * as path from 'path';

function myParseInt(value: string, dummyPrevious: number) {
    // parseInt 参数为字符串和进制数
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
        throw new InvalidArgumentError('Not a number.');
    }
    return parsedValue;
}

async function get_objid_from_str(client: cyfs.MetaClient, str: string): Promise<cyfs.BuckyResult<cyfs.ObjectId>> {
    const to_id = cyfs.ObjectId.from_str(str);
    if (to_id.ok) {
        return to_id;
    }

    console.warn(`${str} is not a valid id, try search as name`);
    const name_status = await client.getName(str);
    if (name_status.ok && name_status.unwrap().is_some()) {
        return await name_status.unwrap().unwrap().name_info.record.link.match({
            ObjectLink: async (link) => cyfs.Ok(link),
            OtherNameLink: async (name) => {return await get_objid_from_str(client, name)},
            IPLink: async() => {return cyfs.Err(new cyfs.BuckyError(cyfs.BuckyErrorCode.NotFound, `name ${str} is a ip link`))}
        })!;
    }

    return cyfs.Err(new cyfs.BuckyError(cyfs.BuckyErrorCode.NotFound, `cannot find name ${str}'s name link`))
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
            .requiredOption("-c, --caller <caller file path>", "desc and sec file path, exclude extension", path.join(config.user_profile_dir, 'people'))
            .option("-v, --value <balance>", "balance from caller to desc account", JSBI.BigInt, JSBI.BigInt(0))
            .option("-u, --update", "force update body time on put")
            .action(async (options) => {
                const meta_client = cyfs.create_meta_client(options.endpoint) 
                await put_desc(meta_client, options);
            })
        )
        .addCommand(new Command("transfer")
            .alias("trans")
            .description("trans balance to other account")
            .requiredOption("-t, --to <to>", "to account id or name")
            .requiredOption("-f, --from <from file path>", "desc and sec file path, exclude extension", path.join(config.user_profile_dir, 'people'))
            .argument("<amount>", "balance amount, Qiu")
            .argument("[coinid]", "coin id", myParseInt, 0)
            .action(async (options) => {
                const meta_client = cyfs.create_meta_client(options.endpoint) 
                await transfer(meta_client, options);
            })
        )
        .addCommand(new Command("withdraw")
            .description("withdraw from object account")
            .argument("<account>", "object account")
            .argument("<balance>", "balance value to withdraw")
            .argument("[coinid]", "coin id", myParseInt, 0)
            .requiredOption("-c, --caller <caller file path>", "desc and sec file path, exclude extension", path.join(config.user_profile_dir, 'people'))
            .action(async (options) => {
                const meta_client = cyfs.create_meta_client(options.endpoint) 
                await withdraw(meta_client, options);
            })
        )
        .addCommand(new Command("bidname")
            .description("bid a name on meta chain")
            .requiredOption("-c, --caller <caller file path>", "desc and sec file path, exclude extension", path.join(config.user_profile_dir, 'people'))
            .option("-o, --owner <owner_id>", "name owner, default = caller")
            .argument("<name>", "name want to bid")
            .argument("[bid_price]", "bid price")
            .argument("[rent]", "name rent price")
            .action(async (options) => {
                const meta_client = cyfs.create_meta_client(options.endpoint) 
                await bidname(meta_client, options);
            })
        )
        .addCommand(new Command("namelink")
            .description("link name to an obj or name")
            .requiredOption("-c, --caller <caller file path>", "desc and sec file path, exclude extension", path.join(config.user_profile_dir, 'people'))
            .argument("<name>", "name want to link")
            .addOption(new Option("-t --type <type>", "link type").choices(["obj", "name", "ip"]).makeOptionMandatory(true))
            .argument("<obj>", "obj to link")
            .action(async (options) => {
                const meta_client = cyfs.create_meta_client(options.endpoint) 
                await namelink(meta_client, options);
            })
        )
        .addCommand(new Command("getname")
            .description("get name info")
            .argument("<name>", "name")
            .action(async (options) => {
                const meta_client = cyfs.create_meta_client(options.endpoint) 
                await getname(meta_client, options);
            })
        )
}

async function put_desc(client: cyfs.MetaClient, options: any) {
    if (!fs.existsSync(options.caller+".sec")) {
        console.error('cannot find caller desc/sec path')
        return;
    }
    
    console.log(`use caller at ${options.caller}`);
    const [caller, sec] = load_desc_and_sec(options.caller);
    let send_desc: cyfs.AnyNamedObject;
    if (options.desc) {
        send_desc = new cyfs.AnyNamedObjectDecoder().raw_decode(new Uint8Array(fs.readFileSync(options.desc))).unwrap()[0];
    } else {
        send_desc = caller;
    }

    if (options.update) {
        send_desc.body().unwrap().increase_update_time(cyfs.bucky_time_now());
    }

    const desc_id = send_desc.desc().calculate_id();

    let send_meta_desc;
    if (send_desc.desc().is_standard_object()) {
        const r = cyfs.SavedMetaObject.try_from(send_desc as cyfs.StandardObject);
        if (r.ok) {
            send_meta_desc = r.unwrap();
        }
    }
    
    if (send_meta_desc === undefined) {
        send_meta_desc = cyfs.SavedMetaObject.Data(new cyfs.Data(desc_id, send_desc.encode_to_buf().unwrap()))
    }

    const update = (await client.getDesc(desc_id)).ok;
    const price = options.price?cyfs.Some(options.price):cyfs.None;
    const coinid = options.coinid?cyfs.Some(options.coinid):cyfs.None;
    let r;
    if (update) {
        r = await client.update_desc(caller, send_meta_desc, price, coinid, sec);
    } else {
        r = await client.create_desc(caller, send_meta_desc, options.value, price.is_some()?price.unwrap():0, coinid.is_some()?coinid.unwrap():0, sec);
    }

    console.log("put desc success, TxId", r.unwrap().to_base_58());
    
}

async function get_receipt(client: cyfs.MetaClient, id: string) {
    const ret = await client.getReceipt(cyfs.TxId.from_base_58(id).unwrap());
    if (ret.err) {
        console.error(`get receipt ${id} err ${ret.val}`);
    } else {
        const receipt_ret = ret.unwrap();
        if (receipt_ret.is_none()) {
            console.error(`cannot get receipt ${id}`)
        } else {
            const [receipt, height] = receipt_ret.unwrap();
            console.log(`get receipt ${id} on height ${height}, ret ${receipt.result}`);
            if (receipt.address.is_some()) {
                console.log(`receipt return contract address ${receipt.address.unwrap().to_base_58()}`)
            }
            if (receipt.return_value.is_some()) {
                const value = receipt.return_value.unwrap();
                console.log(`return value ${value.toHex()}`);
            }
        }
    }
}

async function transfer(client: cyfs.MetaClient, options: any) {
    if (!fs.existsSync(options.from+".sec")) {
        console.error('cannot find from desc/sec path')
        return;
    }

    console.log(`use from account file at ${options.from}`);
    const [from, sec] = load_desc_and_sec(options.from);

    const to = await get_objid_from_str(client, options.to);
    if (to.err) {
        console.error(`invalid to account ${options.to}`)
        return;
    }
    
    const hash = await client.trans_balance(from, to.unwrap(), cyfs.JSBI.BigInt(options.amount), options.coinid, sec);
    if (hash.err) {
        console.error(`trans from ${from.calculate_id()} to ${to.unwrap()} amount ${options.amount} failed, err ${hash.val}`)
    } else {
        console.info(`trans from ${from.calculate_id()} to ${to.unwrap()} amount ${options.amount} success, tx ${hash.unwrap().object_id}`)
    }
}

async function withdraw(client: cyfs.MetaClient, options: any) {
    if (!fs.existsSync(options.caller+".sec")) {
        console.error('cannot find caller desc/sec path')
        return;
    }

    console.log(`use caller account file at ${options.caller}`);
    const [caller, sec] = load_desc_and_sec(options.caller);
    
    const account = await get_objid_from_str(client, options.account);
    if (account.err) {
        console.error(`invalid account ${options.to}`)
        return;
    }

    const hash = await client.withdraw_from_file(caller, account.unwrap(), cyfs.JSBI.BigInt(options.amount), options.coinid, sec);

    if (hash.err) {
        console.error(`withdraw from ${account.unwrap()} to ${caller.calculate_id()} amount ${options.amount} failed, err ${hash.val}`)
    } else {
        console.info(`withdraw from ${account.unwrap()} to ${caller.calculate_id()} amount ${options.amount} success, tx ${hash.unwrap().object_id}`)
    }
}

async function bidname(client: cyfs.MetaClient, options: any) {
    if (!fs.existsSync(options.caller+".sec")) {
        console.error('cannot find caller desc/sec path')
        return;
    }

    console.log(`use caller account file at ${options.caller}`);
    const [caller, sec] = load_desc_and_sec(options.caller);

    let owner: cyfs.Option<cyfs.ObjectId> = cyfs.None;
    if (options.owner) {
        const owner_ret = await get_objid_from_str(client, options.owner);
        if (owner_ret.ok) {
            owner = cyfs.Some(owner_ret.unwrap())
        }
    }

    const hash = await client.bid_name(caller, owner, options.name, cyfs.JSBI.BigInt(options.bid_price), options.rent, sec);

    if (hash.err) {
        console.error(`bidname ${options.name} by ${caller.calculate_id()} failed, err ${hash.val}`)
    } else {
        console.info(`bidname ${options.name} by ${caller.calculate_id()} success, tx ${hash.unwrap().object_id}`)
    }
}

async function namelink(client: cyfs.MetaClient, options: any) {
    if (!fs.existsSync(options.caller+".sec")) {
        console.error('cannot find caller desc/sec path')
        return;
    }

    console.log(`use caller account file at ${options.caller}`);
    const [caller, sec] = load_desc_and_sec(options.caller);

    const name_ret = await client.getName(options.name);
    if (name_ret.err) {
        console.error(`get name ${options.name} info from chain err ${name_ret.val}`)
        return;
    }

    if (name_ret.unwrap().is_none()) {
        console.error(`not found name ${options.name} info from chain`)
        return;
    }

    const info = name_ret.unwrap().unwrap().name_info;

    switch (options.type) {
        case "name":
            info.record.link = cyfs.NameLink.OtherNameLink(options.obj)
            break;
        case "obj":
            info.record.link = cyfs.NameLink.ObjectLink(cyfs.ObjectId.from_str(options.obj).unwrap())
            break;
        case "ip":
            console.error(`not support link name to ip`);
            return;
        default:
            console.error(`link type ${options.type} invalid`);
            return;
    }

    const hash = await client.update_name(caller, options.name, info, 0, sec);

    if (hash.err) {
        console.error(`update name ${options.name} info failed, err ${hash.val}`)
    } else {
        console.info(`update name ${options.name} info success, tx ${hash.unwrap().object_id}`)
    }
}


async function getname(client: cyfs.MetaClient, options: any) {
    const info_ret = await client.getName(options.name);
    if (info_ret.err) {
        console.error(`get name ${options.name} err ${info_ret.val}`)
        return;
    }

    if (info_ret.unwrap().is_none()) {
        console.error(`cannot find name ${options.name} on meta chain`);
        return
    }

    const info = info_ret.unwrap().unwrap()

    console.info(`find name ${options.name}, state ${info.name_state}, owner ${info.name_info.owner.is_some()?info.name_info.owner.unwrap():"none"}, ${info.name_info.record.link}`);
}