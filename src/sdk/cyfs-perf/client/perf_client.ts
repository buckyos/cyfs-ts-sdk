import {
    DeviceId,
    ObjectId,
    Option,
} from "../../cyfs-base";

import { PerfIsolate } from "./isolate";
import { SharedCyfsStack } from "../../cyfs-lib";

export class PerfClient {
    id: string
    version: string
    span_times: number[]
    dec_id: Option<ObjectId>
    stack: SharedCyfsStack
    people_id: ObjectId
    device_id: DeviceId
    isolates: Map<string, PerfIsolate>

    constructor(id: string, version: string, span_times: number[], dec_id: Option<ObjectId>, stack: SharedCyfsStack, people_id: ObjectId, device_id: DeviceId) {
        this.id = id;
        this.version = version;
        this.span_times = span_times;
        this.dec_id = dec_id;
        this.stack = stack;
        this.people_id = people_id;
        this.device_id = device_id;
        this.isolates = new Map<string, PerfIsolate>();
    }

    static async new(id: string, version: string, span_duration: number, dec_id: Option<ObjectId>, stack: SharedCyfsStack): Promise<PerfClient> {
        const device_id = stack.local_device_id();
        const resp = (await stack.util().get_zone({
            common: {
                flags: 0
            }
        })).unwrap()
        const people_id = resp.zone.owner();

        console.info(`people=${people_id}, device=${device_id}, dec_id=${dec_id}`);

        if (span_duration < 1 || span_duration >= 1440) {
            console.error(`span_time=${span_duration} must be [1, 1440)`);
            span_duration = 60;  // 默认1小时聚合
        }

        const span_times: number[] = [];

        //以0为起点, 聚合时间为分段, 有序数组time, 当前要写的时间判断下是否大于数组中的元素就行了
        for(let span_time = 0; span_time < 1440; span_time += span_duration) {
            span_times.push(span_time);
        }

        const perf_client = new PerfClient(id, version, span_times, dec_id, stack, people_id, device_id);
        return perf_client;
    }

    is_isolates_exists(isolate_id: string) : boolean {
        return this.isolates.has(isolate_id);
    }

    new_isolate(id: string) : PerfIsolate {
        if (this.is_isolates_exists(id)) {
            return this.isolates.get(id)!;
        } else {
            const isolate = new PerfIsolate(id, this.span_times, this.people_id, this.device_id, this.dec_id, this.id, this.stack);
            this.isolates.set(id, isolate);

            return isolate;
        }
    }
    get_isolate(id: string) : PerfIsolate | undefined {
        return this.isolates.get(id);
    }

}