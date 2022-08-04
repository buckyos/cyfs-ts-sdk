import JSBI from "jsbi";
import { DeviceId, ObjectId, BuckyResult, Ok, Option, ProtobufCodecHelper, bucky_time_now, BuckyErrorCode, bucky_time_2_js_date, None} from "../../cyfs-base";
import { NONAPILevel, NONObjectInfo, PathOpEnvStub, SharedCyfsStack } from "../../cyfs-lib";
import { PerfAccumulation, PerfAccumulationDecoder, PerfAccumulationItem, PerfAction, PerfActionDecoder, PerfActionItem, PerfRecord, 
    PerfRecordDecoder, PerfRecordItem, PerfRequest, PerfRequestDecoder, PerfRequestItem, PERF_DEC_ID_STR } from "../base";

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

    dec_id: ObjectId

    isolate_id: string

    span_times: number[]

    actions: Map<string, PerfActionItem[]>

    records: Map<string, PerfRecordItem[]>

    accumulations: Map<string, PerfAccumulationItem[]>

    pending_reqs: Map<string, JSBI>
    requests: Map<string, PerfRequestItem[]>
    
    constructor(isolate_id: string, span_times: number[], people_id: ObjectId, dec_id: ObjectId, stack: SharedCyfsStack) {
        this.isolate_id = isolate_id;
        this.span_times = span_times;
        this.people_id = people_id;
        this.dec_id = dec_id;
        this.stack = stack;

        this.actions = new Map<string, PerfActionItem[]>();
        this.records = new Map<string, PerfRecordItem[]>();
        this.accumulations = new Map<string, PerfAccumulationItem[]>();
        this.pending_reqs = new Map<string, JSBI>();
        this.requests = new Map<string, PerfRequestItem[]>();
    }

    async put_object(object_id: ObjectId, object_raw: Uint8Array) : Promise<BuckyResult<void>> {
        const dec_id = ObjectId.from_base_58(PERF_DEC_ID_STR).unwrap();

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
    search_lastsmall(arr: number[], target: number): number {
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

    get_local_cache_path(isolate_id: string, id: string, date_span: string, time_span: string, perf_type: PerfType) : string {
        const dec_id = this.dec_id.to_base_58();
        const path = `/local/${dec_id}/${isolate_id}/${id}/${number_2_metric_name(perf_type)}/${date_span}/${time_span}`;

        return path;
    }

    get_cur_time_span(d: Date): [string, string] {
        let month: string | number = d.getUTCMonth() + 1;
        let strDate: string | number = d.getUTCDate();
    
        if (month <= 9) {
            month = "0" + month;
        }
    
        if (strDate <= 9) {
            strDate = "0" + strDate;
        }
    
        const date = d.getUTCFullYear() + "-" + month + "-" + strDate;
    
        const cur_span_time = d.getUTCHours() * 60 + d.getUTCMinutes();
        const cur_span = this.search_lastsmall(this.span_times, cur_span_time);

        let hour: string | number = Math.floor(cur_span / 60);
        if (hour <= 9) {
            hour = "0" + hour;
        }
        let minutes: string | number = cur_span % 60;
        if (minutes <= 9) {
            minutes = "0" + minutes;
        }
        const time_span = hour + ":" + minutes;
    
        return [date, time_span];
    }


    async local_cache(op_env: PathOpEnvStub, isolate_id: string, id: string, date_span: string, time_span: string, perf_object_id: ObjectId, perf_type: PerfType) : Promise<BuckyResult<void>> {
        // 把对象存到root_state, local cache
        const path = this.get_local_cache_path(isolate_id, id, date_span, time_span, perf_type);
        await op_env.set_with_path(path, perf_object_id, undefined, true);
        //const root = await op_env.commit();
        //console.info(`path: ${path}, value: ${perf_object_id.to_base_58()}, new dec root is: ${root}, perf_obj_id=${perf_object_id}`);

        return Ok(undefined);
    }

    async put_noc_and_root_state(op_env: PathOpEnvStub, object_id: ObjectId, object_raw: Uint8Array, isolate_id: string, id: string, date_span: string, time_span: string, perf_type: PerfType) :  Promise<BuckyResult<void>> {
        await this.put_object(object_id, object_raw);
        await this.local_cache(
            op_env,
            isolate_id, 
            id, 
            date_span,
            time_span,
            object_id, 
            perf_type);

        return Ok(undefined);
    }

    async inner_save_request(op_env: PathOpEnvStub, dec_id: ObjectId) : Promise<BuckyResult<void>> {
        for (const [id, items] of this.requests) {
            // 基于time span 整理分组
            let groups = new Map<string, PerfRequestItem[]>();
            for (const item of items) {
                const d = bucky_time_2_js_date(item.time);
                const [date, time_span] = this.get_cur_time_span(d);
                const span = `${date}_${time_span}`;

                let group = groups.get(span);
                if (group !== undefined) {
                    group.push(item);
                } else {
                    group = [item];
                }
                groups.set(span, group)
            }
            for (const [span, items] of groups) {
                const split = span.split("_");
                const date_span = split[0];
                const time_span = split[1];
                const path = this.get_local_cache_path(this.isolate_id, id,  date_span, time_span, PerfType.Requests);
                const ret = await op_env.get_by_path(path);
                if (ret.err || ret.unwrap() === undefined) {
                    const perf_obj = PerfRequest.create(this.people_id, dec_id);
                    const v = perf_obj.add_stats(items);
                    const object_raw = v.to_vec().unwrap();
                    const object_id = v.desc().object_id();
                    await this.put_noc_and_root_state(op_env, object_id, object_raw, this.isolate_id, id, date_span, time_span, PerfType.Requests);
                } else {
                    const req = {
                        object_id: ret.unwrap()!,
                        common: {
                            dec_id,
                            flags: 0,
                            level: NONAPILevel.NOC
                        }
                    };
                    const ret_result = await this.stack.non_service().get_object(req);
                    const perf_obj = ProtobufCodecHelper.decode_buf(ret_result.unwrap().object.object_raw, new PerfRequestDecoder()).unwrap();
                    const v = perf_obj.add_stats(items);
                    const object_raw = v.to_vec().unwrap();
                    const object_id = v.desc().object_id();
                    await this.put_noc_and_root_state(op_env, object_id, object_raw, this.isolate_id, id, date_span, time_span, PerfType.Requests);
                }
            }

        }

        return Ok(undefined);
    }

    async inner_save_acc(op_env: PathOpEnvStub, dec_id: ObjectId) : Promise<BuckyResult<void>> {
        for (const [id, items] of this.accumulations) {
            // 基于time span 整理分组
            let groups = new Map<string, PerfAccumulationItem[]>();
            for (const item of items) {
                const d = bucky_time_2_js_date(item.time);
                const [date, time_span] = this.get_cur_time_span(d);
                const span = `${date}_${time_span}`;

                let group = groups.get(span);
                if (group !== undefined) {
                    group.push(item);
                } else {
                    group = [item];
                }
                groups.set(span, group)
            }
            for (const [span, items] of groups) {
                const split = span.split("_");
                const date_span = split[0];
                const time_span = split[1];
                const path = this.get_local_cache_path(this.isolate_id, id,  date_span, time_span, PerfType.Accumulations);
                const ret = await op_env.get_by_path(path);
                if (ret.err || ret.unwrap() === undefined) {
                    const perf_obj = PerfAccumulation.create(this.people_id, dec_id);
                    const v = perf_obj.add_stats(items);
                    const object_raw = v.to_vec().unwrap();
                    const object_id = v.desc().object_id();
                    await this.put_noc_and_root_state(op_env, object_id, object_raw, this.isolate_id, id, date_span, time_span, PerfType.Accumulations);
                } else {
                    const req = {
                        object_id: ret.unwrap()!,
                        common: {
                            dec_id,
                            flags: 0,
                            level: NONAPILevel.NOC
                        }
                    };
                    const ret_result = await this.stack.non_service().get_object(req);
                    const perf_obj = ProtobufCodecHelper.decode_buf(ret_result.unwrap().object.object_raw, new PerfAccumulationDecoder()).unwrap();
                    const v = perf_obj.add_stats(items);
                    const object_raw = v.to_vec().unwrap();
                    const object_id = v.desc().object_id();
                    await this.put_noc_and_root_state(op_env, object_id, object_raw, this.isolate_id, id, date_span, time_span, PerfType.Accumulations);
                }
            }

        }

        return Ok(undefined);
    }

    async inner_save_action(op_env: PathOpEnvStub, dec_id: ObjectId) : Promise<BuckyResult<void>> {
        for (const [id, items] of this.actions) {
            // 基于time span 整理分组
            let groups = new Map<string, PerfActionItem[]>();
            for (const item of items) {
                const d = bucky_time_2_js_date(item.time);
                const [date, time_span] = this.get_cur_time_span(d);
                const span = `${date}_${time_span}`;

                let group = groups.get(span);
                if (group !== undefined) {
                    group.push(item);
                } else {
                    group = [item];
                }
                groups.set(span, group)
            }
            for (const [span, items] of groups) {
                const split = span.split("_");
                const date_span = split[0];
                const time_span = split[1];
                const path = this.get_local_cache_path(this.isolate_id, id,  date_span, time_span, PerfType.Actions);
                const ret = await op_env.get_by_path(path);
                if (ret.err || ret.unwrap() === undefined) {
                    const perf_obj = PerfAction.create(this.people_id, dec_id);
                    const v = perf_obj.add_stats(items);
                    const object_raw = v.to_vec().unwrap();
                    const object_id = v.desc().object_id();
                    await this.put_noc_and_root_state(op_env, object_id, object_raw, this.isolate_id, id, date_span, time_span, PerfType.Actions);
                } else {
                    const req = {
                        object_id: ret.unwrap()!,
                        common: {
                            dec_id,
                            flags: 0,
                            level: NONAPILevel.NOC
                        }
                    };
                    const ret_result = await this.stack.non_service().get_object(req);
                    const perf_obj = ProtobufCodecHelper.decode_buf(ret_result.unwrap().object.object_raw, new PerfActionDecoder()).unwrap();
                    const v = perf_obj.add_stats(items);
                    const object_raw = v.to_vec().unwrap();
                    const object_id = v.desc().object_id();
                    await this.put_noc_and_root_state(op_env, object_id, object_raw, this.isolate_id, id, date_span, time_span, PerfType.Actions);
                }
            }

        }

        return Ok(undefined);
    }

    async inner_save_record(op_env: PathOpEnvStub, dec_id: ObjectId) : Promise<BuckyResult<void>> {
        for (const [id, items] of this.records) {
            // 基于time span 整理分组
            let groups = new Map<string, PerfRecordItem[]>();
            for (const item of items) {
                const d = bucky_time_2_js_date(item.time);
                const [date, time_span] = this.get_cur_time_span(d);
                const span = `${date}_${time_span}`;

                let group = groups.get(span);
                if (group !== undefined) {
                    group.push(item);
                } else {
                    group = [item];
                }
                groups.set(span, group)
            }
            for (const [span, items] of groups) {
                const split = span.split("_");
                const date_span = split[0];
                const time_span = split[1];
                const path = this.get_local_cache_path(this.isolate_id, id,  date_span, time_span, PerfType.Records);
                const ret = await op_env.get_by_path(path);
                if (ret.err || ret.unwrap() === undefined) {
                    const perf_obj = PerfRecord.create(this.people_id, dec_id, JSBI.BigInt(0), None);
                    const v = perf_obj.add_stat(items[items.length -1]);
                    const object_raw = v.to_vec().unwrap();
                    const object_id = v.desc().object_id();
                    await this.put_noc_and_root_state(op_env, object_id, object_raw, this.isolate_id, id, date_span, time_span, PerfType.Records);
                } else {
                    const req = {
                        object_id: ret.unwrap()!,
                        common: {
                            dec_id,
                            flags: 0,
                            level: NONAPILevel.NOC
                        }
                    };
                    const ret_result = await this.stack.non_service().get_object(req);
                    const perf_obj = ProtobufCodecHelper.decode_buf(ret_result.unwrap().object.object_raw, new PerfRecordDecoder()).unwrap();
                    const v = perf_obj.add_stat(items[items.length - 1]);
                    const object_raw = v.to_vec().unwrap();
                    const object_id = v.desc().object_id();
                    await this.put_noc_and_root_state(op_env, object_id, object_raw, this.isolate_id, id, date_span, time_span, PerfType.Records);
                }
            }

        }

        return Ok(undefined);
    }

    clear_cache() {
        this.requests.clear();
        this.accumulations.clear();
        this.actions.clear();
        this.records.clear();
    }

    async inner_save(): Promise<BuckyResult<void>> {
        if (this.requests.size > 0 ||
            this.accumulations.size > 0 ||
            this.actions.size > 0 || 
            this.records.size > 0) {
        
            console.time('elapsedTime') 

            const dec_id = ObjectId.from_base_58(PERF_DEC_ID_STR).unwrap();
            const root_state = this.stack.root_state_stub(undefined, dec_id);
            const op_env = (await root_state.create_path_op_env()).unwrap();
    
            await this.inner_save_request(op_env, dec_id);
            await this.inner_save_acc(op_env, dec_id);
            await this.inner_save_action(op_env, dec_id);
            await this.inner_save_record(op_env, dec_id);
    
    
            const root = await op_env.commit();
            console.info(`new dec root is: ${root}`);
    
            console.timeEnd('elapsedTime')
            // 清理缓存数据
            this.clear_cache();
        }


        return Ok(undefined);
    }


    // 开启一个request
    begin_request(id: string, key: string): void {
        const full_id = `${id}_${key}`;
        if  (this.pending_reqs.has(full_id)) {
            // nothing to do here or panic
        } else {
            this.pending_reqs.set(full_id, bucky_time_now());
        }

        return;

    }
    // 统计一个操作的耗时, 流量统计
    end_request(id: string, key: string, err: BuckyErrorCode, bytes: Option<JSBI>): void {
        const full_id = `${id}_${key}`;
        const tick = this.pending_reqs.get(full_id);
        if (tick !== undefined) {
            this.pending_reqs.delete(full_id);
            const now = bucky_time_now();
            const duration = now > tick ? JSBI.subtract(now, tick) : JSBI.BigInt(0);
            const item: PerfRequestItem = {
                time: now,
                spend_time: JSBI.toNumber(duration),
                err: err,
                stat: bytes
            }
            let items = this.requests.get(id);
            if (items !== undefined) {
                items.push(item);
            } else {
                items = [item];
            }
            this.requests.set(id, items)

        }
        
        return;
    }

    acc(id: string, err: BuckyErrorCode, size: JSBI) :void {
        const now = bucky_time_now();
        const item: PerfAccumulationItem = {
            time: now,
            err: err,
            stat: size
        }
        let items = this.accumulations.get(id);
        if (items !== undefined) {
            items.push(item);
        } else {
            items = [item];
        }
        this.accumulations.set(id, items)

        return;
    }

    action(
        id: string,
        err: BuckyErrorCode,
        name: string,
        value: string,
    ): void {
        const item = new PerfActionItem(err, name, value); 
        let items = this.actions.get(id);
        if (items !== undefined) {
            items.push(item);
        } else {
            items = [item];
        }
        this.actions.set(id, items)
        return;
    }

    record(id: string, total: JSBI, total_size: Option<JSBI>) : void {
        const item: PerfRecordItem = {
            time: bucky_time_now(),
            total,
            total_size
        }
        let items = this.records.get(id);
        if (items !== undefined) {
            items.push(item);
        } else {
            items = [item];
        }
        this.records.set(id, items)

        return;
    }

    get_id() : string {
        return this.isolate_id;
    }
}