#!/usr/bin/env node

import path from 'path';
import * as fs from 'fs-extra';
import os from 'os';
import * as action from './actions';

import { Command } from 'commander';
import { CyfsToolConfig } from './lib/util';

async function main(){
    const package_json = fs.readJSONSync(path.join(__dirname, "package.json"));
    console.log("[cyfs], 工具目录：", __dirname);
    console.log("[cyfs], 版本号：", package_json.version);

    let userHome, runtime_root;
    if(os.platform()==='win32'){
        userHome = process.env['USERPROFILE']!;
        runtime_root = path.join(process.env['APPDATA']!, 'cyfs');
    } else if(os.platform()==='darwin'){
        userHome = process.env['HOME']!;
        runtime_root = path.join(userHome, 'Library', 'Application Support', 'cyfs');
    } else {
        userHome = process.env['HOME']!;
        runtime_root = path.join(userHome, '.local', 'share', 'cyfs');
    }

    const cyfs_tool_root = path.join(runtime_root, 'services', 'runtime', 'tools');

    const config: CyfsToolConfig = {
        user_home: userHome,
        cyfs_client: path.join(cyfs_tool_root, "cyfs-client"),
        pack_tool: path.join(cyfs_tool_root, "pack-tools"),
        runtime_exe_path: path.join(runtime_root, "services", 'runtime', "cyfs-runtime"),
        runtime_web_root: path.join(runtime_root, "services", 'runtime', 'www'),
        runtime_desc_path: path.join(runtime_root, "etc", "desc"),
        user_profile_dir: path.join(userHome,".cyfs_profile"),
    };

    const program = new Command('cyfs');
    await program.addCommand(action.create.makeCommand(config))
        .addCommand(action.pack.makeCommand(config))
        .addCommand(action.deploy.makeCommand(config))
        .addCommand(action.desc.makeCommand(config))
        .addCommand(action.import.makeCommand(config))
        .addCommand(action.test.makeCommand(config))
        .addCommand(action.modify.makeCommand(config))
        .addCommand(action.meta.makeCommand(config))
        .addCommand(action.upload.makeCommand(config))
        .addCommand(action.get.makeCommand(config))
        .addCommand(action.dump.makeCommand(config))
        .addCommand(action.shell.makeCommand(config))
        .showHelpAfterError(true)
        .parseAsync();

    process.exit(0)
}

main();