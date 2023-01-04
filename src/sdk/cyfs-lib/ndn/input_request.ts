import JSBI from 'jsbi'
import { BuckyResult, Ok, ObjectId, Attributes, HashValue, ChunkId, BuckyError, BuckyErrorCode, Err, FileId } from "../../cyfs-base"
import { RequestSourceInfo, SourceHelper } from '../access/source'
import { JsonCodec, JsonCodecHelper } from "../base/codec"
import { NDNDataRequestRange, NDNDataResponseRange } from '../base/range'
import { FileDirRef } from '../trans/output_request'
import { NDNAPILevel, NDNDataRefererObject, NDNDataType, NDNPutDataResult } from "./def"

export interface NDNInputRequestCommon {
    // 请求路径，可为空
    req_path?: string,

    source: RequestSourceInfo,

    // api级别
    level: NDNAPILevel,

    // 需要处理数据的关联对象，主要用以chunk
    referer_object?: NDNDataRefererObject[],

    // 用以处理默认行为
    target?: ObjectId,

    flags: number,

    // input链的自定义数据
    user_data?: any,
}

export class NDNInputRequestCommonJsonCodec extends JsonCodec<NDNInputRequestCommon> {
    constructor(private user_data_codec?: JsonCodec<any>) { super() }
    encode_object(param: NDNInputRequestCommon): any {
        const o: any = {
            req_path: param.req_path,

            source: SourceHelper.source_to_obj(param.source),

            level: param.level,

            referer_object: [],

            target: param.target,

            flags: param.flags,
        }

        if (param.referer_object != null) {
            for (const object of param.referer_object) {
                o.referer_object.push(object.toString())
            }
        }

        if (param.user_data) {
            if (this.user_data_codec) {
                o.user_data = this.user_data_codec.encode_object(param.user_data);
            } else {
                o.user_data = param.user_data;
            }
        }

        return o
    }

    decode_object(o: any): BuckyResult<NDNInputRequestCommon> {
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

        let user_data;
        if (o.user_data) {
            if (this.user_data_codec) {
                const r = this.user_data_codec.decode_object(o.user_data);
                if (r.err) {
                    return r;
                }
                user_data = r.unwrap();
            } else {
                user_data = o.user_data;
            }
        }

        return Ok({
            req_path: o.req_path,
            source,
            level: o.level as NDNAPILevel,
            referer_object,
            target,
            flags: o.flags,
            user_data,
        })
    }
}

export interface NDNGetDataInputRequest {
    common: NDNInputRequestCommon,

    // 目前只支持ChunkId/FileId/DirId
    object_id: ObjectId,

    data_type: NDNDataType,

    // request data range
    range?: NDNDataRequestRange,

    // 对dir_id有效
    inner_path?: string,

    // get data from context instead of common.target
    context?: string,

    // get data task's group
    group?: string,
}

export class NDNGetDataInputRequestJsonCodec extends JsonCodec<NDNGetDataInputRequest> {
    constructor(private common_user_data_codec?: JsonCodec<any>) { super(); }
    encode_object(param: NDNGetDataInputRequest): any {
        const val: any = {
            common: new NDNInputRequestCommonJsonCodec(this.common_user_data_codec).encode_object(param.common),
            object_id: param.object_id.to_base_58(),
            data_type: param.data_type,
            inner_path: param.inner_path,
            context: param.context,
            group: param.group
        };
        if (param.range) {
            val.range = param.range.toString();
        }
        return val
    }
    decode_object(o: any): BuckyResult<NDNGetDataInputRequest> {
        const common = new NDNInputRequestCommonJsonCodec(this.common_user_data_codec).decode_object(o.common);
        if (common.err) {
            return common;
        }

        const id = ObjectId.from_base_58(o.object_id);
        if (id.err) {
            return id;
        }

        let range;
        if (o.range) {
            range = NDNDataRequestRange.new_unparsed(o.range);
        }

        return Ok({
            common: common.unwrap(),
            object_id: id.unwrap(),
            data_type: o.data_type,
            range,
            inner_path: o.inner_path,
            context: o.context,
            group: o.group
        })
    }
}

export interface NDNGetDataInputResponse {
    // chunk_id/file_id
    object_id: ObjectId,

    owner_id?: ObjectId,

    // 所属file的attr
    attr?: Attributes,

    range?: NDNDataResponseRange,

    // task group
    group?: string,

    length: number,
    // TODO: 这里在rust中是个Reader，在ts里应该是什么？
    data: Uint8Array,
}

export class NDNGetDataInputResponseJsonCodec extends JsonCodec<NDNGetDataInputResponse> {
    constructor() { super(); }
    encode_object(param: NDNGetDataInputResponse): any {
        const o: any = {
            object_id: param.object_id.to_base_58(),
            owner_id: param.owner_id?.to_base_58(),
            attr: param.attr?.flags,
            length: param.length,
            group: param.group,
            range: param.range?.toString()
        }
        return o;
    }
    decode_object(o: any): BuckyResult<NDNGetDataInputResponse> {
        const id = ObjectId.from_base_58(o.object_id);
        if (id.err) {
            return id;
        }
        // 现在事件不支持data的返回和修改
        const data = new Uint8Array()
        let attr;
        if (o.attr) {
            attr = new Attributes(o.attr);
        }

        let owner_id;
        if (o.owner_id) {
            const r = ObjectId.from_base_58(o.owner_id);
            if (r.err) {
                return r;
            }
            owner_id = r.unwrap()
        }
        let range;
        if (o.range) {
            const r = NDNDataResponseRange.from_json(o.range);
            if (r.err) {
                return r;
            }
            range = r.unwrap()
        }

        return Ok({
            object_id: id.unwrap(),
            owner_id,
            attr,
            range,
            length: o.length,
            data,
            group: o.group
        })
    }
}

// put_data，目前支持chunk
export interface NDNPutDataInputRequest {
    common: NDNInputRequestCommon,

    object_id: ObjectId,
    data_type: NDNDataType,

    length: number,
    // TODO: 这里在rust中是个Reader，在ts里应该是什么？
    data: Uint8Array,
}

export class NDNPutDataInputRequestJsonCodec extends JsonCodec<NDNPutDataInputRequest> {
    constructor(private common_user_data_codec?: JsonCodec<any>) { super(); }
    encode_object(param: NDNPutDataInputRequest): any {
        return {
            common: new NDNInputRequestCommonJsonCodec(this.common_user_data_codec).encode_object(param.common),
            object_id: param.object_id.to_base_58(),
            data_type: param.data_type,
            length: param.length,
            data: param.data.toHex()
        }
    }
    decode_object(o: any): BuckyResult<NDNPutDataInputRequest> {
        const common = new NDNInputRequestCommonJsonCodec(this.common_user_data_codec).decode_object(o.common);
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

        return Ok({
            common: common.unwrap(),
            object_id: id.unwrap(),
            data_type: o.data_type as NDNDataType,
            length: o.length,
            data: data.unwrap()
        })
    }
}

export interface NDNPutDataInputResponse {
    result: NDNPutDataResult,
}

export class NDNPutDataInputResponseJsonCodec extends JsonCodec<NDNPutDataInputResponse> { }

export interface NDNDeleteDataInputRequest {
    common: NDNInputRequestCommon,

    object_id: ObjectId,

    // 对dir_id有效
    inner_path?: string,
}

export class NDNDeleteDataInputRequestJsonCodec extends JsonCodec<NDNDeleteDataInputRequest> {
    constructor(private common_user_data_codec?: JsonCodec<any>) { super(); }
    encode_object(param: NDNDeleteDataInputRequest): any {
        return {
            common: new NDNInputRequestCommonJsonCodec(this.common_user_data_codec).encode_object(param.common),
            object_id: param.object_id.to_base_58(),
            inner_path: param.inner_path
        }
    }
    decode_object(o: any): BuckyResult<NDNDeleteDataInputRequest> {
        const common = new NDNInputRequestCommonJsonCodec(this.common_user_data_codec).decode_object(o.common);
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

export interface NDNDeleteDataInputResponse {
    object_id: ObjectId,
}

export class NDNDeleteDataInputResponseJsonCodec extends JsonCodec<NDNDeleteDataInputResponse> {
    constructor() { super(); }
    encode_object(param: NDNDeleteDataInputResponse): any {
        return {
            object_id: param.object_id.to_base_58()
        }
    }
    decode_object(o: any): BuckyResult<NDNDeleteDataInputResponse> {
        const id = ObjectId.from_base_58(o.object_id);
        if (id.err) {
            return id;
        }
        return Ok({
            object_id: id.unwrap()
        })
    }
}

// query flags for the return value optional fields
export const NDN_QUERY_FILE_REQUEST_FLAG_QUICK_HASN = 2;
export const NDN_QUERY_FILE_REQUEST_FLAG_REF_DIRS = 4;

export enum NDNQueryFileParamType {
    File = "file",
    Hash = "hash",
    QuickHash = "quick-hash",
    Chunk = "chunk",
}

export interface NDNQueryFileParam {
    type: NDNQueryFileParamType,
    // value: ObjectId | HashValue | string | ChunkId,
    file_id?: ObjectId,
    hash?: HashValue,
    quick_hash?: string,
    chunk_id?: ChunkId,
}

export function ndn_query_file_param_to_key_pair(param: NDNQueryFileParam): string[] {
    let value;
    if (param.type === NDNQueryFileParamType.File) {
        value = param.file_id!.to_string();
    } else if (param.type === NDNQueryFileParamType.Hash) {
        value = param.hash!.to_hex_string();
    } else if (param.type === NDNQueryFileParamType.QuickHash) {
        value = param.quick_hash!;
    } else if (param.type === NDNQueryFileParamType.Chunk) {
        value = param.chunk_id!.to_string();
    } else {
        throw new Error(`unknown NDNQueryFileParamType ${param.type}`);
    }

    return [param.type, value];
}


export class NDNQueryFileParamJsonCodec extends JsonCodec<NDNQueryFileParam> {
    constructor() {
        super();
    }
    encode_object(param: NDNQueryFileParam): any {
        const [t, v] = ndn_query_file_param_to_key_pair(param);
        return {
            type: t,
            value: v,
        }
    }
    decode_object(o: any): BuckyResult<NDNQueryFileParam> {
        const type = o.type as NDNQueryFileParamType;
        const ret: NDNQueryFileParam = {
            type,
        };

        if (type === NDNQueryFileParamType.File) {
            const r = ObjectId.from_base_58(o.value);
            if (r.err) {
                return r;
            }
            ret.file_id = r.unwrap();
        } else if (type === NDNQueryFileParamType.Hash) {
            const r = HashValue.from_hex_string(o.value);
            if (r.err) {
                return r;
            }
            ret.hash = r.unwrap();
        } else if (type === NDNQueryFileParamType.QuickHash) {
            ret.quick_hash = o.value as string;
        } else if (type === NDNQueryFileParamType.Chunk) {
            const r = ChunkId.from_base_58(o.value);
            if (r.err) {
                return r;
            }
            ret.chunk_id = r.unwrap();
        } else {
            const msg = `unknown NDNQueryFileParamType: ${type}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        return Ok(ret);
    }
}


export interface NDNQueryFileInputRequest {
    common: NDNInputRequestCommon,

    param: NDNQueryFileParam,
}

export interface NDNQueryFileInfo {
    file_id: FileId,

    hash: string,

    length: JSBI,

    flags: number,

    owner?: ObjectId,

    // 可选，关联的quickhash
    quick_hash?: string[],

    // 可选，关联的dirs
    ref_dirs?: FileDirRef[],
}

export interface NDNQueryFileInputResponse {
    list: NDNQueryFileInfo[],
}


export class NDNQueryFileInfoJsonCodec extends JsonCodec<NDNQueryFileInfo> {
    constructor() {
        super();
    }
    encode_object(param: NDNQueryFileInfo): any {
        const ret: any = {
            file_id: param.file_id.to_base_58(),
            hash: param.hash,
            length: param.length.toString(),
            flags: param.flags,
        };

        if (param.owner) {
            ret.owner = param.owner!.to_base_58();
        }

        if (param.quick_hash) {
            ret.quick_hash = JSON.stringify(param.quick_hash!);
        }

        return ret;
    }

    decode_object(o: any): BuckyResult<NDNQueryFileInfo> {

        let file_id;
        {
            const r = FileId.from_base_58(o.file_id);
            if (r.err) {
                return r;
            }
            file_id = r.unwrap();
        }

        const hash = o.hash as string;
        let length;
        {
            const r = JsonCodecHelper.decode_big_int(o.length);
            if (r.err) {
                return r;
            }
            length = r.unwrap();
        }

        let flags;
        {
            const r = JsonCodecHelper.decode_number(o.flags);
            if (r.err) {
                return r;
            }
            flags = r.unwrap();
        }

        let owner;
        if (o.owner) {
            const r = ObjectId.from_base_58(o.owner!);
            if (r.err) {
                return r;
            }
            owner = r.unwrap();
        }

        let quick_hash;
        if (o.quick_hash) {
            try {
                quick_hash = JSON.parse(o.quick_hash);
            } catch (error) {
                const msg = `invalid quick_hash json format! ${o.quick_hash}, error=${error.message}`;
                console.error(msg);
                return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
            }
        }

        let ref_dirs;
        if (o.ref_dirs) {
            try {
                ref_dirs = JSON.parse(o.ref_dirs);
            } catch (error) {
                const msg = `invalid ref_dirs json format! ${o.ref_dirs}, error=${error.message}`;
                console.error(msg);
                return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
            }
        }

        const ret: NDNQueryFileInfo = {
            file_id,
            hash,
            length,
            flags,
            owner,
            quick_hash,
            ref_dirs,
        };

        return Ok(ret);
    }
}

export class NDNQueryFileInputResponseJsonCodec extends JsonCodec<NDNQueryFileInputResponse> {
    constructor() {
        super();
    }
    encode_object(param: NDNQueryFileInputResponse): any {
        const list = [];
        const codec = new NDNQueryFileInfoJsonCodec();
        for (const item of param.list) {
            list.push(codec.encode_object(item));
        }

        return {
            list,
        };
    }

    decode_object(o: any): BuckyResult<NDNQueryFileInputResponse> {
        const list: NDNQueryFileInfo[] = [];
        const codec = new NDNQueryFileInfoJsonCodec();
        for (const item of o.list) {
            const ret = codec.decode_object(item);
            if (ret.err) {
                return ret;
            }

            list.push(ret.unwrap());
        }

        const r: NDNQueryFileInputResponse = {
            list,
        };

        return Ok(r);
    }
}