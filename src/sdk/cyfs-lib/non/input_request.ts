import JSBI from "jsbi";
import { BuckyResult, ObjectId, Ok } from "../../cyfs-base";
import { RequestSourceInfo, SourceHelper } from "../access/source";
import { JsonCodec, JsonCodecHelper } from "../base/codec";
import { NONAPILevel, NONObjectInfo, NONObjectInfoJsonCodec, NONPutObjectResult } from "./def";

export interface NONInputRequestCommon {
    // 请求路径，可为空
    req_path?: string,

    // the request source info in bundle
    source: RequestSourceInfo,

    // api级别
    level: NONAPILevel,

    // 用以处理默认行为
    target?: ObjectId,

    flags: number,
}

export class NONInputRequestCommonJsonCodec extends JsonCodec<NONInputRequestCommon> {
    constructor() {super();}

    decode_object(o: any): BuckyResult<NONInputRequestCommon> {
        let dec_id;
        {
            if (o.dec_id) {
                const r = ObjectId.from_base_58(o.dec_id);
                if (r.err) {
                    return r;
                }
                dec_id = r.unwrap();
            }
            
        }

        const source = SourceHelper.obj_to_source(o.source);

        let target;
        {
            if (o.target) {
                const r = ObjectId.from_base_58(o.target);
                if (r.err) {
                    return r;
                }
                target = r.unwrap();
            }
            
        }

        return Ok( {
            req_path: o.req_path,

            source,

            // api级别
            level: o.level as NONAPILevel,

            // 用以处理默认行为
            target,

            flags: o.flags,
        })
    }
}

export interface NONGetObjectInputRequest {
    common: NONInputRequestCommon,

    object_id: ObjectId,

    // inner_path在dir情况下适用
    inner_path?: string,
}

export class NONGetObjectInputRequestJsonCodec extends JsonCodec<NONGetObjectInputRequest> {
    constructor() {super();}
    decode_object(o: any): BuckyResult<NONGetObjectInputRequest> {
        let common;
        {
            const r = new NONInputRequestCommonJsonCodec().decode_object(o.common)
            if (r.err) {
                return r;
            }
            common = r.unwrap();
        }

        let object_id;
        {
            const r = ObjectId.from_base_58(o.object_id);
            if (r.err) {
                return r;
            }
            object_id = r.unwrap();
        }

        return Ok({
            common,

            object_id,

            // inner_path在dir情况下适用
            inner_path: o.inner_path,
        })
    }
}

export interface NONGetObjectInputResponse {
    object_update_time?: JSBI,
    object_expires_time?: JSBI,

    object: NONObjectInfo,
}

export class NONGetObjectInputResponseJsonCodec extends JsonCodec<NONGetObjectInputResponse> {
    constructor() {super();}
    encode_object(param: NONGetObjectInputResponse): any {
        const o: any = {object: new NONObjectInfoJsonCodec().encode_object(param.object)}
        if (param.object_update_time) {
            o.object_update_time = param.object_update_time.toString();
        }
        if (param.object_expires_time) {
            o.object_expires_time = param.object_expires_time.toString();
        }
        return o;
    }
    decode_object(o: any): BuckyResult<NONGetObjectInputResponse> {
        let object;
        {
            const r = new NONObjectInfoJsonCodec().decode_object(o.object)
            if (r.err) {
                return r;
            }
            object = r.unwrap();
        }

        let object_update_time;
        {
            if (o.object_update_time) {
                const r = JsonCodecHelper.decode_big_int(o.object_update_time);
                if (r.err) {
                    return r;
                }
                object_update_time = r.unwrap();
            }
            
        }

        let object_expires_time;
        {
            if (o.object_expires_time) {
                const r = JsonCodecHelper.decode_big_int(o.object_expires_time);
                if (r.err) {
                    return r;
                }
                object_expires_time = r.unwrap();
            }
            
        }

        return Ok({
            object,
            object_update_time,
            object_expires_time,
        })
    }
}

export interface NONPutObjectInputRequest {
    common: NONInputRequestCommon,

    object: NONObjectInfo,
}

export class NONPutObjectInputRequestJsonCodec extends JsonCodec<NONPutObjectInputRequest> {
    constructor() {super();}
    encode_object(param: NONPutObjectInputRequest): any {
        return {
            common: new NONInputRequestCommonJsonCodec().encode_object(param.common),
            object: new NONObjectInfoJsonCodec().encode_object(param.object)
        };
    }
    decode_object(o: any): BuckyResult<NONPutObjectInputRequest> {
        let object;
        {
            const r = new NONObjectInfoJsonCodec().decode_object(o.object)
            if (r.err) {
                return r;
            }
            object = r.unwrap();
        }

        let common;
        {
            const r = new NONInputRequestCommonJsonCodec().decode_object(o.common);
                if (r.err) {
                    return r;
                }
                common = r.unwrap();
        }

        return Ok({
            object,
            common,
        })
    }
}

export interface NONPutObjectInputResponse {
    result: NONPutObjectResult,
    object_update_time?: JSBI,
    object_expires_time?: JSBI,
}

export class NONPutObjectInputResponseJsonCodec extends JsonCodec<NONPutObjectInputResponse> {
    constructor() {super();}
    encode_object(param: NONPutObjectInputResponse): any {
        const o: any = {result: param.result}
        if (param.object_update_time) {
            o.object_update_time = param.object_update_time.toString();
        }
        if (param.object_expires_time) {
            o.object_expires_time = param.object_expires_time.toString();
        }
        return o;
    }
    decode_object(o: any): BuckyResult<NONPutObjectInputResponse> {
        const result = o.result as NONPutObjectResult;

        let object_update_time;
        {
            if (o.object_update_time) {
                const r = JsonCodecHelper.decode_big_int(o.object_update_time);
                if (r.err) {
                    return r;
                }
                object_update_time = r.unwrap();
            }
            
        }

        let object_expires_time;
        {
            if (o.object_expires_time) {
                const r = JsonCodecHelper.decode_big_int(o.object_expires_time);
                if (r.err) {
                    return r;
                }
                object_expires_time = r.unwrap();
            }
            
        }

        return Ok({
            result,
            object_update_time,
            object_expires_time,
        })
    }
}

export interface NONPostObjectInputRequest {
    common: NONInputRequestCommon,

    object: NONObjectInfo,
}

export class NONPostObjectInputRequestJsonCodec extends JsonCodec<NONPostObjectInputRequest> {
    constructor() {super();}
    encode_object(param: NONPostObjectInputRequest): any {
        return {
            common: new NONInputRequestCommonJsonCodec().encode_object(param.common),
            object: new NONObjectInfoJsonCodec().encode_object(param.object)
        };
    }
    decode_object(o: any): BuckyResult<NONPostObjectInputRequest> {
        let object;
        {
            const r = new NONObjectInfoJsonCodec().decode_object(o.object)
            if (r.err) {
                return r;
            }
            object = r.unwrap();
        }

        let common;
        {
            const r = new NONInputRequestCommonJsonCodec().decode_object(o.common);
                if (r.err) {
                    return r;
                }
                common = r.unwrap();
        }

        return Ok({
            object,
            common,
        })
    }
}

export interface NONPostObjectInputResponse {
    object?: NONObjectInfo,
}

export class NONPostObjectInputResponseJsonCodec extends JsonCodec<NONPostObjectInputResponse> {
    constructor() {super();}
    encode_object(param: NONPostObjectInputResponse): any {
        let object;
        if (param.object) {
            object = new NONObjectInfoJsonCodec().encode_object(param.object)
        }

        return {
            object,
        };
    }
    decode_object(o: any): BuckyResult<NONPostObjectInputResponse> {
        let object;
        if (o.object) {
            const r = new NONObjectInfoJsonCodec().decode_object(o.object)
            if (r.err) {
                return r;
            }
            object = r.unwrap();
        }

        return Ok({
            object,
        })
    }
}

export interface NONDeleteObjectInputRequest {
    common: NONInputRequestCommon,

    object_id: ObjectId,

    inner_path?: string,
}

export class NONDeleteObjectInputRequestJsonCodec extends JsonCodec<NONDeleteObjectInputRequest> {
    constructor() {super();}
    encode_object(param: NONDeleteObjectInputRequest): any {
        return {
            common: new NONInputRequestCommonJsonCodec().encode_object(param.common),
            object_id: param.object_id.to_base_58(),
            inner_path: param.inner_path
        };
    }
    decode_object(o: any): BuckyResult<NONDeleteObjectInputRequest> {
        let common;
        {
            const r = new NONInputRequestCommonJsonCodec().decode_object(o.common);
            if (r.err) {
                return r;
            }
            common = r.unwrap();
        }

        let object_id;
        {
            const r = ObjectId.from_base_58(o.object_id);
            if (r.err) {
                return r;
            }
            object_id = r.unwrap();
        }

        return Ok({
            common,
            object_id,
            inner_path: o.inner_path
        })
    }
}

export interface NONDeleteObjectInputResponse {
    object?: NONObjectInfo,
}

export class NONDeleteObjectInputResponseJsonCodec extends JsonCodec<NONDeleteObjectInputResponse> {
    constructor() {super();}
    encode_object(param: NONDeleteObjectInputResponse): any {
        const o:any = {};
        if (param.object) {
            o.object = new NONObjectInfoJsonCodec().encode_object(param.object);
        }
        return o;
    }
    decode_object(o: any): BuckyResult<NONDeleteObjectInputResponse> {
        let object;
        {
            if (o.object) {
                const r = new NONObjectInfoJsonCodec().decode_object(o.object);
                if (r.err) {
                    return r;
                }
                object = r.unwrap();
            }
        }

        return Ok({
            object
        })
    }
}