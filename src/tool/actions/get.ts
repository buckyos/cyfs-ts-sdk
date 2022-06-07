import { Command } from "commander";
import path from "path";
import { ObjectId, ObjectTypeCode, SharedCyfsStack, ObjectMapSimpleContentType, NDNAPILevel, TransTaskState, sleep } from "../../sdk";
import * as fs from 'fs-extra';

import fetch from 'node-fetch';
import * as dump from './dump';
import { get_final_owner } from "../lib/util";


const default_dec_id = ObjectId.from_base_58('9tGpLNnDpa8deXEk2NaWGccEu4yFQ2DrTZJPLYLT7gj4').unwrap()

export function makeCommand(config: any): Command {
    return new Command("get")
        .description("get any file or dir from ood/runtime")
        .argument("<link>", "get dir object raw data")
        .requiredOption("-e, --endpoint <endpoint>", "cyfs endpoint, ood or runtime", "runtime")
        .requiredOption("-s, --save <save_path>", "save dir obj to path, mut be absolute path!!!")
        .action(async (olink, options) => {
            console.log("options:", options)
            let stack: SharedCyfsStack;
            if (options.endpoint === "ood") {
                stack = SharedCyfsStack.open_default(default_dec_id);
            } else {
                stack = SharedCyfsStack.open_runtime(default_dec_id);
            }
            await stack.online();
            await run(olink, options, stack);
        })
}
 
// 递归创建目录 同步方法
export function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
      return true;
    } else {
      if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
}

// 从一个已经挂到inner_path上的对象起，将后续的对象树全部从target的下载
async function download_obj(stack: SharedCyfsStack, target?: ObjectId, dec_id?: ObjectId, inner_path?: string, options?: any): Promise<Map<string, ObjectId> | undefined> {
    console.log(`target: ${target}, download obj from root state path, ${inner_path}`)
    let files = new Map();
    const stub = stack.root_state_access_stub(target, dec_id);
    const r = await stub.get_object_by_path(inner_path);
    if (r.err) {
        console.log(`get root state path ${inner_path} err ${r.val}`)
        return;
    }
    const obj = r.unwrap().object;
    
    const page_size = 20;
    if (obj.object_id.obj_type_code() === ObjectTypeCode.File) {
        files.set(inner_path, obj.object_id);
        console.log(`inner_path: ${inner_path}, object_id: ${obj.object_id}`);
    } else if (obj.object_id.obj_type_code() === ObjectTypeCode.ObjectMap) {
        // 创建本地路径?
        mkdirsSync(path.join(options.save, `${inner_path}`));

        let pages = 0;
        while (true) {
            const r = await stub.list(inner_path, pages, page_size);
            if (r.err) {
                console.log(`list root state access ${inner_path} failed, err ${r.val}`)
                return;
            }
            const items = r.unwrap();
            if (items.length === 0) {
                break;
            }
            if (items[0].content_type !== ObjectMapSimpleContentType.Map) {
                console.error(`inner path ${inner_path} type mismatch! except map, actual ${items[0].content_type}`)
                return;
            }
            for (const item of items) {
                const sub_inner_path = inner_path + "/" + item.map.key;
                const download_files = await download_obj(stack, target, dec_id, sub_inner_path, options);
                if (download_files === undefined) {
                    return;
                }
                console.log(`download_files: ${download_files.size}`);

                files = new Map([...files.entries(), ...download_files.entries()])
                console.log(`inner files: ${files.size}`);
            }
            pages += 1;
        }
    } else {
        console.error(`object ${obj.object_id} type ${obj.object_id.obj_type_code()} not file nor object map!`);
        return;
    }

    console.log(`files: ${files.size}`);
    return files;
}

async function download_files(stack: SharedCyfsStack, options: any, files, file_object_id, dec_id) {
    
    const owner_r = await get_final_owner(file_object_id, stack);
    if (owner_r.err) {
        console.error("get stack owner failed, err", owner_r.val);
        return owner_r;
    }
    const owner_id = owner_r.unwrap();
    console.log("upload use owner", owner_id);
    
    // 取OOD信息
    const oods = (await stack.util().resolve_ood({
        common: {flags: 0},
        object_id: owner_id
    })).unwrap().device_list;

    let base_save = options.save;
    const unfinished = new Set<string>();
    // 在本地上开启下载
    for (const file of files) {
        let save_path = path.join(base_save, `${file[0]}`);
        console.log(`download file ${save_path} object: ${file[1]}, on ${oods[0]}`);
        const r = await stack.trans().create_task({
            common: {
                level: NDNAPILevel.Router,
                flags: 0,
                referer_object: [],
                target: stack.local_device_id().object_id,
                dec_id
            },
            object_id: file[1],
            // 保存到的本地目录or文件
            local_path: save_path,
            // 这里需要填文件源
            device_list: [oods[0]],
            auto_start: true
        });
        if (r.err) {
            console.error(`start task on target: ${oods[0]} err ${r.val}`)
            return
        }
        unfinished.add(r.unwrap().task_id)
    }

    console.log('check ood rebuild status...');

    // 在这里检查文件有没有传输到OOD上
    while (true) {
        if (unfinished.size === 0) {
            break;
        }
        for (const task_id of unfinished) {
            const resp = (await stack.trans().get_task_state({
                common: {
                    level: NDNAPILevel.Router,
                    flags: 0,
                    target: stack.local_device_id().object_id,
                    referer_object: []
                },
                task_id
            }));
            if (resp.err) {
                console.warn("get task state failed, maybe finished. check next file.")
                unfinished.delete(task_id);
            } else if (resp.unwrap().state === TransTaskState.Finished) {
                console.log(`taskid: ${task_id}`);
                unfinished.delete(task_id);
            }
        }

        await sleep(2000);
    }
}

export async function run(link: string, options:any, stack: SharedCyfsStack, target_id?: ObjectId, dec_id?: ObjectId, inner_path?: string) {
    const local_device_id = stack.local_device_id();
    const non_service_url = stack.non_service().service_url;
    const mode = "data";
    let obj_id, target;
    if (link.indexOf("cyfs://") != -1) {      
        // 把cyfs链接参照runtime的proxy.rs逻辑，转换成non的标准协议，直接用http请求
        const proxy_url_str = link.replace("cyfs://", non_service_url);
        const url = new URL(proxy_url_str)
        const path_seg = url.pathname.split("/").slice(1);
        // 如果链接带o，拼之后就会变成http://127.0.0.1:1318/non/o/xxxxx
        // 这里要去掉non和o这两个路径。如果没有o，就只去掉non一层
        if (path_seg[1] === "o") {
            url.pathname = path_seg.slice(2).join("/");
        } else {
            url.pathname = path_seg.slice(1).join("/");
        }
        url.searchParams.set("mode", "object");
        url.searchParams.set("format", "json");
        const new_url_str = url.toString();
        console.log(`convert cyfs url: ${link} to non url: ${new_url_str}`);
        const response  = await fetch(new_url_str, {headers: {CYFS_REMOTE_DEVICE: local_device_id.toString()}});
        if (!response.ok) {
            console.error(`response error code ${response.status}, msg ${response.statusText}`)
            return;
        }
        let ret = await response.json();
        console.log(`ret: `, ret);
        obj_id = ret["desc"]["object_id"];
        target = ret["desc"]["owner"];

    } else {
        console.error("invalid link args, err", link);
        return;
    }

    if (target_id !== undefined && dec_id !== undefined && inner_path !== undefined) {
        console.log(`target_id: ${target_id.toString()}, dec_id: ${dec_id.toString()}, inner_path: ${inner_path}`);

        // 遍历对象，下载整个对象树到本地
        const files = await download_obj(stack, target_id, dec_id, inner_path, options);
        if (files === undefined) {
            console.log("search not found files");
            return
        }

        await download_files(stack, options, files, target_id, dec_id)

    } else {
        console.log(`target: ${target}, object_id: ${obj_id}`);
        let target_id = ObjectId.from_base_58(target).unwrap();
        let object_id = ObjectId.from_base_58(obj_id).unwrap();
        const is_dir = object_id.obj_type_code() === ObjectTypeCode.ObjectMap;
        if (is_dir) {
            // 遍历对象，下载整个对象树到本地
            const files = await download_obj(stack, undefined, undefined, "/upload_map/"+obj_id, options);
            if (files === undefined) {
                console.log("search not found files");
                return
            }

            await download_files(stack, options, files, target_id, default_dec_id)

        } else {
            let files = new Map();
            let file_name = obj_id + ".fileobj";
            files.set(file_name, object_id);
            await download_files(stack, options, files, target_id, default_dec_id)

        }

    }
}