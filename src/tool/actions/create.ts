import path from "path";
import * as fs from 'fs-extra';
import child_process from 'child_process';
import { AppExtInfo, DecApp } from "../../sdk";
import { CyfsToolContext } from "../lib/ctx";
import { Command } from "commander";
import { load_desc_and_sec } from "../lib/util";

function init_from_demo(ctx: CyfsToolContext){
    const items = [
        "package.json",
        "readme.md",
        "tsconfig.json",
        "webpack.config.js",
        "service_package.cfg",
        "tslint.json",
        "www",
        "service",
        {
            src: "gitignore",
            dest: ".gitignore"
        },
        "acl.cfg",
        "dependent.cfg"
    ];

    for(const item of items){
        if(typeof item ==='object'){
            const src = path.join(__dirname, "demo", item.src);
            const dest = path.join(ctx.project_dir, item.dest);
            fs.copySync(src, dest);
        }else{
            const src = path.join(__dirname, "demo", item);
            const dest = path.join(ctx.project_dir, item);
            fs.copySync(src, dest);
        }
    }
}

export function setup_app_obj(ctx: CyfsToolContext) {
    const [owner, owner_sec] = load_desc_and_sec(ctx.app_owner().all)
    const owner_id = owner.desc().calculate_id();
    console.log(`new owner: ${owner_id}`);
    // 创建App对象
    const app = DecApp.create(owner_id, ctx.app.app_name);
    console.log(`new app id: ${app.desc().calculate_id()}`);
    ctx.app_obj = app;
    ctx.save_app_obj();

    // 创建AppExtInfo对象，当前内容是空的
    const app_ext = AppExtInfo.create(owner_id, ctx.app.app_name);
    fs.writeFileSync(ctx.get_app_ext_file(), app_ext.to_vec().unwrap());

    // DecId写入config
    ctx.app!.app_id = app.desc().calculate_id().to_base_58();
    ctx.save_project_config();
}

function setup_git_ignore(ctx: CyfsToolContext){
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

function setup_node_modules(ctx: CyfsToolContext){
    child_process.execSync("npm install", { stdio: 'inherit', env: process.env, cwd: ctx.project_dir });
}

export function makeCommand(config: any) {
    return new Command('create')
        .description("create cyfs project")
        .requiredOption("-n, --name <name>", "project name")
        .requiredOption("-o, --owner <owner_path>", "project owner keypair path, exclude extension", path.join(config.user_profile_dir, 'people'))
        .action((options) => {
            if (!fs.existsSync(options.owner + ".desc")) {
                console.error(`owner file ${options.owner + ".desc"} not exists!`);
                return;
            }
            if(options.name==undefined){
                console.log("请使用 -n 指定工程名字, -o 指定owner密钥配对文件名字(owner_name.desc, owner_name.sec):");
                console.log("  cyfs create -n <name> -o <owner_name>");
                return;
            }
            console.log(`use owner at ${options.owner}`)

            const project_path = path.join(process.cwd(), options.name);
            fs.ensureDirSync(project_path);

            const ctx = new CyfsToolContext(project_path);
            ctx.init();

            run(options.name, options.owner, ctx)
        });
}

function run(name: string, owner: string, ctx: CyfsToolContext) {
    if(ctx.cyfs_project_exist) {
        console.error(`指定工程${ctx.project_dir}已存在, 可在工程目录下使用 cyfs update 更新`);
        return;
    }

    ctx.setup_project(name, owner);

    init_from_demo(ctx);
    setup_git_ignore(ctx);
    setup_app_obj(ctx);
    setup_node_modules(ctx);
}