import path from "path";
import * as fs from 'fs-extra';
import * as cyfs from '../../sdk';
import JSBI from 'jsbi';
import { Command } from "commander";
import { CyfsToolConfig } from "../lib/util";
import fetch from 'node-fetch'

export function makeCommand(config: CyfsToolConfig) {
    return new Command("desc")
        .description("create temp desc and sec")
        .requiredOption("-s, --save <path>", "desc save dir", config.user_profile_dir)
        .option("-m, --mnemonic <mnemonic string>", "mnemonic string, 12 words")
        .option("--only-ood", "only gen/activate ood")
        .option("--only-runtime", "only gen/activate runtime")
        .option("-a, --activate", "activate local ood or runtime")
        .action(async (option) => {
            await run(option)

            process.exit(0);
        })
}

function create_people(mnemonic: string): [cyfs.People, cyfs.PrivateKey] {
    const gen = cyfs.CyfsSeedKeyBip.from_mnemonic(mnemonic).unwrap();

    const bip_path = cyfs.CyfsChainBipPath.new_people(
        cyfs.get_current_network(),
        0);
    const pk = gen.sub_key(bip_path).unwrap();

    const people = cyfs.People.create(undefined, [], pk.public(), cyfs.Area.from_str("00:00:0000:00").unwrap(), undefined, undefined, (build) => {
        build.no_create_time()
    });

    return [people, pk]
}

// 计算哈希
function _hashCode(strValue: string): number {
    let hash = 0;
    for (let i = 0; i < strValue.length; i++) {
        const chr = strValue.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }

    hash = Math.floor(Math.abs(hash) / 63336);

    return hash;
}

// 通过uniqueStr计算当前device索引
function _calcIndex(uniqueStr: string): number {

    // 示例用了cyfs sdk依赖的node-forge库进行计算
    const md5 = cyfs.forge.md.md5.create();
    md5.update(uniqueStr, 'utf8')
    const result = cyfs.forge.util.binary.hex.encode(md5.digest())
    const index = _hashCode(result);

    console.log(`calc init index: uniqueStr=${uniqueStr}, index=${index}`);

    return index
}

function create_device(owner: cyfs.ObjectId, pk: cyfs.PrivateKey, category: cyfs.DeviceCategory, unique_id: string, nick_name?: string): [cyfs.Device, cyfs.PrivateKey, number] {
    const gen = cyfs.CyfsSeedKeyBip.from_private_key(pk.to_vec().unwrap().toHex(), owner.to_base_58());
    const address_index = _calcIndex(unique_id)
    const path = cyfs.CyfsChainBipPath.new_device(
        0,
        cyfs.get_current_network(),
        address_index
    );
    const private_key = gen.unwrap().sub_key(path).unwrap();

    const unique = cyfs.UniqueId.copy_from_slice(cyfs.forge.util.binary.raw.decode(unique_id));
    console.info(`unique_str: ${unique_id} -> ${unique.as_slice().toHex()}`);

    const device = cyfs.Device.create(
        owner,
        unique,
        [],
        [],
        [],
        private_key.public(),
        cyfs.Area.from_str("00:00:0000:00").unwrap(),
        category,
        (builder) => {
            builder.no_create_time();
        }
    );

    if (nick_name) {
        device.set_name(nick_name);
    }


    return [device, private_key, address_index]
}

function check_desc_file(desc_path: string) {
    if (fs.existsSync(desc_path)) {
        console.error(`he identity profile already exists in ${path.dirname(desc_path)}`);
        console.error(`  * If you need to overwrite please delete manually, pay attention to backup!`);
        console.error(`  * Or specify another save location with the option -s <save_path>!`);
        process.exit(0);
    }
}

async function check_people_on_meta(meta_client: cyfs.MetaClient, people_id: cyfs.ObjectId): Promise<[cyfs.People | undefined, boolean]> {
    let people: cyfs.People | undefined = undefined, is_bind = false
    const people_r = await meta_client.getDesc(people_id);
    if (people_r.ok) {
        people_r.unwrap().match({
            People: (p) => {
                is_bind = p.body_expect().content().ood_list.length > 0;
                people = p;
            }
        })
    }

    return [people, is_bind]
}

async function run(option: any) {
    let mnemonic;
    if (option.mnemonic) {
        if (!cyfs.bip39.validateMnemonic(option.mnemonic, cyfs.bip39.wordlists.english)) {
            console.error(`invalid mnemonic:`, option.mnemonic)
            return;
        }

        mnemonic = option.mnemonic;
    } else {
        mnemonic = cyfs.bip39.generateMnemonic(128, undefined, cyfs.bip39.wordlists.english);
    }

    console.log('generateing people keypair...')
    let [people, people_pk] = create_people(mnemonic);
    const people_id = people.calculate_id()
    console.log('generated people id:', people_id.to_base_58())

    const meta_client = cyfs.create_meta_client();
    const [meta_people, is_bind] = await check_people_on_meta(meta_client, people_id)

    if (meta_people) {
        people = meta_people
    }

    if (option.activate) {
        if (!option.onlyRuntime) {
            do {
                if (is_bind) {
                    console.error(`people ${people_id.to_base_58()} already bind ood ${meta_people!.body_expect().content().ood_list[0].to_base_58()}`)
                    break;
                }
                // 激活OOD
                try {
                    const info = await (await fetch('http://127.0.0.1:1320/check')).json()
                    if (!info.activation) {
                        console.log(`will bind local ood for ${people_id.to_base_58()}`)

                        const unique_id = info.device_info.mac_address;
                        console.log('generateing ood keypair...')
                        const [ood, ood_pk, address_index] = create_device(people_id, people_pk, cyfs.DeviceCategory.OOD, unique_id);

                        // 设置People的ood_list
                        people.body_expect().content().ood_list.push(ood.device_id());
                        people.body_expect().increase_update_time(cyfs.bucky_time_now());

                        console.log('set ood info to people desc')
                        // People给ood签名
                        cyfs.sign_and_push_named_object(people_pk, ood, new cyfs.SignatureRefIndex(254)).unwrap();

                        // People给自己签名
                        cyfs.sign_and_push_named_object(people_pk, people, new cyfs.SignatureRefIndex(255)).unwrap();

                        console.log(`activate local ood...`)
                        const response = await fetch("http://127.0.0.1:1320/bind", {
                            method: 'POST',
                            headers: {
                                Accept: 'application/json', 'Content-Type': 'application/json',
                            }, body: JSON.stringify({
                                owner: people.to_hex().unwrap(), desc: ood.to_hex().unwrap(), sec: ood_pk.to_vec().unwrap().toHex(), index: address_index
                            }),
                        });
                        const ret = await response.json()
                        if (ret.result !== 0) {
                            console.error(`bind ood failed, ret`, ret.result)
                            return;
                        } else {
                            console.log('bind ood success.')
                        }

                        console.log('put people and ood desc to meta chain')

                        // People上链
                        if (meta_people) {
                            await meta_client.update_desc(people, cyfs.SavedMetaObject.try_from(people).unwrap(), undefined, undefined, people_pk);
                        } else {
                            await meta_client.create_desc(people, cyfs.SavedMetaObject.try_from(people).unwrap(), JSBI.BigInt(0), 0, 0, people_pk);
                        }

                        // OOD 上链
                        await meta_client.create_desc(ood, cyfs.SavedMetaObject.try_from(ood).unwrap(), JSBI.BigInt(0), 0, 0, ood_pk);
                    } else {
                        console.error(`local ood already binded`)
                    }
                } catch (e) {
                    console.warn(`connect to ood failed, skip ood activate`)
                }
            } while (false);
        }
        if (!option.onlyOod) {
            // 激活runtime
            try {
                const info = await (await fetch('http://127.0.0.1:1321/check')).json()
                if (!info.activation) {
                    console.log(`will bind local runtime for ${people_id.to_base_58()}`)

                    const nickName = "runtime"
                    const unique_id = `${info.device_info.mac_address}-${nickName}`;
                    console.log('generateing ood keypair...')
                    const [runtime, runtime_pk, index] = create_device(people_id, people_pk, cyfs.DeviceCategory.PC, unique_id, nickName);
                    // People给runtime签名
                    cyfs.sign_and_push_named_object(people_pk, runtime, new cyfs.SignatureRefIndex(254)).unwrap();

                    // TODO: 如何调用激活接口？
                    console.log(`activate local runtime...`)
                    const response = await fetch("http://127.0.0.1:1321/bind", {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json', 'Content-Type': 'application/json',
                        }, body: JSON.stringify({
                            owner: people.to_hex().unwrap(), desc: runtime.to_hex().unwrap(), sec: runtime_pk.to_vec().unwrap().toHex(), index
                        }),
                    });
                    const ret = await response.json()
                    if (ret.result !== 0) {
                        console.error(`bind runtime failed, ret`, ret.result)
                        return;
                    } else {
                        console.log('bind runtime success.')
                    }

                } else {
                    console.error(`local runtime already binded`)
                }
            } catch (error) {
                console.warn(`connect to runtime failed, skip runtime activate`)
            }
        }

        console.log("Mnemonic：", mnemonic);
        console.log("Please keep the mnemonic in a safe place, it can be imported into CyberChat for management")
    } else {
        const workspace = option.save;
        fs.ensureDirSync(workspace);

        let people_desc_path, people_sec_path, ood_desc_path, ood_sec_path, runtime_desc_path, runtime_sec_path
        if (!option.onlyRuntime) {
            // 检查链上有没有People信息，是否已绑定
            const meta_client = cyfs.create_meta_client();
            const [meta_people, is_bind] = await check_people_on_meta(meta_client, people_id)

            if (meta_people) {
                people = meta_people
            }

            people_desc_path = path.join(workspace, 'people.desc');
            people_sec_path = path.join(workspace, 'people.sec');

            if (!is_bind) {
                console.log('generateing ood keypair...')
                const unique_id = Date.now().toString();
                const [ood, ood_pk] = create_device(people_id, people_pk, cyfs.DeviceCategory.OOD, unique_id);

                // 设置People的ood_list
                people.body_expect().content().ood_list.push(ood.device_id());
                people.body_expect().increase_update_time(cyfs.bucky_time_now());

                console.log('set ood info to people desc')
                // People给ood签名
                cyfs.sign_and_push_named_object(people_pk, ood, new cyfs.SignatureRefIndex(254)).unwrap();

                // People给自己签名
                cyfs.sign_and_push_named_object(people_pk, people, new cyfs.SignatureRefIndex(255)).unwrap();

                console.log('put people and ood desc to meta chain')

                // People上链
                if (meta_people) {
                    await meta_client.update_desc(people, cyfs.SavedMetaObject.try_from(people).unwrap(), undefined, undefined, people_pk);
                } else {
                    await meta_client.create_desc(people, cyfs.SavedMetaObject.try_from(people).unwrap(), JSBI.BigInt(0), 0, 0, people_pk);
                }

                // OOD 上链
                await meta_client.create_desc(ood, cyfs.SavedMetaObject.try_from(ood).unwrap(), JSBI.BigInt(0), 0, 0, ood_pk);

                ood_desc_path = path.join(workspace, 'ood.desc');
                ood_sec_path = path.join(workspace, 'ood.sec');

                check_desc_file(ood_desc_path)

                // ood写入文件
                fs.writeFileSync(ood_desc_path, ood.to_vec().unwrap());
                fs.writeFileSync(ood_sec_path, ood_pk.to_vec().unwrap());
            }

            // People写入文件
            check_desc_file(people_desc_path)
            fs.writeFileSync(people_desc_path, people.to_vec().unwrap());
            fs.writeFileSync(people_sec_path, people_pk.to_vec().unwrap());
        }

        if (!option.onlyOod) {
            console.log('generateing runtime keypair...')
            const unique_id = Date.now().toString();
            const [runtime, runtime_pk] = create_device(people_id, people_pk, cyfs.DeviceCategory.PC, unique_id);

            // People给runtime签名
            cyfs.sign_and_push_named_object(people_pk, runtime, new cyfs.SignatureRefIndex(254)).unwrap();

            runtime_desc_path = path.join(workspace, 'runtime.desc');
            runtime_sec_path = path.join(workspace, 'runtime.sec');

            // runtime写入文件
            fs.writeFileSync(runtime_desc_path, runtime.to_vec().unwrap());
            fs.writeFileSync(runtime_sec_path, runtime_pk.to_vec().unwrap());
        }

        console.log("");
        console.log("");
        console.log("===============");
        console.log("A unique CYFS identity file has been generated for you, please keep it safe and use it according to the tutorial.");
        console.log(`Output Directory:  ${workspace} `);
        console.log("===============");
        if (people_desc_path) {
            console.log("*people Identity file:");
            console.log(`    * ${people_desc_path}`);
            console.log(`    * ${people_sec_path}`);
        }
        if (runtime_desc_path) {
            console.log("*cyfs-runtime Identity file:");
            console.log(`    * ${runtime_desc_path}`);
            console.log(`    * ${runtime_sec_path}`);
        }
        if (ood_desc_path) {
            console.log("*cyfs-ood Identity file:");
            console.log(`    * ${ood_desc_path}`);
            console.log(`    * ${ood_sec_path}`);
        }
        console.log("===============");
        console.log("Mnemonic：", mnemonic);
        console.log("Please keep the mnemonic in a safe place, it can be imported into CyberChat for management")


    }
}