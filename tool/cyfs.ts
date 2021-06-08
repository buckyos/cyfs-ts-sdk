#!/usr/bin/env node

import getopt from 'node-getopt';
import path from 'path';
import * as fs from 'fs-extra';
import os from 'os';
import { CyfsToolContext } from "./lib/ctx";
import * as action from './actions';

import { Command, InvalidOptionArgumentError } from 'commander';

async function main(){
    const package_json = fs.readJSONSync(path.join(__dirname, "../package.json"));
    console.log("[cyfs], 工具目录：", __dirname);
    console.log("[cyfs], 版本号：", package_json.version);

    const opt = getopt.create([
        ['e', 'endpoint=ARG', 'cyfs endpoint, runtime or ood', 'runtime'],
        // create
        ['n', 'name=ARG', 'solution name'],

        // deploy
        ['' , 'www[=ARG]'    , 'deploy website'],
        ['o' , 'owner=ARG'    , 'owner 通常是一个 people '],
        ['s' , 'save=ARG'    ,   '指定保存位置'],
        ['t' , 'target=ARG'    , 'cyfs target, runtime or ood', 'runtime'],

        // modify
        ['r', 'versions=ARG', 'remove version(s) from app obj'],
        ['u', '', 'upload app obj to target'],
        ['e', '', 'update app ext info'],

        // test
        ['', 'start', 'start www test'],
        ['', 'stop', 'stop www test'],

        // meta
        ['', 'receipt=ARG', "get receipt result"],
        ['', 'meta=ARG', "get receipt result"],

        // ['s' , ''                    , 'short option.'],
        // [''  , 'long'                , 'long option.'],
        // ['S' , 'short-with-arg=ARG'  , 'option with argument', 'S'],
        // ['L' , 'long-with-arg=ARG'   , 'long option with argument'],
        // [''  , 'color[=COLOR]'       , 'COLOR is optional'],
        // ['m' , 'multi-with-arg=ARG+' , 'multiple option with argument'],
        // [''  , 'no-comment'],
        // ['h' , 'help'                , 'display this help'],
        // ['v' , 'version'             , 'show version']
      ])              // create Getopt instance
      .bindHelp()     // bind option 'help' to default action
      .parseSystem(); // parse command line

    console.info({argv: opt.argv, options: opt.options});

    const actions = new Map([
        ["create", action.create.run],
        ["build", action.build.run],
        ["deploy", action.deploy.run],
        ["update", action.update.run],
        ["desc", action.desc.run],
        ["modify", action.modify.run],
        ["test", action.test.run],
        ["import-people", action.import.run],
        ["meta", action.meta.run],
    ]);

    let config: any;
    if(os.platform()==='win32'){
        const userHome = process.env['USERPROFILE']!;
        const appData = process.env['APPDATA']!;
        const runtime_root = path.join(appData, 'cyfs');
        const cyfs_tool_root = path.join(runtime_root, 'tools');
        config = {
            user_home: userHome,
            cyfs_client: path.join(cyfs_tool_root, "cyfs-client.exe"),
            cyfs_meta_client: path.join(cyfs_tool_root, "cyfs-meta-client.exe"),
            desc_tool: path.join(cyfs_tool_root, "desc-tool.exe"),
            pack_tool: path.join(cyfs_tool_root, "pack-tools.exe"),
            runtime_root,
            runtime_web_root: path.join(runtime_root, "services", 'runtime', 'www'),
            runtime_desc_dir:path.join(runtime_root, "etc", 'desc'),
            user_profile_dir: path.join(userHome,".cyfs_profile"),
        };
    } else {
        const userHome = process.env['HOME']!;
        const runtime_root = path.join(userHome, '.local', 'share', 'cyfs');
        const cyfs_tool_root = path.join(runtime_root, 'tools');
        config = {
            user_home: userHome,
            cyfs_client: path.join(cyfs_tool_root, "cyfs-client"),
            cyfs_meta_client: path.join(cyfs_tool_root, "cyfs-meta-client"),
            desc_tool: path.join(cyfs_tool_root, "desc-tool"),
            pack_tool: path.join(cyfs_tool_root, "pack-tools"),
            runtime_root,
            runtime_web_root: path.join(runtime_root, 'services', 'runtime', 'www'),
            runtime_desc_dir: path.join(runtime_root, 'etc', 'desc'),
            user_profile_dir: path.join(userHome, ".cyfs_profile"),
        };
    }

    // 如果命令行指定了owner参数，则使用命令行的owner
    // owner参数的优先级：options.o > ctx.app.owner > user_profile_dir/people
    if(opt.options.o){
        let owner;
        if(path.isAbsolute(opt.options.o as string)){
            owner = opt.options.o;
        }else{
            owner = path.join(process.cwd(), opt.options.o as string);
        }
        config.owner = owner;
    }

    if(opt.options.s){
        let save;
        if(path.isAbsolute(opt.options.s as string)){
            save = opt.options.s;
        }else{
            save = path.join(process.cwd(), opt.options.s as string);
        }
        config.save = save;
    }

    for( const [key, action_func] of actions.entries() ) {
        // console.log('key:', key, opt.argv);
        if(opt.argv.indexOf(key)>=0){
            if(key==='create'){

                // 如果没指定owner，而且默认people在，就使用默认people
                if (config.owner === undefined && fs.existsSync(path.join(config.user_profile_dir, 'people.desc'))) {
                    config.owner = path.join(config.user_profile_dir, 'people');
                    console.log(`use default owner: ${config.owner}`)
                }
                if(opt.options.n==null || config.owner===undefined){
                    console.log("请使用 -n 指定工程名字, -o 指定owner密钥配对文件名字(owner_name.desc, owner_name.sec):");
                    console.log("  cyfs create -n <name> -o <owner_name>");
                    return;
                }
                const project_path = path.join(process.cwd(), opt.options.n as string);
                fs.ensureDirSync(project_path);

                let ctx = new CyfsToolContext(project_path);
                config.app_name = opt.options.n;

                await action_func(opt.options, config, ctx);
            } else {
                let ctx = new CyfsToolContext(process.cwd());
                ctx.init();
                let need_project = true;

                // 如果deploy，且指定了w和o参数，表示想要上传一个指定的文件夹，这时候可以不在cyfs项目下
                if (key==='deploy' && opt.options.www && config.owner) {
                    need_project = false;
                }

                // 如果是import-people功能，也不需要在cyfs项目下执行
                if (key === 'import-people' || key === 'desc' || key === 'meta') {
                    need_project = false;
                }

                if (need_project) {
                    if(!ctx.cyfs_project_exist){
                        console.error("当前目录下找不到 .cyfs 目录，请进入 cyfs 项目目录下操作");
                        process.exit(0);
                    }

                    if (config.owner === undefined) {
                        config.owner = ctx.app_owner().all
                    }
                }

                await action_func(opt.options, config, ctx);
            }

            return;
        }
    }
}

main().then(()=>{
    process.exit(0)
});