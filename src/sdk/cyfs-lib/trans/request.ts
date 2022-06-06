
import { BuckyError, BuckyErrorCodeEx, BuckyErrorCode, BuckyResult, Err, ObjectId, Ok, DirId, DeviceId, error_code_from_number } from "../../cyfs-base";
import { NDNOutputRequestCommon, NDNOutputRequestCommonJsonCodec } from "../ndn/output_request";
import exp from "constants";
import {TransContext} from "../../cyfs-core/trans/trans_context";

export interface TransTaskOnAirState {
    download_percent: number;
    download_speed: number;
    upload_speed: number;
}

export enum TransTaskState {
    Pending = 0,
    Downloading = 1,
    Paused = 2,
    Canceled = 3,
    Finished = 4,
    Err = 5
}

export class TransTaskStateInfo {
    state: TransTaskState = TransTaskState.Pending;

    // state == TransTaskState.OnAir
    on_air_state?: TransTaskOnAirState;

    // state == TransTaskState.Ready
    upload_speed?: number;

    // state == TransTaskState.Err
    error_code?: BuckyErrorCodeEx;

    public static async from_respone(resp: Response): Promise<BuckyResult<TransTaskStateInfo>> {
        const text = await resp.text();

        const ret = new TransTaskStateInfo();

        let json;

        // 解析json
        try {
            json = JSON.parse(text);
        } catch (error) {
            const msg = `parse TransTaskStateInfo from resp error! ${text}, ${error.to_string()}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        if (json.Downloading != null) {
            ret.state = TransTaskState.Downloading;
            ret.on_air_state = json.Downloading;
        } else if (json.Finished != null) {
            ret.state = TransTaskState.Finished;
            ret.upload_speed = json.Finished;
        } else if (json.Err != null) {
            ret.state = TransTaskState.Err;
            ret.error_code = error_code_from_number(json.Err);
        } else if (json === 'Pending') {
            ret.state = TransTaskState.Pending;
        } else if (json === 'Paused') {
            ret.state = TransTaskState.Paused;
        } else if (json === 'Canceled') {
            ret.state = TransTaskState.Canceled;
        } else {
            const msg = `unknown TransTaskStateInfo state! ${text}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        return Ok(ret);
    }
}

export enum TransTaskControlAction {
    Start = 'Start',
    Stop = 'Stop',
    Delete = 'Delete',
}

export enum TransTaskStatus {
    Stopped = 'Stopped',
    Running = 'Running',
    Finished = 'Finished',
    Failed = 'Failed',
}

export interface TransGetContextRequest {
    common: NDNOutputRequestCommon;
    context_name: string;
}

export interface TransPutContextRequest {
    common: NDNOutputRequestCommon;
    context: TransContext;
}

export interface TransCreateTaskRequest {
    common: NDNOutputRequestCommon;

    object_id: ObjectId;

    // 保存到的本地目录or文件
    local_path: string;

    // 源设备(hub)列表
    device_list: DeviceId[];
    context_id?: ObjectId;
    auto_start: boolean;
}

export class TransCreateTaskResponse {
    task_id: string;

    constructor(task_id: string) {
        this.task_id = task_id;
    }

    public static async from_response(resp: Response): Promise<BuckyResult<TransCreateTaskResponse>> {
        return Ok(await resp.json());
    }
}

export interface TransTaskRequest {
    common: NDNOutputRequestCommon;
    task_id: string;
}
export interface TransControlTaskRequest {
    common: NDNOutputRequestCommon;
    task_id: string,

    // 源设备(hub)列表
    action: TransTaskControlAction;
}

export interface TransGetTaskStateRequest {
    common: NDNOutputRequestCommon;

    task_id: string;
}

export interface FileDirRef {
    dir_id: DirId,
    inner_path: string,
}

export interface TransQueryTasksRequest {
    common: NDNOutputRequestCommon;
    context_id?: ObjectId;
    task_status?: TransTaskStatus;
    range?: [number, number];
}

export interface TransTaskInfo {
    task_id: string;
    context_id?: ObjectId;
    object_id: ObjectId;
    local_path: string;
    device_list: DeviceId[];
}

export class TransQueryTaskResponse {
    task_list: TransTaskInfo[];

    constructor(task_list: TransTaskInfo[]) {
        this.task_list = task_list;
    }

    public static async from_response(resp: Response): Promise<BuckyResult<TransQueryTaskResponse>> {
        return Ok(await resp.json());
    }
}

export interface TransPublishFileRequest {
    common: NDNOutputRequestCommon;
    // 文件所属者
    owner: ObjectId,

    // 文件的本地路径
    local_path: string,

    // chunk大小
    chunk_size: number,

    file_id?: ObjectId,

    // 关联的dirs
    dirs?: FileDirRef[]
}

export class TransAddFileResponse {
    file_id: ObjectId

    constructor(id: ObjectId) {
        this.file_id = id;
    }

    public static async from_respone(resp: Response): Promise<BuckyResult<TransAddFileResponse>> {
        const root = await resp.json();

        const r = ObjectId.from_base_58(root.file_id);
        if (r.err) {
            return r;
        }

        return Ok(new TransAddFileResponse(r.unwrap()));
    }
}
