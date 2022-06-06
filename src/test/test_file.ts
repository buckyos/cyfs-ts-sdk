import JSBI from 'jsbi';
import * as util from 'util';
const sleep = util.promisify(setTimeout);
import * as cyfs from '../sdk';
import {ObjectId} from "../sdk";

async function test_get_data(stack: cyfs.SharedCyfsStack) {
    const dir_id = cyfs.ObjectId.from_base_58('7jMmeXZqmEro3y46GBdYBhJPPxaGsq2oLg8pqi3mGMBz').unwrap();

    const req: cyfs.NDNGetDataRequest = {
        common: {
            level: cyfs.NDNAPILevel.Router,
            flags: 0,
            referer_object: [],
        },
        object_id: dir_id,
        inner_path: '/test1/1.log',
    };

    const ret = await stack.ndn_service().get_data(req);
    const resp = ret.unwrap();
    resp.length

}

async function test_trans_file(stack: cyfs.SharedCyfsStack, local_path: string, file_id: cyfs.ObjectId) {
    const req: cyfs.TransCreateTaskRequest = {
        common: {
            dec_id: ObjectId.default(),
            level: cyfs.NDNAPILevel.Router,
            flags: 0,
            referer_object: []
        },
        object_id: file_id,
        local_path,
        device_list: [],
        auto_start: false,
    };

    const task_resp = await stack.trans().create_task(req);
    if (task_resp.err) {
        return;
    }

    const task_id = task_resp.unwrap().task_id;


    const add_ret = await stack.trans().start_task({
        common: {
            dec_id: ObjectId.default(),
            level: cyfs.NDNAPILevel.Router,
            flags: 0,
            referer_object: []
        },
        task_id
    });
    if (add_ret.err) {
        return;
    }

    const resp = add_ret.unwrap();
    console.info(`start trans file task success! file_id=${file_id}`);

    const get_req: cyfs.TransGetTaskStateRequest = {
        common: {
            dec_id: ObjectId.default(),
            level: cyfs.NDNAPILevel.Router,
            flags: 0,
            referer_object: []
        },
        task_id
    };

    const get_ret = await stack.trans().get_task_state(get_req);
    if (get_ret.err) {
        return;
    }
    const get_resp = get_ret.unwrap();
    console.info(`get trans file task state success! file_id=${file_id}, state=`, get_resp);
}

async function add_file(stack: cyfs.SharedCyfsStack, local_path: string) {
    const trans = stack.trans;

    let owner;
    const ret = stack.local_device().desc().owner();
    if (ret && ret.is_some()) {
        owner = ret.unwrap();
    } else {
        owner = stack.local_device_id().object_id;
    }

    const req: cyfs.TransPublishFileRequest = {
        common: {
            dec_id: ObjectId.default(),
            level: cyfs.NDNAPILevel.Router,
            flags: 0,
            referer_object: []
        },
        owner,
        local_path,
        chunk_size: 1024 * 1024 * 4,
    };

    const add_ret = await stack.trans().publish_file(req);
    if (add_ret.err) {
        return;
    }

    const resp = add_ret.unwrap();
    console.info(`add file success! file_id=${resp.file_id}`);

    // 拼接url，可直接在浏览器里面引用
    const label_url = `cyfs://o/${resp.file_id.toString()}`;
    console.info(`maybe use in CyberBrowser html label's src! url=${label_url}`);

    // 拼接url，可以直接在浏览器地址栏打开
    const pic_url = `cyfs://static/show.html?${resp.file_id.toString()}`;
    console.info(`maybe open in CyberBrowser to view the pic! url=${pic_url}`);

    await test_trans_file(stack, local_path, resp.file_id);
}

export async function test_file() {
    const stack = cyfs.SharedCyfsStack.open_runtime();
    (await stack.wait_online(cyfs.Some(JSBI.BigInt(60 * 1000 * 1000)))).unwrap();

    console.info("device_id=", stack.local_device_id(), stack.local_device_id().toString());
    const owner = stack.local_device().desc().owner()!.unwrap();
    console.info("owner=", owner.toString());

    //const local_file = `G:\\bing\\BingPics\\AdelaideVineyard_2020_05_21.jpg`;
    //const local_file = `G:\\bing\\BingPics\\`;
    const local_file = `D:\\巴克云.exe`;
    await add_file(stack, local_file);
}

export async function test_trans() {
    // 打开两个栈，一个runtime，一个ood，从runtime传文件到ood
    const runtime_stack = cyfs.SharedCyfsStack.open(cyfs.SharedCyfsStackParam.new_with_ws_event_ports(21002, 21003).unwrap())
    const ood_stack = cyfs.SharedCyfsStack.open(cyfs.SharedCyfsStackParam.new_with_ws_event_ports(21000, 21001).unwrap())
    await runtime_stack.online();
    await ood_stack.online();

    const owner = runtime_stack.local_device().desc().owner()!.unwrap()

    const context = (await ood_stack.trans().get_context({
        common: {
            dec_id: ObjectId.default(),
            level: cyfs.NDNAPILevel.Router,
            flags: 0,
            referer_object: []
        }, context_name: "test"})).unwrap();

    const local_path = "/cyfs/log/gateway/gateway_19212_r00010.log"
    // 先添加文件到runtime
    const file_resp = (await runtime_stack.trans().publish_file({
        common: {
            dec_id: ObjectId.default(),
            level: cyfs.NDNAPILevel.Router,
            flags: 0,
            referer_object: []
        },
        owner,
        local_path,
        chunk_size: 4 * 1024 * 1024     // chunk大小4M
    })).unwrap();

    // 从runtime取回file对象
    const file_obj_resp = (await runtime_stack.non_service().get_object({
        common: {
            level: cyfs.NONAPILevel.NOC,
            flags: 0
        },
        object_id: file_resp.file_id
    })).unwrap();

    // 把File对象推到ood上
    (await runtime_stack.non_service().put_object({
        common: {
            level: cyfs.NONAPILevel.Router,
            flags: 0
        },
        object: file_obj_resp.object
    })).unwrap();

    // 用ood的stack下载文件
    const task_resp = (await ood_stack.trans().create_task({
        common: {
            dec_id: ObjectId.default(),
            level: cyfs.NDNAPILevel.Router,
            flags: 0,
            referer_object: [new cyfs.NDNDataRefererObject(file_resp.file_id)]
        },
        object_id: file_resp.file_id,
        local_path: "c:\\cyfs\\gateway_19212_r00010.log",
        device_list: [runtime_stack.local_device_id()],
        auto_start: true
    })).unwrap();

    // 用ood的stack下载文件
    (await ood_stack.trans().start_task({
        common: {
            dec_id: ObjectId.default(),
            level: cyfs.NDNAPILevel.Router,
            flags: 0,
            referer_object: [new cyfs.NDNDataRefererObject(file_resp.file_id)]
        },
        task_id: task_resp.task_id
    })).unwrap()

    // 循环读取task的status，直到下载成功
    while (true) {
        const resp = (await ood_stack.trans().get_task_state({
            common: {
                dec_id: ObjectId.default(),
                level: cyfs.NDNAPILevel.Router,
                flags: 0,
                referer_object: []
            },
            task_id: task_resp.task_id
        })).unwrap()

        console.log("get task status", resp.state);
        if (resp.state === cyfs.TransTaskState.Finished) {
            console.log("download task finished")
            break;
        }

        await sleep(2000);
    }

    const tasks_resp = (await ood_stack.trans().query_tasks({
        common: {
            dec_id: ObjectId.default(),
            level: cyfs.NDNAPILevel.Router,
            flags: 0,
            referer_object: []
        },
    })).unwrap();

    const task_list = tasks_resp.task_list;
    for (const task of task_list) {
        await ood_stack.trans().delete_task({
            common: {
                dec_id: ObjectId.default(),
                level: cyfs.NDNAPILevel.Router,
                flags: 0,
                referer_object: []
            },
        task_id: task.task_id});
    }
    console.log("test file trans finished")
}
