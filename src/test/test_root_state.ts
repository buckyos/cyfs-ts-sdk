import { assert } from 'console';
import * as cyfs from "../sdk";

export async function test_root_state(
    stack: cyfs.SharedCyfsStack
): Promise<void> {
    await test_root_state_codec(stack);
    await test_root_state_impl(stack);
}


async function test_root_state_impl(
    stack: cyfs.SharedCyfsStack,
) {
    const root_state_stub = stack.root_state_stub();

    // get_current_root
    {
        const r = await root_state_stub.get_current_root();
        if (r.err) {
            console.log(`get_current_root failed, err = ${r}`);
        } else {
            console.log(
                `get_current_root success, current root =  ${r.unwrap().root
                }, revision = ${r.unwrap().revision}`
            );
        }
    }

    // get_dec_root
    {
        const r = await root_state_stub.get_dec_root();
        if (r.err) {
            console.log(`get_dec_root failed, err = ${r}`);
        } else {
            console.log(
                `get_dec_root success , return [root =  ${r.unwrap().root
                }, dec_root = ${r.unwrap().dec_root}] `
            );
        }
    }

    const X1 = cyfs.ObjectId.from_base_58(
        "95RvaS5anntyAoRUBi48vQoivWzX95M8xm4rkB93DdSt"
    ).unwrap();
    const X2 = cyfs.ObjectId.from_base_58(
        "95RvaS5F94aENffFhjY1FTXGgby6vUW2AkqWYhtzrtHz"
    ).unwrap();

    // TEST PathOpEnvStub
    {
        // TEST FOR insert_with_key AND get_by_path AND remove_with_path AND commit
        // MAP
        {
            const path_op_env: cyfs.PathOpEnvStub = (
                await root_state_stub.create_path_op_env()
            ).unwrap();
            await path_op_env.remove_with_path("/a/b");

            const root_info = (await path_op_env.get_current_root()).unwrap();
            console.log(`current root: ${JSON.stringify(root_info)}`);

            const r = await path_op_env.get_by_path("/a/b");
            if (r.err) {
                console.log(`get_by_path a/b failed,  err = ${r}`);
            } else {
                const resp = r.unwrap();
                if (resp) {
                    console.log(`${resp}`);
                } else {
                    console.log(`get_by_path success, but return undefined`);
                }
            }

            const r1 = await path_op_env.insert_with_key("/a/b", "c", X1);
            if (r1.err) {
                console.log(`insert_with_key err = ${r1}`);
            } else {
                console.log(`insert_with_key object_id = ${X1} success`);
            }

            {
                const new_root = (await path_op_env.update()).unwrap();
                console.log(`new root: ${JSON.stringify(new_root)}`);
                console.assert(new_root.root !== root_info.root);
                console.assert(new_root.revision !== root_info.revision);
            }

            const r2 = await path_op_env.get_by_path("/a/b/c");
            if (r2.err) {
                console.log(`get_by_path failed, err =  ${r2}`);
            } else {
                const id = r2.unwrap();
                if (id) {
                    console.log(`get_by_path success, objectid = ${id}}`);
                    if (id.to_base_58() === X1.to_base_58()) {
                        console.log(`insert_with_key and get_by_path is all success`);
                    }
                } else {
                    console.log(`get_by_path success, but return undefined`);
                }
            }

            const r6 = await path_op_env.metadata("/a/b");
            if (r6.err) {
                console.log(`path_op_env get /a/b metadata failed, err = ${r6}`);
            } else {
                const data = r6.unwrap();
                console.log(`path_op_env get /a/b metadata success, content_mode = ${data.content_mode}, content_type = ${data.content_type},
        count = ${data.count}, size = ${data.size}, depth = ${data.depth}`);
            }

            const r3 = await path_op_env.remove_with_path("/a/b/d");
            if (r3.err) {
                console.log(`remove_with_path failed, err =  ${r3}`);
            } else {
                if (r3.unwrap()) {
                    console.log(`remove_with_path success, objectid = ${r3.unwrap()}`);
                } else {
                    console.log(`remove_with_path success, path is not exist`);
                }
            }

            const r4 = await path_op_env.remove_with_path("/a/b/c");
            if (r4.err) {
                console.log(`remove_with_path failed, err =  ${r4}`);
            } else {
                if (r4.unwrap()) {
                    console.log(`remove_with_path success, objectid = ${r4.unwrap()}`);
                } else {
                    console.log(`remove_with_path success, path is not exist`);
                }
            }

            const r5 = await path_op_env.commit();
            if (r5.err) {
                console.log(`commit failed, err = ${r5}`);
            } else {
                console.log(
                    `commit success, return value = [root = ${r5.unwrap().root
                    }, dec_root = ${r5.unwrap().dec_root}, revision = ${r5.unwrap().revision
                    }]`
                );
            }
        }

        // SET
        {
            const path_op_env: cyfs.PathOpEnvStub = (
                await root_state_stub.create_path_op_env()
            ).unwrap();
            await path_op_env.remove_with_path("/set");

            const r1 = await path_op_env.insert("/set/a", X2);
            if (r1.err) {
                console.log(`insert err = ${r1}`);
            } else {
                console.log(`insert object_id = ${X2} success`);
            }

            const r2 = await path_op_env.contains("/set/a", X2);
            if (r2.err) {
                console.log(`contains failed, err =  ${r2}`);
            } else {
                const is_exist = r2.unwrap();
                // const str = is_exist ? "true" : "false";
                console.log(
                    `contains success, objectid is exist  = ${is_exist ? "true" : "false"
                    }`
                );
            }

            const r3 = await path_op_env.insert("/set/a", X2);
            if (r3.err) {
                console.log(`insert err = ${r3}`);
            } else {
                console.log(`insert object_id = ${X2} success`);
            }

            const r4 = await path_op_env.remove("/set/a", X2);
            if (r4.err) {
                console.log(`remove err = ${r4}`);
            } else {
                if (r4.unwrap()) {
                    console.log(`remove object_id = ${X2} success`);
                }
            }
        }

        // ITERATOR
        {
            const path_op_env: cyfs.PathOpEnvStub = (
                await root_state_stub.create_path_op_env()
            ).unwrap();
            console.log(`remove_with_path [/test/it]`);
            await path_op_env.remove_with_path("/test/it");

            const r = await path_op_env.get_by_path("/test/it");
            if (r.err) {
                console.log(`get_by_path err = ${r}`);
            } else {
                const resp = r.unwrap();
                if (resp) {
                    console.log(`get_by_path [/test/it] success, return ${resp}`);
                } else {
                    console.log(`get_by_path success, but return undefined`);
                }
            }

            for (let i = 0; i < 1000; i++) {
                const key = `test_interator_${i}`;
                const r_ = await path_op_env.insert_with_key("/test/it", key, X1);
                if (r_.err) {
                    console.log(`insert_with_key key = ${key} path = [/test/it] failed, err = ${r_}`);
                } else {
                    console.log(`insert_with_key key = ${key} path = [/test/it] success`);
                }
            }

            const r1 = await path_op_env.commit();
            if (r1.err) {
                console.log(`commit err = ${r1}`);
            } else {
                console.log(
                    `commit success, return value = [root = ${r1.unwrap().root
                    }, dec_root = ${r1.unwrap().dec_root}, revision = ${r1.unwrap().revision
                    }]`
                );
            }

            const single_op_env: cyfs.SingleOpEnvStub = (
                await root_state_stub.create_single_op_env()
            ).unwrap();
            if (single_op_env) {
                console.log(`create_single_op_env success`);
            }
            const r2 = await single_op_env.load_by_path("/test/it");
            if (r2.err) {
                console.log(`single_op_env load_by_path [/test/it] failed, err = ${r2}`);
            } else {
                console.log(`single_op_env load_by_path [/test/it] success`);
            }

            const r4 = await single_op_env.metadata();
            if (r4.err) {
                console.log(`single_op_env get metadata failed`);
            } else {
                const data = r4.unwrap();
                console.log(`single_op_env get metadata success, content_mode = ${data.content_mode}, content_type = ${data.content_type},
        count = ${data.count}, size = ${data.size}, depth = ${data.depth}`);
            }

            for (let i = 0; i < 100; i++) {
                const r3 = await single_op_env.next(10);
                if (r3.err) {
                    console.log(`single op env next failed,  err = ${r3}`);
                } else {
                    const items: cyfs.ObjectMapContentItem[] = r3.unwrap();
                    if (items.length === 0) {
                        break;
                    }
                    for (const item of items) {
                        console.log(`current item content_type = ${item.content_type}`);
                        switch (item.content_type) {
                            case cyfs.ObjectMapSimpleContentType.Map: {
                                console.log(`current item key = ${item.map!.key}, value = ${item.map!.value}`);
                                break;
                            }
                            case cyfs.ObjectMapSimpleContentType.Set: {
                                console.log(`current item value = ${item.set!.value}`);
                                break;
                            }
                            case cyfs.ObjectMapSimpleContentType.DiffMap: {
                                const diff_map = item.diff_map!;
                                console.log(`current item key = ${diff_map.key}, prev = ${diff_map.prev}, altered = ${diff_map.altered}, diff = ${diff_map.diff}`);
                                break;
                            }
                            case cyfs.ObjectMapSimpleContentType.DiffSet: {
                                const diff_set = item.diff_set!;
                                console.log(`current item prev = ${diff_set.prev}, altered = ${diff_set.altered}`);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    {
        const root_state_accessor_stub = stack.root_state_accessor_stub();
        const r1 = await root_state_accessor_stub.get_object_by_path("/test/it");
        if (r1.err) {
            console.log(`get_object_by_path for root_state failed: ${r1.err}`);
        } else {
            const resp = r1.unwrap();
            console.log(`get_object_by_path for root_state success`);
            console.log(`get_object_by_path get object update_time : ${resp.object.get_update_time()}`)
            if (resp.object_expires_time) {
                console.log(`get_object_by_path for root_state object_expires_time = ${resp.object_expires_time}`)
            }
        }

        const r2 = await root_state_accessor_stub.list("/test/it", 2, 2);
        if (r2.err) {
            console.log(`list for root_state failed: ${r2.err}`);
        } else {
            console.log(`list for root_state success`);
            const items: cyfs.ObjectMapContentItem[] = r2.unwrap();
            if (items.length) {
                console.log(`get item length = ${items.length}`)
                for (const item of items) {
                    console.log(`current item content_type = ${item.content_type}`);
                    switch (item.content_type) {
                        case cyfs.ObjectMapSimpleContentType.Map: {
                            console.log(`current item key = ${item.map!.key}, value = ${item.map!.value}`);
                            break;
                        }
                        case cyfs.ObjectMapSimpleContentType.Set: {
                            console.log(`current item value = ${item.set!.value}`);
                            break;
                        }
                        case cyfs.ObjectMapSimpleContentType.DiffMap: {
                            const diff_map = item.diff_map!;
                            console.log(`current item key = ${diff_map.key}, prev = ${diff_map.prev}, altered = ${diff_map.altered}, diff = ${diff_map.diff}`);
                            break;
                        }
                        case cyfs.ObjectMapSimpleContentType.DiffSet: {
                            const diff_set = item.diff_set!;
                            console.log(`current item prev = ${diff_set.prev}, altered = ${diff_set.altered}`);
                            break;
                        }
                    }
                }
            }

        }
    }
}

async function test_root_state_codec(
    stack: cyfs.SharedCyfsStack,
) {
    const root_state_stub = stack.root_state_stub();

    const X1 = cyfs.ObjectId.from_base_58(
        "95RvaS5anntyAoRUBi48vQoivWzX95M8xm4rkB93DdSt"
    ).unwrap();
    const X2 = cyfs.ObjectId.from_base_58(
        "95RvaS5F94aENffFhjY1FTXGgby6vUW2AkqWYhtzrtHz"
    ).unwrap();

    const path = '/编码/一二三';
    const key = '四五';
    const full_path = `${path}/${key}`;

    // TEST PathOpEnvStub
    {
        {
            const path_op_env: cyfs.PathOpEnvStub = (
                await root_state_stub.create_path_op_env()
            ).unwrap();
            await path_op_env.remove_with_path(path);

            const r = await path_op_env.get_by_path(path);
            if (r.err) {
                console.log(`get_by_path ${path} failed,  err = ${r}`);
            } else {
                const resp = r.unwrap();
                if (resp) {
                    console.log(`${resp}`);
                } else {
                    console.log(`get_by_path success, but return undefined`);
                }
            }

            const r1 = await path_op_env.insert_with_key(path, key, X1);
            if (r1.err) {
                console.log(`insert_with_key err = ${r1}`);
            } else {
                console.log(`insert_with_key object_id = ${X1} success`);
            }

            const r2 = await path_op_env.get_by_path(full_path);
            if (r2.err) {
                console.log(`get_by_path failed, err =  ${r2}`);
            } else {
                const id = r2.unwrap();
                if (id) {
                    console.log(`get_by_path success, objectid = ${id}}`);
                    if (id.to_base_58() === X1.to_base_58()) {
                        console.log(`insert_with_key and get_by_path is all success`);
                    }
                } else {
                    console.log(`get_by_path success, but return undefined`);
                }
            }

            const r3 = await path_op_env.commit();
            assert(r3.ok);
            const root = r3.unwrap();
            console.info(root);
        }
    }

    // access
    {
        // const rpath = `/$/${stack.dec_id}/${full_path}`;
        const root_state_accessor_stub = stack.root_state_accessor_stub(stack.local_device_id().object_id, stack.dec_id);
        {
            const l1 = await root_state_accessor_stub.list(path);
            assert(l1.ok);
            const resp = l1.unwrap();
            console.info(resp);
        }

        {
            const r1 = await root_state_accessor_stub.get_object_by_path(path);
            assert(r1.ok);
            const resp = r1.unwrap();
            console.info(resp);
        }

        {
            const r1 = await root_state_accessor_stub.get_object_by_path(full_path);
            assert(!r1.ok);
            // const resp = r1.unwrap();
            // console.info(resp);
        }
    }
}