import assert from "assert";
import { SharedCyfsStack, TextObject, NONObjectInfo, CRYPTO_REQUEST_FLAG_SIGN_BY_DEVICE, CRYPTO_REQUEST_FLAG_SIGN_SET_DESC, CRYPTO_REQUEST_FLAG_SIGN_SET_BODY, SignObjectResult, TextObjectDecoder, VerifySignType, VerifyObjectType, RouterHandlerChain, RouterHandlerAction, RouterHandlerSignObjectRoutine, BuckyResult, RouterHandlerSignObjectRequest, RouterHandlerSignObjectResult, Ok } from "../../sdk";

class CryptoHandler implements RouterHandlerSignObjectRoutine {
    async call(param: RouterHandlerSignObjectRequest): Promise<BuckyResult<RouterHandlerSignObjectResult>> {
        console.log("on sign event: sign for object", param.request.object.object_id)
        return Ok({
            action: RouterHandlerAction.Default
        })
    }
    
}

export async function test_crypto(stack: SharedCyfsStack) {
    // 添加一个sign event handler
    stack.router_handlers().add_sign_object_handler(RouterHandlerChain.PreCrypto, "test-pre-crypto", 0, "*", undefined, RouterHandlerAction.Default, new CryptoHandler())
    const crypto = stack.crypto();
    // 因为测试用栈的device签名，对象的owner就是栈的device
    const owner = stack.local_device_id();

    // 用TextObject测试
    const obj = TextObject.create(owner.object_id, "test-text-id", "test-text-key", "test-text-value");

    // 测试签名
    const resp = (await crypto.sign_object({
        common: {flags: 0},
        object: new NONObjectInfo(obj.desc().calculate_id(), obj.encode_to_buf().unwrap()),
        flags: CRYPTO_REQUEST_FLAG_SIGN_BY_DEVICE|CRYPTO_REQUEST_FLAG_SIGN_SET_DESC|CRYPTO_REQUEST_FLAG_SIGN_SET_BODY
    })).unwrap();

    assert(resp.result === SignObjectResult.Signed, "check sign result failed");

    const signed_obj = new TextObjectDecoder().from_raw(resp.object!.object_raw).unwrap();
    assert(signed_obj.signs().desc_signs()!.length === 1, "check desc signs failed");
    assert(signed_obj.signs().body_signs()!.length === 1, "check body signs failed");

    console.log("test sign object success");

    // 测试验证
    {
        const resp2 = (await crypto.verify_object({
            common: {flags: 0},
            sign_type: VerifySignType.Both,
            object: resp.object!,
            sign_object: VerifyObjectType.Owner()
        })).unwrap();
        
        assert(resp2.result.valid, "check verfiy result failed")
        console.log("test verify object by owner success");
    }

    {
        const resp2 = (await crypto.verify_object({
            common: {flags: 0},
            sign_type: VerifySignType.Both,
            object: resp.object!,
            sign_object: VerifyObjectType.Object({object_id: owner.object_id})
        })).unwrap();
    
        assert(resp2.result.valid, "check verfiy result failed")
    
        console.log("test verify object by object success");
    }
    
}