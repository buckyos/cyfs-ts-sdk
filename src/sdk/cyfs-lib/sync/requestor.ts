import { HttpRequest } from "../base/http_request";
import { BaseRequestor, RequestorHelper } from "../base/base_requestor";
import { BuckyResult, ObjectId, Err, Ok, BuckyErrorCode, DeviceId } from "../../cyfs-base";
import JSBI from "jsbi";
import { JsonCodecHelper } from "../base/codec";
import { http_status_code_ok } from "../../util";

export interface DeviceSyncStatus {
    ood_device_id: DeviceId,
    enable_sync: boolean,

    last_success_ping_time: JSBI,
    last_ping_result: BuckyErrorCode,
    last_ping_time: JSBI,
    retry_count: number,

    device_root_state: ObjectId,
    device_root_state_revision: JSBI,

    zone_root_state?: ObjectId,
    zone_root_state_revision: JSBI,
}

export class SyncRequestor {
    service_url: string;

    constructor(private requestor: BaseRequestor, private dec_id?: ObjectId) {
        this.service_url = `http://${requestor.remote_addr()}/sync/`;
    }

    async decode_sync_status_resp(resp: Response): Promise<BuckyResult<DeviceSyncStatus>> {
        const o = await resp.json();

        let ood_device_id;
        {
            const r = DeviceId.from_base_58(o.ood_device_id)
            if (r.err) {
                return r;
            }
            ood_device_id = r.unwrap()
        }

        let last_success_ping_time;
        {
            const r = JsonCodecHelper.decode_big_int(o.last_success_ping_time)
            if (r.err) {
                return r;
            }
            last_success_ping_time = r.unwrap()
        }

        let last_ping_time;
        {
            const r = JsonCodecHelper.decode_big_int(o.last_ping_time)
            if (r.err) {
                return r;
            }
            last_ping_time = r.unwrap()
        }

        let device_root_state;
        {
            const r = ObjectId.from_base_58(o.device_root_state)
            if (r.err) {
                return r;
            }
            device_root_state = r.unwrap()
        }

        let device_root_state_revision;
        {
            const r = JsonCodecHelper.decode_big_int(o.device_root_state_revision)
            if (r.err) {
                return r;
            }
            device_root_state_revision = r.unwrap()
        }

        let zone_root_state;
        if (o.zone_root_state) {
            const r = ObjectId.from_base_58(o.zone_root_state)
            if (r.err) {
                return r;
            }
            zone_root_state = r.unwrap()
        }

        let zone_root_state_revision;
        {
            const r = JsonCodecHelper.decode_big_int(o.zone_root_state_revision)
            if (r.err) {
                return r;
            }
            zone_root_state_revision = r.unwrap()
        }


        return Ok({
            ood_device_id,
            enable_sync: o.enable_sync,

            last_success_ping_time,
            last_ping_result: o.last_ping_result as BuckyErrorCode,
            last_ping_time,
            retry_count: o.retry_count,

            device_root_state,
            device_root_state_revision,

            zone_root_state,
            zone_root_state_revision,
        })
    }

    public async sync_status(flush: boolean): Promise<BuckyResult<DeviceSyncStatus>> {
        const url = this.service_url + 'status';
        const http_req = new HttpRequest(flush?'Post':'Get', url);

        const r = await this.requestor.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (http_status_code_ok(resp.status)) {
            const status_resp = await this.decode_sync_status_resp(resp);
            if (status_resp.err) {
                return status_resp;
            }

            return Ok(status_resp.unwrap());
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            return Err(e);
        }
    }
}