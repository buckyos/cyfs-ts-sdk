import { Command } from "commander";
import { ObjectId, ObjectTypeCode, SharedCyfsStack, clog, NONObjectInfo, ObjectMapSimpleContentType, ObjectMapContentItem, AnyNamedObjectDecoder } from "../../sdk";
import { create_stack, CyfsToolConfig, getObject, get_final_owner, stop_runtime } from "../lib/util";
import * as dump from './dump';
import * as get from './get';
import fetch from 'node-fetch';

const inquirer = require('inquirer')
inquirer.registerPrompt(
    'command',
    require('inquirer-command-prompt')
 )

const  parseArgs = require('minimist');


const default_dec_id = ObjectId.from_base_58('9tGpLNnDpa8deXEk2NaWGccEu4yFQ2DrTZJPLYLT7gj4').unwrap()

let local_device_index = 0;
let device_list = [];
let dec_id_list = [];
const dec_id_index = 0;

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
        device_list.push({name: device.to_base_58(), value: device})
    }
    device_list.push(new inquirer.Separator("------Device-----"))
    for (const device of zone.zone.known_device_list()) {
        device_list.push({name: device.to_base_58(), value: device})
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

// FIXME: 默认最大256 
async function perpare_dec_list(stack: SharedCyfsStack, to: ObjectId) {
    const treeLists = await listRootTree(stack, "/", to, 0, 1024);
    if (treeLists.items && treeLists.items.length ) {
        treeLists.items.forEach(element => {
            if (element != undefined) {
                const dec_id = `${element.dec_id}`;
                console_orig.log(`dec_id: ${dec_id}`);
                dec_id_list.push({name: element.dec_id, value: ObjectId.from_base_58(element.dec_id).unwrap()});
            }
        });
    }   
}

// FIXME: 默认最大256
async function tree_list(inner_path: string, to: ObjectId, stack: SharedCyfsStack, dec_id: ObjectId) {
    const treeLists = await listRootTree(stack, inner_path, to, 0, 1024, dec_id);
    if (treeLists.items && treeLists.items.length ) {
        treeLists.items.forEach(element => {
            if (element != undefined) {
                console_orig.log(`${element.name}`);
            }
        });
    }  
}

async function check_dir(inner_path: string, to: ObjectId, stack: SharedCyfsStack, dec_id: ObjectId) {
    const treeLists = await listRootTree(stack, inner_path, to, 0, 1024, dec_id);
    if (treeLists.items && treeLists.items.length ) {
      return true;
    }

    return false;
}

async function check_subdir(inner_path: string, to: ObjectId, stack: SharedCyfsStack, dec_id: ObjectId) {
    let check = false;
    const treeLists = await listRootTree(stack, inner_path, to, 0, 1024, dec_id);
    if (treeLists.items && treeLists.items.length ) {
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
    dec_id: string,
}

export interface CategoryTree {
    name: string;
    items: ObjectContentItem[];
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
): Promise<{ items: ObjectContentItem[]}> {
    let items: ObjectContentItem[] = [];
    items = await listObjectSetInPath(stack, path, to, page_index, page_size, dec_id);
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
): Promise<ObjectContentItem[]> {

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
                const ret_result = await getObject({ stack, id: item.set!.value!})
                if (ret_result.err) {
                    // do sth?
                } else{
                    const ret_info = ret_result.unwrap().object;

                    const obj = ret_info.object || new AnyNamedObjectDecoder().from_raw(ret_info.object_raw).unwrap()
                    const objectId = obj.desc().calculate_id().to_base_58();
                    const type = obj.desc().obj_type_code();
                    //所有者
                    let owner_info = "-";
                    if (ret_info.object?.desc().owner()) {
                        owner_info = ret_info.object!.desc().owner()!.unwrap().toString();
                    }

                    // nonce
                    const nonce = '--';
                    // if (ret_info.object.nonce().is_some()) {
                    //     let nonce = ret_info.object.nonce().unwrap();
                    //     console_orig.log('----------------nonce', nonce)
                    // }
                    let decid = '';
                    if(ret_info.object?.desc().dec_id().is_some()){
                        decid = ret_info.object?.desc().dec_id().unwrap().toString();
                    }
                    
                    const ret: ObjectContentItem = {
                        name: item.set!.value.toString(),
                        object_id: ret_info.object?.desc().calculate_id(),
                        type: type.toString(),
                        owner_info: owner_info,
                        dec_id: decid,
                    }

                    return ret;

                }
            } else if (item.content_type === ObjectMapSimpleContentType.Map) {
                const ret_result = await getObject({ stack, id: item.map!.value!})
                if (ret_result.err) {
                    // do sth?
                }else
                {
                    const ret_info = ret_result.unwrap().object;
                    const obj = ret_info.object || new AnyNamedObjectDecoder().from_raw(ret_info.object_raw).unwrap()
                    if(obj){

                        const objectId = obj.desc().calculate_id().to_base_58();
                        const type = obj.desc().obj_type_code();
                        //所有者
                        let owner_info = "-";
                        if (ret_info.object?.desc().owner()) {
                            owner_info = ret_info.object!.desc().owner()!.unwrap().toString();
                        }

                        // nonce
                        const nonce = '--';
                        // if (ret_info.object.nonce().is_some()) {
                        //     let nonce = ret_info.object.nonce().unwrap();
                        //     console_orig.log('----------------nonce', nonce)
                        // }
                        let decid = '';
                        if(ret_info.object?.desc().dec_id().is_some()){
                            decid = ret_info.object?.desc().dec_id().unwrap().toString();
                        }
                        
                        const ret: ObjectContentItem = {
                            name: item.map!.key,
                            object_id: ret_info.object?.desc().calculate_id(),
                            type: type.toString(),
                            owner_info: owner_info,
                            dec_id: decid,
                        }

                        return ret;
                        
                    }

                }
            }
        })
    );

    return contentsRet;
}

async function select_target() {
    const resp = await inquirer.prompt([
        {
            type:"rawlist",
            name:"target",
            message:"choose device:",
            choices: device_list,
            default: local_device_index,
            prefix: "",
            suffix: ">"
        }
    ])
    return resp["target"].object_id;
}

async function select_dec_id() {
    const resp = await inquirer.prompt([
        {
            type:"rawlist",
            name:"dec_id",
            message:"choose dec_id:",
            choices: dec_id_list,
            default: dec_id_index,
            prefix: "",
            suffix: ">"
        }
    ])
    return resp["dec_id"];
}


async function help(){
    const list = [];
    let num = '列出该目录下所有子节点';
    list.push({ name: 'ls' + `,${num}`, value: num, descript: '列出该目录下所有子节点' });

    num = '进入该子节点,如果子节点不是ObjectMap,提示错误,并留在当前目录';
    list.push({ name: 'cd' + `,${num}`, value: num, descript: '进入子节点后,命令行为{target id}:{current path}>' });

    num = '以json格式展示该子节点的对象内容';
    list.push({ name: 'cat' + `,${num}`, value: num, descript: '以json格式展示该子节点的对象内容' });

    num = '以二进制格式保存该子节点的对象内容,保存路径默认为当前路径,保存文件名为.obj,保存完成后,提示保存的文件全路径';
    list.push({ name: 'dump' + `,${num}`, value: num, descript: '以二进制格式保存该子节点的对象内容,保存路径默认为当前路径,保存文件名为.obj,保存完成后,提示保存的文件全路径' });

    num = '保存该节点和后续节点的文件到本地,保存路径默认为当前路径+节点名';
    list.push({ name: 'get' + `,${num}`, value: num, descript: '保存该节点和后续节点的文件到本地,保存路径默认为当前路径+节点名' });

    num = '删除节点,如果节点是object map,且还有子节点,删除失败';
    list.push({ name: 'rm' + `,${num}`, value: num, descript: '删除节点,如果节点是object map,且还有子节点,删除失败' });

    num = '重新选择target,选择后路径重置为根目录';
    list.push({ name: 'target' + `,${num}`, value: num, descript: '重新选择target,选择后路径重置为根目录' });

    num = '清除屏幕';
    list.push({ name: 'clear' + `,${num}`, value: num, descript: '清除屏幕' });

    num = '帮助信息';
    list.push({ name: 'help' + `,${num}`, value: num, descript: '帮助信息' });

    num = '退出shell';
    list.push({ name: 'exit' + `,${num}`, value: num, descript: '退出shell' });

    await inquirer.prompt([
        {
            type: 'rawlist',
            name: 'help',
            message: 'Help',
            default: 0,
            choices: list,
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


async function runPrompt(target_id, current_path, device_list) {

    const availableCommands = [
      {
        filter: function (str) {
          return str.replace(/ \[.*$/, '')
        }
      },
      'ls', 'ls /', 'ls /a/b', 'cd', 'cd [inner_path option]', 'cd /a', 'cat [object option]', 'exit', 'quit', 'dump [object option]', 'dump [object option] -s savepath', "rm [object]", "target [-e runtime/ood]", "help"
    ]
  
    return inquirer.prompt([
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
    ]).then(answers => {
      if (!~'ls,cd,cat,dump,get,rm,target,help,exit,quit'.split(',').indexOf(answers.cmd)) {
          // console_orig.log(`answers: ${answers}`)
      }
      return answers.cmd;

    }).catch(err => {
      console_orig.error(err.stack)
    })
  
  }

export function makeCommand(config: CyfsToolConfig): Command {
    return new Command("shell")
        .description("interactive shell")
        .requiredOption("-e, --endpoint <target>", "cyfs shell endpoint, ood or runtime", "runtime")
        .action(async (options) => {
            clog.restore_console();
            console_orig.log("options:", options)
            const [stack, writable] = await create_stack(options.endpoint, config, default_dec_id)
            await stack.online();
            await perpare_device_list(stack);
            await run(options, stack, config);

            stop_runtime()
        })
}

export async function run(options:any, default_stack: SharedCyfsStack, config: CyfsToolConfig) {
    let target_id;
    let dec_id;
    let current_path = "/"

    let taret_stack = default_stack;
    while (true) {
        if (target_id === undefined) {
            target_id = await select_target();
            await perpare_dec_list(default_stack, target_id);
            dec_id = await select_dec_id();
            console_orig.log(`dec_id: ${dec_id}`);

        } else {
            const cmd = await runPrompt(target_id, current_path, device_list);
            var regex = /"([^"]*)"|(\S+)/g;
            var arr = (cmd.match(regex) || []).map(m => m.replace(regex, '$1$2'));
            const args = arr.filter(el => {
                return el != null && el != '';
            });
            // ls -a avalue -b bvalue --name=xiaoming -abc 10 --save-dev --age 20 arg
            // const args = ['--name=xiaoming', '-abc', '10', '--save-dev', '--age', '20'];
            const argv = parseArgs(args);
            // console_orig.log(`prorgam: ${argv._[0]}, args: ${argv._[1]}, a: ${argv.a}, b: ${argv.b}`)
            // 校验参数
            if (argv._.length < 1) {
                continue;
            }
            //windows下  ls e:
            const program = argv._[0];
            let inner_path;
            if (argv._.length < 2) {
                inner_path = current_path;
            } else {
                const args = argv._.slice(1);  // skip argv[0]
                const tmp_path = args.join("/");
                // console_orig.log(`tmp_path: ${tmp_path}`);
                let trim_double_quota_path = tmp_path.replace("\"","").replace("\"","");
                let trim_single_quota_path = trim_double_quota_path.replace("\'","").replace("\'","");

                if (-1 != trim_single_quota_path.indexOf("/")) {
                    inner_path = trim_single_quota_path;
                } else {
                    if (current_path === "/") {
                        inner_path = current_path + trim_single_quota_path;
                    } else {
                        inner_path = current_path + "/" + trim_single_quota_path;
                    }

                }
            }
            if (program === "ls") {
                // console_orig.log(`RUN: ${program} ${args} ${inner_path}`);
                await ls(inner_path, target_id, taret_stack, dec_id);

            } else if (program === "cd") {
                // check tmp path existed(ObjectMap)
                const check = await check_dir(inner_path, target_id, taret_stack, dec_id);
                if (!check) {
                    console_orig.error(`${inner_path} is not vaild sub dir`);
                    continue;
                }
                current_path = inner_path;

            } else if (program === "cat"){
                await cat(taret_stack, target_id, dec_id, inner_path);
                
            } else if (program === "dump"){
                const temp_options = options;
                temp_options.save = "./";
                if (argv.s !== undefined) {
                    let ref = argv.s.replace("\"","").replace("\"","");
                    let trim_quota = ref.replace("\'","").replace("\'","");
                    temp_options.save = trim_quota;
                }

                await dump.run(makeRLink(target_id, dec_id, inner_path), temp_options, taret_stack);

            } else if (program === "get"){
                const temp_options = options;
                if (argv._.length < 2) {
                    console_orig.log(`Usage: get [objectmap option] [-s absolute path option]`)
                    continue;
                }
                if (argv.s !== undefined) {
                    let ref = argv.s.replace("\"","").replace("\"","");
                    let trim_quota = ref.replace("\'","").replace("\'","");
                    temp_options.save = trim_quota;
                } else {
                    temp_options.save = "./";
                }

                console.log(`save path: ${temp_options.save}, target: ${target_id.to_string()}, dec_id: ${dec_id}, inner_path: ${inner_path}`)
                await get.run(makeRLink(target_id, dec_id, inner_path), temp_options, taret_stack, target_id, dec_id, inner_path);
                
            } else if (program === "rm"){
                const check = await check_subdir(inner_path, target_id, taret_stack, dec_id);
                if (!check) {
                    const ret = await cat(taret_stack, target_id, dec_id, inner_path);
                    const key =  ret["desc"]["object_id"];
                    // const owner_id = ret["desc"]["owner"];
                    // let target = ObjectId.from_base_58(owner_id).unwrap();
                    // await test_op_env(key, taret_stack, target, options.endpoint);
                    await rm(key, taret_stack, target_id, options.endpoint, inner_path);
                } else {
                    console_orig.error(`rm: cannot remove ${inner_path}: Is a recurive directory`)
                }
            } else if (program === "target"){
                device_list = [];
                dec_id_list = [];
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
                dec_id = await select_dec_id();

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


async function ls(inner_path: string, target_id: ObjectId, stack: SharedCyfsStack, dec_id: ObjectId) {
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
    const response  = await fetch(new_url_str, {headers: {CYFS_REMOTE_DEVICE: local_device_id.toString()}});
    if (!response.ok) {
        console.error(`response error code ${response.status}, msg ${response.statusText}`)
        return;
    }
    const ret = await response.json();
    console.log(`${JSON.stringify(ret, null, 4)}`);
    return ret;
}

async function rm(obj_id: string, stack: SharedCyfsStack, target_id: ObjectId, ep: string, inner_path: string) {
    console_orig.log(`op_env: ${ep} -> inner_path: ${inner_path} -> key: ${obj_id} -> target: ${target_id.toString()}`)
    // 1. 删除本地的root-state
    const op_env = (await stack.root_state_stub().create_path_op_env()).unwrap()
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

    // const op_env1 = (await stack.root_state_stub().create_path_op_env()).unwrap()
    // const ret = await op_env1.get_object_by_path(inner_path);
    // if (ret.err) {
    //     console.error("get_object_by_path root state err", ret.val)
    //     return
    // } else {
    //     console_orig.log(`get_object_by_path ret: ${ret}`)
    // }

    // 2. 删除ood上的root state
    const owner_r = await get_final_owner(stack.local_device_id().object_id, stack);
    if (owner_r.err) {
        console.error("get stack owner failed, err", owner_r.val);
        return owner_r;
    }
    const owner_id = owner_r.unwrap();
    console.log("rm use owner", owner_id.to_base_58());

    // 取OOD信息
    const oods = (await stack.util().resolve_ood({
        common: {flags: 0},
        object_id: owner_id
    })).unwrap().device_list;

    console.log("rm use target", oods[0].object_id.to_base_58());

    const op_env2 = (await stack.root_state_stub(oods[0].object_id).create_path_op_env()).unwrap()
    const ret1 = await op_env2.remove_with_path(inner_path)
    if (ret1.err) {
        console.error("remove root state err", ret1.val)
        return
    }
    const ret2 = await op_env2.commit()
    if (ret2.err) {
        console.error("commit obj to root state err", ret2.val)
        return
    }

    // const op_env3 = (await stack.root_state_stub(oods[0].object_id).create_path_op_env()).unwrap()
    // const ret3 = await op_env3.get_object_by_path('/upload_map', obj_id);
    // if (ret3.err) {
    //     console.error("get_object_by_path root state err", ret3.val)
    //     return
    // } else {
    //     console_orig.log(`get_object_by_path ret: ${ret3}`)
    // }
}

async function test_op_env(obj_id: string, stack: SharedCyfsStack, target_id: ObjectId, ep: string) {

    let object_id = ObjectId.from_base_58(obj_id).unwrap();

    console_orig.log(`op_env: ${ep} -> path: /upload_map -> key: ${obj_id} -> target: ${target_id.toString()}`)

    const op_env = (await stack.root_state_stub(target_id).create_path_op_env()).unwrap()
    const ret = await op_env.set_with_key('/upload_map', object_id.to_base_58(), object_id, undefined, true)
    if (ret.err) {
        console.error("insert obj to root state err", ret.val)
        return
    }

    const commit_ret = await op_env.commit()
    if (commit_ret.err) {
        console.error("commit obj to root state err", commit_ret.val)
        return
    }

    const op_env1 = (await stack.root_state_stub(target_id).create_path_op_env()).unwrap()
    const ret1 = await op_env1.get_by_key("/upload_map", obj_id);
    if (ret1.err) {
        console.error("get_by_key root state err", ret.val)
        return
    } else {
        console_orig.log(`get_by_key ret: ${ret}`)
    }

}