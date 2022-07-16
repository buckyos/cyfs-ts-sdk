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
    dec_id: Option<ObjectId>
    stack: SharedCyfsStack
    people_id: ObjectId
    device_id: DeviceId
    isolates: Map<string, PerfIsolate>

    constructor(id: string, version: string, dec_id: Option<ObjectId>, stack: SharedCyfsStack, people_id: ObjectId, device_id: DeviceId) {
        this.id = id;
        this.version = version;
        this.dec_id = dec_id;
        this.stack = stack;
        this.people_id = people_id;
        this.device_id = device_id;
        this.isolates = new Map<string, PerfIsolate>();
    }

    static async new(id: string, version: string, dec_id: Option<ObjectId>, stack: SharedCyfsStack): Promise<PerfClient> {
        const device_id = stack.local_device_id();
        const resp = (await stack.util().get_zone({
            common: {
                flags: 0
            }
        })).unwrap()
        const people_id = resp.zone.owner();

        console.info(`people=${people_id}, device=${device_id}, dec_id=${dec_id}`);

        const perf_client = new PerfClient(id, version, dec_id, stack, people_id, device_id);
        return perf_client;
    }

    is_isolates_exists(isolate_id: string) : boolean {
        return this.isolates.has(isolate_id);
    }

    new_isolate(id: string) : PerfIsolate {
        if (this.is_isolates_exists(id)) {
            return this.isolates.get(id)!;
        } else {
            const isolate = new PerfIsolate(id, this.people_id, this.device_id, this.dec_id, this.id, this.stack);
            this.isolates.set(id, isolate);

            return isolate;
        }
    }
    get_isolate(id: string) : PerfIsolate | undefined {
        return this.isolates.get(id);
    }

}