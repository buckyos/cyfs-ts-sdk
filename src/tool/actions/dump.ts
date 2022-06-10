import { Command } from "commander";
import path from "path";
import { NONAPILevel, ObjectId, SharedCyfsStack, AnyNamedObjectDecoder } from "../../sdk";
import * as fs from 'fs-extra';

import fetch from 'node-fetch';
import { CyfsToolConfig } from "../lib/util";

const dec_id = ObjectId.from_base_58('9tGpLNnDpa8deXEk2NaWGccEu4yFQ2DrTZJPLYLT7gj4').unwrap()

export function makeCommand(config: CyfsToolConfig): Command {
    return new Command("dump")
        .description("dump any object from ood/runtime")
        .argument("<olink or objectid>", "dump object raw data")
        .requiredOption("-s, --save <save_path>", "save obj to path", ".")
        .requiredOption("-e, --endpoint <target>", "cyfs dump endpoint, ood or runtime", "runtime")
        .action(async (olink_or_objectid, options) => {
            console.log("options:", options)
            let stack: SharedCyfsStack;
            if (options.endpoint === "ood") {
                stack = SharedCyfsStack.open_default(dec_id);
            } else {
                stack = SharedCyfsStack.open_runtime(dec_id);
            }
            await stack.online();
            await run(olink_or_objectid, options, stack, undefined, true, "object");
        })
}

export async function run(olink_or_objectid: string, options:any, stack: SharedCyfsStack, target_id?: ObjectId, manual?: boolean, mode?: string) {
    if (olink_or_objectid === undefined || olink_or_objectid === "") {
        console.error('no args olink or objectid. exit');
        return
    }

    // console.log(`olink_or_objectid: ${olink_or_objectid}`);

    // cyfs://o/5r4MYfFMPYJr5UqgAh2XcM4kdui5TZrhdssWpQ7XCp2y/95RvaS5gwV5SFnT38UXXNuujFBE3Pk8QQDrKVGdcncB4
    const local_device_id = stack.local_device_id();
    const non_service_url = stack.non_service().service_url;
    let obj_id, obj_raw;
    if (olink_or_objectid.indexOf("cyfs://") != -1) {
        // 把cyfs链接参照runtime的proxy.rs逻辑，转换成non的标准协议，直接用http请求
        const proxy_url_str = olink_or_objectid.replace("cyfs://", non_service_url);
        const url = new URL(proxy_url_str)
        const path_seg = url.pathname.split("/").slice(1);
        // 如果链接带o，拼之后就会变成http://127.0.0.1:1318/non/o/xxxxx
        // 这里要去掉non和o这两个路径。如果没有o，就只去掉non一层
        if (path_seg[1] === "o") {
            url.pathname = path_seg.slice(2).join("/");
        } else {
            url.pathname = path_seg.slice(1).join("/");
        }
        if (mode === "data") {
            url.searchParams.set("mode", "data");
        } else {
            url.searchParams.set("mode", "object");
        }
        url.searchParams.set("format", "raw");
        const new_url_str = url.toString();
        console.log(`convert cyfs url: ${olink_or_objectid} to non url: ${new_url_str}`);
        const response  = await fetch(new_url_str, {headers: {CYFS_REMOTE_DEVICE: local_device_id.toString()}});
        if (!response.ok) {
            console.error(`response error code ${response.status}, msg ${response.statusText}`)
            return;
        }
        obj_raw = new Uint8Array(await response.buffer());
        // 取回的数据一定是个Object
        const obj_ret = new AnyNamedObjectDecoder().from_raw(obj_raw);
        if (obj_ret.err) {
            console.error(`invalid named object, hex: ${obj_raw.toHex()}`);
            return;
        }
        obj_id = obj_ret.unwrap().calculate_id()
    } else {
        obj_id = ObjectId.from_base_58(olink_or_objectid).unwrap();
        // 把对象内容写成文件
        // 从noc取回这个Object
        const obj_resp = (await stack.non_service().get_object({
            object_id: obj_id,
            common: {
                level: NONAPILevel.Router,
                flags: 0,
                target: target_id,
            }
        }));
        if (obj_resp.err) {
            console.error(`get object from router error!`, obj_resp);
            return;
        }
        obj_raw = obj_resp.unwrap().object.object_raw;
    }

    if (manual === true) {
        options.save = path.join(options.save, `${obj_id.to_base_58()}.obj`)
    }

    const file = path.join(options.save);
    // check dir is existed
    if (!fs.existsSync(path.dirname(file))) {
        console.error(` save path not existed: ${path.dirname(file)}`);
        return;
    }
    fs.writeFileSync(file, obj_raw);

    console.log(`dump obj对象为${file}`);

}