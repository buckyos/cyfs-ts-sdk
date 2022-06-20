import { Command } from "commander";
import { ObjectId, SharedCyfsStack, clog, ObjectMapSimpleContentType, ObjectMapContentItem, AnyNamedObjectDecoder } from "../../sdk";
import { create_stack, CyfsToolConfig, getObject, stop_runtime } from "../lib/util";
import * as dump from './dump';
import * as get from './get';
import fetch from 'node-fetch';
import path from "path";

import * as inquirer from 'inquirer'
inquirer.registerPrompt(
    'command',
    require('inquirer-command-prompt')
)

let local_device_index = 0;
let device_list: any[] = [];

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

interface List {
    name: string,
    value: ObjectId,
}

const dec_id_list = {
    list: [] as Array<List>
}

// FIXME: 默认最大1024 
async function perpare_dec_list(stack: SharedCyfsStack, to: ObjectId) {
    const treeLists = await listRootTree(stack, "/", to, 0, 1024);
    if (treeLists.items && treeLists.items.length) {
        treeLists.items.forEach(element => {
            if (element != undefined) {
                // const dec_id = `${element.dec_id}`;
                // console_orig.log(`dec_id: ${dec_id}`);
                dec_id_list.list.push({ name: element.dec_id.toString(), value: element.dec_id });
            }
        });
    }
}

// FIXME: 默认最大1024
async function tree_list(inner_path: string, to: ObjectId, stack: SharedCyfsStack, dec_id?: ObjectId) {
    const treeLists = await listRootTree(stack, inner_path, to, 0, 1024, dec_id);
    if (treeLists.items && treeLists.items.length) {
        treeLists.items.forEach(element => {
            if (element != undefined) {
                console_orig.log(`${element.name}`);
            }
        });
    }
}

async function check_dir(inner_path: string, to: ObjectId, stack: SharedCyfsStack, dec_id: ObjectId) {
    const treeLists = await listRootTree(stack, inner_path, to, 0, 1024, dec_id);
    if (treeLists.items && treeLists.items.length) {
        return true;
    }

    return false;
}

async function check_subdir(inner_path: string, to: ObjectId, stack: SharedCyfsStack, dec_id: ObjectId) {
    let check = false;
    const treeLists = await listRootTree(stack, inner_path, to, 0, 1024, dec_id);
    if (treeLists.items && treeLists.items.length) {
        treeLists.items.forEach(element => {
            if (element != undefined) {
                // ObjectTypeCode.ObjectMap
                if (element.type === "14") {
                    // console_orig.log(`element type: ${element.type}`);
                    check = true;
                    return check;
                }
            }
        });
    }

    return check;
}

interface ObjectContentItem {
    name: string,
    object_id: ObjectId,
    type: string,
    owner_info: string,
    dec_id: ObjectId,
}

export interface CategoryTree {
    name: string;
    items: (ObjectContentItem | undefined)[];
}

/**
 * 特定路径下的完整目录树
 * @param path /a/b
 * @param to
 */
async function listRootTree(
    stack: SharedCyfsStack,
    path: string,
    to: ObjectId,
    page_index: number,
    page_size: number,
    dec_id?: ObjectId,
): Promise<CategoryTree> {
    const { items } = await listObjectMapSetInPath(stack, path, to, page_index, page_size, dec_id);

    const paths = path.split("/");
    return {
        name: paths.length > 0 ? paths[paths.length - 1] : "",
        items,
    };
}

export async function listObjectMapSetInPath(
    stack: SharedCyfsStack,
    path: string,
    to: ObjectId,
    page_index: number,
    page_size: number,
    dec_id?: ObjectId,
): Promise<{ items: (ObjectContentItem | undefined)[] }> {
    const items = await listObjectSetInPath(stack, path, to, page_index, page_size, dec_id);
    return { items };
}


// 从特定路径列举ObjectMap列表
export async function listObjectSetInPath(stack: SharedCyfsStack, path: string, to: ObjectId, page_index: number, page_size: number, dec_id?: ObjectId) {
    return await listMapSetInPath(stack, path, to, page_index, page_size, dec_id);
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

async function select_target() {
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

async function help() {
    interface List {
        name: string,
        value: string,
        descript: string,
    }
    const data = {
        list: [] as Array<List>
    }
    const ls = '列出该目录下所有子节点';
    data.list.push({ name: 'ls' + `,${ls}`, value: ls, descript: '列出该目录下所有子节点' });

    const cd = '进入该子节点,如果子节点不是ObjectMap,提示错误,并留在当前目录';
    data.list.push({ name: 'cd' + `,${cd}`, value: cd, descript: '进入子节点后,命令行为{target id}:{current path}>' });

    const cat = '以json格式展示该子节点的对象内容';
    data.list.push({ name: 'cat' + `,${cat}`, value: cat, descript: '以json格式展示该子节点的对象内容' });

    const dump = '以二进制格式保存该子节点的对象内容,保存路径默认为当前路径,保存文件名为.obj,保存完成后,提示保存的文件全路径';
    data.list.push({ name: 'dump' + `,${dump}`, value: dump, descript: '以二进制格式保存该子节点的对象内容,保存路径默认为当前路径,保存文件名为.obj,保存完成后,提示保存的文件全路径' });

    const get = '保存该节点和后续节点的文件到本地,保存路径默认为当前路径+节点名';
    data.list.push({ name: 'get' + `,${get}`, value: get, descript: '保存该节点和后续节点的文件到本地,保存路径默认为当前路径+节点名' });

    const rm = '删除节点,如果节点是object map,且还有子节点,删除失败';
    data.list.push({ name: 'rm' + `,${rm}`, value: rm, descript: '删除节点,如果节点是object map,且还有子节点,删除失败' });

    const target = '重新选择target,选择后路径重置为根目录';
    data.list.push({ name: 'target' + `,${target}`, value: target, descript: '重新选择target,选择后路径重置为根目录' });

    const clear = '清除屏幕';
    data.list.push({ name: 'clear' + `,${clear}`, value: clear, descript: '清除屏幕' });

    const help = '帮助信息';
    data.list.push({ name: 'help' + `,${help}`, value: help, descript: '帮助信息' });

    const exit = '退出shell';
    data.list.push({ name: 'exit' + `,${exit}`, value: exit, descript: '退出shell' });

    await inquirer.prompt([
        {
            type: 'rawlist',
            name: 'help',
            message: 'Help',
            default: 0,
            choices: data.list,
        }
    ])
    .then(answers => {
        // console_orig.log(JSON.stringify(answers, null, '  '));
    });
}

function makeRLink(
    ownerId: ObjectId,
    dec_id: ObjectId,
    inner_path: string
) {
    return [`cyfs://r`, ownerId.to_base_58(), dec_id.to_base_58(), inner_path].join("/");
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
            console_orig.log("options:", options)
            const [stack, writable] = await create_stack(options.endpoint, config)
            await stack.online();
            await perpare_device_list(stack);
            await run(options, stack, config);

            stop_runtime()
        })
}

export async function run(options: any, default_stack: SharedCyfsStack, config: CyfsToolConfig) {
    let target_id;
    let dec_id;
    let current_path = "/"

    const taret_stack = default_stack;
    // 创建一个Commander实例，名称就用shell先
    const shell_prog = new Command('shell');
    shell_prog
        .addCommand(new Command('ls').description('list objects in current root state path').action((options) => {
            console_orig.log('call ls command, option', JSON.stringify(options))
        }))
        .addCommand(new Command('cd').description('change current root state path').action((options) => {
            console_orig.log('call cd command, option', JSON.stringify(options))
        }))
        .addCommand(new Command('cat').description('show object info in json format').action((options) => {
            console_orig.log('call cat command, option', JSON.stringify(options))
        }))
        .addCommand(new Command('dump').description('save object data to local').option('-s, --save', "save path", ".").action((options) => {
            console_orig.log('call dump command, option', JSON.stringify(options))
        }))
        .addCommand(new Command('get').description('download files to local').option('-s, --save', "save path", ".").action((options) => {
            console_orig.log('call get command, option', JSON.stringify(options))
        }))
        .addCommand(new Command('target').description('change shell`s target').action((options) => {
            console_orig.log('call target command, option', JSON.stringify(options))
        }))
        .addCommand(new Command('rm').description('delete path from root state path').action((options) => {
            console_orig.log('call rm command, option', JSON.stringify(options))
        }))
        .addCommand(new Command('clear').description('clear screen output').action((options) => {
            console_orig.log('call clear command, option', JSON.stringify(options))
        }))
        .addCommand(new Command('exit').description('exit cyfs shell').action((options) => {
            console_orig.log('call exit command, option', JSON.stringify(options))
        })).showSuggestionAfterError().exitOverride()
    while (true) {
        if (target_id === undefined) {
            target_id = await select_target();
            await perpare_dec_list(default_stack, target_id);
        } else {
            const cmds = await runPrompt(target_id, current_path, device_list);
            try {
                shell_prog.parse(cmds, { from: 'user' })
            } catch {
                //
            }
            continue;

            //windows下  ls e:
            const program = argv._[0];
            let inner_path;
            let dec_id_str;
            if (argv._.length < 2) {
                inner_path = current_path;
            } else {
                const args = argv._.slice(1);  // skip argv[0]
                const tmp_path = args.join("/");
                // console_orig.log(`tmp_path: ${tmp_path}`);
                const trimed_path = tmp_path.replace("\"", "").replace("'", "");

                if (dec_id === undefined) {
                    dec_id_str = trimed_path;
                } else {
                    if (-1 != trimed_path.indexOf("/")) {
                        inner_path = trimed_path;
                    } else {
                        if (current_path === "/") {
                            inner_path = current_path + trimed_path;
                        } else {
                            inner_path = current_path + "/" + trimed_path;
                        }
                    }
                }
            }

            if (dec_id !== undefined) {
                inner_path = path.posix.normalize(inner_path);
            }

            if (program === "ls") {
                if (dec_id === undefined) {
                    if (dec_id_list && dec_id_list.list.length) {
                        dec_id_list.list.forEach(element => {
                            if (element != undefined) {
                                console_orig.log(`${element.name}`);
                            }
                        });
                    } else {
                        console_orig.error(`No available dec_id, must least have one`);
                    }
                } else {
                    // console_orig.log(`RUN: ${program} ${args} ${inner_path}`);
                    await ls(inner_path, target_id, taret_stack, dec_id);
                }
            } else if (program === "cd") {
                let flags = false;
                // 选择dec_id
                if (dec_id_list && dec_id_list.list.length) {
                    dec_id_list.list.forEach(element => {
                        if (dec_id_str === element.name) {
                            dec_id = element.value;
                            flags = true;
                        }
                    });
                }
                if (dec_id === undefined || flags) {
                    continue;
                }

                // check tmp path existed(ObjectMap)
                const check = await check_dir(inner_path, target_id, taret_stack, dec_id);
                if (!check) {
                    console_orig.error(`${inner_path} is not vaild sub dir`);
                    continue;
                }
                current_path = inner_path;
            } else if (program === "cat") {
                if (dec_id === undefined) {
                    continue;
                }
                await cat(taret_stack, target_id, dec_id, inner_path);

            } else if (program === "dump") {
                if (dec_id === undefined) {
                    continue;
                }
                const temp_options = options;
                temp_options.save = "./";
                if (argv.s !== undefined) {
                    const trimed_quota = argv.s.replace("\"", "").replace("'", "");
                    temp_options.save = trimed_quota;
                }

                await dump.run(makeRLink(target_id, dec_id, inner_path), temp_options, taret_stack);

            } else if (program === "get") {
                if (dec_id === undefined) {
                    continue;
                }
                const temp_options = options;
                if (argv._.length < 2) {
                    console_orig.log(`Usage: get [objectmap option] [-s absolute path option]`)
                    continue;
                }
                if (argv.s !== undefined) {
                    const trim_quota = argv.s.replace("\"", "").replace("'", "");
                    temp_options.save = trim_quota;
                } else {
                    temp_options.save = "./";
                }

                console.log(`save path: ${temp_options.save}, target: ${target_id.to_string()}, dec_id: ${dec_id}, inner_path: ${inner_path}`)
                await get.run(makeRLink(target_id, dec_id, inner_path), temp_options, taret_stack, target_id, dec_id, inner_path);

            } else if (program === "rm") {
                if (dec_id === undefined) {
                    continue;
                }
                const check = await check_subdir(inner_path, target_id, taret_stack, dec_id);
                if (!check) {
                    await rm(taret_stack, target_id, dec_id, options.endpoint, inner_path);
                } else {
                    console_orig.error(`rm: cannot remove ${inner_path}: Is a recurive directory`)
                }
            } else if (program === "target") {
                device_list = [];
                dec_id_list.list = [];
                dec_id = undefined;
                current_path = "/"
                if (argv.e === "ood") {
                    options.endpoint = "ood";
                } else {
                    options.endpoint = "runtime";
                }
                // 先选出来dec_id, 之后都是对dec_id的具体操作
                await perpare_device_list(taret_stack);
                target_id = await select_target();
                await perpare_dec_list(taret_stack, target_id);

            } else if (program === "exit") {
                break;
            } else if (program === "clear") {
                console.clear();
            } else if (program === "help") {
                await help();
            }
        }
    }
}

async function ls(inner_path: string, target_id: ObjectId, stack: SharedCyfsStack, dec_id?: ObjectId) {
    await tree_list(inner_path, target_id, stack, dec_id);
}

async function cat(stack: SharedCyfsStack, target_id: ObjectId, dec_id: ObjectId, inner_path: string) {
    // cyfs://r/5r4MYfFMPYJr5UqgAh2XcM4kdui5TZrhdssWpQ7XCp2y/95RvaS5gwV5SFnT38UXXNuujFBE3Pk8QQDrKVGdcncB4
    const cyfs_rlink = makeRLink(target_id, dec_id, inner_path);
    // console.log(`cyfs_rlink: ${cyfs_rlink}`);
    const local_device_id = stack.local_device_id();
    const non_service_url = stack.non_service().service_url;
    // 把cyfs链接参照runtime的proxy.rs逻辑，转换成non的标准协议，直接用http请求
    const proxy_url_str = cyfs_rlink.replace("cyfs://", non_service_url);
    const url = new URL(proxy_url_str)
    const path_seg = url.pathname.split("/").slice(1);
    // 如果链接带o，拼之后就会变成http://127.0.0.1:1318/non/o/xxxxx
    if (path_seg[1] === "o") {
        url.pathname = path_seg[0] + "/" + path_seg.slice(2).join("/");
    }
    url.searchParams.set("mode", "object");
    url.searchParams.set("format", "json");
    const new_url_str = url.toString();
    // console.log(`convert cyfs url: ${cyfs_rlink} to non url: ${new_url_str}`);
    const response = await fetch(new_url_str, { headers: { CYFS_REMOTE_DEVICE: local_device_id.toString() } });
    if (!response.ok) {
        console.error(`response error code ${response.status}, msg ${response.statusText}`)
        return;
    }
    const ret = await response.json();
    console.log(`${JSON.stringify(ret, null, 4)}`);
    return ret["desc"]["object_id"];
}

async function rm(stack: SharedCyfsStack, target_id: ObjectId, dec_id: ObjectId, ep: string, inner_path: string) {
    console_orig.log(`op_env: ${ep} -> dec_id: ${dec_id} -> inner_path: ${inner_path} -> target: ${target_id.toString()}`)
    // 删除目标的root-state
    const op_env = (await stack.root_state_stub(target_id, dec_id).create_path_op_env()).unwrap()
    const r = await op_env.remove_with_path(inner_path)
    if (r.err) {
        console.error("remove root state err", r.val)
        return
    }
    const r1 = await op_env.commit()
    if (r1.err) {
        console.error("commit obj to root state err", r1.val)
        return
    }

    const op_env1 = (await stack.root_state_stub(target_id, dec_id).create_path_op_env()).unwrap()
    const ret = await op_env1.get_by_path(inner_path);
    if (ret.err) {
        console.error("get_by_path root state err", ret.val)
        return
    } else {
        console_orig.log(`get_by_path ret: ${ret}`)
    }

}