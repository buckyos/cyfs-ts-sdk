import { Command } from "commander";
import path from "path";
import { NDNAPILevel, NONAPILevel, ObjectId, ObjectTypeCode, SharedCyfsStack, TransTaskState, ObjectMapSimpleContentType, PathOpEnvStub, get_system_dec_app, AccessString, GlobalStatePathAccessItem, BuckyResult, Err, BuckyError, BuckyErrorCode, Ok } from "../../sdk";
import { create_stack, CyfsToolConfig, get_final_owner, stop_runtime } from "../lib/util";
import * as fs from 'fs-extra';

import * as util from 'util';

const sleep = util.promisify(setTimeout);

const dec_id = get_system_dec_app().object_id;
//const dec_id = ObjectId.from_base_58("9tGpLNnErEbyzuMgRLcRX6An1Sn8ZyimNXBdLDTgT2ze").unwrap();

export function makeCommand(config: CyfsToolConfig): Command {
    return new Command("upload")
        .description("upload any file or dir to ood/runtime")
        .argument("<path>", "upload path, file or dir")
        .requiredOption("-e, --endpoint <endpoint>", "cyfs endpoint, ood or runtime", "runtime")
        .requiredOption("-t, --target <target>", "cyfs upload target, ood or runtime", "ood")
        .option("-s, --save <save_path>", "save obj to path")
        .action(async (path, options) => {
            console.log("options:", options)
            const [stack, writable] = await create_stack(options.endpoint, config, dec_id)
            if (!writable) {
                console.error('runtime running in anonymous(readonly) mode, cannot upload.')
                return;
            }
            await stack.online();
            await run(path, options, stack);

            stop_runtime()
        })
}

// 从一个已经挂到path上的对象起，将后续的对象树全部上传到target
async function upload_obj(stack: SharedCyfsStack, target: ObjectId, path: string): Promise<BuckyResult<ObjectId[]>> {
    console.log("upload obj from root state path", path)
    let files: ObjectId[] = [];
    const stub = stack.root_state_accessor_stub();
    const r = await stub.get_object_by_path(path);
    if (r.err) {
        console.log(`get root state path ${path} err ${r.val}`)
        return r;
    }
    const obj = r.unwrap().object;

    {
        const r = await stack.non_service().put_object({
            common: {
                level: NONAPILevel.Router,
                target,
                flags: 0
            },
            object: obj,
            access: AccessString.full()
        });
        if (r.err) {
            console.error(`put object ${obj.object_id} to ${target} err ${r.val}`)
            return r;
        }
    }

    const page_size = 20;
    if (obj.object_id.obj_type_code() === ObjectTypeCode.File) {
        files.push(obj.object_id)
    } else if (obj.object_id.obj_type_code() === ObjectTypeCode.ObjectMap) {
        let pages = 0;
        while (true) {
            const r = await stub.list(path, pages, page_size);
            if (r.err) {
                console.log(`list root state access ${path} failed, err ${r.val}`)
                return r;
            }
            const items = r.unwrap();
            if (items.length === 0) {
                break;
            }
            if (items[0].content_type !== ObjectMapSimpleContentType.Map) {
                const msg = `path ${path} type mismatch! except map, actual ${items[0].content_type}`;
                console.error(msg)
                return Err(new BuckyError(BuckyErrorCode.NotMatch, msg));
            }
            for (const item of items) {
                const inner_path = path + "/" + item.map!.key;
                const upload_files = await upload_obj(stack, target, inner_path);
                if (upload_files.err) {
                    console.error(`upload path ${inner_path} failed`)
                    return upload_files;
                }
                files = files.concat(upload_files.unwrap())
            }
            pages += 1;
        }
    } else {
        const msg = `object ${obj.object_id} type ${obj.object_id.obj_type_code()} not file nor object map!`;
        console.error(msg);
        return Err(new BuckyError(BuckyErrorCode.NotMatch, msg));
    }

    return Ok(files);
}

export async function upload(upload_path: string, depoly_to_ood: boolean, stack: SharedCyfsStack): Promise<BuckyResult<[ObjectId, ObjectId]>> {
    // 检查upload path, 规范成绝对路径
    if (upload_path === undefined || upload_path === "") {
        console.error('no path. exit');
        return Err(new BuckyError(BuckyErrorCode.NotFound, "upload_path null"));
    }
    if (!path.isAbsolute(upload_path)) {
        upload_path = path.resolve(process.cwd(), upload_path);
    }

    // upload文件的情况下，owner必须是endpoint的owner
    const owner_r = await get_final_owner(stack.local_device_id().object_id, stack);
    if (owner_r.err) {
        console.error("get stack owner failed, err", owner_r.val);
        return owner_r;
    }
    const owner_id = owner_r.unwrap();
    console.log("upload use owner", owner_id);

    // 1. 文件部署到本地协议栈，无论后续是否要部署到ood，这一步都是必须的
    const chunk_size = 1024 * 8   // 这里单位是kB，默认是8MB
    // 利用trans的add_file接口，把文件或目录添加到本地stack, 生成对应的file或objectmap对象
    const r = await stack.trans().publish_file({
        common: {
            level: NDNAPILevel.NDC,
            flags: 0,
            referer_object: [],
            dec_id
        },
        // 文件所属者
        owner: owner_id,
        // 文件的本地路径
        local_path: upload_path,
        // chunk大小
        chunk_size: chunk_size * 1024,
        access: AccessString.full()
    });
    if (r.err) {
        console.error(`add file ${upload_path} to stack failed, err ${r.val}`);
        return r;
    }

    const obj_id = r.unwrap().file_id;

    // 把对象存到root_state，以防以后被gc掉
    await stack.root_state_meta_stub().add_access(GlobalStatePathAccessItem.new('/upload_files', AccessString.full()))
    const op_env = (await stack.root_state_stub().create_path_op_env()).unwrap()

    const ret = await op_env.set_with_key('/upload_files', obj_id.to_base_58(), obj_id, undefined, true)
    if (ret.err) {
        console.error("insert obj to root state err", ret.val)
        return ret
    }

    const commit_ret = await op_env.commit()
    if (commit_ret.err) {
        console.error("commit obj to root state err", commit_ret.val)
        return commit_ret
    }

    // 如果还要部署到OOD上，需要在OOD上，对每个文件开启下载命令
    if (depoly_to_ood) {
        // 取OOD信息
        const oods = (await stack.util().resolve_ood({
            common: { flags: 0 },
            object_id: owner_id
        })).unwrap().device_list;

        // 遍历对象，上传整个对象树到ood
        const files = await upload_obj(stack, oods[0].object_id, "/upload_files/" + obj_id.to_base_58());
        if (files.err) {
            return files
        }

        await stack.root_state_meta_stub(oods[0].object_id).add_access(GlobalStatePathAccessItem.new('/upload_files', AccessString.full()))

        // 存到ood的root_state，防止gc
        const op_env = (await stack.root_state_stub(oods[0].object_id).create_path_op_env()).unwrap()
        const r = await op_env.set_with_key('/upload_files', obj_id.to_base_58(), obj_id, undefined, true)
        if (r.err) {
            console.error("insert obj to ood root state err", r.val)
            return r;
        }
        const r1 = await op_env.commit()
        if (r1.err) {
            console.error("commit obj to ood root state err", r1.val)
            return r1;
        }

        const unfinished = new Set<string>();
        // 在ood上开启下载
        for (const file of files.unwrap()) {
            console.log(`download file ${file} on ood`);
            const r = await stack.trans().create_task({
                common: {
                    level: NDNAPILevel.Router,
                    flags: 0,
                    referer_object: [],
                    target: oods[0].object_id,
                    dec_id
                },
                object_id: file,
                // 保存到的本地目录or文件, 这里填空字符串，让chunk_manager自己管理
                local_path: "",
                // 这里需要填文件的源，此时源就是自己这个runtime
                device_list: [stack.local_device_id()],
                auto_start: true
            });
            if (r.err) {
                console.error(`start task on ood ${oods[0].object_id} err ${r.val}`)
                return r
            }
            unfinished.add(r.unwrap().task_id)
        }

        console.log('check ood rebuild status...');

        // 在这里检查文件有没有传输到OOD上
        while (true) {
            if (unfinished.size === 0) {
                break;
            }
            for (const task_id of unfinished) {
                const resp = (await stack.trans().get_task_state({
                    common: {
                        level: NDNAPILevel.Router,
                        flags: 0,
                        target: oods[0].object_id,
                        referer_object: []
                    },
                    task_id
                }));
                if (resp.err) {
                    console.warn("get task state failed, maybe finished. check next file.")
                    unfinished.delete(task_id);
                } else if (resp.unwrap().state.state === TransTaskState.Finished) {
                    unfinished.delete(task_id);
                }
            }

            await sleep(2000);
        }
    }

    return Ok([owner_id, obj_id])
}

async function run(upload_path: string, options: any, stack: SharedCyfsStack) {
    const endpoint = options.endpoint || "runtime";

    let depoly_to_ood = options.target === "ood";

    depoly_to_ood = depoly_to_ood && endpoint !== "ood";
    if (depoly_to_ood) {
        console.log('upload target: runtime to ood');
    } else {
        console.log('upload target: only runtime');
    }

    const upload_r = await upload(upload_path, depoly_to_ood, stack)
    if (upload_r.err) {
        return;
    }

    const [owner_id, obj_id] = upload_r.unwrap();

    const is_dir = obj_id.obj_type_code() === ObjectTypeCode.ObjectMap;

    const cyfs_link = `cyfs://o/${owner_id}/${obj_id}`;
    if (is_dir) {
        (console as any).origin.log(`\nDir ${path} upload finish，use CYFS Browser to open ${cyfs_link}/{inner_path} to access corresponding file`);
    } else {
        (console as any).origin.log(`\nFile ${path} upload finish，use CYFS Browser to open ${cyfs_link} to access it`);
    }

    const cyfs_r_link = `cyfs://r/${owner_id}/${dec_id}/upload_files/${obj_id}`;
    (console as any).origin.log(`\nAnd create cyfs r link ${cyfs_r_link}, it can used as cyfs://o link as above`);

    (console as any).origin.log(`\nupload path： ${endpoint} -> ${options.target || "runtime"}`)

    if (options.save) {
        // 把对象内容写成文件
        // 从noc取回这个Object
        const obj_resp = (await stack.non_service().get_object({
            object_id: obj_id,
            common: {
                level: NONAPILevel.NOC,
                flags: 0
            }
        })).unwrap();

        fs.writeFileSync(path.join(options.save, `${obj_id}.fileobj`), obj_resp.object.object_raw);

        (console as any).origin.log(`\nSave dir/file object: ${path.join(options.save, `${obj_id}.fileobj`)}`);
    }
}