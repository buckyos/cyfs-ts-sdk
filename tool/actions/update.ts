import * as path from "path";
import * as fs from 'fs-extra';
import * as child_process from 'child_process';
import { setup_cyfs_from_src } from "./create";
import { CyfsToolContext } from "../lib/ctx";

function update_node_modules(options: any, config: any, ctx: CyfsToolContext) {
    let new_cyfs_json = fs.readJSONSync(path.join(__dirname, "../demo/package.json"));
    let current_json = fs.readJSONSync(path.join(ctx.project_dir, "package.json"));
    for (const module in new_cyfs_json.dependencies) {
        if (new_cyfs_json.dependencies[module] !== current_json.dependencies[module]) {
            child_process.execSync(`npm i --save ${module}@${new_cyfs_json.dependencies[module]}`, { stdio: 'inherit', env: process.env, cwd: ctx.project_dir })
        }
    }
}

function update_config(options:any, config:any, ctx: CyfsToolContext) {
    // do nithing now
}

export function run(options:any, config:any, ctx: CyfsToolContext) {
    if(!ctx.cyfs_project_exist){
        console.error(".cyfs目录不存在，当前目录不是 cyfs工程目录，可使用 cyfs create 创建");
        process.exit(0);
    }

    setup_cyfs_from_src(options, config, ctx);
    update_node_modules(options, config, ctx);
    update_config(options, config, ctx);
}