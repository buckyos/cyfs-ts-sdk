import {
    bucky_time_now,
    BuckyResult,
    BuckyString,
    DeviceId,
    error,
    js_time_to_bucky_time,
    ObjectId,
    Ok,
    PeopleId,
    Some
} from "../../cyfs-base";

import JSBI from "jsbi";
import {NONAPILevel, NONObjectInfo, SelectOption, SharedCyfsStack} from "../../cyfs-lib";
import {CoreObjectType, DecApp, DecAppId} from "../../cyfs-core";
import {
    DEC_ID,
    PERF_DEC_ID_STR,
    PerfAccumulation,
    PerfAction,
    PerfIsolateEntity,
    PerfIsolateEntityList,
    PerfRecord,
    PerfRequest,
    PerfRequestIsolate,
    PerfTimeRange
} from "../base";
import {Perf, PerfDecoder} from "../base/perf";
import {sha256} from "js-sha256";
import {isolates_exists, perf_acc, perf_action, perf_begin, perf_end, perf_record} from './stat';
import {
    namespaces_perf_accumulation,
    namespaces_perf_action,
    namespaces_perf_isolate,
    namespaces_perf_record,
    namespaces_perf_req,
    namespaces_perf_time_range
} from "./const";

if (typeof localStorage === "undefined" || localStorage === null) {
    const LocalStorage = require('node-localstorage').LocalStorage;
    const localStorage = new LocalStorage('./scratch');
    (global as any).localStorage = localStorage;
}

export class PerfClient {
    owner: ObjectId
    // perf_id: ObjectId
    dec_app_id: DecAppId
    device_id: DeviceId
    perf_service: ObjectId
    version: string
    id: string
    last_noc_time: number;
    last_perf_time: number;

    constructor(private stack: SharedCyfsStack, people: ObjectId, device: DeviceId, dec_id: DecAppId, perf_service: ObjectId, version: string, id: string) {
        this.owner = people;
        this.device_id = device;
        this.dec_app_id = dec_id;
        this.perf_service = perf_service;
        this.version = version;
        this.id = id;
        this.last_noc_time = new Date().getTime();
        this.last_perf_time = new Date().getTime();
    }

    static async create(stack: SharedCyfsStack, target: ObjectId, dec_id: DecAppId, version: string, id: string): Promise<PerfClient> {
        await stack.online();
        const device_id = stack.local_device_id();
        const device = stack.local_device();
        const people_id = device.desc().owner()!.unwrap(); // object_id

        // const dec_id = DecApp.generate_id(people_id, "perf");

        console.info(`owner=${people_id}, device=${device_id}, dec_id=${dec_id}, target_id = ${target}`);

        const perf_client = new PerfClient(stack, people_id, device_id, dec_id, target, version, id);
        return perf_client;
    }

    async start() {
        // 10刷新一次
        setInterval(() => {
            (async () => {
                await this.put_to_noc();
            })();
        }, 1000 * 60 * 10);

        // 10m刷新一次
        setInterval(() => {
            (async () => {
                await this.perf_reporter();
            })();
        }, 1000 * 60 * 11);
    }

    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    async isolate_existed(isolate: string) : Promise<boolean> {
        return true;
    }

    async new_isolate(isolate: string) {
        return new PerfIsolate(isolate);
    }

    async put_to_noc(): Promise<BuckyResult<null>> {
        const now = new Date().getTime();

        if (1000 * 59 > now - this.last_noc_time) {
            return  Ok(null);
        }

        this.last_noc_time = now;

        console.log(`put to noc owner: ${this.owner}, device_id: ${this.device_id}`);

        const time_range = new PerfTimeRange(bucky_time_now(), bucky_time_now());
        const all  = new Map<BuckyString, PerfIsolateEntity>();

        // 最多保留40个isolate
        const  number = 40;
        let i = 0;
        let count = 0;
        for (i = 0; i < number; i++) {
            const isolate_obj = localStorage.getItem(namespaces_perf_isolate + i.toString()) ? localStorage.getItem(namespaces_perf_isolate + i.toString()) : 'undefined';
            if (isolate_obj === 'undefined') {
               count++;
               continue;
            }

            const id_list = JSON.parse(isolate_obj!);

            const id = id_list[id_list.length - 1].id;
            const isolate = id_list[id_list.length - 1].isolate;

            // console.log(`item_id: ${id}, isolate: ${isolate}`);

            // reqs
            const perf_reqs = new Map<BuckyString, PerfRequest>();
            const local_reqs = localStorage.getItem(namespaces_perf_req + id) ? localStorage.getItem(namespaces_perf_req + id) : '[{}]';
            const reqs = JSON.parse(local_reqs!);
            let idx = 0;
            for (const req of reqs) {
                const req_id: string = req.id ? req.id : "";
                const total: number = req.total ? req.total : 0;
                const success: number = req.success ? req.success : 0;
                const total_time: JSBI = req.total_time ? req.total_time : 0;
                const total_size: JSBI = req.total_size ? req.total_size : 0;

                const begin: JSBI = js_time_to_bucky_time(req.begin ? req.begin : 0);
                const end: JSBI = js_time_to_bucky_time(req.end ? req.end : 0);

                // console.log(`reqs time range: (${req.begin}, ${req.end}), ${bucky_time_now()}`)

                idx++;
                const requestsObj = new PerfRequest(req_id, total, success, total_time, total_size, new PerfTimeRange(begin, end));
                perf_reqs.set(new BuckyString(id + idx.toString()), requestsObj);
            }

            const perf_requests = new PerfRequestIsolate(perf_reqs);

            // actions
            const perf_actions = new Map<BuckyString, PerfAction>();
            const local_actions = localStorage.getItem(namespaces_perf_action + id) ? localStorage.getItem(namespaces_perf_action + id) : '[{}]';
            const actions = JSON.parse(local_actions!);
            idx = 0;
            for (const action of actions) {
                const action_id: string = action.id ? action.id : "";
                const err: number = action.err ? action.err : "";
                const name: string = action.name ? action.name : "";
                const value: string = action.value ? action.value : "";

                const time: JSBI = js_time_to_bucky_time(action.time ? action.time : 0);
                // console.log(`actions time range: (${action.time}), ${bucky_time_now()}`)
                idx++;
                const actionsObj = new PerfAction(action_id, err, name, value, time);
                perf_actions.set(new BuckyString(id + idx.toString()), actionsObj);
            }

            // records
            const perf_records = new Map<BuckyString, PerfRecord>();
            const local_records = localStorage.getItem(namespaces_perf_record + id) ? localStorage.getItem(namespaces_perf_record + id) : '[{}]';
            const records = JSON.parse(local_records!);
            idx = 0;
            for (const record of records) {
                const record_id: string = record.id ? record.id : "";
                const total: JSBI = record.total ? record.total : 0;
                const total_size: JSBI = record.total_size ? record.total_size : 0;
                const time: JSBI = js_time_to_bucky_time(record.time ? record.time : 0);
                // console.log(`actions time range: (${record.time}), ${bucky_time_now()}`)
                idx++;
                const recordsObj = new PerfRecord(record_id, total, total_size, time);
                perf_records.set(new BuckyString(id + idx.toString()), recordsObj);
            }

            // accumulations
            const perf_acc = new Map<BuckyString, PerfAccumulation>();
            const local_accumulations = localStorage.getItem(namespaces_perf_accumulation + id) ? localStorage.getItem(namespaces_perf_accumulation + id) : '[{}]';
            const accumulations = JSON.parse(local_accumulations!);
            idx = 0;
            for (const acc of  accumulations) {
                const acc_id: string = acc.id ? acc.id : "";
                const total: number = acc.total ? acc.total : 0;
                const success: number = acc.success ? acc.success : 0;
                const total_size: JSBI = acc.total_size ? acc.total_size : 0;

                const begin: JSBI = js_time_to_bucky_time(acc.begin ? acc.begin : 0);
                const end: JSBI = js_time_to_bucky_time(acc.end ? acc.end : 0);
                // console.log(`acc time range: (${acc.begin}, ${acc.end}), ${bucky_time_now()}`)
                idx++;
                const accObj = new PerfAccumulation(acc_id, total, success, total_size, new PerfTimeRange(begin, end));
                perf_acc.set(new BuckyString(id + idx.toString()), accObj);
            }

            const local_time_range = localStorage.getItem(namespaces_perf_time_range + id) ? localStorage.getItem(namespaces_perf_time_range + id) : '[{}]';
            const time_range_isolate = JSON.parse(local_time_range!);
            let begin = bucky_time_now();
            let end = bucky_time_now();

            for (const tr of time_range_isolate) {
                begin = js_time_to_bucky_time(tr.begin? tr.begin : 0);
                end = js_time_to_bucky_time(tr.end? tr.end : 0);
            }
            // console.log(`entity time range: (${begin}, ${end})`)
            const perf_time_range = new PerfTimeRange(begin, end);

            const isolateObj = new PerfIsolateEntity(
                isolate,
                perf_time_range,
                perf_actions,
                perf_records,
                perf_acc,
                perf_requests);

            all.set(new BuckyString(isolate), isolateObj);
        }

        if (count >= number) {
            return Ok(null)
        }

        if (all.size <= 0) {
            return  Ok(null);
        }

        for (i = 0; i < number; i++) {
            const isolate_obj = localStorage.getItem(namespaces_perf_isolate + i.toString()) ? localStorage.getItem(namespaces_perf_isolate + i.toString()) : 'undefined';
            if (isolate_obj === 'undefined') {
                continue;
            }
            const id_list = JSON.parse(isolate_obj!);
            const id = id_list[id_list.length - 1].id;
            // const isolate = id_list[id_list.length - 1].isolate;

            localStorage.removeItem(namespaces_perf_req + id);
            localStorage.removeItem(namespaces_perf_action + id);
            localStorage.removeItem(namespaces_perf_record + id);
            localStorage.removeItem(namespaces_perf_accumulation + id);
            localStorage.removeItem(namespaces_perf_time_range + id);

            localStorage.removeItem(namespaces_perf_isolate + i);

        }

        const list = new PerfIsolateEntityList(time_range, all);

        const perfObj = Perf.create(this.device_id, this.owner, Some(this.dec_app_id.object_id), this.id, this.version, list);

        const buf = perfObj.to_vec().unwrap();
        const hash = sha256.create();
        hash.update(buf);
        const hash_result = hash.hex();
        perfObj.set_hash(hash_result);

        const r = await this.stack.non_service().put_object({
            common: {
                level: NONAPILevel.NOC,
                flags: 0
            },
            object: NONObjectInfo.new_from_object_raw(perfObj.to_vec().unwrap()).unwrap()
        });

        if (r.err) {
            console.error(`send perf failed, id `)
            return r;
        }

        console.log(`perf put obj_id: ${perfObj.desc().calculate_id()}, raw: ${perfObj.to_vec().unwrap().toHex()}`);

        return Ok(null)

    }

    async perf_reporter(): Promise<BuckyResult<null>> {
        const now = new Date().getTime();

        if (1000 * 59 * 10 > now - this.last_perf_time) {
            return  Ok(null);
        }

        this.last_perf_time = now;

        console.log(`perf_reporter owner: ${this.owner}, device_id: ${this.device_id}`);

        const option = new SelectOption();
        option.page_size = 32;
        option.page_index = 0;
        const r = await this.stack.non_service().select_object( {
            common: {
                level: NONAPILevel.NOC,
                flags: 0
            },
            filter: {
                obj_type: CoreObjectType.PerfOperation,
            },
            opt: option,
        });
        if (r.err) {
            error('get perf noc failed！'+ r.err)
        } else {
            const perfList = r.unwrap().objects;

            console.log(`perfList length, ${perfList.length}, raw => ${JSON.stringify(perfList)}`);
            // const target = ObjectId.from_base_58(PERF_DEC_ID_STR).unwrap();
            const target = this.perf_service;

            for(const list of perfList){
                // console.log("decode perf obj raw:", list.object_raw!.toHex())
                // console.log(
                //     `object=${list.object?.desc().calculate_id()}, insert_time=${list.insert_time} size=${list.size}`);
                const ret = new PerfDecoder().raw_decode(list.object_raw!);
                if(ret.err){
                    console.error('PerfDecoder 获取object raw失败！');
                } else {
                    const [item, _] = ret.unwrap();
                    const object_id = item.desc().calculate_id();

                    console.info(`will put_object: id=${object_id}, target=${target}`);

                    const object_raw = item.to_vec().unwrap();
                    const req = {
                        common: {
                            dec_id: this.dec_app_id.object_id,
                            target,
                            flags: 0,
                            level: NONAPILevel.Router
                        },
                        object: new NONObjectInfo(object_id, object_raw)

                    };

                    const put_ret = await this.stack.non_service().put_object(req);

                    if (put_ret.err) {
                        console.error(`send perf router failed, id ${object_id}`)
                    } else {
                        const del_ret = await this.stack.non_service().delete_object({
                            common: {
                                level: NONAPILevel.Router,
                                flags: 0
                            },
                            object_id,
                        });

                        if(del_ret.err){
                            error('delete perf noc failed');
                        }

                        // get object
                        // {
                        //     const get_ret = await this.stack.non_service().get_object({
                        //         object_id,
                        //         common: {
                        //             level: NONAPILevel.NOC,
                        //             flags: 0
                        //         }
                        //     });
                        //     if (get_ret.err) {
                        //         console.warn(`"deleted object get_object [${object_id.to_base_58()}] failed! ${ret.err}`);
                        //     }
                        // }
                    }
                }

            }
        }

       return Ok(null)
    }
}

export class PerfIsolate {
    isolate: string;
    constructor(isolate: string) {
        this.isolate = isolate;
    }

    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    async new_isolate(isolate_id: string) : Promise<boolean> {
        return true;
    }

    async perf_begin_request(id: string , key: string) {
        perf_begin(id, key, this.isolate);
        // await this.sleep(3000);
    }

    async perf_end_request(id: string, key: string, err: number, bytes?: number) {
        perf_end(id, key, err, bytes);
    }

    async perf_acc(id: string, err: number, size?: number) {
        perf_acc(id, this.isolate, err, size);
    }

    async perf_action(id: string, err: number, name: string, value: string) {
        perf_action(id, this.isolate, err, name, value);
    }

    async perf_record(id: string, total: number, total_size?: number) {
        perf_record(id, this.isolate, total, total_size);
    }

}