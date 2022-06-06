import { JsonCodec, VerifyObjectTypeJsonCodec } from "..";
import { BuckyResult, DeviceId, ObjectId, Ok } from "../../cyfs-base";
import { NONProtocol } from "../base/protocol";
import { NONObjectInfo, NONObjectInfoJsonCodec } from "../non/def";
import { CryptoSignObjectOutputResponse, CryptoVerifyObjectOutputResponse, VerifyObjectType, VerifySignType } from "./output_request";

export interface CryptoInputRequestCommon {
    // 请求路径，可为空
    req_path?: string;

    // 来源DEC
    dec_id?: ObjectId;

    // 来源设备和协议
    source: DeviceId;
    protocol: NONProtocol;

    // 用以默认行为
    target?: ObjectId;

    flags: number;
}

export class CryptoInputRequestCommonJsonCodec extends JsonCodec<CryptoInputRequestCommon> {
    encode_object(param: CryptoInputRequestCommon): any {
        return {
            req_path: param.req_path,
            dec_id: param.dec_id?.toString(),
            source: param.source.toString(),
            protocol: param.protocol,
            target: param.target?.toString(),
            flags: param.flags
        }
    }
    decode_object(o: any): BuckyResult<CryptoInputRequestCommon> {
        let dec_id;
        if (o.dec_id) {
            const r = ObjectId.from_base_58(o.dec_id);
            if (r.err) {
                return r;
            }
            dec_id = r.unwrap();
        }

        let source;
        {
            const r = DeviceId.from_base_58(o.source);
            if (r.err) {
                return r;
            }
            source = r.unwrap();
        }

        let target;
        if (o.target) {
            const r = ObjectId.from_base_58(o.target);
            if (r.err) {
                return r;
            }
            target = r.unwrap();
        }


        return Ok({
            req_path: o.req_path,
            dec_id,
            source,
            protocol: o.protocol as NONProtocol,
            target,
            flags: o.flags
        })
    }
}

export interface CryptoSignObjectInputRequest {
    common: CryptoInputRequestCommon;

    object: NONObjectInfo;

    flags: number;
}

export class CryptoSignObjectInputRequestJsonCodec extends JsonCodec<CryptoSignObjectInputRequest> {
    encode_object(param: CryptoSignObjectInputRequest): any {
        return {
            common: new CryptoInputRequestCommonJsonCodec().encode_object(param.common),
            object: new NONObjectInfoJsonCodec().encode_object(param.object),
            flags: param.flags
        }
    }

    decode_object(o: any): BuckyResult<CryptoSignObjectInputRequest> {
        let common;
        {
            const r = new CryptoInputRequestCommonJsonCodec().decode_object(o.common);
            if (r.err) {
                return r;
            }
            common = r.unwrap();
        }

        let object;
        {
            const r = new NONObjectInfoJsonCodec().decode_object(o.object);
            if (r.err) {
                return r;
            }
            object = r.unwrap();
        }

        return Ok({
            common,
            object,
            flags: o.flags
        })
    }
}

export type CryptoSignObjectInputResponse = CryptoSignObjectOutputResponse; 

export interface CryptoVerifyObjectInputRequest {
    common: CryptoInputRequestCommon;

    // 校验的签名位置
    sign_type: VerifySignType;

    // 被校验对象
    object: NONObjectInfo;

    // 签名来源对象
    sign_object: VerifyObjectType;
}

export class CryptoVerifyObjectInputRequestJsonCodec extends JsonCodec<CryptoVerifyObjectInputRequest> {
    encode_object(param: CryptoVerifyObjectInputRequest): any {
        return {
            common: new CryptoInputRequestCommonJsonCodec().encode_object(param.common),
            sign_type: param.sign_type,
            object: new NONObjectInfoJsonCodec().encode_object(param.object),
            sign_object: new VerifyObjectTypeJsonCodec().encode_object(param.sign_object)
        }
    }

    decode_object(o: any): BuckyResult<CryptoVerifyObjectInputRequest> {
        let common;
        {
            const r = new CryptoInputRequestCommonJsonCodec().decode_object(o.common);
            if (r.err) {
                return r;
            }
            common = r.unwrap();
        }

        let object;
        {
            const r = new NONObjectInfoJsonCodec().decode_object(o.object);
            if (r.err) {
                return r;
            }
            object = r.unwrap();
        }

        let sign_object;
        {
            const r = new VerifyObjectTypeJsonCodec().decode_object(o.sign_object);
            if (r.err) {
                return r;
            }
            sign_object = r.unwrap();
        }

        return Ok({
            common,
            sign_type: o.sign_type as VerifySignType,
            object,
            sign_object
        })
    }
}

export type CryptoVerifyObjectInputResponse = CryptoVerifyObjectOutputResponse;