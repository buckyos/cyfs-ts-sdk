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
        .requiredOption("-e, --endpoint <target>", "cyfs dump endpoint, ood or runtime", "runtime")
        .option("-s, --save <save_path>", "save obj to path")
        .option("--json", "show object as json format, dont save to local")
        .action(async (olink_or_objectid, options) => {
            console.log("options:", options)
            let stack: SharedCyfsStack;
            if (options.endpoint === "ood") {
                stack = SharedCyfsStack.open_default(dec_id);
            } else {
                stack = SharedCyfsStack.open_runtime(dec_id);
            }
            await stack.online();
            await run(olink_or_objectid, options, stack);
        })
}

export async function run(olink_or_objectid: string, options:any, stack: SharedCyfsStack) {
    if (olink_or_objectid === undefined || olink_or_objectid === "") {
        console.error('no args olink or objectid. exit');
        return
    }

    // console.log(`olink_or_objectid: ${olink_or_objectid}`);

    // cyfs://o/5r4MYfFMPYJr5UqgAh2XcM4kdui5TZrhdssWpQ7XCp2y/95RvaS5gwV5SFnT38UXXNuujFBE3Pk8QQDrKVGdcncB4
    const local_device_id = stack.local_device_id();
    const non_service_url = stack.non_service().service_url;
    let non_url;
    if (olink_or_objectid.indexOf("cyfs://") != -1) {
        // 把cyfs链接参照runtime的proxy.rs逻辑，转换成non的标准协议，直接用http请求
        non_url = olink_or_objectid.replace("cyfs://", non_service_url);
    } else {
        const obj_id_ret = ObjectId.from_base_58(olink_or_objectid);
        if (obj_id_ret.err) {
            console.error('invalid object id', olink_or_objectid);
            return;
        }
        // 直接拼non url为"http://127.0.0.1:1318/non/xxxxxxx"
        non_url = non_service_url+olink_or_objectid;
    }

    const url = new URL(non_url)
    const path_seg = url.pathname.split("/").slice(1);
    // 如果链接带o，拼之后就会变成http://127.0.0.1:1318/non/o/xxxxx
    // 这里要去掉non和o这两个路径。如果没有o，就只去掉non一层
    if (path_seg[1] === "o") {
        url.pathname = path_seg.slice(2).join("/");
    } else {
        url.pathname = path_seg.slice(1).join("/");
    }
    url.searchParams.set("mode", "object");
    if (options.json) {
        url.searchParams.set("format", "json");
    } else {
        url.searchParams.set("format", "raw");
    }
    
    const new_url_str = url.toString();
    console.log(`convert cyfs url: ${olink_or_objectid} to non url: ${new_url_str}`);
    const response  = await fetch(new_url_str, {headers: {CYFS_REMOTE_DEVICE: local_device_id.toString()}});
    if (!response.ok) {
        console.error(`response error code ${response.status}, msg ${response.statusText}`)
        return;
    }

    if (options.json) {
        // 返回json文本格式，直接输出
        console.origin.log(`\nobject json:\n`)
        console.origin.log(JSON.stringify(await response.json(), undefined, 4))
    } else {
        const obj_raw = new Uint8Array(await response.buffer());
        // 取回的数据一定是个Object
        const obj_ret = new AnyNamedObjectDecoder().from_raw(obj_raw);
        if (obj_ret.err) {
            console.error(`invalid named object, hex: ${obj_raw.toHex()}`);
            return;
        }
        const obj_id = obj_ret.unwrap().calculate_id()
        let file_path = `${obj_id.to_base_58()}.obj`;
        if (options.save) {
            if (!fs.existsSync(options.save)) {
                console.error(`save path not existed: ${options.save}`);
                console.origin.log('object hex:', obj_raw.toHex())
                return;
            }
            file_path = path.join(options.save, file_path);
        }

        fs.writeFileSync(file_path, obj_raw);
        console.origin.log(`dump obj对象为${file_path}`);
    }
}