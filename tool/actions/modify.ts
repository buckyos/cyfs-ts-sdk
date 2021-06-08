import { AppExtInfoDecoder, DecAppDecoder } from "../../src";
import * as fs from 'fs-extra';
import { put_app_obj, update_ext_info } from './deploy'
import { question } from "../lib/util";
import { CyfsToolContext } from "../lib/ctx";
import { setup_app_obj } from "./create";

function resetBuildNo(version: string){
    let versions = version.split('.');
    version = `${versions[0]}.${versions[1]}.0`;
    return version;
}

export async function run(options:any, config:any, ctx: CyfsToolContext) {
    if (options.o && options.o !== "") {
        let answer = await question(`重新设置owner会清除旧有App数据，重新生成DEC ID，是否继续？(yes/no)`);
        if (answer !== "yes") {
            process.exit(0);
        }

        // 修改owner.json
        ctx.owner.all = options.o
        ctx.save_owner();

        // 重新生成app obj
        (console as any).origin.log('正在重新生成App数据...');
        setup_app_obj(options, config, ctx);

        // 重置版本号
        ctx.app.version = resetBuildNo(ctx.app.version);
        ctx.save_app();

        // 只能修改owner，修改完了就退出
        (console as any).origin.log('owner重新设置完毕，已清除版本号. 重新生成DecId. 请修改代码中的DecId，并新owner匹配的runtime上重新deploy')
        process.exit(0);
    }

    const app_obj = ctx.get_app_obj_file();
    const app_obj_buf = new Uint8Array(fs.readFileSync(app_obj));
    const [app, buf] = new DecAppDecoder().raw_decode(app_obj_buf).unwrap();
    if (options.r) {
        let versions = (options.r as string).split(',');
        for (const version of versions) {
            app.remove_source(version);
        }
        fs.writeFileSync(app_obj, app.to_vec().unwrap());
    }

    if (options.e) {
        update_ext_info(options, config, ctx);
    }

    if (options.u) {
        await put_app_obj(options, config, ctx);
    }

    (console as any).origin.log(`App对象： cyfs://${app.desc().owner()?.unwrap()}/${app.desc().calculate_id()}`);
    (console as any).origin.log('对象内存储版本：');
    for (const [ver, fid] of app.source().entries()) {
        (console as any).origin.log(`${ver}: ${fid}`);
    }

    if(fs.existsSync(ctx.get_app_ext_file())) {
        const [appext, buf1] = new AppExtInfoDecoder().raw_decode(new Uint8Array(fs.readFileSync(ctx.get_app_ext_file()))).unwrap();
        (console as any).origin.log(`App额外信息： ${appext.info()}`);
    }
}