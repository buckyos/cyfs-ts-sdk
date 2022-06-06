import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import { CyfsToolContext } from '../lib/ctx';

export function makeCommand(config: any) {
    return new Command("test")
        .description("start or stop local web test path")
        .option("--start", "start web test")
        .option("--stop", "stop web test")
        .action((options) => {
            let ctx = new CyfsToolContext(process.cwd());
            ctx.init();

            if(!ctx.cyfs_project_exist){
                console.error("当前目录下找不到 .cyfs 目录，请进入 cyfs 项目目录下操作");
                return;
            }

            run(options, config, ctx)
        })
}

function run(options:any, config:any, ctx: CyfsToolContext) {
    let runtime_project_root = path.join(config.runtime_web_root, ctx.app.app_name)
    if (ctx.app.web && ctx.app.web.folder && options.start) {
        fs.ensureSymlinkSync(ctx.app.web.folder, runtime_project_root);
        console.log(`link folder ${ctx.app.web.folder} to ${runtime_project_root}`)
    } else if (options.stop) {
        fs.removeSync(runtime_project_root);
        console.log(`remove linked folder ${runtime_project_root}`)
    }
}