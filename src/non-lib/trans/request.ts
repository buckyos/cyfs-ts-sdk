
import { BuckyError, BuckyErrorCode, BuckyResult, Err, FileId, Ok, Option } from "../../cyfs-base";
import { ObjectId } from "../../cyfs-base/objects/object_id";
import { DirId } from "../../cyfs-base/objects/dir";
import { DeviceId } from "../../cyfs-base/objects/device";

export interface TransTaskOnAirState {
    download_percent: number;
    download_speed: number;
    upload_speed: number;
}

export enum TransTaskState {
    Pending = 0,
    OnAir = 1,
    Ready = 2,
    Stopped = 3,
}

export class TransTaskStateInfo {
    state: TransTaskState = TransTaskState.Pending;

    // state == TransTaskState.OnAir
    on_air_state?: TransTaskOnAirState;

    // state == TransTaskState.Ready
    upload_speed?: number;

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

        if (json.OnAir != null) {
            ret.state = TransTaskState.OnAir;
            ret.on_air_state = json.OnAir;
        } else if (json.Ready != null) {
            ret.state = TransTaskState.Ready;
            ret.upload_speed = json.Ready;
        } else if (json === 'Pending') {
            ret.state = TransTaskState.Pending;
        } else if (json === 'Stopped') {
            ret.state = TransTaskState.Stopped;
        } else {
            const msg = `unknown TransTaskStateInfo state! ${text}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }
        
        return Ok(ret);
    }
}

export enum TransTaskUploadStrategy {
    Default = 0,
    Disable = 1,
}

export interface TransStartTaskRequest {
    target?: DeviceId;

    object_id: ObjectId;

    user_id: string;

    // 上传策略
    upload_strategy: TransTaskUploadStrategy,

    // 保存到的本地目录or文件
    local_path: string;

    // 源设备(hub)列表
    device_list: DeviceId[];
}

export interface TransStopTaskRequest {
    target?: DeviceId,

    object_id: ObjectId,

    user_id: string,
}

export type TransGetTaskStateRequest = TransStopTaskRequest;

export interface FileDirRef {
    dir_id: DirId,
    inner_path: string,
}

export interface TransAddFileRequest {

    // 是否开始当前文件的上传任务
    start_upload: boolean,
    user_id: string,

    // 文件所属者
    owner: ObjectId,

    // 文件的本地路径
    local_path: string,

    // chunk大小
    chunk_size: number,

    // 关联的dirs
    dirs?: FileDirRef[]
}

export class TransAddFileResponse {
    file_id: ObjectId

    constructor (id: ObjectId) {
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