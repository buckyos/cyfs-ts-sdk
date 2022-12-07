import child_process, { ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

import readline from 'readline';
import { BuckyResult, get_channel, MetaClient, 
    NONAPILevel, None, NONGetObjectOutputRequest, 
    NONGetObjectOutputResponse, ObjectId, Ok, PrivateKey, 
    PrivatekeyDecoder, SavedMetaObject, SharedCyfsStack, 
    StandardObject, StandardObjectDecoder, Data, TxId, BuckyErrorCode, AnyNamedObjectDecoder, Err, BuckyError, get_system_dec_app } from '../../sdk';
import { CyfsToolContext } from './ctx';
import JSBI from 'jsbi';

import * as util from 'util';

const sleep = util.promisify(setTimeout);

export interface CyfsToolConfig {
    user_home: string,
    cyfs_client: string,
    pack_tool: string,
    runtime_exe_path: string,
    runtime_desc_path: string,
    runtime_web_root: string,
    user_profile_dir: string
}

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

export function stringToUint8Array(str:string): Uint8Array{
    const arr: number[] = [];
    for (let i = 0, j = str.length; i < j; ++i) {
      arr.push(str.charCodeAt(i));
    }
   
    return new Uint8Array(arr)
}

export function get_owner_path(option_value: any, config: CyfsToolConfig|undefined, ctx: CyfsToolContext): string|undefined {
    // 优先使用 option_value
    // 如果没有，使用ctx.owner
    // 如果还没有，使用default
    if (option_value) {
        return option_value
    }

    if (ctx.cyfs_project_exist && ctx.try_get_app_owner()) {
        return ctx.try_get_app_owner() as string
    }

    if (config) {
        return path.join(config.user_profile_dir, 'people')
    }

    return undefined
}

export function load_desc_and_sec(path: string): [StandardObject, PrivateKey] {
    const desc = new StandardObjectDecoder().raw_decode(new Uint8Array(fs.readFileSync(path + ".desc"))).unwrap()[0];
    const sec = new PrivatekeyDecoder().raw_decode(new Uint8Array(fs.readFileSync(path + ".sec"))).unwrap()[0];
    return [desc, sec];
}

export function check_channel(config: CyfsToolConfig): boolean {
    const output = child_process.execSync(`"${config.cyfs_client}" --version`, { encoding: 'utf-8' })
    console.log("upload tool: ", output)
    const versions = output.match(/^cyfs-client (.+)-(.+) .+/m);
    const channel = versions![2];
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
        if (obj.desc().owner() && obj.desc().owner()!.is_some()) {
            obj_id = obj.desc().owner()!.unwrap()
        } else {
            return Ok(obj_id);
        }
    }
}

export function makeRLink(
    ownerId: ObjectId,
    dec_id: ObjectId,
    inner_path: string
): string {
    return [`cyfs://r`, ownerId.to_base_58(), dec_id.to_base_58(), inner_path].join("/");
}

export function makeOLink(
    ownerId: ObjectId,
    object_id: ObjectId,
    inner_path: string
): string {
    return [`cyfs://o`, ownerId.to_base_58(), object_id.to_base_58(), inner_path].join("/");
}

// 时间格式转换
export function formatDate(date: number | string | Date, isfoleder?: boolean): string{
    if (Number(date) > 0) {
      date = new Date(Number(date))
      const years = date.getFullYear() > 9 ? date.getFullYear() : '0' + date.getFullYear();
      const months = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1);
      const dates = date.getDate() > 9 ? date.getDate() : '0' + date.getDate();
      const hours = date.getHours() > 9 ? date.getHours() : '0' + date.getHours();
      const minutes = date.getMinutes() > 9 ? date.getMinutes() : '0' + date.getMinutes();
      const seconds = date.getSeconds() > 9 ? date.getSeconds() : '0' + date.getSeconds();
      if (isfoleder) {
        return years + '-' + months + '-' + dates + '<br/>' + hours + ':' + minutes + ':' + seconds;
      } else {
        return years + '-' + months + '-' + dates + ' ' + hours + ':' + minutes + ':' + seconds;
      }
    } else {
      return '-';
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
    if (owner_path === undefined) {
        console.error('cannot found owner path in project config.')
        return Err(new BuckyError(BuckyErrorCode.InvalidParam, 'cannot found owner path in project config'))
    }
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

import * as http from 'http'
async function get(url): Promise<string> {
    return new Promise((reslove, reject) => {
        const req = http.get(url, (resp) => {
            let resp_body = "";
            resp.on('data', (chunk) => {
                resp_body += chunk;
            });
            resp.on('end', () => {
                reslove(resp_body)
            })
        });
        req.on('error', (error) => {
            reject(error)
        })
    });
}

// check runtime opening, and also return is writable
// if runtime endpoint, return is writable
// return [isopening, iswritable]
async function check_runtime(endpoint): Promise<[boolean, boolean]> {
    try {
        const resp_json = await get('http://127.0.0.1:1321/check');
        const resp = JSON.parse(resp_json);
        return [true, resp.activation]
    } catch (error) {
        console.log('runtime not running')
        return [false, false]
    }
}

let child_runtime: ChildProcess | undefined = undefined;

function start_runtime(config: CyfsToolConfig) {
    const anonymous = !fs.existsSync(path.join(config.runtime_desc_path, "device.desc"));
    let cmd = config.runtime_exe_path;
    if (anonymous) {
        cmd += ' --anonymous'
    }
    child_runtime = child_process.spawn(cmd, {windowsHide: true, stdio: 'ignore', shell: false});
    console.log("start cyfs runtime. pid", child_runtime.pid);
}

export async function create_stack(endpoint: string, config: CyfsToolConfig, dec_id: ObjectId): Promise<[SharedCyfsStack, boolean]> {
    if (endpoint === "ood") {
        return [SharedCyfsStack.open_default(dec_id), true];
    } else if (endpoint === "runtime") {
        // retry 3 times
        let wait_times = 2000;
        for (let index = 0; index <= 3; index++) {
            console.log('check cyfs-runtime running...')
            const [running, writable] = await check_runtime(endpoint);
            if (running) {
                return [SharedCyfsStack.open_runtime(dec_id), writable];
            }
            if (child_runtime && child_runtime.exitCode !== null) {
                console.warn("cyfs-runtime still initalizing, please wait...");
            } else {
                console.log('cyfs-runtime not running, try start runtime...');
                start_runtime(config);
            }
            await sleep(wait_times)
            wait_times *= 2;
        }

        console.error('cannot start cyfs-runtime, please check cyfs-runtime status')
        process.exit(1)
        
    } else {
        console.error('invalid endpoint:', endpoint);
        throw Error("invalid endpoint")
    }
}

export function stop_runtime():void {
    if (child_runtime) {
        child_runtime.kill()
        child_runtime = undefined;
    }
}


// 从一个cyfs的url，转换成本地协议栈的non url
// json和data不能同时为true，如果同时为true的情况，以json为优先
export function convert_cyfs_url(cyfs_url: string, stack: SharedCyfsStack, json: boolean, data: boolean, dec_id: ObjectId): [string, { [key: string]: string }, string] {
    const local_device_id = stack.local_device_id().object_id
    const non_url = cyfs_url.replace("cyfs://", stack.non_service().service_url);

    const url = new URL(non_url)
    const path_seg = url.pathname.split("/").slice(1);
    // 如果链接带o，拼之后就会变成http://127.0.0.1:1318/non/o/xxxxx
    // 这里要去掉non和o这两个路径。如果没有o，就只去掉non一层
    if (path_seg[1] === "o") {
        url.pathname = path_seg.slice(2).join("/");
    } else {
        url.pathname = path_seg.slice(1).join("/");
    }

    const uri = decodeURI(path_seg[path_seg.length - 1]);

    if (json) {
        url.searchParams.set("format", "json");
    } else {
        url.searchParams.set("format", "raw");
    }

    if (data && !json) {
        url.searchParams.set("mode", "data");
    } else {
        url.searchParams.set("mode", "object");
    }
    
    url.searchParams.set("dec_id", get_system_dec_app().object_id.toString());

    return [url.toString(), {CYFS_REMOTE_DEVICE: local_device_id.toString()}, uri];
}