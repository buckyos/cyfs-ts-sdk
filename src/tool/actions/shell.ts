import { Argument, Command } from "commander";
import { ObjectId, SharedCyfsStack, ObjectMapSimpleContentType, ObjectMapContentItem, AnyNamedObjectDecoder, ObjectTypeCode, BuckyResult, Ok, clog } from "../../sdk";
import { create_stack, CyfsToolConfig, getObject, stop_runtime } from "../lib/util";
import { dump_object } from './dump';
import {run as get_run} from './get';
import * as fs from 'fs'
import {posix as path} from "path";

import * as inquirer from 'inquirer'
inquirer.registerPrompt(
    'command',
    require('inquirer-command-prompt')
)

let local_device_index = 0;
const device_list: any[] = [];

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

interface ObjectContentItem {
    name: string,
    object_id: ObjectId,
    type: string,
    owner_info: string,
    dec_id: ObjectId,
}

async function listMapSetInPath(
    stack: SharedCyfsStack,
    path: string,
    to: ObjectId,
    page_index: number,
    page_size: number,
    dec_id?: ObjectId,
): Promise<(ObjectContentItem | undefined)[]> {

    const access = stack.root_state_access_stub(to, dec_id);

    const lr = await access.list(path, page_index, page_size);

    if (lr.err) {
        console.error(`list-texts in(${path}) io failed, ${lr}`);
        return [];
    }

    const contentsRetRow = lr.unwrap();

    const contentsRet = await Promise.all(
        contentsRetRow.map(async (item: ObjectMapContentItem) => {
            if (item.content_type === ObjectMapSimpleContentType.Set) {
                const ret_result = await getObject({ stack, id: item.set!.value! })
                if (ret_result.err) {
                    // do sth?
                } else {
                    const ret_info = ret_result.unwrap().object;

                    const obj = ret_info.object || new AnyNamedObjectDecoder().from_raw(ret_info.object_raw).unwrap()
                    const type = obj.desc().obj_type_code();
                    //所有者
                    let owner_info = "-";
                    const owner = obj.desc().owner();
                    if (owner && owner.is_some()) {
                        owner_info = owner.unwrap().to_base_58();
                    }

                    let decid = ObjectId.default();
                    if (obj.desc().dec_id().is_some()) {
                        decid = obj.desc().dec_id().unwrap();
                    }

                    const ret: ObjectContentItem = {
                        name: item.set!.value.toString(),
                        object_id: obj.desc().calculate_id(),
                        type: type.toString(),
                        owner_info: owner_info,
                        dec_id: decid,
                    }

                    return ret;

                }
            } else if (item.content_type === ObjectMapSimpleContentType.Map) {
                const ret_result = await getObject({ stack, id: item.map!.value! })
                if (ret_result.err) {
                    // do sth?
                } else {
                    const ret_info = ret_result.unwrap().object;
                    const obj = ret_info.object || new AnyNamedObjectDecoder().from_raw(ret_info.object_raw).unwrap()
                    const type = obj.desc().obj_type_code();
                    //所有者
                    let owner_info = "-";
                    const owner = obj.desc().owner();
                    if (owner && owner.is_some()) {
                        owner_info = owner.unwrap().to_base_58();
                    }

                    let decid = ObjectId.default();
                    if (obj.desc().dec_id().is_some()) {
                        decid = obj.desc().dec_id().unwrap();
                    }

                    const ret: ObjectContentItem = {
                        name: item.map!.key,
                        object_id: obj.desc().calculate_id(),
                        type: type.toString(),
                        owner_info: owner_info,
                        dec_id: decid,
                    }

                    return ret;

                }
            }
        })
    );

    return contentsRet;
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

async function runPrompt(target_id, current_path, device_list): Promise<string[]> {

    const availableCommands = [
        {
            filter: function (str) {
                return str.replace(/ \[.*$/, '')
            }
        },
        'ls', 'ls /', 'ls /a/b', 'cd', 'cd [inner_path option]', 'cd /a', 'cat [object option]', 'exit', 'quit', 'dump [object option]', 'dump [object option] -s savepath', "rm [object]", "target [-e runtime/ood]", "help"
    ]

    const answer = await inquirer.prompt([
        {
            type: 'command',
            name: 'cmd',
            autoCompletion: availableCommands,
            message: `${target_id}:${current_path}`,
            choices: device_list,
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

    return (answer.cmd as string).split(' ')
}

export function makeCommand(config: CyfsToolConfig): Command {
    return new Command("shell")
        .description("interactive shell")
        .requiredOption("-e, --endpoint <target>", "cyfs shell endpoint, ood or runtime", "runtime")
        .action(async (options) => {
            clog.setLevel(4)
            const [stack, writable] = await create_stack(options.endpoint, config)
            await stack.online();
            await perpare_device_list(stack);
            await run(options, stack, config);

            stop_runtime()
        })
}



async function run(options: any, default_stack: SharedCyfsStack, config: CyfsToolConfig): Promise<void> {
    let target_id;
    let current_path = "/"

    // 创建一个Commander实例，名称就用shell先
    const shell_prog = new Command('shell');
    shell_prog
        .addCommand(new Command('ls').description('list objects in current root state path').argument('[path]').option('-l, --list', "list objects detail", false).action(async (dst_path, options) => {
            await ls(current_path, dst_path, target_id, default_stack, options.list)
        }).exitOverride().hook("postAction", (thisCommand, actionCommand) => {
            // 由于command类没有考虑到多次parse不同命令行，再次用没有参数的命令行parse时，不会清除上一次有参数时的结果，这里我们手动清除所有参数
            // 增加参数时，需要在这里手工清除这个参数
            actionCommand.setOptionValue('list', undefined)
        }))
        .addCommand(new Command('cd').description('change current root state path').argument('<dest path>').action(async (dest_path, options) => {
            // cd切换路径，检查路径是否存在。如果不存在，报错。返回current_path，如果存在，返回新路径
            current_path = await cd(current_path, dest_path, target_id, default_stack)
        }).exitOverride())
        .addCommand(new Command('cat').description('show object info in json format').argument('<object path>').action(async (obj_path, options) => {
            await cat(current_path, obj_path, target_id, default_stack)
        }).exitOverride())
        .addCommand(new Command('dump').description('save object data to local').argument('<object path>').option('-s, --save', "save path", ".").action(async (obj_path, options) => {
            await dump(current_path, obj_path, target_id, default_stack, options.save)
        }).exitOverride().hook("postAction", (thisCommand, actionCommand) => {
            // 由于command类没有考虑到多次parse不同命令行，再次用没有参数的命令行parse时，不会清除上一次有参数时的结果，这里我们手动清除所有参数
            // 增加参数时，需要在这里手工清除这个参数
            actionCommand.setOptionValue('save', undefined)
        }))
        .addCommand(new Command('get').description('download files to local').argument('<object path>').option('-s, --save', "save path", ".").action(async (obj_path, options) => {
            await get(current_path, obj_path, target_id, default_stack, options.save)
        }).exitOverride().hook("postAction", (thisCommand, actionCommand) => {
            // 由于command类没有考虑到多次parse不同命令行，再次用没有参数的命令行parse时，不会清除上一次有参数时的结果，这里我们手动清除所有参数
            // 增加参数时，需要在这里手工清除这个参数
            actionCommand.setOptionValue('save', undefined)
        }))
        .addCommand(new Command('target').description('change shell`s target').action(async () => {
            target_id = await select_target()
        }))
        .addCommand(new Command('rm').description('delete path from root state path').argument('<dest path>').option('-f, --force', "force delete entire paths").action(async (dest_path, options) => {
            await rm(current_path, dest_path, target_id, default_stack, options.force)
        }).exitOverride().hook("postAction", (thisCommand, actionCommand) => {
            // 由于command类没有考虑到多次parse不同命令行，再次用没有参数的命令行parse时，不会清除上一次有参数时的结果，这里我们手动清除所有参数
            // 增加参数时，需要在这里手工清除这个参数
            actionCommand.setOptionValue('force', undefined)
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
            const cmds = await runPrompt(target_id, current_path, device_list);
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
    type?: string,
    owner_info?: string,
    dec_id?: ObjectId,
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

// ls先不提供分页功能，全部取回再全部显示。以后可能支持分页。分页行为仿照less命令
async function ls(cur_path: string, dst_path: string|undefined, target_id: ObjectId, stack: SharedCyfsStack, show_detail: boolean) {
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

    // TODO: 如果要显示详细信息，在这里再取详细信息
    if (show_detail) {
        // 显示表头
        console_orig.log('use detail mode')
    }
    // 通用显示,现在只显示key -> objectid信息
    for (const object of objects) {
        console_orig.log(`${object.key} -> ${object.object_id.to_base_58()}`)
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

    const cyfs_link = make_r_link(target_id, new_path);
    console.log(`save path: ${local_path}, target: ${target_id.to_string()}, dec_id: ${dec_id}, inner_path: ${sub_path}`)
    await get_run(cyfs_link, {save: local_path}, stack, target_id, dec_id, sub_path);
}

async function rm(cur_path:string, dst_path:string, target_id: ObjectId, stack: SharedCyfsStack, force_delete: boolean) {
    // 删除目标的root-state
    const new_path = path.resolve(cur_path, dst_path);
    const [dec_id, sub_path] = extract_path(new_path);
    if (dec_id === undefined) {
        console_orig.error(`error: cannot rm root path ${new_path}`)
        return;
    }

    // TODO: 正确实现rm，不加-f参数，只能删除空ObjectMap。
    const op_env = (await stack.root_state_stub(target_id, dec_id).create_path_op_env()).unwrap()
    const r = await op_env.remove_with_path(sub_path)
    if (r.err) {
        console_orig.error("remove root state err", r.val)
        return
    }
    const r1 = await op_env.commit()
    if (r1.err) {
        console_orig.error("commit obj to root state err", r1.val)
        return
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