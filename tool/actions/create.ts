import path from "path";
import * as fs from 'fs-extra';
import child_process from 'child_process';
import { AnyNamedObjectDecoder, AppExtInfo, DecApp } from "../../src";
import { CyfsToolContext } from "../lib/ctx";
import { Command } from "commander";

function init_from_demo(options:any, config:any, ctx: CyfsToolContext){
    const items = [
        "package.json",
        "readme.md",
        "tsconfig.json",
        "webpack.config.js",
        "service_package.cfg",
        "tslint.json",
        {
            src: "cyfs-app/www",
            dest: "www"
        },
        {
            src: "gitignore",
            dest: ".gitignore"
        }
    ];

    for(const item of items){
        if(typeof item ==='object'){
            const src = path.join(__dirname, "../demo", item.src);
            const dest = path.join(ctx.project_dir, item.dest);
            fs.copySync(src, dest);
        }else{
            const src = path.join(__dirname, "../demo", item);
            const dest = path.join(ctx.project_dir, item);
            fs.copySync(src, dest);
        }
    }
}

export function setup_cyfs_from_src(options:any, config:any, ctx: CyfsToolContext){
    fs.emptyDirSync(path.join(ctx.project_dir, "cyfs"));
    const src = path.join(__dirname, "../src");
    const dest = path.join(ctx.project_dir, "cyfs");
    fs.copySync(src, dest);
}

export function setup_app_obj(options:any, config:any, ctx: CyfsToolContext) {
    let [owner, _] = new AnyNamedObjectDecoder().raw_decode(new Uint8Array(fs.readFileSync(ctx.app_owner().all+'.desc'))).unwrap();
    let owner_id = owner.desc().calculate_id();
    console.log(`new owner: ${owner_id}`);
    // 创建App对象
    let app = DecApp.create(owner_id, ctx.app.app_name);
    console.log(`new app id: ${app.desc().calculate_id()}`);
    fs.writeFileSync(ctx.get_app_obj_file(), app.to_vec().unwrap());

    // 创建AppExtInfo对象，当前内容是空的
    let app_ext = AppExtInfo.create(owner_id, ctx.app.app_name);
    fs.writeFileSync(ctx.get_app_ext_file(), app_ext.to_vec().unwrap());

    // DecId写入config
    ctx.app!.app_id = app.desc().calculate_id().to_base_58();
    ctx.save_app();
}

function setup_git_ignore(options:any, config:any, ctx: CyfsToolContext){
    const git_ignore = path.join(ctx.project_dir, ".gitignore");

    const git_ignore_default = [
        "dist",
        "node_modules",
        ".vscode",
        ".bucky",
        '*.js',
        '*.map',
        '/.cyfs/owner.json',
        '/cyfs',
    ];

    let git_ignore_list;
    if(fs.existsSync(git_ignore)){
        git_ignore_list = fs.readFileSync(git_ignore).toString().split('\n');
        for(const gi of git_ignore_default){
            if(git_ignore_list.indexOf(gi)<0){
                git_ignore_list.push(gi);
            }
        }
    }else{
        git_ignore_list = git_ignore_default;
    }
    fs.writeFileSync(git_ignore, git_ignore_list.join("\n"));
}

function setup_node_modules(options:any, config:any, ctx: CyfsToolContext){
    child_process.execSync("npm install --registry=https://registry.npm.taobao.org", { stdio: 'inherit', env: process.env, cwd: ctx.project_dir });
}

function build(options:any, config:any, ctx: CyfsToolContext){
    child_process.execSync("npm run compile", { stdio: 'inherit', env: process.env, cwd: ctx.project_dir });
}

export async function run(options:any, config:any, ctx: CyfsToolContext) {
    // console.log(ctx);
    // console.log('');
    if(ctx.cyfs_project_exist) {
        console.error(".cyfs目录已存在，当前目录已经是 cyfs工程目录，可使用 cyfs update 更新");
        console.error(ctx.project_dir);
        process.exit(0);
    }

    ctx.setup_project(config.app_name, config.owner);

    init_from_demo(options, config, ctx);
    setup_cyfs_from_src(options, config, ctx);
    setup_git_ignore(options, config, ctx);
    setup_app_obj(options, config, ctx);
    setup_node_modules(options, config, ctx);
    build(options, config, ctx);
}