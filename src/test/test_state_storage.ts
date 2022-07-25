import assert from 'assert';
import * as cyfs from '../sdk';

const sleep = require('util').promisify(setTimeout)

export async function test_state_storage(s: cyfs.SharedCyfsStack): Promise<void> {
    const x1_value = cyfs.ObjectId.from_str("95RvaS5anntyAoRUBi48vQoivWzX95M8xm4rkB93DdSt").unwrap();
    const x2_value = cyfs.ObjectId.from_str("95RvaS5F94aENffFhjY1FTXGgby6vUW2AkqWYhtzrtHz").unwrap();

    {
        const storage = s.global_state_storage_ex(
            cyfs.GlobalStateCategory.RootState,
            "/user/friends",
            cyfs.ObjectMapSimpleContentType.Map,
            undefined,
            cyfs.get_system_dec_app().object_id,
        );

        (await storage.init()).unwrap();

        const map = new cyfs.StateStorageMap(storage);
        const remove_ret = (await map.remove("user1")).unwrap()
        if (remove_ret) {
            console.info("remove current value:", remove_ret);
        } else {
            console.info("current value is none!");
        }

        const list = (await map.list()).unwrap();
        assert(list.length === 0);

        (await map.save()).unwrap();
    }

    {
        const storage = s.global_state_storage_ex(
            cyfs.GlobalStateCategory.RootState,
            "/user/friends",
            cyfs.ObjectMapSimpleContentType.Map,
            undefined,
            cyfs.get_system_dec_app().object_id,
        );

        (await storage.init()).unwrap();

        const map = new cyfs.StateStorageMap(storage);
        const v = (await map.get("user1")).unwrap();
        assert(!v);

        let prev = (await map.set("user1", x1_value)).unwrap();
        assert(!prev);

        (await map.storage().save()).unwrap();

        prev = (await map.set("user1", x2_value)).unwrap();
        assert(prev!.eq(x1_value));

        (await map.storage().save()).unwrap();
        (await map.storage().save()).unwrap();

        const list = (await map.list()).unwrap();
        assert(list.length === 1);
        const item = list[0];
        assert(item[0] === "user1");
        assert(item[1].eq(x2_value));

        (await map.storage().abort());
    }

    {
        const storage = s.global_state_storage_ex(
            cyfs.GlobalStateCategory.RootState,
            "/user/friends",
            cyfs.ObjectMapSimpleContentType.Map,
            undefined,
            cyfs.get_system_dec_app().object_id,
        );

        (await storage.init()).unwrap();

        const map = new cyfs.StateStorageMap(storage);
        const v = (await map.get("user1")).unwrap();
        assert(v!.eq(x2_value));

        (await map.abort());
    }

    // test auto_save
    {
        const storage = s.global_state_storage_ex(
            cyfs.GlobalStateCategory.LocalCache,
            "/user/friends",
            cyfs.ObjectMapSimpleContentType.Map,
            undefined,
            cyfs.get_system_dec_app().object_id,
        );

        (await storage.init()).unwrap();
        storage.start_save(5000);

        const map = new cyfs.StateStorageMap(storage);
        (await map.remove("user2")).unwrap();
        (await map.set("user2", x1_value)).unwrap();

        console.info("will wait for auto save for user2...");
        await sleep(10000)

        console.info("will drop map for user2...");
        storage.stop_save()

        {
            const storage = s.global_state_storage_ex(
                cyfs.GlobalStateCategory.LocalCache,
                "/user/friends",
                cyfs.ObjectMapSimpleContentType.Map,
                undefined,
                cyfs.get_system_dec_app().object_id,
            );

            (await storage.init()).unwrap();

            const map = new cyfs.StateStorageMap(storage);
            const ret = (await map.get("user2")).unwrap();
            assert(ret!.eq(x1_value));
        }
    }

    // test auto_save and drop
    {
        const storage = s.global_state_storage_ex(
            cyfs.GlobalStateCategory.LocalCache,
            "/user/friends",
            cyfs.ObjectMapSimpleContentType.Map,
            undefined,
            cyfs.get_system_dec_app().object_id,
        );

        (await storage.init()).unwrap();

        const map = new cyfs.StateStorageMap(storage);
        (await map.remove("user2")).unwrap();
        (await map.set("user2", x1_value)).unwrap();
        assert(map.storage().is_dirty());

        map.storage().start_save(5000);
        await sleep(5000);
        map.storage().stop_save()
    }

    // test some set cases
    {
        // clear test set
        {
            const op_env = (await s.root_state_stub(undefined, cyfs.get_system_dec_app().object_id).create_path_op_env()).unwrap()
            const r = await op_env.remove_with_path("/user/index")
            if (r.err) {
                console.info('remove test set /user/index err', r.val)
            }
            await op_env.commit()
        }

        const storage = s.global_state_storage_ex(
            cyfs.GlobalStateCategory.RootState,
            "/user/index",
            cyfs.ObjectMapSimpleContentType.Set,
            undefined,
            cyfs.get_system_dec_app().object_id,
        );

        (await storage.init()).unwrap();

        const set = new cyfs.StateStorageSet(storage);
        assert(!(await set.contains(x1_value)).unwrap());
        assert(!(await set.contains(x2_value)).unwrap());

        (await set.insert(x1_value)).unwrap();
        assert((await set.contains(x1_value)).unwrap());

        (await set.save()).unwrap();
        let ret = (await set.insert(x2_value)).unwrap();
        assert(ret);

        ret = (await set.insert(x2_value)).unwrap();
        assert(!ret);

        (await set.save()).unwrap();
    }

    {
        const storage = s.global_state_storage_ex(
            cyfs.GlobalStateCategory.RootState,
            "/user/index",
            cyfs.ObjectMapSimpleContentType.Set,
            undefined,
            cyfs.get_system_dec_app().object_id,
        );

        (await storage.init()).unwrap();

        const set = new cyfs.StateStorageSet(storage);

        const list = (await set.list()).unwrap();
        assert(list.length == 2);
        assert(list.find((value) => {
            return value.eq(x1_value)
        }));
        assert(list.find((value) => {
            return value.eq(x2_value)
        }));

        (await set.abort());
    }

    console.info("state storage test complete!");
}