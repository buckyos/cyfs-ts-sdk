
import { BuckyError, BuckyErrorCodeEx, BuckyErrorCode, BuckyResult, Err, ObjectId, Ok, DirId, DeviceId, error_code_from_number, AccessString } from "../../cyfs-base";
import { NDNOutputRequestCommon } from "../ndn/output_request";
import {TransContext} from "../../cyfs-core/trans/trans_context";
import JSBI from "jsbi";
import { DownloadTaskControlState, DownloadTaskState } from "../../cyfs-core";

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

    public static from_obj(obj: any): BuckyResult<TransTaskStateInfo> {
        const ret = new TransTaskStateInfo();

        if (obj.Downloading != null) {
            ret.state = TransTaskState.Downloading;
            ret.on_air_state = obj.Downloading;
        } else if (obj.Finished != null) {
            ret.state = TransTaskState.Finished;
            ret.upload_speed = obj.Finished;
        } else if (obj.Err != null) {
            ret.state = TransTaskState.Err;
            ret.error_code = error_code_from_number(obj.Err);
        } else if (obj === 'Pending') {
            ret.state = TransTaskState.Pending;
        } else if (obj === 'Paused') {
            ret.state = TransTaskState.Paused;
        } else if (obj === 'Canceled') {
            ret.state = TransTaskState.Canceled;
        } else {
            const msg = `unknown TransTaskStateInfo state! ${JSON.stringify(obj)}`;
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

export interface TransGetContextOutputRequest {
    common: NDNOutputRequestCommon;
    // get TransContext object by object id
    context_id?: ObjectId,

    // or get TransContext object by context_path excatly
    context_path?: string,
}

export interface TransGetContextOutputResponse {
    context: TransContext,
}

export interface TransPutContextOutputRequest {
    common: NDNOutputRequestCommon;
    context: TransContext;
    access?: AccessString;
}

export interface TransCreateTaskOutputRequest {
    common: NDNOutputRequestCommon;

    object_id: ObjectId;

    // 保存到的本地文件全路径，路径为空字符串时，数据以chunk形式保存到chunk-cache
    local_path: string;

    // 源设备(hub)列表
    device_list: DeviceId[];
    group?: string,
    context?: string,
    auto_start: boolean;
}

export class TransCreateTaskOutputResponse {
    task_id: string;

    constructor(task_id: string) {
        this.task_id = task_id;
    }

    public static async from_response(resp: Response): Promise<BuckyResult<TransCreateTaskOutputResponse>> {
        return Ok(await resp.json());
    }
}

export interface TransTaskOutputRequest {
    common: NDNOutputRequestCommon;
    task_id: string;
}
export interface TransControlTaskOutputRequest {
    common: NDNOutputRequestCommon;
    task_id: string,

    // 源设备(hub)列表
    action: TransTaskControlAction;
}

export interface TransGetTaskStateOutputRequest {
    common: NDNOutputRequestCommon;

    task_id: string;
}

export interface TransGetTaskStateOutputResponse {
    state: TransTaskStateInfo,
    group?: string,
}

export interface FileDirRef {
    dir_id: DirId,
    inner_path: string,
}

export interface TransQueryTasksOutputRequest {
    common: NDNOutputRequestCommon;
    task_status?: TransTaskStatus;
    range?: [JSBI|number, number];
}

export interface TransTaskInfo {
    task_id: string;
    context?: string;
    object_id: ObjectId;
    local_path: string;
    device_list: DeviceId[];
}

export class TransQueryTaskOutputResponse {
    task_list: TransTaskInfo[];

    constructor(task_list: TransTaskInfo[]) {
        this.task_list = task_list;
    }

    public static async from_response(resp: Response): Promise<BuckyResult<TransQueryTaskOutputResponse>> {
        return Ok(await resp.json());
    }
}

export interface TransPublishFileOutputRequest {
    common: NDNOutputRequestCommon;
    // 文件所属者
    owner: ObjectId,

    // 文件的本地路径
    local_path: string,

    // chunk大小
    chunk_size: number,

    // access string for target object
    access?: AccessString;

    file_id?: ObjectId,

    // 关联的dirs
    dirs?: FileDirRef[]
}

export class TransPublishFileOutputResponse {
    file_id: ObjectId

    constructor(id: ObjectId) {
        this.file_id = id;
    }

    public static async from_respone(resp: Response): Promise<BuckyResult<TransPublishFileOutputResponse>> {
        const root = await resp.json();

        const r = ObjectId.from_base_58(root.file_id);
        if (r.err) {
            return r;
        }

        return Ok(new TransPublishFileOutputResponse(r.unwrap()));
    }
}


export interface TransGetTaskGroupStateOutputRequest {
    common: NDNOutputRequestCommon,

    group: string,
    speed_when?: JSBI,
}

export class TransGetTaskGroupStateOutputResponse {
    constructor(public state: DownloadTaskState,
        public control_state: DownloadTaskControlState,
        public speed: number|undefined,
        public cur_speed: number,
        public history_speed: number) {}

    static async from_response(resp: Response): Promise<TransGetTaskGroupStateOutputResponse> {
        const root = await resp.json();
        const state = DownloadTaskState.from_obj(root.state);
        return new TransGetTaskGroupStateOutputResponse(state, root.control_state, root.speed, root.cur_speed, root.history_speed);
    }
}

export enum TransTaskGroupControlAction {
    Resume = "Resume",
    Cancel = "Cancel",
    Pause = "Pause",
}


export interface TransControlTaskGroupOutputRequest {
    common: NDNOutputRequestCommon,

    group: string,
    action: TransTaskGroupControlAction,
}

export interface TransControlTaskGroupOutputResponse {
    control_state: DownloadTaskControlState,
}
