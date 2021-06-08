import { Dir, AnyNamedObjectVisitor, DirDecoder, ChunkId, ObjectId } from '../cyfs-base';
import { DirId, match_any_obj, None } from '../cyfs-base';
import { RouterGetObjectRequest, SharedObjectStack, TransAddFileRequest } from '../non-lib';

export async function test_router() {
    const stack = SharedObjectStack.open_runtime();
    (await stack.online()).unwrap();

    console.info("device_id=", stack.local_device_id(), stack.local_device_id().toString());
    const owner = stack.local_device().desc().owner()!.unwrap();
    console.info("owner=", owner.toString());

    
}