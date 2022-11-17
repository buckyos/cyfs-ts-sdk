import { JsonCodec } from "..";
import { BuckyResult, DeviceId, Ok } from "../../cyfs-base";
import { RequestProtocol } from "../access/source";
import { NDNDataRefererObject } from "../ndn/def";
import { NONSlimObjectInfo, NONSlimObjectInfoJsonCodec } from "../non/def";
import { AclAccess, AclAction } from "./def";

export interface AclHandlerRequest {
    // 来源协议
    protocol: RequestProtocol,

    // 动作
    action: AclAction,

    // source/target
    device_id: DeviceId,

    // 操作对象
    object?: NONSlimObjectInfo,
    inner_path?: string,

    // 所属dec
    dec_id: string,

    // 请求的path
    req_path?: string,

    // 引用对象
    referer_object?: NDNDataRefererObject[],
}

export class AclHandlerRequestJsonCodec extends JsonCodec<AclHandlerRequest> {
    encode_object(param: AclHandlerRequest): any {
        const ret: any = {
            protocol: param.protocol,
            action: param.action,
            device_id: param.device_id.to_base_58(),
            object: param.object?new NONSlimObjectInfoJsonCodec().encode_object(param.object):undefined,
            inner_path: param.inner_path,
            dec_id: param.dec_id,
            req_path: param.req_path,
        };

        if (param.referer_object != null) {
            ret.referer_object = [];
            for (const obj of param.referer_object) {
                ret.referer_object.push(obj.toString())
            }
        }
        return ret;
    }

    decode_object(o: any): BuckyResult<AclHandlerRequest> {
        const device_id = DeviceId.from_base_58(o.device_id);
        if (device_id.err) {
            return device_id;
        }
        let object;
        if (o.object) {
            const r = new NONSlimObjectInfoJsonCodec().decode_object(o.object);
            if (r.err) {
                return r;
            }
            object = r.unwrap()
        }
        
        
        let referer_object;
        if (o.referer_object) {
            referer_object = [];
            for (const obj of o.referer_object) {
                const r = NDNDataRefererObject.from_str(obj);
                if (r.err) {
                    return r;
                }
                referer_object.push(r.unwrap());
            }
        }

        return Ok({
            protocol: o.protocol,

            action: o.action,

            device_id: device_id.unwrap(),

            object,
            inner_path: o.inner_path,

            dec_id: o.dec_id,

            req_path: o.req_path,

            referer_object,
        });
    }
}

export interface AclHandlerResponse {
    access: AclAccess,
}

export class AclHandlerResponseJsonCodec extends JsonCodec<AclHandlerResponse> {}