import {CyfsToolConfig, exec} from "../lib/util";

import * as path from 'path';
import * as fs from 'fs-extra';
import { CyfsToolContext } from "../lib/ctx";
import { Command } from "commander";

function copy_pack_files(ctx: CyfsToolContext) {
    // 如果service type是node，拷贝需要的文件到dist/service/target下边，否则视为用户自己手工放文件
    if (ctx.app!.service.type === "rust") {
        // 如果service type是rust，pack指定一个或多个目录，将${pack}/下所有的文件拷贝到dist/service下，先不做更精细的操作了
        const dist_target = path.join(ctx.project_dir, ctx.app.dist, "service");
        console.log(`copy service to target path ${dist_target}`);
        fs.ensureDirSync(dist_target);
        for(const item of ctx.app.service.pack){
            fs.copySync( path.join(ctx.project_dir, item), dist_target, {recursive: true, overwrite: true});
        }
    } else if (ctx.app!.service.type === "node") {
        // 如果service type是node，拷贝需要的文件到dist/service/target下边
        for(const target of ctx.app.service.dist_targets){
            const dist_target = path.join(ctx.project_dir, ctx.app.dist, "service", target);
            console.log(`copy service to target path ${dist_target}`);
            fs.ensureDirSync(dist_target);
            for(const item of ctx.app.service.pack){
                fs.copySync( path.join(ctx.project_dir, item), path.join(dist_target, item));
            }
            fs.copyFileSync(path.join(ctx.project_dir, "package.json"), path.join(dist_target, "package.json"))
        }
    } else {
        console.error(`unsupport service type ${ctx.app!.service.type}`)
    }
    
}

function copy_service_config(ctx: CyfsToolContext) {
    for(const target of ctx.app.service.dist_targets){
        const dist_target = path.join(ctx.project_dir, ctx.app.dist, "service", target);
        // 只有service target文件夹存在，才会拷贝service_config文件
        if (fs.existsSync(dist_target)) {
            console.log(`copy service config to target path ${dist_target}`);
            const config_path = ctx.app.service.app_config[target] || ctx.app.service.app_config.default
            fs.copySync(path.join(ctx.project_dir, config_path), path.join(dist_target, "package.cfg"))
        }
    }
}


function copy_dependent_config(ctx: CyfsToolContext) {
    if (ctx.app.service.app_dependent_config === undefined || ctx.app.service.app_dependent_config === "") {
        console.log(`no need copy dependent config`);
        return;
    }
    if (ctx.app.service.app_dependent_config.default === undefined || ctx.app.service.app_dependent_config.default === "") {
        console.log(`no need copy dependent config`);
        return;
    }
    const dist_target = path.join(ctx.project_dir, ctx.app.dist, "dependent");
    fs.ensureDirSync(dist_target);
    if (fs.existsSync(dist_target)) {
        console.log(`copy service dependent config to target path ${dist_target}`);
        const dependent_config_path = path.join(ctx.project_dir,ctx.app.service.app_dependent_config.default);
        if (fs.existsSync(dependent_config_path)) {
            fs.copySync(dependent_config_path, path.join(dist_target, "dependent.cfg"))
        }
    }
}

function copy_acl_config(ctx: CyfsToolContext) {
    if (ctx.app.service.app_acl_config === undefined || ctx.app.service.app_acl_config === "") {
        console.log(`no need copy acl config`);
        return;
    }
    if (ctx.app.service.app_acl_config.default === undefined || ctx.app.service.app_acl_config.default === "") {
        console.log(`no need copy acl config`);
        return;
    }
    const dist_target = path.join(ctx.project_dir, ctx.app.dist, "acl");
    fs.ensureDirSync(dist_target);
    if (fs.existsSync(dist_target)) {
        console.log(`copy service acl config to target path ${dist_target}`);
        const acl_config_path = path.join(ctx.project_dir,ctx.app.service.app_acl_config.default);
        if (fs.existsSync(acl_config_path)) {
            fs.copySync(acl_config_path, path.join(dist_target, "acl.cfg"))
        }
    }
}

function pack_targets(config: CyfsToolConfig, ctx: CyfsToolContext) {
    // 打包 service
    // pack-tools -d <path>，在<path>的上一级目录下生成<last_path_name>.zip文件
    for(const target of ctx.app.service.dist_targets){
        const dist_target = path.join(ctx.project_dir, ctx.app.dist, "service", target);
        // 只有service target文件夹存在，才会打包对应target的service
        if (fs.existsSync(dist_target)) {
            console.log(`pack ${dist_target}`);
            exec(`"${config.pack_tool}" -d "${dist_target}"`, process.cwd());
            fs.removeSync(dist_target)
        }
    }
}

function pack_service(config: CyfsToolConfig, ctx: CyfsToolContext): boolean {
    console.log("begin pack service");
    // 如果没配置service.pack, 认为用户没有service
    if (ctx.app!.service.pack.length === 0) {
        console.log("no node service folder, skip.")
        return false;
    }
    
    copy_dependent_config(ctx);
    copy_acl_config(ctx);
    copy_pack_files(ctx);
    copy_service_config(ctx);
    pack_targets(config, ctx);
    return true;
}

function pack_web(config: CyfsToolConfig, ctx: CyfsToolContext): boolean {
    console.log("begin pack web folder");
    // 如果没有配置ctx.web.folder, 就不build
    if (ctx.app!.web.folder === undefined || ctx.app!.web.folder === "") {
        console.log("no web folder in config, skip");
        return false;
    }
    // 在web folder下生成一个web_config.json文件，当前就只是存储entry首页的信息
    // 把web文件夹拷贝到${dist}/web
    const web_dir = path.join(ctx.get_app_dist_path(), "web");
    fs.copySync(ctx.app!.web.folder, web_dir);
    const web_config:any = {};
    if (ctx.app!.web.entry) {
        web_config.entry = ctx.app!.web.entry
    }
    fs.writeJSONSync(path.join(web_dir, "web_config.json"), web_config);
    // 用pack-tool将web文件夹打包成zip
    console.log(`pack ${web_dir}`);
    exec(`"${config.pack_tool}" -d "${web_dir}"`, process.cwd());
    fs.removeSync(web_dir)
    return true;
}

export function makeCommand(config: CyfsToolConfig) {
    return new Command('pack')
        .description("pack app for deploy")
        .action(() => {
            const ctx = new CyfsToolContext(process.cwd());
            ctx.init();

            if(!ctx.cyfs_project_exist){
                console.error(".cyfs directory is not found in the current directory, please go to the cyfs project directory");
                return;
            }

            pack(config, ctx);
        });
}

export function pack(config: CyfsToolConfig, ctx: CyfsToolContext): boolean {
    fs.emptyDirSync(ctx.app!.dist)

    const web = pack_web(config, ctx);
    const service = pack_service(config, ctx);
    return web || service;
}