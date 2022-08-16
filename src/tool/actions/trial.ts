import { Command } from "commander";
import { CyfsToolConfig } from "../lib/util";
import * as fs from 'fs'
import * as path from 'path'
import * as cyfs from '../../sdk';
import { create_device } from "./desc";

const console_origin = (console as any).origin;

export function makeCommand(config: CyfsToolConfig) {
    return new Command("trial")
        .description("trial cyfs-runtime via public ood")
        .option("--force", "force replace already exists runtime desc")
        .option("--clean", "clean trial runtime identity files")
        .action(async (option) => {
            await run(option, config)

            process.exit(0);
        })
}

async function run(option: any, config: CyfsToolConfig) {
    let desc_path = path.join(config.runtime_desc_path, "device.desc")
    let sec_path = path.join(config.runtime_desc_path, "device.sec")
    let owner_desc = cyfs.from_file(path.join(__dirname, "desc", "public_people.desc"), new cyfs.PeopleDecoder()).unwrap()
    let owner_pk = cyfs.from_file(path.join(__dirname, "desc", "public_people.sec"), new cyfs.PrivatekeyDecoder()).unwrap()
    let owner_id = owner_desc.calculate_id();
    if (option.clean) {
        if (fs.existsSync(desc_path)) {
            let desc = new cyfs.DeviceDecoder().from_raw(new Uint8Array(fs.readFileSync(desc_path))).unwrap();
            let desc_owner = desc.desc().owner();
            if (desc_owner && desc_owner.is_some() && desc_owner.unwrap().eq(owner_id)) {
                fs.rmSync(desc_path);
                fs.rmSync(sec_path);
                console_origin.log("clean trial runtime identity files complete.");

                let orig_desc = path.join(config.runtime_desc_path, "device.desc.bak")
                if (fs.existsSync(orig_desc)) {
                    fs.renameSync(orig_desc, desc_path)
                    fs.renameSync(path.join(config.runtime_desc_path, "device.sec.bak"), sec_path)

                    console_origin.log("restore runtime identity files complete.");
                }
            } else {
                console_origin.log("runtime identity files not a trial one, keep it.");
            }
        } else {
            console_origin.log("not have runtime identity files");
        }
    } else {
        if (fs.existsSync(desc_path)) {
            if (option.force) {
                fs.renameSync(desc_path, path.join(config.runtime_desc_path, "device.desc.bak"))
                fs.renameSync(sec_path, path.join(config.runtime_desc_path, "device.sec.bak"))
                console_origin.log("backup runtime identity files complete");
            } else {
                console_origin.log("cyfs runtime already actitived. cannot set to trial runtime identity files")
                console_origin.log("use --force to overwrite runtime identity files");
                return;
            }
        }

        // 创建Runtime Device
        let [runtime, runtime_pk] = create_device(owner_id, cyfs.DeviceCategory.PC);
        // People给runtime签名
        cyfs.sign_and_push_named_object(owner_pk, runtime, new cyfs.SignatureRefIndex(254)).unwrap();

        if (!fs.existsSync(config.runtime_desc_path)) {
            fs.mkdirSync(config.runtime_desc_path, {recursive: true});
        }
        
        cyfs.to_file(desc_path, runtime);
        cyfs.to_file(sec_path, runtime_pk);
        console_origin.log("init trial runtime identity files success")
    }
    
}