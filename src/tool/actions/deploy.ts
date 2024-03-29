import {
    ObjectId,
    SharedCyfsStack,
    AnyNamedObjectDecoder,
    AnyNamedObject,
    NONAPILevel, NONObjectInfo,
    create_meta_client,
    get_system_dec_app,
} from '../../sdk';

import { check_channel, create_stack, CyfsToolConfig, exec, get_owner_path, load_desc_and_sec, stop_runtime, upload_app_objs } from "../lib/util";

import { pack } from "./pack";

import * as fs from 'fs-extra';

import { CyfsToolContext, CUR_CONFIG_VERSION } from '../lib/ctx';
import { Command } from 'commander';
import { upload } from './upload';

const dec_id = get_system_dec_app().object_id;

interface DeployOptions {
    tag?: string,
    desc?: string
}

function upload_dec_app(config: CyfsToolConfig, ctx: CyfsToolContext) {
    // 上传 dec app 包到 chunk manager
    // cyfs-client.exe put <app.zip> -f fid -o <owner>
    const app_dist_path = ctx.get_app_dist_path();
    exec(`"${config.cyfs_client}" put "${app_dist_path}" -f "${ctx.get_app_fid_path()}" -o "${ctx.app_owner().all}" --use-stack-sn --tcp`, process.cwd());
}

function increseBuildNo(version: string){
    const versions = version.split('.');
    let buildNo = parseInt(versions[2], 10);
    buildNo++;
    version = `${versions[0]}.${versions[1]}.${buildNo}`;
    return version;
}

function inc_app_version(ctx: CyfsToolContext) {
    const old_version = ctx.app.version;
    // 修改ctx.app.version的第三位值，然后更新cyfs.config.json文件
    ctx.app.version = increseBuildNo(ctx.app.version);
    ctx.save_project_config();
    return old_version;
}

export function update_ext_info(ctx: CyfsToolContext, update_release_date: boolean) {
    const appext = ctx.get_app_ext_obj();

    let old_ext_info;
    try {
        old_ext_info = JSON.parse(appext.info())
    } catch (error) {
        old_ext_info = {};
    }
    // 准备新的ext_info
    let new_info = ctx.app.ext_info || {};
    new_info = JSON.parse(JSON.stringify(new_info));
    // 拷贝旧的上传时间字段
    if (old_ext_info["cyfs-app-store"] && old_ext_info["cyfs-app-store"]["releasedate"]) {
        if (new_info["cyfs-app-store"] === undefined) {
            new_info["cyfs-app-store"] = {};
        }
        new_info["cyfs-app-store"]["releasedate"] = old_ext_info["cyfs-app-store"]["releasedate"];
    }
    // ext_info.default = new_info;

    // 添加版本的上传时间到ext_info
    if (!new_info["cyfs-app-store"]) {
        new_info["cyfs-app-store"] = {};
    }

    if (!new_info["cyfs-app-store"]["releasedate"]) {
        new_info["cyfs-app-store"]["releasedate"] = {};
    }

    if (update_release_date) {
        const date = new Date()
        new_info["cyfs-app-store"]["releasedate"][ctx.app.version] = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
    }
    
    // 向app_ext对象添加extinfo
    const new_info_str = JSON.stringify(new_info)
    if (new_info_str !== appext.info()) {
        console.log(`ext info change: ${appext.info()} => ${new_info}`);
        appext.set_info(new_info_str)
    }

    ctx.save_app_ext_obj();
}

function update_app_version(options: DeployOptions, ctx: CyfsToolContext) {
    // 读取 dec app 上传后生成的 fid 文件的内容
    const fid_path = ctx.get_app_fid_path();
    const fid = fs.readFileSync(fid_path).toString();

    // 向 app 对象添加 version 和 fid ：
    const app = ctx.get_app_obj();
    let source_desc;
    if (options.desc) {
        let desc = options.desc;
        if (fs.existsSync(desc)) {
            desc = fs.readFileSync(desc, {encoding: 'utf-8'});
        }

        source_desc = desc;
    }
    app.set_source(ctx.app.version, ObjectId.from_base_58(fid).unwrap(), source_desc);

    // 设置当前version的tag
    const tag = options.tag || "latest";
    app.set_tag(tag, ctx.app.version);

    ctx.save_app_obj();

    // 向app_ext对象添加extinfo
    update_ext_info(ctx, true);
}

// 如果icon填写了本地路径，那么上传到OOD并替换成cyfs路径
async function upload_app_icon(ctx: CyfsToolContext, stack: SharedCyfsStack) {
    // icon存在，且为文件
    const icon_path = ctx.app!.icon;
    if (icon_path && fs.existsSync(icon_path) && fs.statSync(icon_path).isFile()) {
        const upload_r = await upload(icon_path, true, stack);
        if (upload_r.err) {
            console.error(`upload icon ${icon_path} err ${upload_r.val}`)
        }
        const [owner_id, obj_id] = upload_r.unwrap()
        ctx.app!.icon = `cyfs://o/${owner_id}/${obj_id}`
        console.log(`upload app icon ${icon_path} to ood, cyfs link ${ctx.app!.icon}`)
    }
}

// 更新app对象的desc和icon部分
function update_app_obj(ctx: CyfsToolContext) {
    const app = ctx.get_app_obj();
    const desc = (ctx.app!.description !== "")?ctx.app!.description:undefined;
    if (desc !== app.app_desc()) {
        app.set_app_desc(desc);
    }

    const icon = (ctx.app!.icon !== "")?ctx.app!.icon:undefined;
    if (icon !== app.icon()) {
        console.log(`set app icon to ${icon}`)
        app.set_icon(icon)
    }

    ctx.save_app_obj();
}

async function put_obj_file(obj_path: string, stack: SharedCyfsStack, target: ObjectId | undefined): Promise<[AnyNamedObject, Uint8Array]> {
    const obj_buf = new Uint8Array(fs.readFileSync(obj_path));
    const obj = new AnyNamedObjectDecoder().raw_decode(obj_buf).unwrap()[0];
    const id = obj.desc().calculate_id();
    const r = await stack.non_service().put_object({
        common: {
            level: NONAPILevel.Router,
            target,
            flags: 0,
        },
        object: new NONObjectInfo(id, obj_buf)
    });

    if (r.err) {
        console.error(`put_object ${id} failed! ${r.val}`);
    } else {
        console.log(`put object ${id} success!`);
    }

    return [obj, obj_buf];
}

export async function put_app_obj(options: any, ctx: CyfsToolContext, stack: SharedCyfsStack): Promise<void> {
    const [app, app_buf] = await put_obj_file(ctx.get_app_obj_file(), stack, undefined);
    const id = app.calculate_id();
    const owner = app.desc().owner()!;
    console.log(`decoded app_id is: ${id}`);
    await put_obj_file(ctx.get_app_ext_file(), stack, undefined);

    const meta_client = create_meta_client();
    await upload_app_objs(ctx, meta_client);

    (console as any).origin.log(`Upload DecApp Finished.\nCYFS App Install Link: cyfs://${owner}/${id}\n`);
}

function check_owner(config: CyfsToolConfig, ctx: CyfsToolContext, stack: SharedCyfsStack): boolean {
    // 先检测本地project的owner和app obj的owner是不是同一个
    const app_owner = ctx.get_app_obj().desc().owner()!;
    const [cur_owner, cur_key] = load_desc_and_sec(get_owner_path(undefined, config, ctx)!);

    if (!cur_owner.calculate_id().eq(app_owner)) {
        console.error(`app obj's owner ${app_owner} not match current project owner ${cur_owner.calculate_id()}`);
        return false;
    }
    // 再检测device的owner和app obj的owner是不是同一个
    const device_owner = stack.local_device().desc().owner()!
    if (!device_owner.eq(app_owner)) {
        console.error(`app obj's owner ${app_owner} not match current device's owner ${device_owner}`);
        return false;
    }

    return true;
}

function check_config(ctx: CyfsToolContext) {
    // 在这里检测配置文件是否为最新版本，不为最新版的要升级
    if (ctx.app!.config_version === undefined) {
        // 没有这个字段的当作1版本处理
        ctx.app!.config_version = 1;
    }
    if (ctx.app!.config_version !== CUR_CONFIG_VERSION) {
        console.warn(`project config version ${ctx.app!.config_version} older then latest ${CUR_CONFIG_VERSION}`)
    }
}

async function deploy_dec_app(options:DeployOptions, config: CyfsToolConfig, ctx: CyfsToolContext, stack: SharedCyfsStack): Promise<void> {
    // 目前deploy app需要用到runtime带的cyfs-client工具，这里检查工具的channel和sdk的channel是否匹配
    if (!check_channel(config)) {
        console.error('channel mismatch, exit deploy.');
        return;
    }
    if (!check_owner(config, ctx, stack)) {
        console.error('owner mismatch, exit deploy.');
        return;
    }
    check_config(ctx)
    const is_pack = pack(config, ctx);
    if (!is_pack) {
        console.warn(`service and web are not packed! check project config file. not deploy this version`);
        return;
    }
    upload_dec_app(config, ctx);
    await upload_app_icon(ctx, stack);
    update_app_obj(ctx);
    update_app_version(options, ctx);
    const old_ver = inc_app_version(ctx);
    await put_app_obj(options, ctx, stack);
    console.log(`Deployed DecApp Version: ${old_ver}`);
}

export function makeCommand(config:CyfsToolConfig): Command {
    return new Command("deploy")
        .description("deploy cyfs project`s service or web to ood")
        .option("--tag <tag>", "set version tag, default latest", "latest")
        .option("-d, --desc <desc or desc file>", "set version desc when deploy a new version, can input text or file path")
        .action(async (options: DeployOptions) => {
            const ctx = new CyfsToolContext(process.cwd());
            ctx.init();

            if(!ctx.cyfs_project_exist){
                console.error("当前目录下找不到 .cyfs 目录，请进入 cyfs 项目目录下操作");
                process.exit(0);
            }

            const [stack, writable] = await create_stack("runtime", config, dec_id)
            if (!writable) {
                console.error('runtime running in anonymous(readonly) mode, cannot deploy app.')
                return;
            }

            await stack.online();

            await run(options, config, ctx, stack);
            stop_runtime()

            // process.exit(0);
        })
} 

export async function run(options:DeployOptions, config: CyfsToolConfig, ctx: CyfsToolContext, stack: SharedCyfsStack): Promise<void> {
    console.log('will deploy service');
    await deploy_dec_app(options, config, ctx, stack);
}