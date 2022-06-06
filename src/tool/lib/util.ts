import child_process from 'child_process';
import path from 'path';
import fs from 'fs';

import readline from 'readline';
import { BuckyResult, get_channel, MetaClient, 
    NONAPILevel, None, NONGetObjectOutputRequest, 
    NONGetObjectOutputResponse, ObjectId, Ok, PrivateKey, 
    PrivatekeyDecoder, SavedMetaObject, SharedCyfsStack, 
    StandardObject, StandardObjectDecoder, Data, TxId, create_meta_client, AnyNamedObjectDecoder } from '../../sdk';
import { CyfsToolContext } from './ctx';
import JSBI from 'jsbi';

import * as util from 'util';

const sleep = util.promisify(setTimeout);

export function question(msg: string): Promise<string> {
    return new Promise((reslove, reject) => {
        const cmd = readline.createInterface({ input: process.stdin, output: process.stdout });
        cmd.question(msg, async (answer) => {
            reslove(answer);
        })
    })
}

export function exec(cmd: string, workspace: string): void {
    console.log('');
    console.log('命令执行目录: ', workspace);
    console.log('执行命令: ', cmd,);
    console.log('');
    child_process.execSync(cmd, { stdio: 'inherit', cwd: workspace })
}

export function get_owner_path(option_value: any, config: any, ctx: CyfsToolContext): string {
    // 优先使用 option_value
    // 如果没有，使用ctx.owner
    // 如果还没有，使用default
    if (option_value) {
        return option_value
    }

    if (ctx.cyfs_project_exist && ctx.try_get_app_owner()) {
        return ctx.try_get_app_owner() as string
    }

    return path.join(config.user_profile_dir, 'people')
}

export function load_desc_and_sec(path: string): [StandardObject, PrivateKey] {
    const desc = new StandardObjectDecoder().raw_decode(new Uint8Array(fs.readFileSync(path + ".desc"))).unwrap()[0];
    const sec = new PrivatekeyDecoder().raw_decode(new Uint8Array(fs.readFileSync(path + ".sec"))).unwrap()[0];
    return [desc, sec];
}

export function check_channel(config: any): boolean {
    const output = child_process.execSync(`${config.cyfs_client} --version`, { encoding: 'utf-8' })
    const versions = output.match(/^cyfs-client (.+)-(.+) .+/m);
    const channel = versions[2];
    // const version = versions[1];
    if (channel === undefined) {
        console.log("cannot find runtime tools channel!")
        return false;
    }
    const sdk_channel = get_channel();
    if (channel != sdk_channel) {
        console.error(`sdk channel "${sdk_channel}" mismatch runtime channel "${channel}"!`);
        return false;
    }

    return true;
}

export async function get_final_owner(id: ObjectId, stack: SharedCyfsStack): Promise<BuckyResult<ObjectId>> {
    let obj_id = id;
    while (true) {
        const r = await stack.non_service().get_object({
            common: { flags: 0, level: NONAPILevel.Router },
            object_id: obj_id
        });
        if (r.err) {
            return r;
        }

        const obj = r.unwrap().object.object!;
        // 如果obj没有owner，它就是最终owner了，返回这个id
        if (obj.desc().owner() && obj.desc().owner().is_some()) {
            obj_id = obj.desc().owner().unwrap()
        } else {
            return Ok(obj_id);
        }
    }
}

export async function getObject(params: {
    stack: SharedCyfsStack,
    id: ObjectId | string,
    flags?: number,
    target?: ObjectId,
    inner_path?: string,
    req_path?: string,
    dec_id?: ObjectId,
}): Promise<BuckyResult<NONGetObjectOutputResponse>> {

    let object_id: ObjectId;
    if (typeof (params.id) == 'string') {
        const idResult = ObjectId.from_base_58(params.id);
        if (idResult.err) {
            return idResult
        }
        object_id = idResult.unwrap()
    } else {
        object_id = params.id;
    }
    const target = params.target ? params.target : undefined;
    const flags = params.flags ? params.flags : 0;
    const req: NONGetObjectOutputRequest = {
        object_id: object_id,
        inner_path: params.inner_path,
        common: {
            level: NONAPILevel.Router,
            flags: flags,
            target: target,
            req_path: params.req_path,
            dec_id: params.dec_id
        }
    }
    const r = await params.stack.non_service().get_object(req);
    return r;
}

export async function put_obj_to_meta(meta_client: MetaClient, id: ObjectId, buf: Uint8Array, ctx: CyfsToolContext): Promise<BuckyResult<TxId>> {
    let update = false;
    if ((await meta_client.getDesc(id)).ok) {
        update = true;
        console.log(`id ${id} already on meta chain, update.`)
    } else {
        console.log(`id ${id} not on meta chain, create.`)
    }

    const owner_path = get_owner_path(undefined, undefined, ctx);
    console.info(`use owner at path ${owner_path}`)
    const [owner, owner_sec] = load_desc_and_sec(owner_path)
    const saved_data = SavedMetaObject.Data(new Data(id, buf));
    let r;
    if (update) {
        r = await meta_client.update_desc(owner, saved_data, None, None, owner_sec);
    } else {
        r = await meta_client.create_desc(owner, saved_data, JSBI.BigInt(0), 0, 0, owner_sec);
    }
    if (r.err) {
        console.error("put app desc to meta chain err! ", r.val)
    } else {
        console.log("put app desc to meta chain TxId", r.unwrap())
    }

    return r;
}

export async function upload_app_objs(ctx: CyfsToolContext, meta_client: MetaClient): Promise<void> {
    console.log("will upload app obj to meta chain, use owner`s account")
    let upload_meta_success = false;
    const app_buf = new Uint8Array(fs.readFileSync(ctx.get_app_obj_file()))
    const app = new AnyNamedObjectDecoder().from_raw(app_buf).unwrap();
    const ext_buf = new Uint8Array(fs.readFileSync(ctx.get_app_ext_file()))
    const ext = new AnyNamedObjectDecoder().from_raw(ext_buf).unwrap();
    const app_ret = await put_obj_to_meta(meta_client, app.calculate_id(), app_buf, ctx);
    const ext_ret = await put_obj_to_meta(meta_client, ext.calculate_id(), ext_buf, ctx);
    if (app_ret.err) {
        console.warn('upload app obj to meta err', app_ret.val);
    }

    if (ext_ret.err) {
        console.warn('upload ext obj to meta err', ext_ret.val);
    }
    console.log("waiting app objs on chain...")
    for (let index = 0; index < 3; index++) {
        const app_receipt_ret = await meta_client.getReceipt(app_ret.unwrap());
        if (app_receipt_ret.err) {
            console.info('check meta receipt fail. wait 10 secs');
            await sleep(10*1000);
            continue
        }
        const [app_receipt, app_height] = app_receipt_ret.unwrap().unwrap();

        if (app_receipt.result !== 0) {
            console.error(`upload app obj err ${app_receipt.result} at height ${app_height}`);
            break;
        }

        console.log(`upload app obj success on chain height ${app_height}`)

        const ext_receipt_ret = await meta_client.getReceipt(ext_ret.unwrap());
        if (ext_receipt_ret.err) {
            console.info('check meta receipt fail. wait 10 secs');
            await sleep(10*1000);
            continue
        }
        const [ext_receipt, ext_height] = ext_receipt_ret.unwrap().unwrap();

        if (ext_receipt.result !== 0) {
            console.error(`upload app ext obj err ${ext_receipt.result} at height ${ext_height}`);
            break;
        }

        console.log(`upload app ext obj success on chain height ${ext_height}`)

        upload_meta_success = true;
    }

    if (!upload_meta_success) {
        console.error(`upload app objs failed.\nyou can retry upload use command 'cyfs modify -u' later`)
    }
}