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

    people_id: ObjectId;
    device_id: DeviceId;

    dec_id: Option<ObjectId>

    isolate_id: string;

    id: string

    actions: PerfAction[]

    records: Map<string, PerfRecord>

    accumulations: Map<string, PerfAccumulation>

    pending_reqs: Map<string, number>
    reqs: Map<string, PerfRequest>
    
    constructor(isolate_id: string, people_id: ObjectId, device_id: DeviceId, dec_id: Option<ObjectId>, id: string, stack: SharedCyfsStack) {
        this.isolate_id = isolate_id;
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
        let hour: string | number = now.getUTCHours();
        if (hour <= 9) {
            hour = "0" + hour;
        }
        let minutes: string | number = now.getUTCMinutes();
        if (minutes <= 9) {
            minutes = "0" + minutes;
        }
        const time_span = hour + ":" + minutes;
        //const time_span = hour + ":00";
        const people_id = this.people_id.to_base_58();
        const device_id = this.device_id.to_base_58();
        // /<DecId>/perf-dec-id/<owner>/<device>/<isolate_id>/<id>/<PerfType>/<Date>/<TimeSpan>
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
        const full_id = `${id}_${key}`;

        const path = this.get_local_cache_path(this.dec_id, this.isolate_id, this.id, PerfType.Requests);

        let dec_id = ObjectId.from_base_58(PERF_DEC_ID_STR).unwrap();
        if(this.dec_id.is_some()){
            dec_id = this.dec_id.unwrap();
        }

        const ret = await this.stack
        .root_state_access_stub(this.device_id.object_id, dec_id)
        .get_object_by_path(path)

        if (ret.err) {
            if (this.pending_reqs.delete(full_id)) {
                const perf_obj = PerfRequest.create(this.people_id, dec_id);
                const v = perf_obj.add_stat(spend_time, stat);
                const object_raw = v.to_vec().unwrap();
                const object_id = v.desc().object_id();
                await this.put_noc_and_root_state(object_id, object_raw, PerfType.Requests);
            }
            return Ok(undefined);
        }
        console.info(`ret: ${ret}`);
        const v = ret.unwrap().object.object_id;
        const req = {
            object_id: v,
            common: {
                dec_id,
                flags: 0,
                level: NONAPILevel.NOC
            }
        };
    
        const ret_result = await this.stack.non_service().get_object(req);
        if (ret_result.err) {
            if (this.pending_reqs.delete(full_id)) {
                const perf_obj = PerfRequest.create(this.people_id, dec_id);
                const v = perf_obj.add_stat(spend_time, stat);
                const object_raw = v.to_vec().unwrap();
                const object_id = v.desc().object_id();
                await this.put_noc_and_root_state(object_id, object_raw, PerfType.Requests);
            }
        } else {
            if (this.pending_reqs.delete(full_id)) {
                const perf_obj = ProtobufCodecHelper.decode_buf(ret_result.unwrap().object.object_raw, new PerfRequestDecoder()).unwrap();
                const v = perf_obj.add_stat(spend_time, stat);
                const object_raw = v.to_vec().unwrap();
                const object_id = v.desc().object_id();
                await this.put_noc_and_root_state(object_id, object_raw, PerfType.Requests);
            }
        }

        return Ok(undefined);
    }

    async acc(id: string, stat: BuckyResult<JSBI>) : Promise<BuckyResult<void>> {

       const path = this.get_local_cache_path(this.dec_id, this.isolate_id, this.id, PerfType.Accumulations);

        let dec_id = ObjectId.from_base_58(PERF_DEC_ID_STR).unwrap();
        if(this.dec_id.is_some()){
            dec_id = this.dec_id.unwrap();
        }

        const ret = await this.stack
        .root_state_access_stub(this.device_id.object_id, dec_id)
        .get_object_by_path(path)

        if (ret.err) {
            const perf_obj = PerfAccumulation.create(this.people_id, dec_id);
            const v = perf_obj.add_stat(stat);
            const object_raw = v.to_vec().unwrap();
            const object_id = v.desc().object_id();
            await this.put_noc_and_root_state(object_id, object_raw, PerfType.Accumulations);
            return Ok(undefined);
        }
        const v = ret.unwrap().object.object_id;

        const req = {
            object_id: v,
            common: {
                dec_id,
                flags: 0,
                level: NONAPILevel.NOC
            }
        };
    
        const ret_result = await this.stack.non_service().get_object(req);
        if (ret_result.err) {
            const perf_obj = PerfAccumulation.create(this.people_id, dec_id);
            const v = perf_obj.add_stat(stat);
            const object_raw = v.to_vec().unwrap();
            const object_id = v.desc().object_id();
            await this.put_noc_and_root_state(object_id, object_raw, PerfType.Accumulations);
        } else {
            const perf_obj = ProtobufCodecHelper.decode_buf(ret_result.unwrap().object.object_raw, new PerfAccumulationDecoder()).unwrap();
            const v = perf_obj.add_stat(stat);
            const object_raw = v.to_vec().unwrap();
            const object_id = v.desc().object_id();
            await this.put_noc_and_root_state(object_id, object_raw, PerfType.Accumulations);
        }

        return Ok(undefined);
    }

    async action(
        id: string,
        stat: BuckyResult<[string, string]>
    ): Promise<BuckyResult<void>> {
        let dec_id = ObjectId.from_base_58(PERF_DEC_ID_STR).unwrap();
        if(this.dec_id.is_some()){
            dec_id = this.dec_id.unwrap();
        }

        const v = PerfAction.create(this.people_id, dec_id, stat);
        const object_raw = v.to_vec().unwrap();
        const object_id = v.desc().object_id();
        await this.put_noc_and_root_state(object_id, object_raw, PerfType.Actions);
        return Ok(undefined);
    }

    async record(id: string, total: JSBI, total_size: Option<JSBI>) : Promise<BuckyResult<void>> {
        const path = this.get_local_cache_path(this.dec_id, this.isolate_id, this.id, PerfType.Records);

        let dec_id = ObjectId.from_base_58(PERF_DEC_ID_STR).unwrap();
        if(this.dec_id.is_some()){
            dec_id = this.dec_id.unwrap();
        }

        const ret = await this.stack
        .root_state_access_stub(this.device_id.object_id, dec_id)
        .get_object_by_path(path)

        if (ret.err) {
            const perf_obj = PerfRecord.create(this.people_id, dec_id, total, total_size);
            const v = perf_obj.add_stat(total, total_size);
            const object_raw = v.to_vec().unwrap();
            const object_id = v.desc().object_id();
            await this.put_noc_and_root_state(object_id, object_raw, PerfType.Records);
            return Ok(undefined);
        }
        const v = ret.unwrap().object.object_id;

        const req = {
            object_id: v,
            common: {
                dec_id,
                flags: 0,
                level: NONAPILevel.NOC
            }
        };
    
        const ret_result = await this.stack.non_service().get_object(req);
        if (ret_result.err) {
            const perf_obj = PerfRecord.create(this.people_id, dec_id, total, total_size);
            const v = perf_obj.add_stat(total, total_size);
            const object_raw = v.to_vec().unwrap();
            const object_id = v.desc().object_id();
            await this.put_noc_and_root_state(object_id, object_raw, PerfType.Records);
        } else {
            const perf_obj = ProtobufCodecHelper.decode_buf(ret_result.unwrap().object.object_raw, new PerfRecordDecoder()).unwrap();
            const v = perf_obj.add_stat(total, total_size);
            const object_raw = v.to_vec().unwrap();
            const object_id = v.desc().object_id();
            await this.put_noc_and_root_state(object_id, object_raw, PerfType.Records);
        }

        return Ok(undefined);
    }

    get_id() : string {
        return this.id;
    }
}