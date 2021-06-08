import { HttpRequest } from "./http_request";
import {
    CYFS_AUTHOR_ID, CYFS_CREATE_TIME,
    CYFS_FILTER_DEC_ID, CYFS_FILTER_FLAGS, CYFS_INSERT_TIME,
    CYFS_OBJ_TYPE,
    CYFS_OBJ_TYPE_CODE, CYFS_OBJECTS, CYFS_OWNER_ID, CYFS_PAGE_INDEX, CYFS_PAGE_SIZE, CYFS_UPDATE_TIME,
    AnyNamedObjectDecoder, AnyNamedObject,
    ObjectTypeCode,
} from "../../cyfs-base";
import { Option } from "../../cyfs-base";

export class SelectTimeRange {

    constructor(public begin?: bigint, public end?: bigint) {
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
}

export interface SelectFilter {
    obj_type?: number;
    obj_type_code?: ObjectTypeCode;
    dec_id?: string;
    owner_id?: string;
    author_id?: string;

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
            http_req.insert_header(CYFS_FILTER_DEC_ID, req.dec_id);
        }
        if (req.owner_id) {
            http_req.insert_header(CYFS_OWNER_ID, req.owner_id);
        }
        if (req.author_id) {
            http_req.insert_header(CYFS_AUTHOR_ID, req.author_id);
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
    object_raw: ArrayBuffer = new ArrayBuffer(1);

    constructor(public size: number, public insertTime: number) {
        //
    }


    public static decodeString(str: string): SelectResponseObjectInfo {
        const item: { size: number; insertTime: number } = JSON.parse(str);
        return new SelectResponseObjectInfo(item.size, item.insertTime);
    }

    public bind_object(buf: ArrayBuffer) {
        const r = new AnyNamedObjectDecoder().raw_decode(new Uint8Array(buf));
        if (r.err) {
            console.error("decode any named object from SelectResponseObjectInfo failed, err:{}", r.err);
            return;
        }

        const [obj, _buf] = r.unwrap();
        this.object = obj;
        this.object_raw = buf;
    }
}

export class SelectResponse {
    constructor(public objects: SelectResponseObjectInfo[] = []) {
    }


    public static async from_response(resp: Response): Promise<SelectResponse> {
        if (!resp.headers.has(CYFS_OBJECTS)) {
            console.error('not has CYFS_OBJECTS');
            return new SelectResponse();
        }

        const objects: SelectResponseObjectInfo[] = [];

        resp.headers.forEach((value, name) => {
            if (name === CYFS_OBJECTS) {
                const infos = JSON.parse(['[', value, ']'].join(''));
                for (const info of infos) {
                    info.size = parseInt(info.size, 10);
                    console.log("push cyfs_objects:", info);
                    const info_obj = SelectResponseObjectInfo.decodeString(JSON.stringify(info));
                    objects.push(info_obj);
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
            item.bind_object(allBuf.slice(pos, pos + item.size));
            pos += item.size;
        }
        return new SelectResponse(objects);
    }
}
