import { AppExtInfoDecoder, create_meta_client, SharedCyfsStack } from "../../sdk";
import * as fs from 'fs-extra';
import { put_app_obj, update_ext_info } from './deploy'
import { create_stack, CyfsToolConfig, question, stop_runtime, upload_app_objs} from "../lib/util";
import { CyfsToolContext } from "../lib/ctx";
import { setup_app_obj } from "./create";
import { Command } from "commander";

function resetBuildNo(version: string){
    const versions = version.split('.');
    version = `${versions[0]}.${versions[1]}.0`;
    return version;
}

export function makeCommand(config: CyfsToolConfig) {
    return new Command("modify")
        .description("modify app info and upload to ood")
        .option("-l, --local", "only change app info locally, not put to ood or meta")
        .option("-s, --show", "only show app info, not change anything")
        .option("-o, --owner <new_owner_path>", "change project`s owner path")
        .option("-e, --endpoint <endpoint>", "cyfs endpoint", "runtime")
        .option("--ext", "update app ext info")
        .option("-r, --remove [versions]", "remove app versions")
        .option("-u, --upload", "upload app info to meta")
        .option("-t, --tag <tag>:<version>", "set tag to version")
        .option("--remove-tag <tags>", "remove tags, split by comma")
        .action(async (options) => {
            const ctx = new CyfsToolContext(process.cwd());
            ctx.init();

            if(!ctx.cyfs_project_exist) {
                console.error("当前目录下找不到 .cyfs 目录，请进入 cyfs 项目目录下操作");
                return;
            }

            await run(options, config, ctx)
        })
}

export async function run(options:any, config: CyfsToolConfig, ctx: CyfsToolContext) {
    const app = ctx.get_app_obj();
    if (!options.show) {
        if (options.owner && options.owner !== "") {
            const answer = await question(`重新设置owner会清除旧有App数据，重新生成DEC ID，是否继续？(yes/no)`);
            if (answer !== "yes") {
                process.exit(0);
            }
    
            // 修改owner.json
            if (!ctx.owner) {
                console.error('app owner config not exist!, create an empty config')
                ctx.owner = {all: ""}
            }
            ctx.owner.all = options.owner
            ctx.save_owner();
    
            // 重新生成app obj
            (console as any).origin.log('正在重新生成App数据...');
            setup_app_obj(ctx);
    
            // 重置版本号
            ctx.app.version = resetBuildNo(ctx.app.version);
            ctx.save_project_config();
    
            // 只能修改owner，修改完了就退出
            (console as any).origin.log('owner重新设置完毕，已清除版本号. 重新生成DecId. 请修改代码中的DecId，并新owner匹配的runtime上重新deploy')
            process.exit(0);
        }

        if (options.remove) {
            const versions = (options.remove as string).split(',');
            for (const version of versions) {
                app.remove_source(version);
            }
        }
    
        if (options.ext) {
            update_ext_info(ctx);
        }
    
        if (options.tag) {
            const [tag, ver] = (options.tag as string).split(":")
            if (!tag || !ver) {
                console.error("tag param error, must use <tag>:<version>");
                return;
            }
    
            if (app.find_source(ver).err) {
                console.log(`cannot find ver ${ver}, set tag failed.`);
                return;
            }
    
            app.set_tag(tag, ver);
        }
    
        if (options.removeTag) {
            const tags = (options.removeTag as string).split(",");
            for (const tag of tags) {
                app.remove_tag(tag);
            }
        }
    
        ctx.save_app_obj()
    
        if (!options.local) {
            const [stack, writable] = await create_stack("runtime", config)
            if (!writable) {
                console.error('runtime running in anonymous(readonly) mode, cannot upload decapp object.')
                return;
            }
            await stack.online();
            await put_app_obj(options, ctx, stack);
            stop_runtime();

            if (options.upload) {
                const meta_client = create_meta_client();
                await upload_app_objs(ctx, meta_client);
            }
        }
    }

    (console as any).origin.log(`App对象链接： cyfs://${app.desc().owner()?.unwrap()}/${app.desc().calculate_id()}`);
    const desc = app.app_desc()
    if (desc) {
        (console as any).origin.log("App 描述:", desc);
        
    }
    const icon = app.icon()
    if (icon) {
        (console as any).origin.log("App 图标链接:", icon);
    }
    (console as any).origin.log('对象内存储版本：');
    for (const [ver, fid] of app.source().entries()) {
        (console as any).origin.log(`\t${ver}: ${fid}`);
    }

    (console as any).origin.log('对象内tag：');
    for (const [tag, version] of app.tags().entries()) {
        (console as any).origin.log(`\t${tag}: ${version}`);
    }

    if(fs.existsSync(ctx.get_app_ext_file())) {
        const appext = new AppExtInfoDecoder().from_raw(new Uint8Array(fs.readFileSync(ctx.get_app_ext_file()))).unwrap();
        (console as any).origin.log(`App额外信息： ${appext.info()}`);
    }
}