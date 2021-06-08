import path from 'path';
import {
    ObjectId,
    DecAppDecoder,
    SharedObjectStack,
    None,
    AppExtInfoDecoder,
    AnyNamedObjectDecoder,
    AnyNamedObject,
    Some,
    Dir,
} from '../../src';

import { exec } from "../lib/util";

import { run as build } from "./build";

import * as fs from 'fs-extra';
import { TransTaskState, TransTaskUploadStrategy } from '../../src';
const SDK_USER_ID = "cyfs-sdk";

import * as util from 'util';
import { CyfsToolContext } from '../lib/ctx';
const sleep = util.promisify(setTimeout);

async function deploy_web(options:any, config: any, ctx: CyfsToolContext) {
    let endpoint = options.e || "runtime";
    let stack: SharedObjectStack;
    if (endpoint === "ood") {
        stack = SharedObjectStack.open_default()
    } else {
        stack = SharedObjectStack.open_runtime();
    }

    await stack.online();

    let depoly_to_ood = (ctx.app && ctx.app.web && ctx.app.web.deploy_target.indexOf('ood')>=0);

    depoly_to_ood = (depoly_to_ood || (options.t==="ood")) && endpoint !== "ood";
    if (depoly_to_ood) {
        console.log('depoly target: runtime to ood');
    } else {
        console.log('depoly target: only runtime');
    }

    let [owner, _] = new AnyNamedObjectDecoder().raw_decode(new Uint8Array(fs.readFileSync(`${config.owner}.desc`))).unwrap();
    let owner_id = owner.desc().calculate_id();
    // 这里检查配置的owner和stack的owner是否匹配，不匹配是不能上传到OOD的
    if (depoly_to_ood) {
        let stack_device = stack.local_device();
        let stack_owner_id = stack_device.desc().owner()!.is_some()?stack_device.desc().owner()!.unwrap():stack_device.desc().calculate_id();

        if (!owner_id.equals(stack_owner_id)) {
            console.error(`owner mismatch! config ${owner_id}, stack ${stack_owner_id}`);
            return;
        }
    }

    // 1. 网站部署到runtime，无论后续是否要部署到ood，这一步都是必须的
    let webDir = options.www || ctx.app.web.folder;
    if (webDir === undefined || webDir === "") {
        console.error('no web dir. exit');
        return
    }
    if (!path.isAbsolute(webDir)) {
        webDir = path.join(process.cwd(), webDir);
    }

    let chunk_size = 1024   // 这里单位是kB
    // 利用trans的add_file接口，在stack内部生成zip格式的dirObj，并开启上传
    let r = await stack.trans().add_file({
        // 是否开始当前文件的上传任务
        start_upload: true,
        user_id: SDK_USER_ID,
        // 文件所属者
        owner: owner_id,
        // 文件的本地路径
        local_path: webDir,
        // chunk大小
        chunk_size: chunk_size*1024,
    });
    if (r.err) {
        console.error(`add file ${webDir} to stack failed, err ${r.val}`);
        return;
    }

    let dir_id = r.unwrap().file_id;
    // 从noc取回这个DirObject
    let dir_resp = (await stack.noc_service().get_object({
        object_id: dir_id,
        flags: 0
    })).unwrap();

    fs.writeFileSync(`${dir_id}.fileobj`, dir_resp.object_raw);

    // 如果还要部署到OOD上，需要在OOD上，对每个文件开启下载命令
    if (depoly_to_ood) {
        // 把dirObject传到OOD上
        await stack.router().put_object({
            object_id: dir_id,
            object_raw: dir_resp.object_raw,
            flags: 0
        })
        let dirObj = dir_resp.object as Dir;

        // 取OOD信息
        let oods = (await stack.util().resolve_ood({
            object_id: owner_id
        })).unwrap().device_list;;
        let ood_root = (await stack.util().get_device_static_info(Some(oods[0]))).unwrap().cyfs_root;
        let unfinished = new Set<string>();

        // 遍历DirObj，对每个File开启上传
        let files:[string, ObjectId][] = [];
        dirObj.desc().content().obj_list().match({
            Chunk: ()=> {},
            ObjList: (list) => {
                for (const [inner_path, info] of list.object_map().entries()) {
                    files.push([inner_path.value(), info.node().object_id()!]);
                }
            }
        })

        for (const [inner_path, file_id] of files) {
            // 临时方案：先把file_id对应的对象put到ood上
            console.log(`put file obj ${file_id} to ood`);
            let file_raw = dirObj.body_expect().content().match<Uint8Array|undefined>({
                Chunk: () => {return undefined},
                ObjList: (list) => {
                    return list.get(file_id)?.buffer;
                }
            })!;
            await stack.router().put_object({
                object_id: file_id,
                object_raw: file_raw,
                flags: 0
            });

            console.log(`download file ${file_id} on ood`);
            await stack.trans().start_task({
                target: oods[0],
                object_id: file_id,
                user_id: SDK_USER_ID,
                upload_strategy: TransTaskUploadStrategy.Default,
                // 保存到的本地目录or文件
                local_path: path.join(ood_root, "data", "cyfs-sdk", file_id.to_base_58()),
                // 源设备(hub)列表
                device_list: oods,
            });

            unfinished.add(file_id.to_base_58());
        }

        console.log('check ood rebuild status...');

        // 在这里检查文件有没有传输到OOD上
        while (true) {
            if (unfinished.size === 0) {
                break;
            }
            dirObj.desc().content().obj_list().match_async({
                Chunk: async () => {console.error("not support dir in chunk!");return;},
                ObjList: async (list) => {
                    for (const [inner_path, info] of list.object_map().entries()) {
                        let file_id = info.node().object_id()!;
                        if (!unfinished.has(file_id.to_base_58())) {
                            continue;
                        } else {
                            let resp = (await stack.trans().get_task_state({
                                target: oods[0],
                                object_id: file_id,
                                user_id: SDK_USER_ID,
                            })).unwrap();
                            if (resp.state === TransTaskState.Ready) {
                                unfinished.delete(file_id.to_base_58());
                            }
                        }
                    }
                }
            });

            await sleep(2000);
        }
    }
    // 如果在app项目目录下，把生成的链接写入ext_info
    let entry = 'index.html';
    if (ctx.app && ctx.app.web.entry) {
        entry = ctx.app.web.entry;
    }
    let cyfs_link = `cyfs://o/${owner_id}/${dir_id}/${entry}`;
    if (ctx.app && ctx.app.ext_info) {
        if (ctx.app.ext_info.auto_update) {
            ctx.app.ext_info.link = cyfs_link;
            ctx.save_app();
        }
    }

    console.log(`部署完成，可用cyfs浏览器打开${cyfs_link}访问`);
    // 把dir内容写成文件
    console.log(`已生成网站的对应dir obj对象为${dir_id}.fileobj`);

}

function upload_dec_app(options:any, config: any, ctx: CyfsToolContext) {
    // 上传 dec app 包到 chunk manager
    // cyfs-client.exe put <app.zip> -f fid -o <owner>
    const app_pack_obj = ctx.get_app_pack_path();
    exec(`${config.cyfs_client} put ${app_pack_obj} -f ${ctx.get_app_fid_path()} -o ${ctx.app_owner().all}`, process.cwd());
}

function increseBuildNo(version: string){
    let versions = version.split('.');
    let buildNo = parseInt(versions[2], 10);
    buildNo++;
    version = `${versions[0]}.${versions[1]}.${buildNo}`;
    return version;
}

function inc_app_version(options:any, config: any, ctx: CyfsToolContext) {
    // 修改ctx.app.version的第三位值，然后更新cyfs.config.json文件
    let new_version = increseBuildNo(ctx.app.version);
    ctx.app.version = new_version;
    ctx.save_app();
}

export function update_ext_info(options:any, config: any, ctx: CyfsToolContext) {
    // 向app_ext对象添加extinfo
    if (ctx.app.ext_info) {
        const app_ext_obj = ctx.get_app_ext_file();
        const [appext, buf1] = new AppExtInfoDecoder().raw_decode(new Uint8Array(fs.readFileSync(app_ext_obj))).unwrap();
        let new_info = JSON.stringify(ctx.app.ext_info)
        if (new_info !== appext.info()) {
            console.log(`ext info change: ${appext.info()} => ${new_info}`);
            appext.set_info(new_info)
            fs.writeFileSync(app_ext_obj, appext.to_vec().unwrap());
        }
    }
}

function update_app_obj(options:any, config: any, ctx: CyfsToolContext) {
    // 读取 dec app 上传后生成的 fid 文件的内容
    const fid_path = ctx.get_app_fid_path();
    const fid = fs.readFileSync(fid_path).toString();

    // 向 app 对象添加 version 和 fid ：
    const app_obj = ctx.get_app_obj_file();
    const [app, buf] = new DecAppDecoder().raw_decode(new Uint8Array(fs.readFileSync(app_obj))).unwrap();
    app.set_source(ctx.app.version, ObjectId.from_base_58(fid).unwrap(), None);
    fs.writeFileSync(app_obj, app.to_vec().unwrap());

    // 向app_ext对象添加extinfo
    update_ext_info(options, config, ctx);
}

async function put_obj_file(obj_path: string, stack: SharedObjectStack | undefined, target: ObjectId | undefined): Promise<AnyNamedObject> {
    if (stack === undefined) {
        stack = SharedObjectStack.open_runtime();
    }
    let obj_buf = new Uint8Array(fs.readFileSync(obj_path));
    let [obj, buf] = new AnyNamedObjectDecoder().raw_decode(obj_buf).unwrap();
    let id = obj.desc().calculate_id();
    let r = await stack.router().put_object({
        object_id: id,
        target,
        object_raw: obj_buf,
        flags: 0,
    });

    if (r.err) {
        console.error(`put_object ${id} failed! ${r.err}`);
    } else {
        console.log(`put object ${id} success!`);
    }

    return obj;
}

export async function put_app_obj(options:any, config: any, ctx: CyfsToolContext) {
    let endpoint = options.e || "runtime";
    let stack: SharedObjectStack;
    if (endpoint === "ood") {
        stack = SharedObjectStack.open_default()
    } else {
        stack = SharedObjectStack.open_runtime();
    }

    await stack.online();
    let app = await put_obj_file(ctx.get_app_obj_file(), stack, undefined);
    let id = app.desc().calculate_id();
    let owner = app.desc().owner()!.unwrap();
    console.log(`decoded app_id is: ${id}`);

    await put_obj_file(ctx.get_app_ext_file(), stack, undefined);

    console.log(`CYFS App Service Link: cyfs://${owner}/${id}`);

    // TODO: 上链
}

async function deploy_dec_app(options:any, config: any, ctx: CyfsToolContext){
    await build(options, config, ctx);
    upload_dec_app(options, config, ctx);
    inc_app_version(options, config, ctx);
    update_app_obj(options, config, ctx);
    await put_app_obj(options, config, ctx);
}

export async function run(options:any, config: any, ctx: CyfsToolContext) {
    if(options.www !== undefined){
        console.log('will deploy web');
        await deploy_web(options, config, ctx);
    }else{
        console.log('will deploy service');
        await deploy_dec_app(options, config, ctx);
    }
}