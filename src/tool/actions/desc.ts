import path from "path";
import * as fs from 'fs-extra';
import * as cyfs from '../../sdk';
import JSBI from 'jsbi';
import { Command } from "commander";
import { CyfsToolConfig } from "../lib/util";

function stringToUint8Array(str:string): Uint8Array{
    const arr = [];
    for (let i = 0, j = str.length; i < j; ++i) {
      arr.push(str.charCodeAt(i));
    }
   
    return new Uint8Array(arr)
}

export function makeCommand(config: CyfsToolConfig) {
    return new Command("desc")
        .description("create temp desc and sec")
        .requiredOption("-s, --save <path>", "desc save dir", config.user_profile_dir)
        .action(async (option) => {
            await run(option.save)

            process.exit(0);
        })
}

async function run(save_path: string) {
    const workspace = save_path;

    const people_desc = path.join(workspace, "people.desc");
    if(fs.existsSync(people_desc)){
        console.error(`身份配置文件已存在于 ${workspace}`);
        console.error(`  * 如需覆盖请手工删除，请注意备份！`);
        console.error(`  * 或者请通过选项 -s xxx 指定其他保存位置！`);
        process.exit(0);
    }

    fs.ensureDirSync(workspace);

    function create_people(): [cyfs.People, cyfs.PrivateKey] {
        let pk = cyfs.PrivateKey.generate_rsa(1024).unwrap();
        let public_key = pk.public();
        let people = cyfs.People.create(cyfs.None, [], public_key, cyfs.None);
        return [people, pk];
    }

    function create_device(owner: cyfs.ObjectId, cat: cyfs.DeviceCategory): [cyfs.Device, cyfs.PrivateKey] {
        let pk = cyfs.PrivateKey.generate_rsa(1024).unwrap();
        let public_key = pk.public();
        let unique = cyfs.UniqueId.copy_from_slice(stringToUint8Array(Date.now().toString()))
        let device = cyfs.Device.create(cyfs.Some(owner), unique, [], [], [], public_key, cyfs.Area.default(), cat);

        return [device, pk];
    }

    let people_desc_path = path.join(workspace, 'people.desc');
    let people_sec_path = path.join(workspace, 'people.sec');

    let ood_desc_path = path.join(workspace, 'ood.desc');
    let ood_sec_path = path.join(workspace, 'ood.sec');

    let runtime_desc_path = path.join(workspace, 'runtime.desc');
    let runtime_sec_path = path.join(workspace, 'runtime.sec');

    let meta_client = cyfs.create_meta_client();
    // 创建People，此时没有ood_list
    let [people, people_pk] = create_people();
    const people_id = people.desc().calculate_id();
    // 创建Runtime Device
    let [runtime, runtime_pk] = create_device(people_id, cyfs.DeviceCategory.PC);
    // 创建OOD Device
    let [ood, ood_pk] = create_device(people_id, cyfs.DeviceCategory.OOD);
    // 设置People的ood_list
    people.body_expect().content().ood_list.push(ood.device_id());
    people.body_expect().increase_update_time(cyfs.bucky_time_now());
    // People给自己签名
    cyfs.sign_and_push_named_object(people_pk, people, new cyfs.SignatureRefIndex(255)).unwrap();
    // People给runtime签名
    cyfs.sign_and_push_named_object(people_pk, runtime, new cyfs.SignatureRefIndex(254)).unwrap();
    // People给ood签名
    cyfs.sign_and_push_named_object(people_pk, ood, new cyfs.SignatureRefIndex(254)).unwrap();
    // People上链
    await meta_client.create_desc(people, cyfs.SavedMetaObject.try_from(people).unwrap(), JSBI.BigInt(0), 0, 0, people_pk);
    // OOD 上链
    await meta_client.create_desc(ood, cyfs.SavedMetaObject.try_from(ood).unwrap(), JSBI.BigInt(0), 0, 0, ood_pk);

    // People写入文件
    fs.writeFileSync(people_desc_path, people.to_vec().unwrap());
    fs.writeFileSync(people_sec_path, people_pk.to_vec().unwrap());

    // runtime写入文件
    fs.writeFileSync(runtime_desc_path, runtime.to_vec().unwrap());
    fs.writeFileSync(runtime_sec_path, runtime_pk.to_vec().unwrap());

    // ood写入文件
    fs.writeFileSync(ood_desc_path, ood.to_vec().unwrap());
    fs.writeFileSync(ood_sec_path, ood_pk.to_vec().unwrap());

    console.log("");
    console.log("");
    console.log("===============");
    console.log("已为您生成专属 CYFS 身份密钥文件，请妥善保管并按照教程使用.");
    console.log(`输出目录:  ${workspace} `);
    console.log("===============");
    console.log("*个人(people)身份密钥文件:");
    console.log(`    * ${people_desc_path}`);
    console.log(`    * ${people_sec_path}`);
    console.log("*客户端运行时(cyfs-runtime)身份密钥文件:");
    console.log(`    * ${runtime_desc_path}`);
    console.log(`    * ${runtime_sec_path}`);
    console.log("*OOD设备(cyfs-ood)身份密钥文件:");
    console.log(`    * ${ood_desc_path}`);
    console.log(`    * ${ood_sec_path}`);
    console.log("===============");
    console.log("");
}