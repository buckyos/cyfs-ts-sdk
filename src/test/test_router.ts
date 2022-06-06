import * as cyfs from '../sdk';

export async function test_router(stack: cyfs.SharedCyfsStack) {

    console.info("device_id=", stack.local_device_id(), stack.local_device_id().toString());
    const owner_id = stack.local_device().desc().owner()!.unwrap();
    console.info("owner=", owner_id.to_string());

    const app = cyfs.DecApp.create(owner_id, 'test_router');
    const dec_id = app.desc().calculate_id();
    console.log(`new app id: ${dec_id}`);

    await test_put_object(stack, dec_id, owner_id);
}

async function test_put_object(stack: cyfs.SharedCyfsStack, dec_id: cyfs.ObjectId, owner_id: cyfs.ObjectId) {
    let object_id: cyfs.ObjectId;
    let encoded_str: string;
    {
        const obj = cyfs.TextObject.create(cyfs.Some(owner_id), 'question', "test_header", "hello!");
        object_id = obj.desc().calculate_id();
        console.info(`will put_object: id=${object_id}`);

        const object_raw = obj.to_vec().unwrap();
        encoded_str = Buffer.from(object_raw).toString('hex');
        const req = {
            common: {
                level: cyfs.NONAPILevel.Router,
                dec_id,
                flags: 0,
            },
            object: new cyfs.NONObjectInfo(object_id, object_raw)
        };

        const put_ret = await stack.non_service().put_object(req);
        console.info('put_object result:', put_ret);
        console.assert(!put_ret.err);
    }

    const check_get_resp = (resp: cyfs.NONObjectInfo) => {
        const result_object_id = resp.object!.desc().calculate_id();
        console.info(`get_object: id=${result_object_id}`);
        console.assert(result_object_id.to_string() === object_id.to_string());

        const result_str = Buffer.from(resp.object_raw).toString('hex');
        console.assert(result_str === encoded_str);

        const [text, buf] = new cyfs.TextObjectDecoder().raw_decode(resp.object_raw).unwrap();
        console.assert(text.desc().calculate_id().to_string() === object_id.to_string());
    };

    // 测试查找
    {
        const select_ret = await stack.non_service().select_object({
            common: {
                level: cyfs.NONAPILevel.Router,
                flags: 0
            },
            filter: {
                obj_type: cyfs.CoreObjectType.Text
            }
        });

        console.info('select_object result:', select_ret);
        console.assert(select_ret.unwrap().objects.length > 0);
    }

    // 测试Get
    {
        const req = {
            object_id,
            common: {
                dec_id,
                flags: 0,
                level: cyfs.NONAPILevel.Router
            }

        };

        const get_ret = await stack.non_service().get_object(req);
        console.info('get_object result:', get_ret);
        console.assert(!get_ret.err);
        const resp = get_ret.unwrap();

        check_get_resp(resp.object);
    }

    // 测试删除
    {
        const req = {
            object_id,
            common: {
                dec_id,
                flags: cyfs.CYFS_REQUEST_FLAG_DELETE_WITH_QUERY,
                level: cyfs.NONAPILevel.Router
            }
        };

        const delete_ret = await stack.non_service().delete_object(req);
        console.info('delete_object result:', delete_ret);
        console.assert(!delete_ret.err);

        const resp = delete_ret.unwrap();
        console.assert(resp.object);

        check_get_resp(resp.object!);
    }

    // 测试查找
    {
        const req = {
            object_id,
            common: {
                dec_id,
                flags: 0,
                level: cyfs.NONAPILevel.Router
            }

        };

        const get_ret = await stack.non_service().get_object(req);
        console.info('get_object result:', get_ret);
        console.assert(get_ret.err);
        const err = get_ret.val as cyfs.BuckyError;
        console.assert(err.code === cyfs.BuckyErrorCode.NotFound);
    }
}