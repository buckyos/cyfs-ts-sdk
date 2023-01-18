import { ObjectId, Attributes, BuckyResult, DeviceId, Ok } from "../../cyfs-base"
import { JsonCodec } from "../base/codec"
import { NDNDataRequestRange, NDNDataResponseRange } from "../base/range";
import { NDNAPILevel, NDNDataRefererObject, NDNPutDataResult } from "./def"
import { NDNQueryFileInputResponse, NDNQueryFileInputResponseJsonCodec, NDNQueryFileParam, NDNQueryFileParamJsonCodec } from './input_request';

export interface NDNOutputRequestCommon {
    // 请求路径，可为空
    req_path?: string,

    // 来源DEC
    dec_id?: ObjectId,

    // api级别
    level: NDNAPILevel,

    // 用以处理默认行为
    target?: ObjectId,

    // 需要处理数据的关联对象，主要用以chunk/file等
    referer_object?: NDNDataRefererObject[],

    flags: number,
}

export class NDNOutputRequestCommonJsonCodec extends JsonCodec<NDNOutputRequestCommon> {
    constructor(){super()}

    decode_object(o: any): BuckyResult<NDNOutputRequestCommon> {
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

        const referer_object = [];
        if (o.referer_object != null) {
            for (const object of o.referer_object) {
                const r = NDNDataRefererObject.from_str(object);
                if (r.err) {
                    return r;
                }
                referer_object.push(r.unwrap());
            }
        }

        return Ok({
            req_path: o.req_path,
            dec_id,
            level: o.level as NDNAPILevel,
            referer_object,
            target,
            flags: o.flags,
        })
    }
}

export interface NDNPutDataOutputRequest {
    common: NDNOutputRequestCommon,

    object_id: ObjectId,

    length: number,
    data: Uint8Array,
}

export class NDNPutDataOutputRequestJsonCodec extends JsonCodec<NDNPutDataOutputRequest> {
    constructor() {super();}
    encode_object(param: NDNPutDataOutputRequest): any {
        return {
            common: new NDNOutputRequestCommonJsonCodec().encode_object(param.common),
            object_id: param.object_id.to_base_58(),
            length: param.length,
            data: param.data.toHex()
        }
    }
    decode_object(o: any): BuckyResult<NDNPutDataOutputRequest>{
        const common = new NDNOutputRequestCommonJsonCodec().decode_object(o.common);
        if (common.err) {
            return common;
        }

        const id = ObjectId.from_base_58(o.object_id);
        if (id.err) {
            return id;
        }
        const data = Uint8Array.prototype.fromHex(o.data);
        if (data.err) {
            return data;
        }

        return Ok( {
            common: common.unwrap(),
            object_id: id.unwrap(),
            length: o.length,
            data: data.unwrap()
        })
    }
}

export interface NDNPutDataOutputRequestWithBuffer {
    common: NDNOutputRequestCommon,

    object_id: ObjectId,
    data: Uint8Array,
}

export class NDNPutDataOutputRequestWithBufferJsonCodec extends JsonCodec<NDNPutDataOutputRequestWithBuffer> {
    constructor() {super();}
    encode_object(param: NDNPutDataOutputRequestWithBuffer): any {
        return {
            common: new NDNOutputRequestCommonJsonCodec().encode_object(param.common),
            object_id: param.object_id.to_base_58(),
            data: param.data.toHex()
        }
    }
    decode_object(o: any): BuckyResult<NDNPutDataOutputRequestWithBuffer>{
        const common = new NDNOutputRequestCommonJsonCodec().decode_object(o.common);
        if (common.err) {
            return common;
        }

        const id = ObjectId.from_base_58(o.object_id);
        if (id.err) {
            return id;
        }
        const data = Uint8Array.prototype.fromHex(o.data);
        if (data.err) {
            return data;
        }

        return Ok( {
            common: common.unwrap(),
            object_id: id.unwrap(),
            data: data.unwrap()
        })
    }
}

export interface NDNPutDataOutputResponse {
    result: NDNPutDataResult,
}

export class NDNPutDataOutputResponseJsonCodec extends JsonCodec<NDNPutDataOutputResponse> {}

/*
支持三种形式:
chunk_id
file_id
dir_id/inner_path
*/
export interface NDNGetDataOutputRequest {
    common: NDNOutputRequestCommon,

    // 目前只支持ChunkId/FileId/DirId
    object_id: ObjectId,

    // 对dir_id有效
    inner_path?: string,

    range?: NDNDataRequestRange
}

export class NDNGetDataOutputRequestJsonCodec extends JsonCodec<NDNGetDataOutputRequest> {
    constructor() {super();}
    encode_object(param: NDNGetDataOutputRequest): any {
        return {
            common: new NDNOutputRequestCommonJsonCodec().encode_object(param.common),
            object_id: param.object_id.to_base_58(),
            inner_path: param.inner_path,
        }
    }
    decode_object(o: any): BuckyResult<NDNGetDataOutputRequest>{
        const common = new NDNOutputRequestCommonJsonCodec().decode_object(o.common);
        if (common.err) {
            return common;
        }

        const id = ObjectId.from_base_58(o.object_id);
        if (id.err) {
            return id;
        }

        return Ok({
            common: common.unwrap(),
            object_id: id.unwrap(),
            inner_path: o.inner_path
        })
    }
}

export interface NDNGetDataOutputResponse {
    // chunk_id/file_id
    object_id: ObjectId,

    // file's owner
    owner_id?: ObjectId,

    // 所属file的attr
    attr?: Attributes,
    range?: NDNDataResponseRange,

    // content
    length: number,
    data?: Uint8Array,
    stream?: ReadableStream
}

export class NDNGetDataOutputResponseJsonCodec extends JsonCodec<NDNGetDataOutputResponse> {
    constructor() {super();}
    encode_object(param: NDNGetDataOutputResponse): any {
        const o:any = {
            object_id: param.object_id.to_base_58(),
            length: param.length,
            data: param.data?.toHex()
        }
        if (param.attr) {
            o.attr = param.attr.flags;
        }
        return o;
    }
    decode_object(o: any): BuckyResult<NDNGetDataOutputResponse>{
        const id = ObjectId.from_base_58(o.object_id);
        if (id.err) {
            return id;
        }
        const data = Uint8Array.prototype.fromHex(o.data);
        if (data.err) {
            return data;
        }
        let attr;
        if (o.attr) {
            attr = new Attributes(o.attr);
        }

        return Ok( {
            object_id: id.unwrap(),
            attr,
            length: o.length,
            data: data.unwrap()
        })
    }
}

export interface NDNDeleteDataOutputRequest {
    common: NDNOutputRequestCommon,

    object_id: ObjectId,

    // 对dir_id有效
    inner_path?: string,
}

export class NDNDeleteDataOutputRequestJsonCodec extends JsonCodec<NDNDeleteDataOutputRequest> {
    constructor() {super();}
    encode_object(param: NDNDeleteDataOutputRequest): any {
        return {
            common: new NDNOutputRequestCommonJsonCodec().encode_object(param.common),
            object_id: param.object_id.to_base_58(),
            inner_path: param.inner_path
        }
    }
    decode_object(o: any): BuckyResult<NDNDeleteDataOutputRequest>{
        const common = new NDNOutputRequestCommonJsonCodec().decode_object(o.common);
        if (common.err) {
            return common;
        }

        const id = ObjectId.from_base_58(o.object_id);
        if (id.err) {
            return id;
        }

        return Ok({
            common: common.unwrap(),
            object_id: id.unwrap(),
            inner_path: o.inner_path
        })
    }
}

export interface NDNDeleteDataOutputResponse {
    object_id: ObjectId,
}

export class NDNDeleteDataOutputResponseJsonCodec extends JsonCodec<NDNDeleteDataOutputResponse> {
    constructor() {super();}
    encode_object(param: NDNDeleteDataOutputResponse): any {
        return {
            object_id: param.object_id.to_base_58()
        }
    }
    decode_object(o: any): BuckyResult<NDNDeleteDataOutputResponse>{
        const id = ObjectId.from_base_58(o.object_id);
        if (id.err) {
            return id;
        }
        return Ok({
            object_id: id.unwrap()
        })
    }
}

export interface NDNQueryFileOutputRequest {
    common: NDNOutputRequestCommon,

    param: NDNQueryFileParam,
}


export class NDNQueryFileOutputRequestJsonCodec extends JsonCodec<NDNQueryFileOutputRequest> {
    constructor() {super();}
    encode_object(param: NDNQueryFileOutputRequest): any {
        return {
            common: new NDNOutputRequestCommonJsonCodec().encode_object(param.common),
            param: new NDNQueryFileParamJsonCodec().encode_object(param.param),
        }
    }
    decode_object(o: any): BuckyResult<NDNQueryFileOutputRequest>{
        const common = new NDNOutputRequestCommonJsonCodec().decode_object(o.common);
        if (common.err) {
            return common;
        }

        const param = new NDNQueryFileParamJsonCodec().decode_object(o.param);
        if (param.err) {
            return param;
        }

        return Ok({
            common: common.unwrap(),
            param: param.unwrap(),
        })
    }
}

export type NDNQueryFileOutputResponse = NDNQueryFileInputResponse;
export type NDNQueryFileOutputResponseJsonCodec = NDNQueryFileInputResponseJsonCodec;