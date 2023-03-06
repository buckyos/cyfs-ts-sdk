import * as cyfs from '../sdk';
import * as forge from 'node-forge'

export async function test() {
    const [stack, file_id, owner_id] = await add_file();

    // remove object meta access
    {
        const meta = stack.root_state_meta_stub();

        (await meta.remove_object_meta({
            selector: `obj_type == ${cyfs.ObjectTypeCode.File}`,
            access: cyfs.GlobalStatePathGroupAccess.Default(cyfs.AccessString.full_except_write().value),
        })).unwrap();
    }

    const ret = await get_file(file_id, stack.local_device_id());
    console.assert(ret.err);

    // add object meta access
    {
        const meta = stack.root_state_meta_stub();

        (await meta.add_object_meta({
            selector: `obj_type == ${cyfs.ObjectTypeCode.File}`,
            access: cyfs.GlobalStatePathGroupAccess.Default(cyfs.AccessString.full_except_write().value),
        })).unwrap();
    }

    const ret2 = await get_file(file_id, stack.local_device_id());
    console.assert(ret2.ok);

    console.info("test object meta cases success!");
}

async function get_file(file_id: cyfs.ObjectId, target: cyfs.DeviceId): Promise<cyfs.BuckyResult<void>> {
    const dec_id = cyfs.DecApp.generate_id(cyfs.ObjectId.default(), "zone-simulator");
    const stack = cyfs.SharedCyfsStack.open(cyfs.SharedCyfsStackParam.new_with_ws_event_ports(21012, 21013, dec_id).unwrap());

    const resp = await stack.non_service().get_object({
        common: {
            level: cyfs.NONAPILevel.Router,
            flags: 0,
            target: target.object_id
        },
        object_id: file_id
    });
    if (resp.err) {
        console.assert(resp.val.code === cyfs.BuckyErrorCode.PermissionDenied)
        return resp
    }
    return cyfs.Ok(undefined);
}

async function add_file(): Promise<[cyfs.SharedCyfsStack, cyfs.ObjectId, cyfs.ObjectId]> {
    const dec_id = cyfs.DecApp.generate_id(cyfs.ObjectId.default(), "zone-simulator");
    const stack = cyfs.SharedCyfsStack.open(cyfs.SharedCyfsStackParam.new_with_ws_event_ports(21000, 21001, dec_id).unwrap());
    await stack.online();
    const owner_id = stack.local_device().desc().owner()!;

    const data = forge.util.binary.raw.decode(`test chunk ${cyfs.bucky_time_now()}`);
    const chunk_id = cyfs.ChunkId.calculate(data);

    (await stack.ndn_service().put_data({
        common: {
            level: cyfs.NDNAPILevel.NDC,
            flags: 0
        },
        object_id: chunk_id.calculate_id(),
        length: data.byteLength,
        data
    })).unwrap();

    const hash = cyfs.HashValue.hash_data(data);
    const chunk_list = new cyfs.ChunkList([chunk_id]);
    const file = cyfs.File.create(owner_id, cyfs.JSBI.BigInt(data.byteLength), hash, chunk_list, (builder) => {
        builder.no_create_time()
    });

    const file_id = file.desc().calculate_id();
    console.info(
        `svg file=${file_id}, chunk=${chunk_id}, len=${data.byteLength}`,
    );

    (await stack.non_service().put_object({
        common: {
            level: cyfs.NONAPILevel.NOC,
            flags: 0
        },
        object: new cyfs.NONObjectInfo(file_id, file.to_vec().unwrap())
    })).unwrap();

    console.info(
        `put test meta file object to local noc success! file=${file_id}, owner=${owner_id}`
    );

    return [stack, file_id, owner_id]
}