import { HttpRequest } from "./http_request";
import {
    CYFS_AUTHOR_ID, CYFS_CREATE_TIME,
    CYFS_FILTER_DEC_ID, CYFS_FILTER_FLAGS, CYFS_INSERT_TIME,
    CYFS_OBJ_TYPE,
    CYFS_OBJ_TYPE_CODE, CYFS_OBJECTS, CYFS_OWNER_ID, CYFS_PAGE_INDEX, CYFS_PAGE_SIZE, CYFS_UPDATE_TIME,
    AnyNamedObjectDecoder, AnyNamedObject,
    ObjectTypeCode,
    ObjectId,
    BuckyResult,
    BuckyErrorCode,
    BuckyError,
    Err,
    Ok,
} from "../../cyfs-base";
import { Option } from "../../cyfs-base";
import { JsonCodec, JsonCodecHelper } from './codec';
import JSBI from 'jsbi';


export class SelectTimeRange {
    constructor(public begin?: JSBI, public end?: JSBI) {
    }

    toString() {
        if (this.begin && this.end) {
            return `${this.begin}:${this.end}`;
        } else if (this.begin) {
            return `${this.begin}:`;
        } else if (this.end) {
            return `:${this.end}`
        } else {
            return `:`;
        }
    }

    public static fromString(s: string): BuckyResult<SelectTimeRange> {
        const parts = s.split(':');
        if (parts.length !== 2) {
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid select_time_range format: ${s}`));
        }

        let begin: JSBI | undefined;
        let end: JSBI | undefined;

        {
            const part = parts[0].trim();
            if (part.length > 0) {
                const ret = JsonCodecHelper.decode_big_int(part);
                if (ret.err) {
                    return ret;
                }

                begin = ret.unwrap();
            }
        }

        {
            const part = parts[1].trim();
            if (part.length > 0) {
                const ret = JsonCodecHelper.decode_big_int(part);
                if (ret.err) {
                    return ret;
                }

                end = ret.unwrap();
            }
        }

        const resp: SelectTimeRange = {
            begin,
            end,
        };

        return Ok(resp);
    }
}

export interface SelectFilter {
    obj_type?: number;
    obj_type_code?: ObjectTypeCode;
    dec_id?: ObjectId;
    owner_id?: ObjectId;
    author_id?: ObjectId;

    create_time?: SelectTimeRange;
    update_time?: SelectTimeRange;
    insert_time?: SelectTimeRange;

    flags?: number;
}

export class SelectOption {
    page_size = 32;
    page_index = 0;
}

export class SelectEncoder {
    constructor(private serviceURL: string) {
    }

    encode_select_request(req: SelectFilter, opt: Option<SelectOption>): HttpRequest {
        const http_req = new HttpRequest('GET', this.serviceURL);

        if (req.obj_type) {
            http_req.insert_header(CYFS_OBJ_TYPE, req.obj_type.toString());
        }
        if (req.obj_type_code) {
            http_req.insert_header(CYFS_OBJ_TYPE_CODE, req.obj_type_code.toString());
        }
        if (req.dec_id) {
            http_req.insert_header(CYFS_FILTER_DEC_ID, req.dec_id.to_base_58());
        }
        if (req.owner_id) {
            http_req.insert_header(CYFS_OWNER_ID, req.owner_id.to_base_58());
        }
        if (req.author_id) {
            http_req.insert_header(CYFS_AUTHOR_ID, req.author_id.to_base_58());
        }
        if (req.create_time) {
            http_req.insert_header(CYFS_CREATE_TIME, req.create_time.toString());
        }
        if (req.update_time) {
            http_req.insert_header(CYFS_UPDATE_TIME, req.update_time.toString());
        }
        if (req.insert_time) {
            http_req.insert_header(CYFS_INSERT_TIME, req.insert_time.toString());
            console.log('req.insert_time', req.insert_time);
        } else {
            console.log('req.insert_time failed', req.insert_time);
        }

        if (req.flags) {
            http_req.insert_header(CYFS_FILTER_FLAGS, req.flags.toString());
        }

        if (opt && opt.is_some()) {
            http_req.insert_header(CYFS_PAGE_SIZE, opt.unwrap().page_size.toString());
            http_req.insert_header(CYFS_PAGE_INDEX, opt.unwrap().page_index.toString());
        }

        return http_req;
    }
}

export class SelectResponseObjectInfo {
    object?: AnyNamedObject;
    object_raw?: Uint8Array;

    constructor(public size: number, public insert_time: JSBI) {
        //
    }


    public static decode_meta_info(o: any): BuckyResult<SelectResponseObjectInfo> {
        let size: number;
        let insert_time: JSBI;

        {
            const ret = JsonCodecHelper.decode_number(o.size);
            if (ret.err) {
                return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid size filed: ${o.size}`));
            }
            size = ret.unwrap();
        }

        {
            const ret = JsonCodecHelper.decode_big_int(o.insert_time);
            if (ret.err) {
                return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid insert_time filed: ${o.size}`));
            }
            insert_time = ret.unwrap();
        }

        const result = new SelectResponseObjectInfo(size, insert_time);
        return Ok(result);
    }

    public bind_object(buf: Uint8Array): BuckyResult<void> {
        const r = new AnyNamedObjectDecoder().raw_decode(buf);
        if (r.err) {
            console.error("decode any named object from SelectResponseObjectInfo failed, err:", r.val);
            console.error("error object hex:", buf.toHex())
            return r;
        }

        const [obj, _buf] = r.unwrap();
        this.object = obj;
        this.object_raw = buf;

        return Ok(void (0));
    }
}

export class SelectResponse {
    constructor(public objects: SelectResponseObjectInfo[] = []) {
    }


    public static async from_response(resp: Response): Promise<BuckyResult<SelectResponse>> {
        if (!resp.headers.has(CYFS_OBJECTS)) {
            console.error('not has CYFS_OBJECTS');
            return Ok(new SelectResponse());
        }

        const objects: SelectResponseObjectInfo[] = [];

        resp.headers.forEach((value, name) => {
            if (name === CYFS_OBJECTS) {
                const infos = JSON.parse(['[', value, ']'].join(''));
                console.log("cyfs_objects:", infos);

                for (const info of infos) {
                    const ret = SelectResponseObjectInfo.decode_meta_info(info);
                    if (ret.err) {
                        return ret;
                    }

                    objects.push(ret.unwrap());
                }
            }
        });

        const allBuf = await resp.arrayBuffer();

        console.info(`recv select all_buf: len=${allBuf.byteLength} ${allBuf.toString()}`);
        let pos = 0;
        for (const item of objects) {
            if (item.size === 0) {
                continue;
            }
            console.log("bind_object:", item);
            const ret = item.bind_object(new Uint8Array(allBuf.slice(pos, pos + item.size)));
            if (ret.err) {
                return ret;
            }

            pos += item.size;
        }

        return Ok(new SelectResponse(objects));
    }
}

export class SelectTimeRangeJsonCodec extends JsonCodec<SelectTimeRange> {
    public encode_object(param: SelectTimeRange): any {
        const o: any = {};

        if (param.begin != null) {
            o.begin = o.begin.toString();
        }
        if (param.end != null) {
            o.end = o.end.toString();
        }

        return o;
    }

    public decode_object(o: any): BuckyResult<SelectTimeRange> {
        let begin: JSBI | undefined;
        let end: JSBI | undefined;

        if (o.begin != null) {
            const ret = JsonCodecHelper.decode_big_int(o.begin);
            if (ret.err) {
                return ret;
            }

            begin = ret.unwrap();
        }
        if (o.end != null) {
            const ret = JsonCodecHelper.decode_big_int(o.end);
            if (ret.err) {
                return ret;
            }

            end = ret.unwrap();
        }

        const resp: SelectTimeRange = {
            begin,
            end,
        };

        return Ok(resp);
    }
}

export class SelectFilterJsonCodec extends JsonCodec<SelectFilter> {
    time_range_codec: SelectTimeRangeJsonCodec;

    constructor() {
        super();
        this.time_range_codec = new SelectTimeRangeJsonCodec();
    }

    public encode_object(param: SelectFilter): any {
        const o: any = {
            flags: param.flags,
        };

        if (param.obj_type != null) {
            o.obj_type = param.obj_type;
        }
        if (param.obj_type_code != null) {
            o.obj_type_code = param.obj_type_code as number;
        }

        if (param.dec_id != null) {
            o.dec_id = param.dec_id.to_base_58();
        }
        if (param.owner_id != null) {
            o.owner_id = param.owner_id.to_base_58();
        }
        if (param.author_id != null) {
            o.author_id = param.author_id.to_base_58();
        }

        if (param.create_time) {
            o.create_time = this.time_range_codec.encode_object(param.create_time);
        }
        if (param.update_time) {
            o.update_time = this.time_range_codec.encode_object(param.update_time);
        }
        if (param.insert_time) {
            o.insert_time = this.time_range_codec.encode_object(param.insert_time);
        }

        return o;
    };


    public decode_object(o: any): BuckyResult<SelectFilter> {
        let obj_type: number | undefined;
        let obj_type_code: ObjectTypeCode | undefined;
        let dec_id: ObjectId | undefined;
        let owner_id: ObjectId | undefined;
        let author_id: ObjectId | undefined;
        let create_time: SelectTimeRange | undefined;
        let update_time: SelectTimeRange | undefined;
        let insert_time: SelectTimeRange | undefined;
        let flags: number | undefined;

        if (o.obj_type != null) {
            const ret = JsonCodecHelper.decode_number(o.obj_type);
            if (ret.err) {
                return ret;
            }

            obj_type = ret.unwrap();
        }

        if (o.obj_type_code != null) {
            obj_type_code = o.obj_type_code as ObjectTypeCode;
        }

        if (o.dec_id) {
            const ret = ObjectId.from_base_58(o.dec_id);
            if (ret.err) {
                return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid dec_id filed: ${o.dec_id}`));
            }
            dec_id = ret.unwrap();
        }
        if (o.owner_id) {
            const ret = ObjectId.from_base_58(o.owner_id);
            if (ret.err) {
                return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid owner_id filed: ${o.owner_id}`));
            }
            owner_id = ret.unwrap();
        }
        if (o.author_id) {
            const ret = ObjectId.from_base_58(o.author_id);
            if (ret.err) {
                return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid author_id filed: ${o.author_id}`));
            }
            author_id = ret.unwrap();
        }

        if (o.create_time != null) {
            const ret = this.time_range_codec.decode_object(o.create_time);
            if (ret.err) {
                return ret;
            }

            create_time = ret.unwrap();
        }
        if (o.update_time != null) {
            const ret = this.time_range_codec.decode_object(o.update_time);
            if (ret.err) {
                return ret;
            }

            update_time = ret.unwrap();
        }
        if (o.insert_time != null) {
            const ret = this.time_range_codec.decode_object(o.insert_time);
            if (ret.err) {
                return ret;
            }

            insert_time = ret.unwrap();
        }

        if (o.flags != null) {
            const ret = JsonCodecHelper.decode_number(o.flags);
            if (ret.err) {
                return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid flags filed: ${o.flags}`));
            }
            flags = ret.unwrap();
        }

        const resp: SelectFilter = {
            obj_type,
            obj_type_code,

            dec_id,
            owner_id,
            author_id,

            create_time,
            update_time,
            insert_time,

            flags,
        };

        return Ok(resp);
    }
}

// 标准的json对象，不需要额外编解码
export class SelectOptionJsonCodec extends JsonCodec<SelectOption> { }

export class SelectResponseObjectInfoJsonCodec extends JsonCodec<SelectResponseObjectInfo> {
    public encode_object(param: SelectResponseObjectInfo): any {
        const o: any = {
            size: param.size,
            insert_time: param.insert_time.toString(),
        };

        if (param.object_raw != null) {
            o.object_raw = Buffer.from(param.object_raw).toString('hex');
        }

        return o;
    }

    public decode_object(o: any): BuckyResult<SelectResponseObjectInfo> {
        let result: SelectResponseObjectInfo;

        {
            const ret = SelectResponseObjectInfo.decode_meta_info(o);
            if (ret.err) {
                return ret;
            }

            result = ret.unwrap();
        }

        if (o.object_raw != null) {
            const ret = JsonCodecHelper.decode_hex_to_buffer(o.object_raw);
            if (ret.err) {
                return ret;
            }

            const buf = ret.unwrap();
            const bind_ret = result.bind_object(buf);
            if (bind_ret.err) {
                return bind_ret;
            }
        }

        return Ok(result);
    }
}

export class SelectOptionCodec {
    static encode(req: HttpRequest, opt?:SelectOption) {
        if (opt) {
            req.insert_header(CYFS_PAGE_SIZE, opt.page_size.toString());
            req.insert_header(CYFS_PAGE_INDEX, opt.page_index.toString());
        }
    }
}

export class SelectFilterUrlCodec {
    static encode(url: string, filter: &SelectFilter): string {
        const querys = new URLSearchParams();
        if (filter.obj_type) {
            querys.append("obj-type", filter.obj_type.toString())
        }
        if (filter.obj_type_code) {
            querys.append("obj-type-code", filter.obj_type_code.toString())
        }
        if (filter.dec_id) {
            querys.append("dec-id", filter.dec_id.toString())
        }
        if (filter.owner_id) {
            querys.append("owner-id", filter.owner_id.toString())
        }
        if (filter.author_id) {
            querys.append("author-id", filter.author_id.toString())
        }
        if (filter.create_time) {
            querys.append("create-time", filter.create_time.toString())
        }
        if (filter.update_time) {
            querys.append("update-time", filter.update_time.toString())
        }
        if (filter.insert_time) {
            querys.append("insert-time", filter.insert_time.toString())
        }
        if (filter.flags) {
            querys.append("flags", filter.flags.toString())
        }

        return url + "?" + querys.toString();
    }
}