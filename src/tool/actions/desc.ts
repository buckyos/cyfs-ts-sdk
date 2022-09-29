import path from "path";
import * as fs from 'fs-extra';
import * as cyfs from '../../sdk';
import JSBI from 'jsbi';
import { Command } from "commander";
import { CyfsToolConfig } from "../lib/util";
import fetch, { Request } from 'node-fetch'

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
    let gen = cyfs.CyfsSeedKeyBip.from_mnemonic(mnemonic).unwrap();

    let bip_path = cyfs.CyfsChainBipPath.new_people(
        cyfs.get_current_network(),
        0);
    let pk = gen.sub_key(bip_path).unwrap();

    let people = cyfs.People.create(cyfs.None, [], pk.public(), cyfs.Some(cyfs.Area.from_str("00:00:0000:00").unwrap()), undefined, undefined, (build) => {
        build.no_create_time()
    });

    return [people, pk]
}

// 计算哈希
function _hashCode(strValue: string): number {
    let hash = 0;
    for (let i = 0; i < strValue.length; i++) {
        let chr = strValue.charCodeAt(i);
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
    let result = cyfs.forge.util.binary.hex.encode(md5.digest())
    let index = _hashCode(result);

    console.log(`calc init index: uniqueStr=${uniqueStr}, index=${index}`);

    return index
}

function create_device(owner: cyfs.ObjectId, pk: cyfs.PrivateKey, category: cyfs.DeviceCategory, unique_id: string, nick_name?: string): [cyfs.Device, cyfs.PrivateKey, number] {
    let gen = cyfs.CyfsSeedKeyBip.from_private_key(pk.to_vec().unwrap().toHex(), owner.to_base_58());
    let address_index = _calcIndex(unique_id)
    let path = cyfs.CyfsChainBipPath.new_device(
        0,
        get_network(),
        address_index
    );
    let private_key = gen.unwrap().sub_key(path).unwrap();

    let unique = cyfs.UniqueId.copy_from_slice(cyfs.forge.util.binary.raw.decode(unique_id));
    console.info(`unique_str: ${unique_id} -> ${unique.as_slice().toHex()}`);

    let device = cyfs.Device.create(
        cyfs.Some(owner),
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
        console.error(`身份配置文件已存在于 ${path.dirname(desc_path)}`);
        console.error(`  * 如需覆盖请手工删除，请注意备份！`);
        console.error(`  * 或者请通过选项 -s xxx 指定其他保存位置！`);
        process.exit(0);
    }
}

async function check_people_on_meta(meta_client: cyfs.MetaClient, people_id: cyfs.ObjectId): Promise<[cyfs.People | undefined, boolean]> {
    let people: cyfs.People | undefined = undefined, is_bind = false
    let people_r = await meta_client.getDesc(people_id);
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
    let people_id = people.calculate_id()
    console.log('generated people id:', people_id.to_base_58())

    let meta_client = cyfs.create_meta_client();
    let [meta_people, is_bind] = await check_people_on_meta(meta_client, people_id)

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
                    let info = await (await fetch('http://127.0.0.1:1320/check')).json()
                    if (!info.activation) {
                        console.log(`will bind local ood for ${people_id.to_base_58()}`)

                        let unique_id = info.device_info.mac_address;
                        console.log('generateing ood keypair...')
                        let [ood, ood_pk, address_index] = create_device(people_id, people_pk, cyfs.DeviceCategory.OOD, unique_id);

                        // 设置People的ood_list
                        people.body_expect().content().ood_list.push(ood.device_id());
                        people.body_expect().increase_update_time(cyfs.bucky_time_now());

                        console.log('set ood info to people desc')
                        // People给ood签名
                        cyfs.sign_and_push_named_object(people_pk, ood, new cyfs.SignatureRefIndex(254)).unwrap();

                        // People给自己签名
                        cyfs.sign_and_push_named_object(people_pk, people, new cyfs.SignatureRefIndex(255)).unwrap();

                        console.log(`activate local ood...`)
                        let response = await fetch("http://127.0.0.1:1320/bind", {
                            method: 'POST',
                            headers: {
                                Accept: 'application/json', 'Content-Type': 'application/json',
                            }, body: JSON.stringify({
                                owner: people.to_hex().unwrap(), desc: ood.to_hex().unwrap(), sec: ood_pk.to_vec().unwrap().toHex(), index: address_index
                            }),
                        });
                        let ret = await response.json()
                        if (ret.result !== 0) {
                            console.error(`bind ood failed, ret`, ret.result)
                            return;
                        } else {
                            console.log('bind ood success.')
                        }

                        console.log('put people and ood desc to meta chain')

                        // People上链
                        if (meta_people) {
                            await meta_client.update_desc(people, cyfs.SavedMetaObject.try_from(people).unwrap(), cyfs.None, cyfs.None, people_pk);
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
                let info = await (await fetch('http://127.0.0.1:1321/check')).json()
                if (!info.activation) {
                    console.log(`will bind local runtime for ${people_id.to_base_58()}`)

                    let nickName = "runtime"
                    let unique_id = `${info.device_info.mac_address}-${nickName}`;
                    console.log('generateing ood keypair...')
                    let [runtime, runtime_pk, index] = create_device(people_id, people_pk, cyfs.DeviceCategory.PC, unique_id, nickName);
                    // People给runtime签名
                    cyfs.sign_and_push_named_object(people_pk, runtime, new cyfs.SignatureRefIndex(254)).unwrap();

                    // TODO: 如何调用激活接口？
                    console.log(`activate local runtime...`)
                    let response = await fetch("http://127.0.0.1:1321/bind", {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json', 'Content-Type': 'application/json',
                        }, body: JSON.stringify({
                            owner: people.to_hex().unwrap(), desc: runtime.to_hex().unwrap(), sec: runtime_pk.to_vec().unwrap().toHex(), index
                        }),
                    });
                    let ret = await response.json()
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

        console.log("助记词：", mnemonic);
        console.log("请妥善保管好助记词，该助记词可导入超送进行后续管理")
    } else {
        const workspace = option.save;
        fs.ensureDirSync(workspace);

        let people_desc_path, people_sec_path, ood_desc_path, ood_sec_path, runtime_desc_path, runtime_sec_path
        if (!option.onlyRuntime) {
            // 检查链上有没有People信息，是否已绑定
            let meta_client = cyfs.create_meta_client();
            let [meta_people, is_bind] = await check_people_on_meta(meta_client, people_id)

            if (meta_people) {
                people = meta_people
            }

            if (!is_bind) {
                console.log('generateing ood keypair...')
                let unique_id = Date.now().toString();
                let [ood, ood_pk] = create_device(people_id, people_pk, cyfs.DeviceCategory.OOD, unique_id);

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
                    await meta_client.update_desc(people, cyfs.SavedMetaObject.try_from(people).unwrap(), cyfs.None, cyfs.None, people_pk);
                } else {
                    await meta_client.create_desc(people, cyfs.SavedMetaObject.try_from(people).unwrap(), JSBI.BigInt(0), 0, 0, people_pk);
                }

                // OOD 上链
                await meta_client.create_desc(ood, cyfs.SavedMetaObject.try_from(ood).unwrap(), JSBI.BigInt(0), 0, 0, ood_pk);


                people_desc_path = path.join(workspace, 'people.desc');
                people_sec_path = path.join(workspace, 'people.sec');

                ood_desc_path = path.join(workspace, 'ood.desc');
                ood_sec_path = path.join(workspace, 'ood.sec');

                check_desc_file(people_desc_path)
                check_desc_file(ood_desc_path)

                // People写入文件
                fs.writeFileSync(people_desc_path, people.to_vec().unwrap());
                fs.writeFileSync(people_sec_path, people_pk.to_vec().unwrap());

                // ood写入文件
                fs.writeFileSync(ood_desc_path, ood.to_vec().unwrap());
                fs.writeFileSync(ood_sec_path, ood_pk.to_vec().unwrap());
            }

        }

        if (!option.onlyOod) {
            console.log('generateing runtime keypair...')
            let unique_id = Date.now().toString();
            let [runtime, runtime_pk] = create_device(people_id, people_pk, cyfs.DeviceCategory.PC, unique_id);

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
        console.log("已为您生成专属 CYFS 身份密钥文件，请妥善保管并按照教程使用.");
        console.log(`输出目录:  ${workspace} `);
        console.log("===============");
        if (people_desc_path) {
            console.log("*个人(people)身份密钥文件:");
            console.log(`    * ${people_desc_path}`);
            console.log(`    * ${people_sec_path}`);
        }
        if (runtime_desc_path) {
            console.log("*客户端运行时(cyfs-runtime)身份密钥文件:");
            console.log(`    * ${runtime_desc_path}`);
            console.log(`    * ${runtime_sec_path}`);
        }
        if (ood_desc_path) {
            console.log("*OOD设备(cyfs-ood)身份密钥文件:");
            console.log(`    * ${ood_desc_path}`);
            console.log(`    * ${ood_sec_path}`);
        }
        console.log("===============");
        console.log("助记词：", mnemonic);
        console.log("请妥善保管好助记词，该助记词可导入超送进行后续管理")


    }
}