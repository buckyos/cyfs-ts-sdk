import {exec} from "../lib/util";

import * as path from 'path';
import * as fs from 'fs-extra';
import * as child_process from 'child_process';
import { CyfsToolContext } from "../lib/ctx";

function copy_pack_files(options:any, config: any, ctx: CyfsToolContext) {
    for(const target of ctx.app.service.dist_targets){
        let dist_target = path.join(ctx.project_dir, ctx.app.service.dist, target);
        fs.ensureDirSync(dist_target);
        for(const item of ctx.app.service.pack){
            fs.copySync( path.join(ctx.project_dir, item), path.join(dist_target, item));
        }
        fs.copySync( path.join(ctx.project_dir, "cyfs"), path.join(dist_target, "cyfs"));
        fs.copyFileSync(path.join(ctx.project_dir, "package.json"), path.join(dist_target, "package.json"))
    }
}

function copy_service_config(options:any, config: any, ctx: CyfsToolContext) {
    for(const target of ctx.app.service.dist_targets){
        let dist_target = path.join(ctx.project_dir, ctx.app.service.dist, target);
        fs.ensureDirSync(dist_target);
        let config_path = ctx.app.service.app_config[target] || ctx.app.service.app_config.default
        fs.copySync(path.join(ctx.project_dir, config_path), path.join(dist_target, "package.cfg"))
    }
}

function pack_targets(options:any, config: any, ctx: CyfsToolContext) {
    // 打包 app
    // pack-tools -d <path>，在<path>的上一级目录下生成<last_path_name>.zip文件
    exec(`${config.pack_tool} -d ${ctx.app.service.dist}`, process.cwd());
}

function build_dec_app(options:any, config: any, ctx: CyfsToolContext) {
    // 如果没配置service.pack, 就不build，认为用户已经事先准备好dist目录，只需要pack
    if (ctx.app!.service.pack && ctx.app!.service.pack.length !== 0) {
        child_process.execSync("npm run compile", { stdio: 'inherit', env: process.env, cwd: ctx.project_dir });
        copy_pack_files(options, config, ctx);
    }

    copy_service_config(options, config, ctx);
    pack_targets(options, config, ctx);
}

async function build_web(options:any, config: any, ctx: CyfsToolContext) {
    // 如果没有配置ctx.web.folder, 就不build
    if (ctx.app!.web.folder === "") {
        return;
    }
    child_process.execSync("npm run build", { stdio: 'inherit', env: process.env, cwd: ctx.project_dir });
}

export async function run(options:any, config: any, ctx: CyfsToolContext) {
    if(options.www !== undefined){
        return build_web(options, config, ctx);
    }else{
        return build_dec_app(options, config, ctx);
    }
}