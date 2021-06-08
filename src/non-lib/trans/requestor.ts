import {HttpRequest} from "../base/http_request";
import {HttpRequestor} from "../base/base_requestor";
import {Err, Ok} from "ts-results";
import {BuckyError, BuckyResult} from "../../cyfs-base";
import { TransAddFileRequest, TransAddFileResponse, TransGetTaskStateRequest, TransStartTaskRequest, TransStopTaskRequest, TransTaskStateInfo } from './request';


export class TransRequestor {
    serviceURL: string;

    constructor(private requestor: HttpRequestor) {
        this.serviceURL = `http://${requestor.remote_addr()}/trans/`;
    }

    // POST {serviceURL}/trans/task
    public async start_task(req: TransStartTaskRequest): Promise<BuckyResult<null>> {
        const url = `${this.serviceURL}task`;
        console.log('will start trans task', url, req);
        const httpReq = new HttpRequest('POST', url);
        httpReq.set_json_body(req);

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            return Ok(null);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`start_task to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // DELETE {serviceURL}/task
    public async stop_task(req: TransStopTaskRequest): Promise<BuckyResult<null>> {

        const url = `${this.serviceURL}task`;
        console.log('will stop trans task: ', url, req);

        const httpReq = new HttpRequest('DELETE', url);
        httpReq.set_json_body(req);

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            return Ok(null);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`stop_task to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }

    // GET {serviceURL}/task/state
    public async get_task_state(req: TransGetTaskStateRequest): Promise<BuckyResult<TransTaskStateInfo>> {
        const url = `${this.serviceURL}task/state`;
        console.log('will get trans task state: ', url, req);

        const httpReq = new HttpRequest('POST', url);
        httpReq.set_json_body(req);

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

    // POST {serviceURL}/task/file
    public async add_file(req: &TransAddFileRequest): Promise<BuckyResult<TransAddFileResponse>> {
        const url = `${this.serviceURL}file`;
        const httpReq = new HttpRequest('POST', url);
        
        console.info(`add_file: ${JSON.stringify(req)}`);
        httpReq.set_json_body(req);

        const ret = await this.requestor.request(httpReq);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();

        if (resp.status === 200) {
            return await TransAddFileResponse.from_respone(resp);
        } else {
            const e: { code: number; msg: string } = await resp.json();
            console.error(`add_file to non stack failed, status=${resp.status}, err=${JSON.stringify((e))}`);
            return new Err(new BuckyError(e.code, e.msg));
        }
    }
}