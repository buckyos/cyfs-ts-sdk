import JSBI from "jsbi";
import { Attributes, BuckyResult, ObjectId, Ok } from "../../cyfs-base";
import { JsonCodec, JsonCodecHelper } from "../base/codec";
import { SelectFilter, SelectFilterJsonCodec, SelectOption, SelectOptionJsonCodec, SelectResponseObjectInfo, SelectResponseObjectInfoJsonCodec } from "../base/select_request";
import { NONAPILevel, NONObjectInfo, NONObjectInfoJsonCodec, NONPutObjectResult } from "./def";

export interface NONOutputRequestCommon {
    // 请求路径，可为空
    req_path?: string,

    // 来源DEC
    dec_id?: ObjectId,

    // api级别
    level: NONAPILevel,

    // 用以处理默认行为
    target?: ObjectId,

    flags: number,
}

export class NONOutputRequestCommonJsonCodec extends JsonCodec<NONOutputRequestCommon> {
    constructor() { super(); }

    decode_object(o: any): BuckyResult<NONOutputRequestCommon> {
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

        return Ok({
            req_path: o.req_path,

            // 来源DEC
            dec_id,

            // api级别
            level: o.level as NONAPILevel,

            // 用以处理默认行为
            target,

            flags: o.flags,
        })
    }
}

export interface NONPutObjectOutputRequest {
    common: NONOutputRequestCommon,

    object: NONObjectInfo,
}

export class NONPutObjectOutputRequestJsonCodec extends JsonCodec<NONPutObjectOutputRequest> {
    constructor() { super(); }
    encode_object(param: NONPutObjectOutputRequest): any {
        return {
            common: new NONOutputRequestCommonJsonCodec().encode_object(param.common),
            object: new NONObjectInfoJsonCodec().encode_object(param.object)
        };
    }
    decode_object(o: any): BuckyResult<NONPutObjectOutputRequest> {
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
            const r = new NONOutputRequestCommonJsonCodec().decode_object(o.common);
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

export interface NONPutObjectOutputResponse {
    result: NONPutObjectResult,
    object_update_time?: JSBI,
    object_expires_time?: JSBI,
}

export class NONPutObjectOutputResponseJsonCodec extends JsonCodec<NONPutObjectOutputResponse> {
    constructor() { super(); }
    encode_object(param: NONPutObjectOutputResponse): any {
        const o: any = { result: param.result }
        if (param.object_update_time) {
            o.object_update_time = param.object_update_time.toString();
        }
        if (param.object_expires_time) {
            o.object_expires_time = param.object_expires_time.toString();
        }
        return o;
    }
    decode_object(o: any): BuckyResult<NONPutObjectOutputResponse> {
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

export interface NONGetObjectOutputRequest {
    common: NONOutputRequestCommon,

    object_id: ObjectId,

    // inner_path在dir情况下适用
    inner_path?: string,
}

export class NONGetObjectOutputRequestJsonCodec extends JsonCodec<NONGetObjectOutputRequest> {
    constructor() { super(); }
    decode_object(o: any): BuckyResult<NONGetObjectOutputRequest> {
        let common;
        {
            const r = new NONOutputRequestCommonJsonCodec().decode_object(o.common)
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

export interface NONGetObjectOutputResponse {
    object_update_time?: JSBI,
    object_expires_time?: JSBI,

    object: NONObjectInfo,
    attr?: Attributes,
}

export class NONGetObjectOutputResponseJsonCodec extends JsonCodec<NONGetObjectOutputResponse> {
    constructor() { super(); }
    encode_object(param: NONGetObjectOutputResponse): any {
        const o: any = { object: new NONObjectInfoJsonCodec().encode_object(param.object) }
        if (param.object_update_time) {
            o.object_update_time = param.object_update_time.toString();
        }
        if (param.object_expires_time) {
            o.object_expires_time = param.object_expires_time.toString();
        }
        if (param.attr) {
            o.attr = param.attr.flags;
        }

        return o;
    }
    decode_object(o: any): BuckyResult<NONGetObjectOutputResponse> {
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

        let attr;
        {
            if (o.attr) {
                const r = JsonCodecHelper.decode_number(o.attr);
                if (r.err) {
                    return r;
                }
                attr = new Attributes(r.unwrap());
            }
        }

        return Ok({
            object,
            object_update_time,
            object_expires_time,
            attr,
        })
    }
}

export interface NONPostObjectOutputRequest {
    common: NONOutputRequestCommon,

    object: NONObjectInfo,
}

export class NONPostObjectOutputRequestJsonCodec extends JsonCodec<NONPostObjectOutputRequest> {
    constructor() { super(); }
    encode_object(param: NONPostObjectOutputRequest): any {
        return {
            common: new NONOutputRequestCommonJsonCodec().encode_object(param.common),
            object: new NONObjectInfoJsonCodec().encode_object(param.object)
        };
    }
    decode_object(o: any): BuckyResult<NONPostObjectOutputRequest> {
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
            const r = new NONOutputRequestCommonJsonCodec().decode_object(o.common);
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

export interface NONPostObjectOutputResponse {
    object?: NONObjectInfo,
}

export class NONPostObjectOutputResponseJsonCodec extends JsonCodec<NONPostObjectOutputResponse> {
    constructor() { super(); }
    encode_object(param: NONPostObjectOutputResponse): any {
        let object;
        if (param.object) {
            object = new NONObjectInfoJsonCodec().encode_object(param.object);
        }

        return {
            object,
        };
    }
    decode_object(o: any): BuckyResult<NONPostObjectOutputResponse> {
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

export interface NONSelectObjectOutputRequest {
    common: NONOutputRequestCommon,

    filter: SelectFilter,
    opt?: SelectOption,
}

export class NONSelectObjectOutputRequestJsonCodec extends JsonCodec<NONSelectObjectOutputRequest> {
    constructor() { super(); }
    encode_object(param: NONSelectObjectOutputRequest): any {
        let opt;
        if (param.opt) {
            opt = new SelectOptionJsonCodec().encode_object(param.opt);
        }
        return {
            common: new NONOutputRequestCommonJsonCodec().encode_object(param.common),
            filter: new SelectFilterJsonCodec().encode_object(param.filter),
            opt
        };
    }
    decode_object(o: any): BuckyResult<NONSelectObjectOutputRequest> {
        let common;
        {
            const r = new NONOutputRequestCommonJsonCodec().decode_object(o.common);
            if (r.err) {
                return r;
            }
            common = r.unwrap();
        }

        let filter;
        {
            const r = new SelectFilterJsonCodec().decode_object(o.filter);
            if (r.err) {
                return r;
            }
            filter = r.unwrap();
        }

        let opt;
        {
            if (o.opt) {
                const r = new SelectOptionJsonCodec().decode_object(o.opt);
                if (r.err) {
                    return r;
                }
                opt = r.unwrap();
            }
        }

        return Ok({
            common,
            filter,
            opt
        })
    }
}

export interface NONSelectObjectOutputResponse {
    objects: SelectResponseObjectInfo[],
}

export class NONSelectObjectOutputResponseJsonCodec extends JsonCodec<NONSelectObjectOutputResponse> {
    constructor() { super(); }
    encode_object(param: NONSelectObjectOutputResponse): any {
        const objects = [];
        for (const object of param.objects) {
            objects.push(new SelectResponseObjectInfoJsonCodec().encode_object(object))
        }
        return {
            objects,
        };
    }
    decode_object(o: any): BuckyResult<NONSelectObjectOutputResponse> {
        const objects = [];
        {
            for (const object of o.objects) {
                const r = new SelectResponseObjectInfoJsonCodec().decode_object(object);
                if (r.err) {
                    return r;
                }
                objects.push(r.unwrap());
            }
        }

        return Ok({
            objects
        })
    }
}

export interface NONDeleteObjectOutputRequest {
    common: NONOutputRequestCommon,

    object_id: ObjectId,

    inner_path?: string,
}

export class NONDeleteObjectOutputRequestJsonCodec extends JsonCodec<NONDeleteObjectOutputRequest> {
    constructor() { super(); }
    encode_object(param: NONDeleteObjectOutputRequest): any {
        return {
            common: new NONOutputRequestCommonJsonCodec().encode_object(param.common),
            object_id: param.object_id.to_base_58(),
            inner_path: param.inner_path
        };
    }
    decode_object(o: any): BuckyResult<NONDeleteObjectOutputRequest> {
        let common;
        {
            const r = new NONOutputRequestCommonJsonCodec().decode_object(o.common);
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

export interface NONDeleteObjectOutputResponse {
    object?: NONObjectInfo,
}

export class NONDeleteObjectOutputResponseJsonCodec extends JsonCodec<NONDeleteObjectOutputResponse> {
    constructor() { super(); }
    encode_object(param: NONDeleteObjectOutputResponse): any {
        const o: any = {};
        if (param.object) {
            o.object = new NONObjectInfoJsonCodec().encode_object(param.object);
        }
        return o;
    }
    decode_object(o: any): BuckyResult<NONDeleteObjectOutputResponse> {
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