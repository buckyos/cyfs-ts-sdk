import { Dir, AnyNamedObjectVisitor, DirDecoder, FileId, ObjectId } from '../cyfs-base';
import { DirId, match_any_obj, None, Some } from '../cyfs-base';
import { RouterGetObjectRequest, SharedObjectStack, TransAddFileRequest, TransStartTaskRequest, TransTaskUploadStrategy, TransGetTaskStateRequest } from '../non-lib';

async function test_trans_file(stack: SharedObjectStack, local_path: string, file_id: ObjectId) {
    const req: TransStartTaskRequest =  {
        user_id: "x-man",
        object_id: file_id,
        upload_strategy: TransTaskUploadStrategy.Default,
        local_path,
        device_list: [],
    };

    const add_ret = await stack.trans().start_task(req);
    if (add_ret.err) {
        return;
    }

    const resp = add_ret.unwrap();
    console.info(`start trans file task success! file_id=${file_id}`);

    const get_req: TransGetTaskStateRequest = {
        user_id: "x-man",
        object_id: file_id,
    };

    const get_ret = await stack.trans().get_task_state(get_req);
    if (get_ret.err) {
        return;
    }
    const get_resp = get_ret.unwrap();
    console.info(`get trans file task state success! file_id=${file_id}, state=`, get_resp);
}

async function add_file(stack: SharedObjectStack, local_path: string) {
    const trans = stack.trans;

    let owner;
    const ret = stack.local_device().desc().owner();
    if (ret && ret.is_some()) {
        owner = ret.unwrap();
    } else {
        owner = stack.local_device_id().object_id;
    }

    const req: TransAddFileRequest =  {
        start_upload: true,
        user_id: "x-man",

        owner,
        local_path,
        chunk_size: 1024 * 1024 * 4,
    };

    const add_ret = await stack.trans().add_file(req);
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
    const stack = SharedObjectStack.open_runtime();
    (await stack.wait_online(Some(BigInt(60 * 1000 * 1000)))).unwrap();

    console.info("device_id=", stack.local_device_id(), stack.local_device_id().toString());
    const owner = stack.local_device().desc().owner()!.unwrap();
    console.info("owner=", owner.toString());

    //const local_file = `G:\\bing\\BingPics\\AdelaideVineyard_2020_05_21.jpg`;
    //const local_file = `G:\\bing\\BingPics\\`;
    const local_file = `D:\\巴克云.exe`;
    await add_file(stack, local_file);
}