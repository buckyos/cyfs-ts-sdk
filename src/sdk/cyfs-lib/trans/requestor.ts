import {HttpRequest} from "../base/http_request";
import {BaseRequestor} from "../base/base_requestor";
import {Err, Ok} from "ts-results";
import {BuckyError, BuckyResult, CYFS_API_LEVEL, CYFS_DEC_ID, CYFS_FLAGS, CYFS_REFERER_OBJECT, CYFS_REQ_PATH, CYFS_TARGET, ObjectId} from "../../cyfs-base";
import {
    TransAddFileResponse,
    TransControlTaskRequest,
    TransCreateTaskRequest, TransCreateTaskResponse,
    TransGetContextRequest,
    TransGetTaskStateRequest,
    TransPublishFileRequest,
    TransPutContextRequest, TransQueryTaskResponse, TransQueryTasksRequest,
    TransTaskControlAction,
    TransTaskRequest,
    TransTaskStateInfo
} from './request';
import {TransContext, TransContextDecoder} from "../../cyfs-core/trans/trans_context";
import { NDNOutputRequestCommon } from '../ndn/output_request';


export class TransRequestor {
    serviceURL: string;

    constructor(private requestor: BaseRequestor, private dec_id?: ObjectId) {
        this.serviceURL = `http://${requestor.remote_addr()}/trans/`;
    }

    encode_common_headers(
        com_req: NDNOutputRequestCommon,
        http_req: HttpRequest,
    ): void {
        if (com_req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, com_req.dec_id.to_string());
        } else if (this.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, this.dec_id.to_string());
        }

        if (com_req.req_path) {
            http_req.insert_header(CYFS_REQ_PATH, encodeURI(com_req.req_path))
        }

        http_req.insert_header(CYFS_API_LEVEL, com_req.level);

        if (com_req.target) {
            http_req.insert_header(CYFS_TARGET, com_req.target.to_string());
        }

        if (com_req.referer_object != null && com_req.referer_object.length > 0) {
            const headers = [];
            for (const object of com_req.referer_object) {
                headers.push(object.toString());
            }
            // 根据RFC 2616，在一个header里传多个值，应该用逗号分隔。没有找到rust http-types里对header进行编码的实际代码
            http_req.insert_header(CYFS_REFERER_OBJECT, headers.join(","))
        }

        http_req.insert_header(CYFS_FLAGS, com_req.flags.toString());
    }

    // POST {serviceURL}/trans/get_context
    public async get_context(req: TransGetContextRequest): Promise<BuckyResult<TransContext>> {
        const url = `${this.serviceURL}get_context`;
        console.log('will get context', url, req);
        const httpReq = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, httpReq);
        httpReq.set_json_body({
            context_name: req.context_name
        });

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            return new TransContextDecoder().from_hex(await resp.text());
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`get context failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // POST {serviceURL}/trans/put_context
    public async put_context(req: TransPutContextRequest): Promise<BuckyResult<null>> {
        const url = `${this.serviceURL}put_context`;
        console.log('will put context', url, req);
        const httpReq = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, httpReq);
        httpReq.set_json_body( {
            context: req.context.to_hex().unwrap()
        });

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            return Ok(null);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`put context failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // POST {serviceURL}/trans/task
    public async create_task(req: TransCreateTaskRequest): Promise<BuckyResult<TransCreateTaskResponse>> {
        const url = `${this.serviceURL}task`;
        console.log('will start trans task', url, req);
        const httpReq = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, httpReq);
        httpReq.set_json_body({
            object_id: req.object_id,

            // 保存到的本地目录or文件
            local_path: req.local_path,

            // 源设备(hub)列表
            device_list: req.device_list,
            context_id: req.context_id,
            auto_start: req.auto_start,
        });

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            return await TransCreateTaskResponse.from_response(resp);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`start_task to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // PUT {serviceURL}/trans/task
    public async start_task(req: TransTaskRequest): Promise<BuckyResult<null>> {
        const url = `${this.serviceURL}task`;
        console.log('will start trans task', url, req);
        const control_req: TransControlTaskRequest = {
            common: req.common,
            task_id: req.task_id,
            action: TransTaskControlAction.Start
        };

        return await this.control_task(control_req);
    }

    // PUT {serviceURL}/trans/task
    public async stop_task(req: TransTaskRequest): Promise<BuckyResult<null>> {
        const url = `${this.serviceURL}task`;
        console.log('will stop trans task', url, req);
        const control_req: TransControlTaskRequest = {
            common: req.common,
            task_id: req.task_id,
            action: TransTaskControlAction.Stop
        };

        return await this.control_task(control_req);
    }

    // PUT {serviceURL}/trans/task
    public async delete_task(req: TransTaskRequest): Promise<BuckyResult<null>> {
        const url = `${this.serviceURL}task`;
        console.log('will start trans task', url, req);
        const control_req: TransControlTaskRequest = {
            common: req.common,
            task_id: req.task_id,
            action: TransTaskControlAction.Delete
        };

        return await this.control_task(control_req);
    }

    // DELETE {serviceURL}/task
    async control_task(req: TransControlTaskRequest): Promise<BuckyResult<null>> {

        const url = `${this.serviceURL}task`;
        console.log('will control trans task: ', url, req);

        const httpReq = new HttpRequest('PUT', url);
        this.encode_common_headers(req.common, httpReq);
        httpReq.set_json_body({
            task_id: req.task_id,
            action: req.action
        });

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            return Ok(null);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`control_task to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // GET {serviceURL}/task/state
    public async get_task_state(req: TransGetTaskStateRequest): Promise<BuckyResult<TransTaskStateInfo>> {
        const url = `${this.serviceURL}task/state`;
        console.log('will get trans task state: ', url, req);

        const httpReq = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, httpReq);
        httpReq.set_json_body({
            task_id: req.task_id
        });

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            return await TransTaskStateInfo.from_respone(resp);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`get_task_state to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    public async query_tasks(req: TransQueryTasksRequest): Promise<BuckyResult<TransQueryTaskResponse>> {
        const url = `${this.serviceURL}query`;
        console.log('will query task: ', url, req);

        const httpReq = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, httpReq);
        const body: any = {
            context_id: req.context_id,
            task_status: req.task_status,
        }
        if (req.range) {
            body.offset = req.range[0]
            body.length = req.range[1]
        }
        httpReq.set_json_body(body);

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            return await TransQueryTaskResponse.from_response(resp);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`get_task_state to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // POST {serviceURL}/task/file
    public async publish_file(req: &TransPublishFileRequest): Promise<BuckyResult<TransAddFileResponse>> {
        const url = `${this.serviceURL}file`;
        const httpReq = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, httpReq);

        console.info(`publish_file: ${JSON.stringify(req)}`);
        httpReq.set_json_body({
            // 文件所属者
            owner: req.owner,

            // 文件的本地路径
            local_path: req.local_path,

            // chunk大小
            chunk_size: req.chunk_size,

            file_id: req.file_id,

            // 关联的dirs
            dirs: req.dirs
        });

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            return await TransAddFileResponse.from_respone(resp);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`publish_file to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }
}
