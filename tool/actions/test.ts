import * as fs from 'fs-extra';
import * as path from 'path';

export async function run(options:any, config:any, ctx: any) {
    let runtime_project_root = path.join(config.runtime_web_root, ctx.app.app_name)
    if (ctx.app.web && ctx.app.web.folder && options.start) {
        fs.ensureSymlinkSync(ctx.app.web.folder, runtime_project_root);
        console.log(`link folder ${ctx.app.web.folder} to ${runtime_project_root}`)
    } else if (options.stop) {
        fs.removeSync(runtime_project_root);
        console.log(`remove linked folder ${runtime_project_root}`)
    }
}