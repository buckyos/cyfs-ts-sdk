import assert from "assert";
import * as cyfs from '../sdk';
import { NONAPILevel, NONObjectInfo, get_system_dec_app } from "../sdk";

class AclHandler implements cyfs.RouterHandlerAclRoutine {
    constructor(private id: string){}
    async call(param: cyfs.RouterHandlerAclRequest): Promise<cyfs.BuckyResult<cyfs.RouterHandlerAclResult>> {
        const obj = new cyfs.AclHandlerRequestJsonCodec().encode_object(param.request);
        console.log(`${this.id} recv acl event, obj ${JSON.stringify(obj)}, `)
        return cyfs.Ok({
            action: cyfs.RouterHandlerAction.Response,
            response: cyfs.Ok({access: cyfs.AclAccess.Accept})
        });
    }
}

export async function test_acl():Promise<void> {
    const stack1 = cyfs.SharedCyfsStack.open(cyfs.SharedCyfsStackParam.new_with_ws_event_ports(21000, 21001, get_system_dec_app().object_id).unwrap());
    const stack2 = cyfs.SharedCyfsStack.open(cyfs.SharedCyfsStackParam.new_with_ws_event_ports(21010, 21011, get_system_dec_app().object_id).unwrap());

    await stack1.online();
    await stack2.online();

    const people1 = cyfs.PeopleId.try_from_object_id(stack1.local_device().desc().owner()!).unwrap();
    const people2 = cyfs.PeopleId.try_from_object_id(stack2.local_device().desc().owner()!).unwrap();
    console.log("zone1 people: ", people1);
    console.log("zone2 people: ", people2);

    // stack注册acl事件
    await stack1.router_handlers().add_acl_handler(cyfs.RouterHandlerChain.Acl, "im.add-friend", 0, "*", undefined, cyfs.RouterHandlerAction.Default, new AclHandler("stack1"))
    await stack2.router_handlers().add_acl_handler(cyfs.RouterHandlerChain.Acl, "im.add-friend", 0, "*", undefined, cyfs.RouterHandlerAction.Default, new AclHandler("stack2"))

    // 创建一个AddFriend
    const text_obj = cyfs.AddFriend.create(people1, people2);
    const object_id = text_obj.desc().calculate_id();

    // 清理环境，两边删掉这个object
    await stack1.non_service().delete_object({
        common: {
            level: cyfs.NONAPILevel.NOC,
            flags: 0
        },
        object_id
    });

    await stack2.non_service().delete_object({
        common: {
            level: cyfs.NONAPILevel.NOC,
            flags: 0
        },
        object_id
    });

    // stack1给对象签名
    const sign1_resp = (await stack1.crypto().sign_object({
        common: {flags: 0},
        object: new NONObjectInfo(object_id, text_obj.to_vec().unwrap()),
        flags: cyfs.CRYPTO_REQUEST_FLAG_SIGN_BY_DEVICE | cyfs.CRYPTO_REQUEST_FLAG_SIGN_SET_DESC
    })).unwrap();

    // 测试stack1 Put给 stack2，测试acl直到put成功
    const resp = await stack1.non_service().put_object({
        common: {
            level: cyfs.NONAPILevel.Router,
            flags: 0,
            target: people2.object_id
        },
        object: NONObjectInfo.new_from_object_raw(sign1_resp.object!.object_raw).unwrap()
    });
    console.log("put obj resp: ", resp);
    assert(resp.ok);

    // stack2从自己的NOC上取到这个obj
    const get_resp2 = (await stack2.non_service().get_object({
        common: {
            level: cyfs.NONAPILevel.NOC,
            flags: 0
        },
        object_id
    })).unwrap()

    // stack2增加一个自己的签名
    const sign2_resp = (await stack2.crypto().sign_object({
        common: {flags: 0},
        object: get_resp2.object,
        flags: cyfs.CRYPTO_REQUEST_FLAG_SIGN_BY_DEVICE | cyfs.CRYPTO_REQUEST_FLAG_SIGN_PUSH_DESC
    })).unwrap();

    // 然后stack2把对象再put回stack1
    const resp2 = await stack2.non_service().put_object({
        common: {
            level: cyfs.NONAPILevel.Router,
            flags: 0,
            target: people1.object_id
        },
        object: NONObjectInfo.new_from_object_raw(sign2_resp.object!.object_raw).unwrap()
    });
    console.log("stack2 put obj resp: ", resp);
    assert(resp2.ok);

    // stack1再次取回这个对象，检测是否有两个签名
    const get_resp1_again = (await stack1.non_service().get_object({
        common: {
            level: cyfs.NONAPILevel.NOC,
            flags: 0
        },
        object_id
    })).unwrap()
    get_resp1_again.object!.decode_and_verify().unwrap()
    assert(get_resp1_again.object!.object!.signs().desc_signs()!.length === 2);

    // 创建一个Msg，stack1发送给stack2
    const msg1 = cyfs.Msg.create(people1, people2.object_id, cyfs.MsgContent.Text("hello1"));
    console.log(`stack1 will put msg ${msg1.desc().calculate_id()} to stack2`);
    const msg_resp1 = (await stack1.non_service().put_object({
        common: {
            level: cyfs.NONAPILevel.Router,
            flags: 0,
            target: people2.object_id
        },
        object: new NONObjectInfo(msg1.desc().calculate_id(), msg1.to_vec().unwrap())
    }))
    console.log("stack1 send msg resp", msg_resp1);
    assert(msg_resp1.ok);

    // stack2读取这个Msg，打印内容
    console.log(`stack2 will get msg ${msg1.desc().calculate_id()}`);
    const get_msg_resp1 = (await stack2.non_service().get_object({
        common: {
            level: cyfs.NONAPILevel.NOC,
            flags: 0
        },
        object_id: msg1.desc().calculate_id()
    })).unwrap()
    const msg1_recv = new cyfs.MsgDecoder().from_raw(get_msg_resp1.object.object_raw).unwrap();
    console.log("stack2 recv msg content", msg1_recv.content().match({Text: (text) => text}));
}