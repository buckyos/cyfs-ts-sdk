import { HttpRequest } from "../base/http_request";
import { BaseRequestor, RequestorHelper } from "../base/base_requestor";
import { Err, Ok } from "ts-results";
import { BuckyResult, CYFS_ACCESS, CYFS_API_LEVEL, CYFS_DEC_ID, CYFS_FLAGS, CYFS_REFERER_OBJECT, CYFS_REQ_PATH, CYFS_TARGET, ObjectId } from "../../cyfs-base";
import {
    TransPublishFileOutputResponse,
    TransControlTaskOutputRequest,
    TransCreateTaskOutputRequest, TransCreateTaskOutputResponse,
    TransGetContextOutputRequest,
    TransGetTaskStateOutputRequest,
    TransPublishFileOutputRequest,
    TransPutContextOutputRequest, TransQueryTaskOutputResponse, TransQueryTasksOutputRequest,
    TransTaskControlAction,
    TransTaskOutputRequest,
    TransTaskStateInfo,
    TransGetContextOutputResponse,
    TransControlTaskGroupOutputRequest,
    TransControlTaskGroupOutputResponse,
    TransGetTaskGroupStateOutputRequest,
    TransGetTaskGroupStateOutputResponse,
    TransGetTaskStateOutputResponse
} from './output_request';
import { TransContextDecoder } from "../../cyfs-core/trans/trans_context";
import { NDNOutputRequestCommon } from '../ndn/output_request';
import { http_status_code_ok } from "../../util";


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
            http_req.insert_header(CYFS_REQ_PATH, encodeURIComponent(com_req.req_path))
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
    public async get_context(req: TransGetContextOutputRequest): Promise<BuckyResult<TransGetContextOutputResponse>> {
        const url = `${this.serviceURL}get_context`;
        console.log('will get context', url, req);
        const httpReq = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, httpReq);
        httpReq.set_json_body(req);

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (http_status_code_ok(resp.status)) {
            const context = new TransContextDecoder().from_raw(new Uint8Array(await resp.arrayBuffer()));
            if (context.err) {
                return context;
            }
            return Ok({ context: context.unwrap() });
        } else {
            const err = await RequestorHelper.error_from_resp(resp);
            console.error(`get context failed, status=${resp.status}, err=${err}`);
            return Err(err);
        }
    }

    // POST {serviceURL}/trans/put_context
    public async put_context(req: TransPutContextOutputRequest): Promise<BuckyResult<null>> {
        const url = `${this.serviceURL}put_context`;
        console.log('will put context', url, req);
        const httpReq = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, httpReq);
        if (req.access) {
            httpReq.insert_header(CYFS_ACCESS, req.access.value.toString())
        }
        httpReq.set_body(req.context.to_vec().unwrap())

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (http_status_code_ok(resp.status)) {
            return Ok(null);
        } else {
            const err = await RequestorHelper.error_from_resp(resp);
            console.error(`put context failed, status=${resp.status}, err=${err}`);
            return new Err(err);
        }
    }

    // POST {serviceURL}/trans/task
    public async create_task(req: TransCreateTaskOutputRequest): Promise<BuckyResult<TransCreateTaskOutputResponse>> {
        const url = `${this.serviceURL}task`;
        console.log('will start trans task', url, req);
        const httpReq = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, httpReq);
        httpReq.set_json_body(req);

        const ret = await this.requestor.request(httpReq);
        return await RequestorHelper.parse_resp(ret, "get task state", TransCreateTaskOutputResponse.from_response)
    }

    // PUT {serviceURL}/trans/task
    public async start_task(req: TransTaskOutputRequest): Promise<BuckyResult<null>> {
        const url = `${this.serviceURL}task`;
        console.log('will start trans task', url, req);
        const control_req: TransControlTaskOutputRequest = {
            common: req.common,
            task_id: req.task_id,
            action: TransTaskControlAction.Start
        };

        return await this.control_task(control_req);
    }

    // PUT {serviceURL}/trans/task
    public async stop_task(req: TransTaskOutputRequest): Promise<BuckyResult<null>> {
        const url = `${this.serviceURL}task`;
        console.log('will stop trans task', url, req);
        const control_req: TransControlTaskOutputRequest = {
            common: req.common,
            task_id: req.task_id,
            action: TransTaskControlAction.Stop
        };

        return await this.control_task(control_req);
    }

    // PUT {serviceURL}/trans/task
    public async delete_task(req: TransTaskOutputRequest): Promise<BuckyResult<null>> {
        const url = `${this.serviceURL}task`;
        console.log('will start trans task', url, req);
        const control_req: TransControlTaskOutputRequest = {
            common: req.common,
            task_id: req.task_id,
            action: TransTaskControlAction.Delete
        };

        return await this.control_task(control_req);
    }

    // PUT {serviceURL}/task
    async control_task(req: TransControlTaskOutputRequest): Promise<BuckyResult<null>> {

        const url = `${this.serviceURL}task`;
        console.log('will control trans task: ', url, req);

        const httpReq = new HttpRequest('PUT', url);
        this.encode_common_headers(req.common, httpReq);
        httpReq.set_json_body(req);

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (http_status_code_ok(resp.status)) {
            return Ok(null);
        } else {
            const err = await RequestorHelper.error_from_resp(resp);
            console.error(`control_task to non stack failed, status=${resp.status}, err=${err}`);
            return Err(err);
        }
    }

    // GET {serviceURL}/task/state
    public async get_task_state(req: TransGetTaskStateOutputRequest): Promise<BuckyResult<TransGetTaskStateOutputResponse>> {
        const url = `${this.serviceURL}task/state`;
        console.log('will get trans task state: ', url, req);

        const httpReq = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, httpReq);
        httpReq.set_json_body(req);

        const ret = await this.requestor.request(httpReq);
        return await RequestorHelper.parse_resp(ret, "get task state", TransGetTaskStateOutputResponse.from_response)
    }

    public async query_tasks(req: TransQueryTasksOutputRequest): Promise<BuckyResult<TransQueryTaskOutputResponse>> {
        const url = `${this.serviceURL}query`;
        console.log('will query task: ', url, req);

        const httpReq = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, httpReq);
        const body: any = {
            common: req.common,
            task_status: req.task_status,
        }
        if (req.range) {
            body.offset = req.range[0].toString()
            body.length = req.range[1].toString()
        }
        httpReq.set_json_body(body);

        const ret = await this.requestor.request(httpReq);
        return await RequestorHelper.parse_resp(ret, "query tasks", TransQueryTaskOutputResponse.from_response)
    }

    // POST {serviceURL}/task/file
    public async publish_file(req: TransPublishFileOutputRequest): Promise<BuckyResult<TransPublishFileOutputResponse>> {
        const url = `${this.serviceURL}file`;
        const httpReq = new HttpRequest('POST', url);
        this.encode_common_headers(req.common, httpReq);

        console.info(`publish_file: ${JSON.stringify(req)}`);
        const body = {
            common: req.common,
            owner: req.owner,
            local_path: req.local_path,
            chunk_size: req.chunk_size,
            access: req.access ? req.access.value : undefined,
            file_id: req.file_id,
            dirs: req.dirs,
        };
        httpReq.set_json_body(body);

        const ret = await this.requestor.request(httpReq);
        return await RequestorHelper.parse_resp(ret, "publish_file to non stack", TransPublishFileOutputResponse.from_response)
    }

    public async get_task_group_state(req: TransGetTaskGroupStateOutputRequest): Promise<BuckyResult<TransGetTaskGroupStateOutputResponse>> {
        console.log("will get trans task group state:", req);
        const url = `${this.serviceURL}task_group/state`;
        const http_req = new HttpRequest("Post", url);

        this.encode_common_headers(req.common, http_req);
        http_req.set_json_body(req);

        const ret = await this.requestor.request(http_req);
        return await RequestorHelper.parse_resp(ret, "get task group state", TransGetTaskGroupStateOutputResponse.from_response)
    }

    public async control_task_group(req: TransControlTaskGroupOutputRequest): Promise<BuckyResult<TransControlTaskGroupOutputResponse>> {
        console.log("will control trans task group:", req);

        const url = `${this.serviceURL}task_group`;
        const http_req = new HttpRequest("Put", url);

        this.encode_common_headers(req.common, http_req);
        http_req.set_json_body(req);

        const ret = await this.requestor.request(http_req);
        return await RequestorHelper.parse_resp(ret, "trans control task")
    }
}
