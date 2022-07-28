import JSBI from "jsbi";
import { DeviceId, ObjectId, BuckyResult, Ok, Option, Some, ProtobufCodecHelper} from "../../cyfs-base";
import { NONAPILevel, NONObjectInfo, SharedCyfsStack } from "../../cyfs-lib";
import { PerfAccumulation, PerfAccumulationDecoder, PerfAction, PerfRecord, 
    PerfRecordDecoder, PerfRequest, PerfRequestDecoder, PERF_DEC_ID_STR } from "../base";

export enum PerfType {
    Requests,
    Accumulations,
    Actions,
    Records,
}

export function number_2_metric_name(x:number): string{
    if (typeof PerfType[x] === 'undefined') {
        // console.error('Invalid PerfObjectType number');
        return "Unknown";
    }
    switch(x){
        case PerfType.Requests: return "Requests";
        case PerfType.Accumulations: return "Accumulations";
        case PerfType.Actions: return "Actions";
        case PerfType.Records: return "Records";
        default: return "Unknown";
    }
}

export class PerfIsolate {
    stack: SharedCyfsStack

    people_id: ObjectId
    device_id: DeviceId

    dec_id: Option<ObjectId>

    isolate_id: string

    span_times: number[]

    id: string

    actions: PerfAction[]

    records: Map<string, PerfRecord>

    accumulations: Map<string, PerfAccumulation>

    pending_reqs: Map<string, number>
    reqs: Map<string, PerfRequest>
    
    constructor(isolate_id: string, span_times: number[], people_id: ObjectId, device_id: DeviceId, dec_id: Option<ObjectId>, id: string, stack: SharedCyfsStack) {
        this.isolate_id = isolate_id;
        this.span_times = span_times;
        this.people_id = people_id;
        this.device_id = device_id;
        this.dec_id = dec_id;
        this.id = id;
        this.stack = stack;

        this.actions = [];
        this.records = new Map<string, PerfRecord>();
        this.accumulations = new Map<string, PerfAccumulation>();
        this.pending_reqs = new Map<string, number>();
        this.reqs = new Map<string, PerfRequest>();

    }

    async put_object(object_id: ObjectId, object_raw: Uint8Array) : Promise<BuckyResult<void>> {
        let dec_id = ObjectId.from_base_58(PERF_DEC_ID_STR).unwrap();
        if(this.dec_id.is_some()){
            dec_id = this.dec_id.unwrap();
        }

        const req = {
            common: {
                dec_id,
                flags: 0,
                level: NONAPILevel.NOC
            },
            object: new NONObjectInfo(object_id, object_raw)
        };

        const put_ret = await this.stack.non_service().put_object(req);
        console.info(`put_ret: ${put_ret}, object_id: ${object_id.to_base_58()}`);
        return Ok(undefined);
    }

    // 查找最后一个小于等于给定值的元素
    binary_search_lastsmall(arr: number[], target: number): number {
        if (arr.length <= 1) {
            return 0;
        } 
        // 低位下标
        let lowIndex = 0
        // 高位下标
        let highIndex = arr.length - 1

        while (lowIndex <= highIndex) {
            // 中间下标
            const midIndex = Math.floor((lowIndex + highIndex) / 2)
            if (arr[midIndex] <= target) {
                if (midIndex === arr.length - 1 || arr[midIndex + 1] > target) {
                    return arr[midIndex];
                }
                lowIndex = midIndex + 1
            } else {
                highIndex = midIndex - 1
            }
        }

        return 0;
    }

    get_local_cache_path(dec_id: Option<ObjectId>, isolate_id: string, id: string, perf_type: PerfType) : string {
        const now = new Date();
        let month: string | number = now.getUTCMonth() + 1;
        let strDate: string | number = now.getUTCDate();

        if (month <= 9) {
            month = "0" + month;
        }

        if (strDate <= 9) {
            strDate = "0" + strDate;
        }

        const date = now.getUTCFullYear() + "-" + month + "-" + strDate;
        
        const cur_span_time = now.getUTCHours() * 60 + now.getUTCMinutes();
        const cur_span = this.binary_search_lastsmall(this.span_times, cur_span_time);

        let hour: string | number = Math.floor(cur_span / 60);
        if (hour <= 9) {
            hour = "0" + hour;
        }
        let minutes: string | number = cur_span % 60;
        if (minutes <= 9) {
            minutes = "0" + minutes;
        }
        const time_span = hour + ":" + minutes;
        const people_id = this.people_id.to_base_58();
        const device_id = this.device_id.to_base_58();
        const path = `/${PERF_DEC_ID_STR}/${people_id}/${device_id}/${isolate_id}/${id}/${number_2_metric_name(perf_type)}/${date}/${time_span}`;

        return path;
    }

    async local_cache(device_id: ObjectId, dec_id: ObjectId, isolate_id: string, id: string, perf_object_id: ObjectId, perf_type: PerfType) : Promise<BuckyResult<void>> {
        // 把对象存到root_state, local cache
        const root_state = this.stack.root_state_stub(device_id, dec_id);
        const op_env = (await root_state.create_path_op_env()).unwrap();
        const path = this.get_local_cache_path(Some(dec_id), isolate_id, id, perf_type);
        if (perf_type === PerfType.Actions) {
            await op_env.set_with_key(path, perf_object_id.to_base_58(), perf_object_id, undefined, true);
        } else {
            await op_env.set_with_path(path, perf_object_id, undefined, true);
        }
        const root = await op_env.commit();
        console.info(`path: ${path}, value: ${perf_object_id.to_base_58()}, new dec root is: ${root}, perf_obj_id=${perf_object_id}`);

        return Ok(undefined);
    }

    async put_noc_and_root_state(object_id: ObjectId, object_raw: Uint8Array, perf_type: PerfType) :  Promise<BuckyResult<void>> {
        await this.put_object(object_id, object_raw);

        let dec_id = ObjectId.from_base_58(PERF_DEC_ID_STR).unwrap();
        if(this.dec_id.is_some()){
            dec_id = this.dec_id.unwrap();
        }
        
        await this.local_cache(
            this.device_id.object_id,
            dec_id, 
            this.isolate_id, 
            this.id, 
            object_id, 
            perf_type);

        return Ok(undefined);
    }

    // 开启一个request
    begin_request(id: string, key: string): void {
        const full_id = `${id}_${key}`;
        if  (this.pending_reqs.has(full_id)) {
            // nothing to do here or panic
        } else {
            this.pending_reqs.set(full_id, 1);
        }

        return;

    }
    // 统计一个操作的耗时, 流量统计
    async end_request(id: string, key: string, spend_time: number, stat: BuckyResult<Option<JSBI>>): Promise<BuckyResult<void>> {
        return Ok(undefined);
    }

    async acc(id: string, stat: BuckyResult<JSBI>) : Promise<BuckyResult<void>> {

        return Ok(undefined);
    }

    async action(
        id: string,
        stat: BuckyResult<[string, string]>
    ): Promise<BuckyResult<void>> {
        return Ok(undefined);
    }

    async record(id: string, total: JSBI, total_size: Option<JSBI>) : Promise<BuckyResult<void>> {

        return Ok(undefined);
    }

    get_id() : string {
        return this.id;
    }
}