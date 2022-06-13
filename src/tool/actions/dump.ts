import { Command } from "commander";
import path from "path";
import { NONAPILevel, ObjectId, SharedCyfsStack, AnyNamedObjectDecoder, AnyNamedObject, obj_type_code_raw_check } from "../../sdk";
import * as fs from 'fs-extra';

import fetch from 'node-fetch';
import { create_stack, CyfsToolConfig, stop_runtime } from "../lib/util";

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
            const [stack, writable] = await create_stack(options.endpoint, config, dec_id)
            await stack.online();
            await run(olink_or_objectid, options, stack);
            stop_runtime()
        })
}

export async function dump_object(stack: SharedCyfsStack, olink: string, json: boolean): Promise<any|[Uint8Array, ObjectId]|undefined> {
    const local_device_id = stack.local_device_id();
    const non_service_url = stack.non_service().service_url;

    const non_url = olink.replace("cyfs://", non_service_url);

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
    if (json) {
        url.searchParams.set("format", "json");
    } else {
        url.searchParams.set("format", "raw");
    }
    
    const new_url_str = url.toString();
    console.log(`convert cyfs url: ${olink} to non url: ${new_url_str}`);
    const response  = await fetch(new_url_str, {headers: {CYFS_REMOTE_DEVICE: local_device_id.toString()}});
    if (!response.ok) {
        console.error(`response error code ${response.status}, msg ${response.statusText}`)
        return;
    }

    if (json) {
        return await response.json()
    } else {
        const obj_raw = new Uint8Array(await response.buffer());
        // 取回的数据一定是个Object
        const obj_ret = new AnyNamedObjectDecoder().from_raw(obj_raw);
        if (obj_ret.err) {
            console.error(`invalid named object, hex: ${obj_raw.toHex()}`);
            return;
        }

        return [obj_raw, obj_ret.unwrap().calculate_id()]
    }
}

export async function run(olink_or_objectid: string, options:any, stack: SharedCyfsStack) {
    if (olink_or_objectid === undefined || olink_or_objectid === "") {
        console.error('no args olink or objectid. exit');
        return
    }

    // cyfs://o/5r4MYfFMPYJr5UqgAh2XcM4kdui5TZrhdssWpQ7XCp2y/95RvaS5gwV5SFnT38UXXNuujFBE3Pk8QQDrKVGdcncB4
    let olink;
    if (olink_or_objectid.indexOf("cyfs://") != -1) {
        // 把cyfs链接参照runtime的proxy.rs逻辑，转换成non的标准协议，直接用http请求
        olink = olink_or_objectid;
    } else {
        const obj_id_ret = ObjectId.from_base_58(olink_or_objectid);
        if (obj_id_ret.err) {
            console.error('invalid object id', olink_or_objectid);
            return;
        }
        // 直接拼non url为"cyfs://xxxxxxx"
        olink = `cyfs://${olink_or_objectid}`
    }

    const ret = await dump_object(stack, olink, options.json)
    if (ret === undefined) {
        return;
    }
    if (options.json) {
        // 返回json文本格式，直接输出
        console.origin.log(`\nobject json:\n`)
        console.origin.log(JSON.stringify(ret, undefined, 4))
    } else {        
        const [obj_raw, obj_id] = (ret as [Uint8Array, ObjectId]);
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