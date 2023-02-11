import * as cyfs from '../sdk';

export async function test_router_handlers(stack: cyfs.SharedCyfsStack): Promise<void> {

    const owner_id = cyfs.ObjectId.from_base_58('5r4MYfFT6foJinoH5RPy4em6rp41PGqd6BbmbG3hpB3x').unwrap();
    const dec_id = cyfs.ObjectId.from_base_58('5aSixgP8EPf6HkP54Qgybddhhsd1fgrkg7Atf2icJiiz').unwrap();
    //await test_put_object(stack, dec_id, owner_id);
    await test_get_object(stack, dec_id, owner_id);
}

class PutObjectWatcher implements cyfs.RouterHandlerPutObjectRoutine {
    async call(param: cyfs.RouterHandlerPutObjectRequest): Promise<cyfs.BuckyResult<cyfs.RouterHandlerPutObjectResult>> {
        const codec = new cyfs.NONPutObjectOutputRequestJsonCodec();
        console.info('watch put_object param:', JSON.stringify(codec.encode_object(param.request)));

        const [text, buf] = new cyfs.TextObjectDecoder().raw_decode(param.request.object.object_raw).unwrap();
        console.info(`watch put_object text_object: id=${text.id}, header=${text.header}, body=${text.body()}`);

        // 观察者直接返回Pass，继续下一个handler
        const result: cyfs.RouterHandlerPutObjectResult = {
            action: cyfs.RouterHandlerAction.Pass,
        };

        return cyfs.Ok(result)
    }
}

class PostObjectHandler implements cyfs.RouterHandlerPostObjectRoutine {
    async call(param: cyfs.RouterHandlerPostObjectRequest): Promise<cyfs.BuckyResult<cyfs.RouterHandlerPostObjectResult>> {
        const codec = new cyfs.NONPostObjectOutputRequestJsonCodec();
        console.info('post_object param: ', JSON.stringify(codec.encode_object(param.request)));

        console.info("source=", param.request.common.source);

        const [text, buf] = new cyfs.TextObjectDecoder().raw_decode(param.request.object.object_raw).unwrap();
        console.info(`put_object text_object: id=${text.id}, header=${text.header}, body=${text.body}`);

        if (text.id === 'request') {
            const obj = cyfs.TextObject.create(undefined, 'response', "test_header", "hello!");
            const object_id = obj.desc().calculate_id();
            console.info(`will response put_object: ${param.request.object.object_id} ---> ${object_id}`);

            const object_raw = obj.to_vec().unwrap();

            // 修改object，并保存，然后继续后续路由流程
            const result: cyfs.RouterHandlerPostObjectResult = {
                action: cyfs.RouterHandlerAction.Response,
                request: param.request,
                response: cyfs.Ok({
                    object: new cyfs.NONObjectInfo(object_id, object_raw)
                })
            };

            return cyfs.Ok(result);
        }
        return cyfs.Err(new cyfs.BuckyError(cyfs.BuckyErrorCode.NotMatch, "post handler get wrong text id"));
    }
}

class PutObjectHandler implements cyfs.RouterHandlerPutObjectRoutine {
    async call(param: cyfs.RouterHandlerPutObjectRequest): Promise<cyfs.BuckyResult<cyfs.RouterHandlerPutObjectResult>> {
        const codec = new cyfs.NONPutObjectOutputRequestJsonCodec();
        console.info('put_object param: ', JSON.stringify(codec.encode_object(param.request)));

        const [text, buf] = new cyfs.TextObjectDecoder().raw_decode(param.request.object.object_raw).unwrap();
        console.info(`put_object text_object: id=${text.id}, header=${text.header}, body=${text.body}`);

        if (text.id === 'normal') {
            const obj = cyfs.TextObject.create(undefined, 'question2', "test_header", "hello!");
            const object_id = obj.desc().calculate_id();
            console.info(`will change put_object: ${param.request.object.object_id} -> ${object_id}`);

            const object_raw = obj.to_vec().unwrap();

            param.request.object.object_id = object_id;
            param.request.object.object_raw = object_raw;

            // 修改object，并保存，然后继续后续路由流程
            const result: cyfs.RouterHandlerPutObjectResult = {
                action: cyfs.RouterHandlerAction.Default,
                request: param.request,
            };

            return cyfs.Ok(result)
        } else if (text.id === 'request') {
            const obj = cyfs.TextObject.create(undefined, 'response', "test_header", "hello!");
            const object_id = obj.desc().calculate_id();
            console.info(`will response put_object: ${param.request.object.object_id} ---> ${object_id}`);

            const object_raw = obj.to_vec().unwrap();

            // 修改object，并保存，然后继续后续路由流程
            const result: cyfs.RouterHandlerPutObjectResult = {
                action: cyfs.RouterHandlerAction.Response,
                request: param.request,
                response: cyfs.Ok({
                    result: cyfs.NONPutObjectResult.Accept
                })
            };

            result.request!.object = new cyfs.NONObjectInfo(object_id, object_raw);

            return cyfs.Ok(result);
        } else if (text.id === 'question_reject') {
            // 直接拒绝
            const result: cyfs.RouterHandlerPutObjectResult = {
                action: cyfs.RouterHandlerAction.Reject,
            };

            return cyfs.Ok(result)
        } else {
            // 默认处理完毕，终止路由，直接返回给调用者成功
            const resp: cyfs.NONPutObjectOutputResponse = {
                result: cyfs.NONPutObjectResult.Updated,
            };

            const result: cyfs.RouterHandlerPutObjectResult = {

                // 直接以成功应答，不保存object(如果想要保存，改用RouterHandlerAction.ResponseAndSave应答即可)
                action: cyfs.RouterHandlerAction.Response,
                response: cyfs.Ok(resp)
            };

            return cyfs.Ok(result);
        }
    }
}

class GetObjectHandler implements cyfs.RouterHandlerGetObjectRoutine {
    async call(param: cyfs.RouterHandlerGetObjectRequest): Promise<cyfs.BuckyResult<cyfs.RouterHandlerGetObjectResult>> {
        const codec = new cyfs.NONGetObjectOutputRequestJsonCodec();
        console.info(codec.encode_object(param.request));

        console.info(`get_object: id=${param.request.object_id}`);

        const obj_type_code = param.request.object_id.obj_type_code();
        if (obj_type_code === cyfs.ObjectTypeCode.Custom) {
            // 创建一个新对象并应答
            const obj = cyfs.TextObject.create(undefined, 'answer', "test_header", "hello!");
            const object_id = obj.desc().calculate_id();
            const object_raw = obj.to_vec().unwrap();

            console.info(`will resp get_object with ${object_id}`);
            const resp: cyfs.NONGetObjectOutputResponse = {
                object: cyfs.NONObjectInfo.new_from_object_raw(object_raw).unwrap()
            };

            const result: cyfs.RouterHandlerGetObjectResult = {
                // 直接终止路由并以resp作为应答
                // 如果需要同时保存，那么替换为ResponseAndSave即可
                action: cyfs.RouterHandlerAction.Response,
                response: cyfs.Ok(resp),
            };

            return cyfs.Ok(result);
        } else {
            // 其余对象，直接拒绝
            const result: cyfs.RouterHandlerGetObjectResult = {
                action: cyfs.RouterHandlerAction.Reject,
            };

            return cyfs.Ok(result);
        }

    }
}

async function test_put_object(stack: cyfs.SharedCyfsStack, dec_id: cyfs.ObjectId, owner_id: cyfs.ObjectId) {
    
    // 添加一个处理器
    {
        const handler = new PutObjectHandler();
        const ret = await stack.router_handlers().add_put_object_handler(cyfs.RouterHandlerChain.PreNOC,
            'put-object-handler',
            0,
            `dec_id == ${dec_id.to_base_58()}`,
            undefined,
            cyfs.RouterHandlerAction.Drop,
            handler,
        );

        console.info(ret);
    }

    // 添加一个观察者
    {
        const handler = new PutObjectWatcher();
        const ret = await stack.router_handlers().add_put_object_handler(cyfs.RouterHandlerChain.PostNOC,
            'put-object-watcher',
            -1,
            `obj_type == ${cyfs.CoreObjectType.Text} && dec_id == ${dec_id.to_base_58()}`,
            undefined,
            cyfs.RouterHandlerAction.Pass,
            handler
        );

        console.info(ret);
    }

    // 添加一个Post Handler
    {
        const handler = new PostObjectHandler();
        const ret = await stack.router_handlers().add_post_object_handler(cyfs.RouterHandlerChain.PreRouter,
            'post-object-handler',
            -1,
            `obj_type == ${cyfs.CoreObjectType.Text} && dec_id == ${dec_id.to_base_58()} && req_path == '/qa/request/'`,
            undefined,
            cyfs.RouterHandlerAction.Pass,
            handler,
        );

        console.info(ret);
    }

    // 创建一个使用传统put_object的对象
    {
        const obj = cyfs.TextObject.create(owner_id, 'normal', "test_header", "hello!");
        const object_id = obj.desc().calculate_id();
        console.info(`will put_object: id=${object_id}`);

        const object_raw = obj.to_vec().unwrap();
        const req = {
            common: {
                dec_id,
                flags: 0,
                level: cyfs.NONAPILevel.Router
            },
            object: new cyfs.NONObjectInfo(object_id, object_raw)
        };

        const put_ret = await stack.non_service().put_object(req);
        console.info('put_object result:', put_ret);
        console.assert(!put_ret.err);
    }

    // 标准的QA流程
    {
        const obj = cyfs.TextObject.create(owner_id, 'request', "test_header", "hello!");
        const object_id = obj.desc().calculate_id();
        console.info(`will post_object: id=${object_id}`);

        const object_raw = obj.to_vec().unwrap();
        // 添加一个req_path，测试带req_path的有效性
        const req = {
            common: {
                req_path: "/qa/request",
                dec_id,
                flags: 0,
                level: cyfs.NONAPILevel.Router
            },
            object: new cyfs.NONObjectInfo(object_id, object_raw)
        };

        const put_ret = await stack.non_service().post_object(req);
        console.info('post_object result:', put_ret);
        console.assert(!put_ret.err);
        const resp = put_ret.unwrap();
        // qa流程测试用post_object，这里没有result字段
        // console.assert(resp.result === NONPutObjectResult.Accept);
        console.assert(resp.object);
        console.info(`put_object got resp! object=${resp.object!.object!.desc().calculate_id()}`);
    }

    {
        const obj = cyfs.TextObject.create(owner_id, 'question_reject', "test_header", "hello!");
        const object_id = obj.desc().calculate_id();
        console.info(`will put_object: id=${object_id}`);

        const object_raw = obj.to_vec().unwrap();
        const req = {
            common: {
                dec_id,
                flags: 11,
                level: cyfs.NONAPILevel.Router
            },
            object: new cyfs.NONObjectInfo(object_id, object_raw)
        };

        const put_ret = await stack.non_service().put_object(req);
        console.info('put_object reject result:', put_ret);
        console.assert(put_ret.err);
        const err = put_ret.val! as cyfs.BuckyError;
        console.info(typeof cyfs.BuckyErrorCode.Reject);
        console.info(typeof err.code);
        console.assert(err.code === cyfs.BuckyErrorCode.Reject);
    }

    {
        const obj = cyfs.TextObject.create(owner_id, 'question_resp', "test_header", "hello!");
        const object_id = obj.desc().calculate_id();
        console.info(`will put_object: id=${object_id}`);

        const object_raw = obj.to_vec().unwrap();
        const req = {
            common: {
                dec_id,
                flags: 0,
                level: cyfs.NONAPILevel.Router
            },
            object: new cyfs.NONObjectInfo(object_id, object_raw),
        };

        const put_ret = await stack.non_service().put_object(req);
        console.info('put_object result:', put_ret);
        console.assert(!put_ret.err);
    }
}

async function test_get_object(stack: cyfs.SharedCyfsStack, dec_id: cyfs.ObjectId, owner_id: cyfs.ObjectId) {
    const handler = new GetObjectHandler();


    {
        // 低优先级的默认handler，index大于text_object的hanlder，优先级会低
        const ret = await stack.router_handlers().add_get_object_handler(cyfs.RouterHandlerChain.PreNOC,
            'get_another_object',
            1,
            `dec_id == ${dec_id.to_base_58()} && req_path==/qa/*`,
            undefined,
            cyfs.RouterHandlerAction.Reject,
            handler,
        );

        console.info(ret);
    }

    // 高优先级handler，处理text_object
    {
        const ret = await stack.router_handlers().add_get_object_handler(cyfs.RouterHandlerChain.PreNOC,
            'get_text_object',
            0,
            `dec_id == ${dec_id.to_base_58()} && req_path==/qa/*`,
            undefined,
            cyfs.RouterHandlerAction.Reject,
            handler,
        );

        console.info(ret);
    }

    // 使用text_object_id发起一次get
    {
        const obj = cyfs.TextObject.create(owner_id, 'get_request', "test_header", "hello!");
        const object_id = obj.desc().calculate_id();

        const req = {
            object_id,
            common: {
                req_path: "/qa/put_object",
                level: cyfs.NONAPILevel.Router,
                dec_id,
                flags: 0,
            }
        };

        const get_ret = await stack.non_service().get_object(req);
        console.info('get_object result:', get_ret);
        console.assert(!get_ret.err);

        const resp = get_ret.unwrap();
        const resp_object_id = resp.object.object!.desc().calculate_id();
        console.info(`get_object resp: ${resp_object_id}`);
    }

    // 使用一个基础对象id获取，会被拒绝
    {
        const object_id = cyfs.ObjectId.from_base_58('5aSixgLwprg8rJ6q5sHHrMicieEyuAaiaX6YVFnB2i1R').unwrap();
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
        const err = get_ret.val! as cyfs.BuckyError;
        console.assert(err.code === cyfs.BuckyErrorCode.Reject);
    }
}