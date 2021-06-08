import { Dir, AnyNamedObjectVisitor, DirDecoder, ChunkId, ObjectId } from '../cyfs-base';
import { DirId, match_any_obj, None } from '../cyfs-base';
import { RouterGetObjectRequest, SharedObjectStack, TransAddFileRequest } from '../non-lib';

interface TreeNode {
    // 只有根节点没有名字
    name?: string,

    // 判断是不是叶子节点还是中间的目录结构
    type: 'dir'|'object',

    // type = 'dir'情况下有子节点
    subs?: Map<string, TreeNode>,

    // type='object'情况下有object_id
    object_id?: ObjectId,
}

// 重建dir的目录树结构
async function build_dir(stack: SharedObjectStack, dir_id: DirId) {
    const req: RouterGetObjectRequest = {
        object_id: dir_id.object_id,
        flags: 0,
    };

    const resp = await stack.router().get_object(req);
    if (resp.err) {
        console.error(`get dir object from router error!`, resp);
        return;
    }

    const ret = resp.unwrap();
    const [dir, _] = new DirDecoder().raw_decode(ret.object_raw).unwrap();
    
    const root: TreeNode = {
        type: 'dir',
        subs: new Map(),
    };

    dir.desc().content().obj_list().match({
        Chunk: (chunk_id: ChunkId) => {
            console.error(`obj_list in chunk not support yet! ${chunk_id}`);
        },
        ObjList: (obj_list) => {
            for (const [inner_path, info] of obj_list.object_map().entries()) {
                const segs = inner_path.value().split('/');
                console.assert(segs.length > 0);

                // 一个叶子节点就是一个object_id，可能是FileObj，也可能是DirObj
                const leaf_node: TreeNode = {
                    name: segs.pop(),
                    type: 'object',
                    object_id: info.node().object_id()!,
                };
                
                let cur: TreeNode = root;
                for (const seg of segs) {
                    if (!cur.subs!.get(seg)) {
                        const sub_node: TreeNode = {
                            name: seg,
                            type: 'dir',
                            subs: new Map(),
                        };
                        cur.subs!.set(seg, sub_node);
                    }
                    cur = cur.subs!.get(seg)!;
                }

                cur.subs!.set(leaf_node.name!, leaf_node);
            }
        }
    });

    console.info(root);
    // let visitor: AnyNamedObjectVisitor<Dir> = ();
    // const dir: Dir = match_any_obj(ret.object, new );
}

export async function test_dir() {
    const stack = SharedObjectStack.open_runtime();
    (await stack.online()).unwrap();

    console.info("device_id=", stack.local_device_id(), stack.local_device_id().toString());
    const owner = stack.local_device().desc().owner()!.unwrap();
    console.info("owner=", owner.toString());

    const dir_id = DirId.from_base_58('7jMmeXZWRh8u3qHTEsujtLrTXRpJn6EziWQRsY9qbNEB').unwrap();

    await build_dir(stack, dir_id);
}

