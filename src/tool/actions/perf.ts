import { Argument, Command } from "commander";
import { create_stack, CyfsToolConfig, formatDate, getObject, stop_runtime } from "../lib/util";

import {BuckyResult, clog, DecAppDecoder, DeviceDecoder, DeviceId, NONAPILevel, ObjectId, ObjectMapSimpleContentType, ObjectTypeCode, Ok, SharedCyfsStack } from "../../sdk";
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

const PERF_DEC_ID_STR = "9tGpLNnAAYE9Dd4ooNiSjtP5MeL9CNLf9Rxu6AFEc12M";

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

    const friendly_path = await decorate_decid(cur_path, stack)
    const answer = await inquirer.prompt([
        {
            type: 'command',
            name: 'cmd',
            autoCompletion: availableCommands,
            message: `/local${friendly_path}`,
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

    // 这里 use 默认进入第一个子维度, 处理Commander default argument
    let cmd: string = answer.cmd
    if (cmd.trim() === "use") {
        cmd = "use .";
    }

    if (cmd.indexOf("cat") !== -1) {
        const next_type = next_dimension(cur_path);
        if (next_type === "type" || next_type === undefined) {
            cmd = cmd.replace('cat', 'cat .');
        }
    }

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
        
        .addCommand(new Command('use').description('pin specified dimensions').argument('<destpath>').action(async (dest_path, options) => {
            // cd切换路径，检查路径是否存在。如果不存在，报错。返回current_path，如果存在，返回新路径
            current_path = await use(current_path, dest_path, default_stack)
        }).exitOverride())

        .addCommand(new Command('cat')
        .description('show object info in json format')
        .argument('<id>')
        .option('-t, --type <type>', "list objects request, acc, action, record", undefined)
        .option('-s, --start <start>', "start format datatime `YYYY-MM-DD hh:mm`", undefined)
        .option('-e, --end <end>', "end format datatime `YYYY-MM-DD hh:mm`", undefined)
        .action(async (id, options) => {
            await cat(current_path, id, default_stack, options.type, options.start, options.end)
        }).exitOverride().hook("postAction", (thisCommand, actionCommand) => {
            // 由于command类没有考虑到多次parse不同命令行，再次用没有参数的命令行parse时，不会清除上一次有参数时的结果，这里我们手动清除所有参数
            // 增加参数时，需要在这里手工清除这个参数
            actionCommand.setOptionValue('type', undefined);
            actionCommand.setOptionValue('start', undefined);
            actionCommand.setOptionValue('end', undefined);
        }))
        
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
import {posix as path} from "path";

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

async function objects_info(cur_path: string, type: string, target_id: ObjectId, stack: SharedCyfsStack, is_show: boolean): Promise<[number, string]> {
    let table_head: string[] = [];
    const table_data: any[] = [];

    let size = 0;
    let dimension = '';

    //通用显示
    table_head = [type]

    if (type === "people") {
        // people
        const people = people_id.to_base_58();
        table_data.push([people])
        size += 1;
        dimension = people;

    } else if (type === "device") {
        // device
        for (const device of device_list) {
            table_data.push([device.name])
            dimension = device.name;
            size += 1;
        }
    } else {
        // 获取 dec/iso/id
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
            const key = await decorate_decid(show_key(object.object_id.obj_type_code(), object.key), stack)
            table_data.push([key])
            dimension = object.key;
            size += 1;
        }
    }

    if (is_show) {
        show_table(table_head, table_data);
    }

    return [size, dimension];
}

function validate(cur_path: string, type: string): boolean {
    const [dec_id, sub_path] = extract_path(cur_path);
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

function next_dimension(cur_path: string): string | undefined {
    const [dec_id, sub_path] = extract_path(cur_path);
    if (dec_id === undefined) {
        return "dec";
    }

    const path_parts = cur_path.split(path.sep);

    if (path_parts.length <= 2) {
        return "iso"
    }

    if (path_parts.length <= 3) {
        return "id"
    }

    if (path_parts.length <= 4) {
        return "type"
    }

    return undefined;
}


function reslove_full_path(cur_path: string) {
    const target_id = device_list[local_device_index].value.object_id;
    const [dec_id, sub_path] = extract_path(cur_path);
    // 拼接dec_id + perf-dec-id/<owner>/<device> + ...
    let dst_path = cur_path;
    if (dec_id !== undefined) {
        dst_path = `/${dec_id.to_base_58()}` + `/${PERF_DEC_ID_STR}/${people_id.to_base_58()}/${target_id.to_base_58()}` + sub_path;
    }

    return dst_path;
}

// /dec-id/perf-dec-id/<owner>/<device>/<isolate_id>/<id>/<PerfType>/<Date>/<TimeSpan>
async function show(cur_path: string, type: string, default_stack: SharedCyfsStack) {
    const vaild = dimensions.some(e => e === type);
    if (vaild) {
        // 指定type时候, 就显示这个type对应的列表(只有一个的时候也展示)
        if (validate(cur_path, type)) {
            await objects_info(cur_path, type, device_list[local_device_index].value.object_id, default_stack, true);
        }

    } else {
        let next_type = next_dimension(cur_path);
        let dst_path = reslove_full_path(cur_path);
        if (next_type === undefined) {
            return;
        }
        let i = 0;
        do {
            const [size, dimension] = await objects_info(dst_path, next_type, device_list[local_device_index].value.object_id, default_stack, true);
            if (size > 1) {
                break;
            }

            // 路径检查器
            const new_path = path.resolve(cur_path, dimension);
            next_type = next_dimension(new_path);
            if (next_type === undefined) {
                break;
            }
            dst_path = reslove_full_path(new_path);

            i++;
        } while (i <= 1);
    }

}


async function use(cur_path: string, dst_path: string, default_stack: SharedCyfsStack): Promise<string> {
    if (dst_path === ".") {
        const next_type = next_dimension(cur_path);
        dst_path = reslove_full_path(cur_path);
        if (next_type === undefined) {
            return cur_path;
        }
        const [size, dimension] = await objects_info(dst_path, next_type, device_list[local_device_index].value.object_id, default_stack, false);
        if (size === 1) {
            dst_path = dimension;
        }
    }
    // 路径检查器
    const new_path = path.resolve(cur_path, dst_path);
    const next_type = next_dimension(new_path);
    if (next_type === undefined) {
        console_orig.log(`new path ${new_path}`);
        return cur_path
    }
    
    const check_path = reslove_full_path(new_path);
    // 如果这个path存在，且是ObjectMap，返回new_path。否则返回cur_path
    const [dec_id, sub_path] = extract_path(check_path);
    const ret = await default_stack.root_state_access_stub(device_list[local_device_index].value.object_id, dec_id).get_object_by_path(sub_path);
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


async function cat(cur_path: string, id: string, default_stack: SharedCyfsStack, type: string, start_time: string, end_time: string) {
    // 默认最近一个时间片的信息
    if (start_time === undefined) {
        start_time = formatDate(new Date().getTime() - 1000 * 60)
    }
    // 默认为当前本地时间
    if (end_time === undefined) {
        end_time = formatDate(new Date().getTime())
    }

    if (type === undefined) {
        type = "all";
    }

    const new_path = path.resolve(cur_path, id);

    console_orig.log(`cat  cur_path: ${cur_path}, id: ${id}, new_path: ${new_path}, type: ${type}, start_time ${start_time}, end_time: ${end_time}`);
}
