import {HttpRequestor, RequestorHelper} from "../base/base_requestor";
import {HttpRequest} from "../base/http_request";
import {
    ChunkId,
    CYFS_CHUNK_EXIST,
    CYFS_CHUNK_STATE,
    CYFS_TIMEOUT
} from "../../cyfs-base";
import {Err, Ok} from "ts-results";
import {BuckyError, BuckyResult, None, Option, Some} from "../../cyfs-base";
import {DeviceId} from "../../cyfs-base/objects/device";

export interface NDNGetChunkRequest {
    chunk_id: ChunkId
}

export interface NDNPutChunkRequest {
    chunk_id: ChunkId;
    chunk_raw: Uint8Array;
}

export interface NDNInterestChunkRequest {
    chunk_id: ChunkId;
    device_list?: DeviceId[];
}

export interface NDNExistChunkRequest {
    chunk_id: ChunkId;
    device?: DeviceId;
}

export interface NDNWatchChunkRequest {
    chunk_id: ChunkId;
    device?: DeviceId;
    timeout_millis: number;
}

export class NDNInterestChunkResponse {
    constructor(public state: ChunkState = ChunkState.NotFound) {

    }

    public static async from_response(resp: Response): Promise<BuckyResult<NDNInterestChunkResponse>> {
        const state = RequestorHelper.decode_optional_header<number>(resp, CYFS_CHUNK_STATE, s => {
            return parseInt(s, 10);
        }).unwrap();
        if (state.is_none()) {
            const msg = `chunk_state header not found: ${resp.headers}`;
            console.error(msg);
            return Err(BuckyError.from(msg));
        }

        return Ok(new NDNInterestChunkResponse(state.unwrap()));
    }
}

export class NDNWatchChunkResponse {
    constructor(public state: ChunkState = ChunkState.NotFound) {

    }

    public static async from_response(resp: Response): Promise<BuckyResult<NDNInterestChunkResponse>> {
        const state = RequestorHelper.decode_optional_header<number>(resp, CYFS_CHUNK_STATE, s => {
            return parseInt(s, 10);
        }).unwrap();
        if (state.is_none()) {
            const msg = `chunk_state header not found: ${resp.headers}`;
            console.error(msg);
            return Err(BuckyError.from(msg));
        }

        return Ok(new NDNWatchChunkResponse(state.unwrap()));
    }
}

export class NDNExistChunkResponse {
    constructor(public state: ChunkState = ChunkState.NotFound, public exist = false) {
    }

    public static async from_response(resp: Response): Promise<BuckyResult<NDNExistChunkResponse>> {
        const exist = RequestorHelper.decode_optional_header<boolean>(resp, CYFS_CHUNK_EXIST, s => {
            return true;
        }).unwrap();

        if (exist.is_none()) {
            const msg = `exist header not found: ${resp.headers}`;
            console.error(msg);
            return Err(BuckyError.from(msg));
        }

        const state = RequestorHelper.decode_optional_header(resp, CYFS_CHUNK_STATE, s => {
            return parseInt(s, 10);
        }).unwrap();

        if (state.is_none()) {
            const msg = `chunk_state header not found: ${resp.headers}`;
            console.error(msg);
            return Err(BuckyError.from(msg));
        }

        return Ok(new NDNExistChunkResponse(state.unwrap(), exist.unwrap()));
    }
}

enum ChunkState{
    NotFound = 0,  // 不存在
    New = 1,       // 新加入
    Pending = 2,   // 准备中
    Ready = 3,     // 就绪
    Ignore = 4     // 被忽略
}

export class NDNGetChunkResponse {

    constructor(private state: ChunkState = ChunkState.NotFound,
                private length: number = 0,
                public chunk: Option<Uint8Array> = Some(new Uint8Array())) {
    }

    public static async from_respone(resp: Response): Promise<BuckyResult<NDNGetChunkResponse>> {
        const state = RequestorHelper.decode_optional_header<number>(resp, CYFS_CHUNK_STATE, (s) => {
            return parseInt(s, 10);
        }).unwrap();
        if (state.is_none()) {
            const msg = `chunk_state header not found: ${resp.headers}`;
            console.error(msg);
            return Err(BuckyError.from(msg));
        }

        const get_resp = new NDNGetChunkResponse(state.unwrap(), 0, None);
        if (state.unwrap() === ChunkState.Ready) {
            get_resp.chunk = Some(new Uint8Array(await resp.arrayBuffer()));
        }

        return Ok(get_resp);
    }
}

export class NDNRequestor {
    service_url: string;
    constructor(private requestor: HttpRequestor) {
        this.service_url = `http://${requestor.remote_addr()}/ndn/`;
    }

    format_url(func: Option<string>, chunk_id: ChunkId): string {
        let url = `${this.service_url}chunk/`;
        if (func.is_some()) {
            url = `${url}${func}/`;
        }

        return `${url}${chunk_id.to_base_58()}`;
    }

    encode_get_request(req: NDNGetChunkRequest): HttpRequest {
        const url = this.format_url(None, req.chunk_id);
        return new HttpRequest('GET', url);
    }

    encode_put_request(req: NDNPutChunkRequest): HttpRequest {
        const url = this.format_url(None, req.chunk_id);
        const http_req = new HttpRequest('POST', url);
        http_req.set_body(req.chunk_raw);
        return http_req;
    }

    encode_interest_request(req: NDNInterestChunkRequest): HttpRequest {
        const url = this.format_url(Some("interest"), req.chunk_id);
        const http_req = new HttpRequest('POST', url);
        if (req.device_list) {
            RequestorHelper.insert_device_list_header(http_req, req.device_list);
        }
        return http_req;
    }

    encode_exist_request(req: NDNExistChunkRequest): HttpRequest {
        const url = this.format_url(Some("exist"), req.chunk_id);
        const http_req = new HttpRequest('GET', url);
        if (req.device) {
            RequestorHelper.insert_device_list_header(http_req, [req.device]);
        }
        return http_req;
    }

    encode_watch_request(req: NDNWatchChunkRequest) {
        const url = this.format_url(Some("watch"), req.chunk_id);
        const http_req = new HttpRequest('GET', url);
        if (req.device) {
            RequestorHelper.insert_device_list_header(http_req, [req.device]);
        }
        http_req.insert_header(CYFS_TIMEOUT, req.timeout_millis.toString());
        return http_req;
    }

    public async get_chunk(req: NDNGetChunkRequest): Promise<BuckyResult<NDNGetChunkResponse>> {
        const http_req = this.encode_get_request(req);
        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            console.log(`get chunk from cyfs success: ${req.chunk_id}`);
            return NDNGetChunkResponse.from_respone(resp);
        } else {
            const msg = `get chunk from ndn cyfs failed: ${req.chunk_id} status=${resp.status} msg=${await resp.text()}`;
            console.error(msg);
            return Err(BuckyError.from(msg));
        }
    }

    public async put_chunk(req: NDNPutChunkRequest): Promise<BuckyResult<null>> {
        const http_req = this.encode_put_request(req);
        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            console.log(`put chunk to cyfs success: ${req.chunk_id}`);
            return Ok(null);
        } else {
            const msg = `put chunk to ndn cyfs failed: ${req.chunk_id} status=${resp.status} msg=${await resp.text()}`;
            console.error(msg);

            return Err(BuckyError.from(msg));
        }
    }

    public async interest_chunk(req: NDNInterestChunkRequest): Promise<BuckyResult<NDNInterestChunkResponse>> {
        const http_req = this.encode_interest_request(req);
        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            console.log(`interest chunk to cyfs success: ${req.chunk_id}`);
            return NDNInterestChunkResponse.from_response(resp);
        } else {
            const msg = `interest chunk to cyfs failed: ${req.chunk_id} status=${resp.status} msg=${await resp.text()}`;
            console.error(msg);

            return Err(BuckyError.from(msg));
        }
    }

    public async exist_chunk(req: NDNExistChunkRequest): Promise<BuckyResult<NDNExistChunkResponse>> {
        const http_req = this.encode_exist_request(req);
        const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            console.log(`exist chunk from cyfs success: ${req.chunk_id}`);
            return NDNExistChunkResponse.from_response(resp);
        } else {
            const msg = `exist chunk from cyfs failed: ${req.chunk_id} status=${resp.status} msg=${await resp.text()}`;
            console.log(msg);
            return Err(BuckyError.from(msg));
        }
    }

    public async watch_chunk(req: NDNWatchChunkRequest): Promise<BuckyResult<NDNWatchChunkResponse>> {
        const http_req = this.encode_watch_request(req);
         const ret = await this.requestor.request(http_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();
        
        if (resp.status === 200) {
            console.log(`watch chunk from cyfs success: ${req.chunk_id}`);
            return NDNWatchChunkResponse.from_response(resp);
        } else {
            const msg = `watch chunk from cyfs failed: ${req.chunk_id} status=${resp.status} msg=${await resp.text()}`;
            console.error(msg);

            return Err(BuckyError.from(msg));
        }
    }
}