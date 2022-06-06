import { assert } from 'console';
import * as cyfs from '../sdk';
import { ObjectId } from '../sdk';

export async function test_object_map(stack: cyfs.SharedCyfsStack) {

    console.info("device_id=", stack.local_device_id(), stack.local_device_id().toString());

    const app = cyfs.DecApp.create(stack.local_device_id().object_id, 'test_object_map');
    const dec_id = app.desc().calculate_id();
    console.log(`new app id: ${dec_id}`);

    const root_id = await test_put(stack, dec_id);
    await test_get(stack, dec_id, root_id,);
}

async function test_put(stack: cyfs.SharedCyfsStack, dec_id: ObjectId): Promise<ObjectId> {
    const ret = await stack.root_state_stub().create_path_op_env();
    const op_env = ret.unwrap();
    const iret = await op_env.insert_with_path('/a/b/我的照片', dec_id);
    assert(iret.ok);

    const gret = await op_env.get_by_path('/a/b/我的照片');
    assert(gret.ok);
    const id = gret.unwrap();
    console.assert(id!.toString() === dec_id.toString());

    const info = (await op_env.commit()).unwrap();
    console.info(info);

    return info.dec_root;
}

async function test_get(stack: cyfs.SharedCyfsStack, dec_id: ObjectId, object_id: ObjectId) {
    // const object_id = ObjectId.from_base_58('95RvaS5ZtuoqmkfyGzjDpzhMaLyQEc7ZkE3XntcmkKJZ').unwrap();

    const req = {
        object_id,
        common: {
            dec_id,
            flags: 0,
            level: cyfs.NONAPILevel.Router
        }
    };

    const ret = await stack.non_service().get_object(req);
    console.info('get_object result:', ret);
    console.assert(!ret.err);
    const resp = ret.unwrap();

    check_object_map(resp.object);
}

function check_object_map(info: cyfs.NONObjectInfo) {
    const result_object_id = info.object!.desc().calculate_id();
    console.info(result_object_id);
}