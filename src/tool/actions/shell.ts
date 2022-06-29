import { Argument, Command } from "commander";

import { ObjectId, SharedCyfsStack, ObjectMapSimpleContentType, ObjectTypeCode, BuckyResult, Ok, clog, get_system_dec_app, DecAppDecoder, bucky_time_2_js_time, number_2_obj_type_code_name, OBJECT_TYPE_CORE_START, OBJECT_TYPE_CORE_END, number_2_core_object_name } from "../../sdk";
import { create_stack, CyfsToolConfig, formatDate, getObject, stop_runtime } from "../lib/util";
import { dump_object } from './dump';
import {run as get_run} from './get';
import { delete_object as del} from './del';
import * as fs from 'fs'
import {posix as path} from "path";

import * as inquirer from 'inquirer'
inquirer.registerPrompt(
    'command',
    require('inquirer-command-prompt')
)

const colors = require('colors-console')

let local_device_index = 0;
const device_list: any[] = [];
const dec_name_cache = new Map<string, string|undefined>();

const console_orig = (console as any).origin;

async function perpare_device_list(stack: SharedCyfsStack) {
    const local_id = stack.local_device_id();
    const zone = (await stack.util().get_zone({
        common: {
            flags: 0
        }
    })).unwrap()
    device_list.push(new inquirer.Separator("------OOD-----"))
    for (const device of zone.zone.ood_list()) {
        device_list.push({ name: device.to_base_58(), value: device })
    }
    device_list.push(new inquirer.Separator("------Device-----"))
    for (const device of zone.zone.known_device_list()) {
        device_list.push({ name: device.to_base_58(), value: device })
    }

    for (const item of device_list) {
        if (item instanceof inquirer.Separator) {
            continue;
        }

        if (item.value.equals(local_id)) {
            break;
        }

        local_device_index++;
    }
}

async function select_target(): Promise<ObjectId> {
    const resp = await inquirer.prompt([
        {
            type: "rawlist",
            name: "target",
            message: "choose device:",
            choices: device_list,
            default: local_device_index,
            prefix: "",
            suffix: ">"
        }
    ])
    return resp["target"].object_id;
}

async function runPrompt(target_id: ObjectId, cur_path: string, stack: SharedCyfsStack): Promise<string[]> {
    const availableCommands = [
        {
            filter: function (str) {
                return str.replace(/ \[.*$/, '')
            }
        },
        'ls', 'ls /', 'ls -l', 'cd', 'cd [inner_path option]', 'cd /', 'cat [object option]', 'exit', 'quit', 'dump [object option]', 'dump [object option] -s savepath', "rm -r", "rm [object]", "target", "help"
    ]

    const friendly_path = await decorate_decid(cur_path, stack)

    const answer = await inquirer.prompt([
        {
            type: 'command',
            name: 'cmd',
            autoCompletion: availableCommands,
            message: `${target_id}:${friendly_path}`,
            context: 0,
            prefix: "",
            suffix: ">",
            validate: val => {
                // Enter \r\n support
                if (val === "") {
                    return true
                }
                return val ? true : `Press TAB for suggestions val`
            },
            short: true
        }
    ]);

    // 这里要处理复杂的如文件名空格
    const regex = /"([^"]*)"|(\S+)/g;
    const arr = (answer.cmd.match(regex) || []).map((m: string) => m.replace(regex, '$1$2'));
    const args = arr.filter((el: string | null) => {
        return el != null && el != '';
    });

    return args;
}

export function makeCommand(config: CyfsToolConfig): Command {
    return new Command("shell")
        .description("interactive shell")
        .requiredOption("-e, --endpoint <target>", "cyfs shell endpoint, ood or runtime", "runtime")
        .action(async (options) => {
            clog.setLevel(4) // warn level log message
            const [stack, writable] = await create_stack(options.endpoint, config)
            await stack.online();
            await perpare_device_list(stack);
            await run(options, stack);

            stop_runtime()
        })
}

function init_known_dec_name() {
    dec_name_cache.set(get_system_dec_app().object_id.to_base_58(), 'system')
}

async function run(options: any, default_stack: SharedCyfsStack): Promise<void> {
    init_known_dec_name()
    let target_id;
    let current_path = "/"
    // 创建一个Commander实例，名称就用shell先
    const shell_prog = new Command('shell');
    shell_prog
        .addCommand(new Command('ls').description('list objects in current root state path')
        .argument('[path]')
        .option('-d, --decid', "list objects dec_id", false)
        .option('-o, --owner', "list objects owner", false)
        .option('-l, --list', "list objects detail", false)
        .action(async (dst_path, options) => {
            await ls(current_path, dst_path, target_id, default_stack, options.list, options.decid, options.owner)
        }).exitOverride().hook("postAction", (thisCommand, actionCommand) => {
            // 由于command类没有考虑到多次parse不同命令行，再次用没有参数的命令行parse时，不会清除上一次有参数时的结果，这里我们手动清除所有参数
            // 增加参数时，需要在这里手工清除这个参数
            actionCommand.setOptionValue('list', false)
            actionCommand.setOptionValue('owner', false)
            actionCommand.setOptionValue('decid', false)
        }))
        .addCommand(new Command('cd').description('change current root state path').argument('<dest path>').action(async (dest_path, options) => {
            // cd切换路径，检查路径是否存在。如果不存在，报错。返回current_path，如果存在，返回新路径
            current_path = await cd(current_path, dest_path, target_id, default_stack)
        }).exitOverride())
        .addCommand(new Command('cat').description('show object info in json format').argument('<object path>').action(async (obj_path, options) => {
            await cat(current_path, obj_path, target_id, default_stack)
        }).exitOverride())
        .addCommand(new Command('dump').description('save object data to local').argument('<object path>').option('-s, --save <local_path>', "save path", ".").action(async (obj_path, options) => {
            await dump(current_path, obj_path, target_id, default_stack, options.save)
        }).exitOverride().hook("postAction", (thisCommand, actionCommand) => {
            // 由于command类没有考虑到多次parse不同命令行，再次用没有参数的命令行parse时，不会清除上一次有参数时的结果，这里我们手动清除所有参数
            // 增加参数时，需要在这里手工清除这个参数
            actionCommand.setOptionValue('save', undefined)
        }))
        .addCommand(new Command('get').description('download files to local').argument('<object path>').option('-s, --save <local_path>', "save path", ".").action(async (obj_path, options) => {
            await get(current_path, obj_path, target_id, default_stack, options.save)
        }).exitOverride().hook("postAction", (thisCommand, actionCommand) => {
            // 由于command类没有考虑到多次parse不同命令行，再次用没有参数的命令行parse时，不会清除上一次有参数时的结果，这里我们手动清除所有参数
            // 增加参数时，需要在这里手工清除这个参数

            actionCommand.setOptionValue('save', undefined)
        }))
        .addCommand(new Command('target').description('change shell`s target').action(async () => {
            target_id = await select_target()
            current_path = "/";
        }))
        .addCommand(new Command('rm').description('delete path from root state path').argument('<dest path>')
        .option('-r, --recursive', "force delete entire paths", false)
        .option('-o, --object', "delete path belongs to objects", false)
        .action(async (dest_path, options) => {
            await rm(current_path, dest_path, target_id, default_stack, options.recursive, options.object)

        }).exitOverride().hook("postAction", (thisCommand, actionCommand) => {
            // 由于command类没有考虑到多次parse不同命令行，再次用没有参数的命令行parse时，不会清除上一次有参数时的结果，这里我们手动清除所有参数
            // 增加参数时，需要在这里手工清除这个参数
            actionCommand.setOptionValue('recursive', false)
            actionCommand.setOptionValue('object', false)
        }))
        .addCommand(new Command('ln').description('create a root_state path link to object id')
            .addArgument(new Argument('<rpath>', "root_state path"))
            .addArgument(new Argument('<object_id>', "object id for link"))
            .action(async (dst_path, objectid) => {
                await ln(current_path, dst_path, target_id, default_stack, objectid)
        }).exitOverride())
        .addCommand(new Command('clear').description('clear screen output').action(() => {
            console.clear();
        }).exitOverride())
        .addCommand(new Command('exit').description('exit cyfs shell').action(() => {
            process.exit(0)
        }).exitOverride()).showSuggestionAfterError().exitOverride()
    while (true) {
        if (target_id === undefined) {
            target_id = await select_target();
        } else {
            const cmds = await runPrompt(target_id, current_path, default_stack);
            try {
                await shell_prog.parseAsync(cmds, { from: 'user' })
            } catch {
                //
            }
        }
    }
}

interface ObjectInfo {
    key: string,
    object_id: ObjectId,
    object_type?: number,
    owner_info?: ObjectId,
    dec_id?: ObjectId,
    create_time?: string,
}

// 从一个绝对路径解出dec_id和其他部分。如果没有dec_id，返回undefined
function extract_path(pathstr: string): [ObjectId|undefined, string] {
    const path_parts = pathstr.split(path.sep)
    let dec_id: ObjectId|undefined = undefined;
    if (path_parts[1].length > 0) {
        const r = ObjectId.from_base_58(path_parts[1])
        if (r.ok) {
            dec_id = r.unwrap()
        }
    }

    return [dec_id, path.sep + path_parts.slice(2).join(path.sep)]
}

function make_r_link(target_id: ObjectId, full_path: string):string {
    return `cyfs://r/${target_id}${full_path}`;
}

async function get_dec_name(dec_id: string, stack: SharedCyfsStack): Promise<string | undefined> {
    if (dec_name_cache.has(dec_id)) {
        return dec_name_cache.get(dec_id)
    }
    if (dec_id.length < 32) {
        return
    }
    const id_ret = ObjectId.from_base_58(dec_id);
    if (id_ret.err) {
        return;
    }
    if (!id_ret.unwrap().is_core_object()) {
        return
    }
    
    const ret_result = await getObject({ stack, id: id_ret.unwrap()})
    if (ret_result.err) {
        dec_name_cache.set(dec_id, undefined)
        return;
    } else {
        const app_ret = new DecAppDecoder().from_raw(ret_result.unwrap().object.object_raw)
        if (app_ret.err) {
            return;
        }
        const name = app_ret.unwrap().name()
        dec_name_cache.set(dec_id, name)
        return name
    }
}

const ansi_color_pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'
].join('|');
const ansi_color_regexp = new RegExp(ansi_color_pattern, 'g')


async function decorate_decid(old_path: string|undefined, stack: SharedCyfsStack): Promise<string> {
    if (!old_path) {
        return '-'
    }
    const parts = old_path.split(path.sep)
    for (let i = 0; i < parts.length; i++) {
        const uncolor_text = parts[i].split(ansi_color_regexp).join("");
        const name = await get_dec_name(uncolor_text, stack);
        if (name) {
            parts[i] += `(${name})`
        }
    }
    
    return parts.join(path.sep)
}

function show_key(obj_type: number, key: string): string {
    if (obj_type === ObjectTypeCode.ObjectMap) {
       return colors('cyan', key);
    } else if(obj_type === ObjectTypeCode.File) {
        return colors('magenta', key);
    }

    return key
}

function show_obj_type(obj_type: number): string {
    if (obj_type <= ObjectTypeCode.Custom) {
        return number_2_obj_type_code_name(obj_type).split('.')[1]
    } else if (obj_type >= OBJECT_TYPE_CORE_START && obj_type < OBJECT_TYPE_CORE_END) {
        return number_2_core_object_name(obj_type).split('.')[1]
    } else {
        return obj_type.toString()
    }
}

import {table, getBorderCharacters} from 'table';

function show_table(table_head: string[], table_data: string[][]) {
    console_orig.log(table([table_head].concat(table_data), {
        border: getBorderCharacters('ramac'),
        drawVerticalLine: () => false,
        drawHorizontalLine: (line) => line === 1
    }))
}

// ls先不提供分页功能，全部取回再全部显示。以后可能支持分页。分页行为仿照less命令
async function ls(cur_path: string, dst_path: string|undefined, target_id: ObjectId, stack: SharedCyfsStack, show_detail: boolean, show_dec_id: boolean, show_owner: boolean) {
    if (dst_path) {
        cur_path = path.resolve(cur_path, dst_path);
    }
    // 先取回objects列表
    let objects: ObjectInfo[] = []
    let page_index = 0;
    const page_size = 100;
    // 这里把分页的都整合在一起
    while (true) {
        const list_ret = await list(cur_path, target_id, stack, page_index, page_size)
        if (list_ret.err) {
            break;
        }
        objects = objects.concat(list_ret.unwrap())
        if (list_ret.unwrap().length < page_size) {
            break;
        }
        page_index++;
    }

    //如果要显示详细信息，在这里再取详细信息
    if (show_detail) {
        const table_head = ["ObjectType"]
        //表头|ObjectTyp|DecId|Owner|CreateTime|ObjectId|Key
        await object_detail(stack, target_id, objects);
        if (show_dec_id) {
            table_head.push('DecId')
        }
        if (show_owner) {
            table_head.push('Owner')
        }
        table_head.push("CreateTime", "ObjectId", "path")
        const table_data: any[] = []
        for (const object of objects) {
            const object_data:any[] = [];
            object_data.push(show_obj_type(object.object_type!))
            if (show_dec_id) {
                object_data.push(await decorate_decid(object.dec_id?.to_base_58(), stack))
            }
            if (show_owner) {
                object_data.push(object.owner_info)
            }
            
            // const show_key_str = show_key(object.object_type!, await decorate_decid(object.key, stack))
            const show_key_str = await decorate_decid(show_key(object.object_type!, object.key), stack)
            object_data.push(object.create_time, object.object_id,show_key_str)

            table_data.push(object_data)
        }

        show_table(table_head, table_data)

    } else {
        // 通用显示,现在只显示path -> objectid信息
        const table_data: any[] = [];
        const table_head = ["ObjectId", "path"]
        for (const object of objects) {
            const key = await decorate_decid(show_key(object.object_id.obj_type_code(), object.key), stack)
            table_data.push([object.object_id, key])
            //const show_key_str = show_key(object.object_id.obj_type_code(), await decorate_decid(object.key, stack))
            //console_orig.log(`${object.object_id.to_base_58()}\t\t${show_key_str}`);
        }

        show_table(table_head, table_data)
    }

}

async function object_detail(stack: SharedCyfsStack, target: ObjectId, objects: ObjectInfo[]): Promise<void> {
    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        const ret_result = await getObject({ stack, id: object.object_id, target})
        if (ret_result.err) {
            continue;
        }
        const obj_info = ret_result.unwrap().object;
        obj_info.try_decode()
    
        const obj = obj_info.object!;
        object.object_type = obj.desc().obj_type();

        //所有者
        if (obj.desc().owner() && obj.desc().owner()!.is_some()) {
            object.owner_info = obj.desc().owner()!.unwrap()
        }

        //创建时间
        object.create_time = formatDate(bucky_time_2_js_time(obj.desc().create_time()))

        if(obj.desc().dec_id().is_some()){
            object.dec_id = obj.desc().dec_id().unwrap();
        }
    }
}

async function list(cur_path: string, target_id: ObjectId, stack: SharedCyfsStack, page_index: number, page_size: number): Promise<BuckyResult<ObjectInfo[]>> {
    const [dec_id, sub_path] = extract_path(cur_path);
    const result: ObjectInfo[] = [];
    const list_ret = await stack.root_state_access_stub(target_id, dec_id).list(sub_path, page_index, page_size);
    if (list_ret.err) {
        console_orig.log(`error: list ${cur_path} err ${list_ret.val}`)
        return list_ret
    }
    for (const item of list_ret.unwrap()) {
        switch (item.content_type) {
            case ObjectMapSimpleContentType.Map:
                result.push({
                    key: item.map!.key,
                    object_id: item.map!.value
                })
                break;
            case ObjectMapSimpleContentType.Set:
                result.push({
                    key: item.set!.value.to_base_58(),
                    object_id: item.set!.value
                })
                break;
            default:
                break;
        }
    }

    return Ok(result)
    
}

async function cd(cur_path: string, dst_path: string, target_id: ObjectId, stack: SharedCyfsStack): Promise<string> {
    const new_path = path.resolve(cur_path, dst_path);
    // 如果这个path存在，且是ObjectMap，返回new_path。否则返回cur_path
    const [dec_id, sub_path] = extract_path(new_path);
    const ret = await stack.root_state_access_stub(target_id, dec_id).get_object_by_path(sub_path);
    if (ret.err) {
        console_orig.error(`stat path ${new_path} err ${ret.val}`)
        return cur_path
    }
    if (dec_id === undefined && new_path !== "/")  {
        console_orig.error(`${new_path} not existed folder!`);
        return cur_path
    }
    if (ret.unwrap().object.object_id.obj_type_code() === ObjectTypeCode.ObjectMap) {
        return new_path
    } else {
        console_orig.error(`${new_path} is not a valid folder!`);
        return cur_path
    }
}

async function cat(cur_path: string, dst_path: string, target_id: ObjectId, stack: SharedCyfsStack): Promise<void> {
    const new_path = path.resolve(cur_path, dst_path)
    // cyfs://r/5r4MYfFMPYJr5UqgAh2XcM4kdui5TZrhdssWpQ7XCp2y/95RvaS5gwV5SFnT38UXXNuujFBE3Pk8QQDrKVGdcncB4
    const cyfs_link = make_r_link(target_id, new_path);
    const obj = await dump_object(stack, cyfs_link, true);
    if (obj) {
        console_orig.log(JSON.stringify(obj, undefined, 4))
    }
}

async function dump(cur_path: string, dst_path: string, target_id: ObjectId, stack: SharedCyfsStack, local_path: string): Promise<void> {
    if (local_path === undefined) {
        local_path = "./";
    }
    const new_path = path.resolve(cur_path, dst_path)
    // cyfs://r/5r4MYfFMPYJr5UqgAh2XcM4kdui5TZrhdssWpQ7XCp2y/95RvaS5gwV5SFnT38UXXNuujFBE3Pk8QQDrKVGdcncB4
    const cyfs_link = make_r_link(target_id, new_path);
    const ret = await dump_object(stack, cyfs_link, false);
    if (ret) {
        const [obj_raw, obj_id] = (ret as [Uint8Array, ObjectId]);
        let file_path = `${obj_id.to_base_58()}.obj`;
        if (!fs.existsSync(local_path)) {
            console_orig.error(`save path not existed: ${local_path}`);
            console_orig.log('object hex:', obj_raw.toHex())
            return;
        }
        file_path = path.join(local_path, file_path);

        fs.writeFileSync(file_path, obj_raw);
        console_orig.log(`dump object to ${file_path}`);
    }
}

async function get(cur_path: string, dst_path: string, target_id: ObjectId, stack: SharedCyfsStack, local_path: string): Promise<void> {
    const new_path = path.join(cur_path, dst_path)
    const [dec_id, sub_path] = extract_path(new_path)
    if (dec_id === undefined) {
        return
    }
    if (local_path === undefined) {
        local_path = "./";
    }

    const cyfs_link = make_r_link(target_id, new_path);
    console.log(`save path: ${local_path}, target: ${target_id.to_string()}, dec_id: ${dec_id}, inner_path: ${sub_path}`)
    const link_type = "r";
    await get_run(cyfs_link, {save: local_path}, stack, target_id, dec_id, sub_path, link_type);
}

async function rm(cur_path:string, dst_path:string, target_id: ObjectId, stack: SharedCyfsStack, recursive_delete: boolean, delete_object: boolean) {
    // 删除目标的root-state
    const new_path = path.resolve(cur_path, dst_path);
    const [dec_id, sub_path] = extract_path(new_path);
    if (dec_id === undefined) {
        console_orig.error(`error: cannot rm root path ${new_path}`)
        return;
    }

    if (sub_path === "/") {
        console_orig.error(`rm: cannot remove '${sub_path}': Is a root path`);
        return;
    }

    let object_id;
    let is_dir = false;
    if (delete_object || !recursive_delete) {
        const cyfs_link = make_r_link(target_id, new_path);
        const ret = await dump_object(stack, cyfs_link, true);
        if (ret) {
            object_id = ObjectId.from_base_58(ret["desc"]["object_id"]).unwrap();
            if (ret["desc"]["object_type"] === 14) {
                is_dir = true;
            }
        }
    }

    if (delete_object) {
        if (object_id) {
            const del_ret = await del(object_id, target_id, stack);
            console_orig.log(`delete object: ${object_id} on target: ${target_id}, del_ret: ${del_ret}`);
        }

    }

    // 正确实现rm，不加-r参数，只能删除空ObjectMap。
    if (!recursive_delete) {
        let flags = true;
        if (is_dir) {
            const list_ret = await list(new_path, target_id, stack, 0, 10);
            if (list_ret.unwrap().length > 0) {
                flags = false;
            }
        }

        // 不为空, 直接返回了
        if (!flags) {
            console_orig.error(`rm: cannot remove '${sub_path}': Is a directory`);
            return;
        }
    }

    const op_env = (await stack.root_state_stub(target_id, dec_id).create_path_op_env()).unwrap();

    const r = await op_env.remove_with_path(sub_path);
    if (r.err) {
        console_orig.error("remove root state err", r.val);
        return;
    }
    const r1 = await op_env.commit();
    if (r1.err) {
        console_orig.error("commit obj to root state err", r1.val);
        return;
    }
}


async function ln(cur_path: string, dst_path: string, target: ObjectId, stack: SharedCyfsStack, objid: string): Promise<void> {
    const object_id = ObjectId.from_base_58(objid);
    if (object_id.err) {
        console_orig.error('invalid object id', objid);
    }

    const new_path = path.resolve(cur_path, dst_path);
    // 先只支持map，直接用path来操作
    const [dec_id, sub_path] = extract_path(new_path);
    if (dec_id === undefined) {
        console_orig.error(`cannot create path in root`)
        return;
    }

    const op_env = (await stack.root_state_stub(target, dec_id).create_path_op_env()).unwrap()
    const r = await op_env.set_with_path(sub_path, object_id.unwrap(), undefined, true)
    if (r.err) {
        console_orig.error(`link ${new_path} to ${objid} err`, r.val)
        return
    }
    const r1 = await op_env.commit()
    if (r1.err) {
        console_orig.error(`commit link ${new_path} to ${objid} err`, r1.val)
        return
    }    
}