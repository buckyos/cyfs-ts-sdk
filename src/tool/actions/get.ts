import { Command } from "commander";
import path from "path";
import { ObjectId, ObjectTypeCode, SharedCyfsStack, ObjectMapSimpleContentType, NDNAPILevel, TransTaskState, sleep } from "../../sdk";
import * as fs from 'fs-extra';

import fetch from 'node-fetch';
import { create_stack, CyfsToolConfig, get_final_owner, stop_runtime } from "../lib/util";

import { dump_object } from "./dump";


const default_dec_id = ObjectId.from_base_58('9tGpLNnDpa8deXEk2NaWGccEu4yFQ2DrTZJPLYLT7gj4').unwrap()

export function makeCommand(config: CyfsToolConfig): Command {
    return new Command("get")
        .description("get any file or dir from ood/runtime")
        .argument("<link>", "get dir object raw data")
        .requiredOption("-e, --endpoint <endpoint>", "cyfs endpoint, ood or runtime", "runtime")
        .requiredOption("-s, --save <save_path>", "save dir obj to path, mut be absolute path!!!", ".")
        .action(async (olink, options) => {
            console.log("options:", options)
            const [stack, writable] = await create_stack(options.endpoint, config, default_dec_id)
            await stack.online();
            await run(olink, options, stack);

            stop_runtime()
        })
}

function objToStrMap(obj){
    let strMap = new Map();
    for (let k of Object.keys(obj)) {
        strMap.set(k,obj[k]);
    }
    return strMap;
}

// 从一个已经挂到inner_path上的对象起，将后续的对象树全部从target的下载
async function download_obj(stack: SharedCyfsStack, link: string, target?: ObjectId, dec_id?: ObjectId, inner_path?: string, options?: any): Promise<Map<string, ObjectId> | undefined> {
    console.log(`target: ${target}, download obj from root state path, ${inner_path}`)
    let files = new Map();

    let json = await dump_object(stack, link, true);
    console.log(`ret: `, json);
    let obj_id = json["desc"]["object_id"];
    let object_id = ObjectId.from_base_58(obj_id).unwrap();
    
    if (object_id.obj_type_code() === ObjectTypeCode.File) {
        files.set(inner_path, object_id);
        console.log(`inner_path: ${inner_path}, object_id: ${object_id}`);
    } else if (object_id.obj_type_code() === ObjectTypeCode.ObjectMap) {
        const str = json["desc"]["content"]["content"];
        const items = objToStrMap(str);
        for (const item of items) {
            const reletive = "/" + item[0];
            const sub_inner_path = inner_path + reletive;
            let sub_link = link + reletive;
            const download_files = await download_obj(stack, sub_link, target, dec_id, sub_inner_path, options);
            if (download_files === undefined) {
                return;
            }

            files = new Map([...files.entries(), ...download_files.entries()])
        }
    } else {
        console.error(`object ${object_id} type ${object_id.obj_type_code()} not file nor object map!`);
        return;
    }

    return files;
}

/* 判断文件是否存在的函数
*@path_way, 文件路径
 */
function isFileExisted(path_way) {
    return new Promise((resolve, reject) => {
      fs.access(path_way, (err) => {
        if (err) {
          reject(false);
        } else {
          resolve(true);
        }
      })
    })
};

function isEmptyDir(path) {
    return fs.readdirSync(path).length === 0;
}

function isDirectory(path) {
    return fs.statSync(path).isDirectory();
}


async function download_files(stack: SharedCyfsStack, options: any, files, file_object_id, dec_id, relative_root, is_dir: boolean) {  
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
    const option_str: String = options.save;
    if (!path.isAbsolute(options.save)) {
        base_save = path.normalize(path.join(process.cwd(), options.save));
    }

    let flags = 0;
    // obj_dor | 目录存在+目录不为空
    if (is_dir) {
        if (fs.existsSync(base_save) && !isEmptyDir(base_save)) {
            flags = 1;
        } else {
            flags = 2;
        }
    } else {
       if ((fs.existsSync(base_save) && isDirectory(base_save)) || option_str.endsWith("/") || option_str.endsWith("\\")) {
            flags = 3;
       } else {
            flags = 4;
       }
    }

    if (!fs.existsSync(path.dirname(base_save))) {
        fs.ensureDirSync(path.dirname(base_save));
    }
    
    const unfinished = new Set<string>();
    // 在本地上开启下载
    for (const file of files) {
        // 这里以 relative_root 分割, 裁剪路径
        let ipos = file[0].indexOf(relative_root);//指定开始的字符串
        let file_path = file[0].substring(ipos, file[0].length);//取后部分(指定开始的字符串(包括)的之后)
        if (flags === 1) {
            // 缺省
        } else if (flags === 2) {
            file_path = file[0].substring(ipos + relative_root.length, file[0].length);//取后部分(指定开始的字符串(排除)的之后)
        } else if (flags === 3) {
            // 缺省
        } else if (flags === 4) {
            file_path = "";
        }
        let save_path = path.join(base_save, `${file_path}`);
        if (!fs.existsSync(path.dirname(save_path))) {
            fs.ensureDirSync(path.dirname(save_path));
        }
        
        try{
            const isExisted = await isFileExisted(save_path);
            if (isExisted) {
                console.error(`${save_path} already exists`);
                continue;
            }
        }catch (error){
            // ignore
        }
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
    let obj_id, target, relative_root;
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

        relative_root = decodeURI(path_seg[path_seg.length - 1]);
        console.log(`relative_root: ${path_seg[path_seg.length - 1]}`);

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

    let object_id = ObjectId.from_base_58(obj_id).unwrap();
    const is_dir = object_id.obj_type_code() === ObjectTypeCode.ObjectMap;

    if (target_id !== undefined && dec_id !== undefined && inner_path !== undefined) {
        console.log(`target_id: ${target_id.toString()}, dec_id: ${dec_id.toString()}, inner_path: ${inner_path}`);

        if (is_dir) {
            // 遍历对象，下载整个对象树到本地
            const files = await download_obj(stack, link, target_id, dec_id, inner_path, options);
            if (files === undefined) {
                console.log("search not found files");
                return
            }

            await download_files(stack, options, files, target_id, dec_id, relative_root, is_dir)
        } else {
            let files = new Map();
            const file_name = `${relative_root}.file`;
            files.set(file_name, object_id);
            await download_files(stack, options, files, target_id, default_dec_id, relative_root, is_dir)
        }

    } else {
        console.log(`target: ${target}, object_id: ${obj_id}`);
        let target_id = ObjectId.from_base_58(target).unwrap();

        if (is_dir) {
            // 遍历对象，下载整个对象树到本地
            let files = await download_obj(stack, link, target_id, undefined, "/upload_map/"+obj_id, options);
            if (files === undefined) {
                console.log("search not found files");
                return;
            }

            await download_files(stack, options, files, target_id, default_dec_id, relative_root, is_dir)

        } else {
            let files = new Map();
            const file_name = `${relative_root}.file`;
            files.set(file_name, object_id);
            await download_files(stack, options, files, target_id, default_dec_id, relative_root, is_dir);

        }

    }
}