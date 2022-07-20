import { Argument, Command } from "commander";
import { create_stack, CyfsToolConfig, formatDate, getObject, stop_runtime } from "../lib/util";

import {BuckyResult, clog, DeviceDecoder, DeviceId, NONAPILevel, ObjectId, ObjectMapSimpleContentType, Ok, SharedCyfsStack } from "../../sdk";
import * as inquirer from 'inquirer'
inquirer.registerPrompt(
    'command',
    require('inquirer-command-prompt')
)

const colors = require('colors-console')

let people_id: ObjectId;
let local_device_index = 0;
const device_list: any[] = [];
const dec_name_cache = new Map<string, string|undefined>();
const device_name_cache = new Map<string, string>();

const dimensions = ["people", "device", "dec", "iso", "id"];
const console_orig = (console as any).origin;

async function device_info(stack: SharedCyfsStack, device: DeviceId): Promise<string|undefined> {
    const ret = await stack.non_service().get_object({
        common: {level: NONAPILevel.Router, flags: 0},
        object_id: device.object_id
    })

    if (ret.err) {
        return;
    }

    const object_ret = new DeviceDecoder().from_raw(ret.unwrap().object.object_raw);
    if (object_ret.err) {
        return;
    }

    return object_ret.unwrap().name();
}

async function prelude_device_list(stack: SharedCyfsStack) {
    const local_id = stack.local_device_id();
    // 查询自己所属的zone
    const zone = (await stack.util().get_zone({
        common: {
            flags: 0
        }
    })).unwrap()
    for (const device of zone.zone.ood_list()) {
        const info = await device_info(stack, device);
        let name = device.to_base_58();
        if (info) {
            name = name + `(${info})`
        }
        device_name_cache.set(device.to_base_58(), name)
        device_list.push({ name, value: device })
    }
    for (const device of zone.zone.known_device_list()) {
        const info = await device_info(stack, device);
        let name = device.to_base_58();
        if (info) {
            name = name + ` (${info})`
        }
        device_name_cache.set(device.to_base_58(), name)
        device_list.push({ name, value: device })
    }

    people_id = zone.zone.owner();

    for (const item of device_list) {
        if (item instanceof inquirer.Separator) {
            continue;
        }

        if (item.value.equals(local_id)) {
            break;
        }
        // 默认local 本协议栈index pos位置
        local_device_index++;
    }
}


export function makeCommand(config: CyfsToolConfig): Command {
    return new Command("perf")
        .description("perf statistical summary tool")
        .requiredOption("-e, --endpoint <target>", "cyfs shell endpoint, ood or runtime", "runtime")
        .action(async (options) => {
            clog.setLevel(4) // warn level log message
            const [stack, writable] = await create_stack(options.endpoint, config)
            await stack.online();
            await prelude_device_list(stack);
            await run(options, stack);

            stop_runtime()
        })
}


async function runPrompt(cur_path: string, stack: SharedCyfsStack): Promise<string[]> {
    const availableCommands = [
        {
            filter: function (str) {
                return str.replace(/ \[.*$/, '')
            }
        },
        'show', "use", "cat"
    ]


    const answer = await inquirer.prompt([
        {
            type: 'command',
            name: 'cmd',
            autoCompletion: availableCommands,
            message: `/local:${cur_path}`,
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


    const cmd: string = answer.cmd
    // 这里要处理复杂的如文件名空格
    const regex = /"([^"]*)"|(\S+)/g;
    const arr = (cmd.match(regex) || []).map((m: string) => m.replace(regex, '$1$2'));
    const args = arr.filter((el: string | null) => {
        return el != null && el != '';
    });

    return args;
}

async function run(options: any, default_stack: SharedCyfsStack): Promise<void> {

    let current_path = "/"
    // 创建一个Commander实例，名称就用perf
    const shell_prog = new Command('perf');
    shell_prog
        .addCommand(new Command('show').description('Displays a list of dimensions next to the current dimension, ex: people, device, dec, iso, id, or none')
        .argument('[type]')
        .action(async (type, options) => {
            await show(current_path, type, default_stack);
        }).exitOverride().hook("postAction", (thisCommand, actionCommand) => {
            // 由于command类没有考虑到多次parse不同命令行，再次用没有参数的命令行parse时，不会清除上一次有参数时的结果，这里我们手动清除所有参数
            // 增加参数时，需要在这里手工清除这个参数
        }))
        
        .addCommand(new Command('use').description('pin specified dimensions').argument('<dest path>').action(async (dest_path, options) => {
            // cd切换路径，检查路径是否存在。如果不存在，报错。返回current_path，如果存在，返回新路径
            current_path = await use(current_path, dest_path, default_stack)
        }).exitOverride())

        .addCommand(new Command('cat')
        .description('show object info in json format')
        .argument('<id>')
        .option('-t, --type', "list objects request, acc, action, record", undefined)
        .option('-s, --start', "start format datatime `YYYY-MM-DD hh:mm`", undefined)
        .option('-e, --end', "end format datatime `YYYY-MM-DD hh:mm`", undefined)
        .action(async (obj_path, options) => {
            await cat(current_path, obj_path, default_stack, options.type, options.start, options.end)
        }).exitOverride())
        
        .addCommand(new Command('clear').description('clear screen output').action(() => {
            console.clear();
        }).exitOverride())
        
        .addCommand(new Command('exit').description('exit cyfs perf').action(() => {
            process.exit(0)
        }).exitOverride()).showSuggestionAfterError().exitOverride()
    while (true) {
        const cmds = await runPrompt(current_path, default_stack);
        try {
            await shell_prog.parseAsync(cmds, { from: 'user' })
        } catch {
            //
        }
    }
}

import {table, getBorderCharacters} from 'table';
import path from "path";

function show_table(table_head: string[], table_data: string[][]) {
    console_orig.log(table([table_head].concat(table_data), {
        border: getBorderCharacters('ramac'),
        drawVerticalLine: () => false,
        drawHorizontalLine: (line) => line === 1
    }))
}

// 从一个绝对路径解出dec_id和其他部分。如果没有dec_id，返回undefined
function extract_path(pathstr: string): [ObjectId|undefined, string] {
    const path_parts = pathstr.split(path.sep)
    let dec_id: ObjectId|undefined = undefined;
    if (path_parts.length > 1 && path_parts[1].length > 0) {
        const r = ObjectId.from_base_58(path_parts[1])
        if (r.ok) {
            dec_id = r.unwrap()
        }
    }

    return [dec_id, path.sep + path_parts.slice(2).join(path.sep)]
}

interface ObjectInfo {
    key: string,
    object_id: ObjectId,
}

async function list(cur_path: string, target_id: ObjectId, stack: SharedCyfsStack, page_index: number, page_size: number): Promise<BuckyResult<ObjectInfo[]>> {
    const [dec_id, sub_path] = extract_path(cur_path);
    const result: ObjectInfo[] = [];
    const list_ret = await stack.root_state_access_stub(target_id, dec_id).list(sub_path, page_index, page_size);
    if (list_ret.err) {
        console.error(`error: list ${cur_path} err ${list_ret.val}`)
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

async function objects_info(cur_path: string, type: string, dst_path: string|undefined, target_id: ObjectId, stack: SharedCyfsStack): Promise<number> {
    let table_head: string[] = [];
    const table_data: any[] = [];

    let size = 0;

    //通用显示
    table_head = [type]

    if (type === "people") {
        // people
        table_data.push([people_id.to_base_58()])
        size += 1;
    } else if (type === "device") {
        // device
        for (const device of device_list) {
            table_data.push([device.name])
            size += 1;
        }
    } else {
        // 获取 dec/iso/id 的path
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

        for (const object of objects) {
            table_data.push([object.key])
            size += 1;
        }
    }

    show_table(table_head, table_data);

    return size;
}

function validate(curr_path: string, type: string): boolean {
    const [dec_id, sub_path] = extract_path(curr_path);
    if (dec_id === undefined && (type === "iso" || type === "id")) {
        console_orig.log(`dec is not specified`);
        return false;
    }

    if (type === "id") {
        const path_parts = sub_path.split(path.sep);
        if (path_parts.length < 4) {
            console_orig.log(`iso is not specified`);
            return false;
        }
    }

    return true;
}

function next_dimension(curr_path: string): string | undefined {
    const [dec_id, sub_path] = extract_path(curr_path);
    if (dec_id === undefined) {
        return "dec";
    }
    const path_parts = sub_path.split(path.sep);

    if (path_parts.length < 3) {
        return "people"
    }

    if (path_parts.length < 4) {
        return "device"
    }

    if (path_parts.length < 5) {
        return "iso"
    }
    if (path_parts.length < 6) {
        return "id";
    }

    return undefined;
}

// /dec-id/perf-dec-id/<owner>/<device>/<isolate_id>/<id>/<PerfType>/<Date>/<TimeSpan>
async function show(curr_path: string, type: string, default_stack: SharedCyfsStack) {
    const vaild = dimensions.some(e => e === type);
    if (vaild) {
        // 指定type时候, 就显示这个type对应的列表(只有一个的时候也展示)
        const is_ok = validate(curr_path, type);
        if (is_ok) {
            await objects_info(curr_path, type, undefined, device_list[local_device_index].value.object_id, default_stack);
        }

    } else {
        const next_type = next_dimension(curr_path);
        let i = 0;
        do {
            const size = await objects_info(curr_path, next_type, undefined, device_list[local_device_index].value.object_id, default_stack);
            if (size > 1) {
                break;
            }
            i++;
        } while (i <= 1);
    }

}


async function use(curr_path: string, dst_path: string, default_stack: SharedCyfsStack): Promise<string> {
    console_orig.log(`use: ${dst_path}`);

    return "";
}

async function cat(curr_path: string, dst_path: string, default_stack: SharedCyfsStack, type: string, start_time: string, end_time: string) {
    console_orig.log(`cat: ${dst_path}`);
}
