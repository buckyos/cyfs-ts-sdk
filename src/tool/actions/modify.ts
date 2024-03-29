import { AppExtInfoDecoder} from "../../sdk";
import * as fs from 'fs-extra';
import { put_app_obj, update_ext_info } from './deploy'
import { create_stack, CyfsToolConfig, question, stop_runtime} from "../lib/util";
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
        .option("--export-ext <export file path>", "export entire extinfo to file")
        .option("--import-ext <ext file path>", "import entire extinfo to app ext info")
        .option("-r, --remove [versions]", "remove app versions")
        .option("-t, --tag <tag>:<version>", "set tag to version")
        .option("--remove-tag <tags>", "remove tags, split by comma")
        .action(async (options) => {
            const ctx = new CyfsToolContext(process.cwd());
            ctx.init();

            if(!ctx.cyfs_project_exist) {
                console.error(".cyfs directory is not found in the current directory, please go to the cyfs project directory");
                return;
            }

            await run(options, config, ctx)
        })
}

export async function run(options:any, config: CyfsToolConfig, ctx: CyfsToolContext) {
    const app = ctx.get_app_obj();
    if (!options.show) {
        if (options.owner && options.owner !== "") {
            const answer = await question(`Resetting the owner will clear the old App data and regenerate the DEC ID, Continue?(yes/no)`);
            if (answer !== "yes") {
                process.exit(0);
            }

            // 检查这个路径传的对不对
            if (!(fs.existsSync(`${options.owner}.sec`) && fs.existsSync(`${options.owner}.desc`))) {
                console.error(`path ${options.owner}.sec or ${options.owner}.desc not exists!`)
                process.exit(1)
            }
    
            // 修改owner.json
            if (!ctx.owner) {
                console.error('app owner config not exist!, create an empty config')
                ctx.owner = {all: ""}
            }
            ctx.owner.all = options.owner
            ctx.save_owner();
    
            // 重新生成app obj
            (console as any).origin.log('Regenerating App data...');
            setup_app_obj(ctx);
    
            // 重置版本号
            ctx.app.version = resetBuildNo(ctx.app.version);
            ctx.save_project_config();
    
            // 只能修改owner，修改完了就退出
            (console as any).origin.log('The owner reset and version cleared. Regenerate the DecId. Please modify the DecId in the code and re-deploy it on the new owner`s runtime.')
            process.exit(0);
        }

        if (options["export-ext"]) {
            let ext = ctx.get_app_ext_obj()
            fs.writeFileSync(options["export-ext"], ext.info());
            // export后就退出了
            (console as any).origin.log(`export ext info to file ${options["export-ext"]}`);
            process.exit(0);
        }

        if (options.remove) {
            const versions = (options.remove as string).split(',');
            let app_ext = ctx.get_app_ext_obj();
            let app_ext_obj = JSON.parse(app_ext.info());
            for (const version of versions) {
                app.remove_source(version);
                if (app_ext_obj["cyfs-app-store"] && app_ext_obj["cyfs-app-store"]["releasedate"] && app_ext_obj["cyfs-app-store"]["releasedate"]) {
                    delete app_ext_obj["cyfs-app-store"]["releasedate"][version]
                }
            }
            // 向app_ext对象添加extinfo
            const new_info_str = JSON.stringify(app_ext_obj)
            if (new_info_str !== app_ext.info()) {
                console.log(`ext info change: ${app_ext.info()} => ${new_info_str}`);
                app_ext.set_info(new_info_str)
            }
            ctx.save_app_ext_obj();
        }
    
        if (options.ext) {
            update_ext_info(ctx, false);
        }

        if (options["import-ext"]) {
            let ext = ctx.get_app_ext_obj()
            ext.set_info(fs.readFileSync(options["import-ext"], {encoding: "utf-8"}));
            ctx.save_app_ext_obj();
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
        }
    }

    (console as any).origin.log(`App Link： cyfs://${app.desc().owner()?.unwrap()}/${app.desc().calculate_id()}`);
    const desc = app.app_desc()
    if (desc) {
        (console as any).origin.log("App Desc:", desc);
        
    }
    const icon = app.icon()
    if (icon) {
        (console as any).origin.log("App Icon:", icon);
    }
    (console as any).origin.log('Versions in App：');
    for (const [ver, fid] of app.source().entries()) {
        (console as any).origin.log(`\t${ver}: ${fid}`);
    }

    (console as any).origin.log('Tags in App：');
    for (const [tag, version] of app.tags().entries()) {
        (console as any).origin.log(`\t${tag}: ${version}`);
    }

    if(fs.existsSync(ctx.get_app_ext_file())) {
        const appext = new AppExtInfoDecoder().from_raw(new Uint8Array(fs.readFileSync(ctx.get_app_ext_file()))).unwrap();
        (console as any).origin.log(`App ExtInfo： ${appext.info()}`);
    }
}