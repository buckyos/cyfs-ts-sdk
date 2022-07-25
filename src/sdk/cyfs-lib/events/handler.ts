import { BuckyResult, EventListenerAsyncRoutineT, ObjectId, Ok } from "../../cyfs-base";
import { JsonCodec } from "../base/codec";
import { CyfsStackEventType } from "../stack/stack";
import { RouterEventCategory } from "./def";
import { EmptyEventParamJsonCodec, RouterEventRequest, RouterEventRequestJsonCodec, RouterEventResponse, RouterEventResponseJsonCodec, RouterEventTestEventRoutine, RouterEventZoneRoleChangedEventRoutine, ZoneRoleChangedEventRequestJsonCodec } from './request'
import { RouterWSEventManager } from "./ws/manager";


export interface RouterEventAnyRoutine {
    emit(param: string): Promise<BuckyResult<string>>;
}

export class RouterEventRoutineT<REQ, RESP> implements RouterEventAnyRoutine {
    private request_codec: RouterEventRequestJsonCodec<REQ>;
    private result_codec: RouterEventResponseJsonCodec<RESP>;
   
    constructor(
        req_codec: JsonCodec<REQ>,
        resp_codec: JsonCodec<RESP>,
        private listener: EventListenerAsyncRoutineT<RouterEventRequest<REQ>, RouterEventResponse<RESP>>) {

        this.request_codec = new RouterEventRequestJsonCodec<REQ>(req_codec);
        this.result_codec = new RouterEventResponseJsonCodec<RESP>(resp_codec);
    }

    async emit(param: string): Promise<BuckyResult<string>> {
        let p: RouterEventRequest<REQ>;
        {
            const ret = this.request_codec.decode_string(param);
            if (ret.err) {
                return ret;
            }
            p = ret.unwrap();
        }

        const result = await this.listener.call(p);
        if (result.err) {
            return result;
        }

        return Ok(this.result_codec.encode_string(result.unwrap()));
    }
}

export class RouterEventManager {
    // http: Option<RouterEventHttpHandlerManager> = None;
    ws?: RouterWSEventManager;

    constructor(event_type: CyfsStackEventType, ws_url?: string, private dec_id?: ObjectId) {
        switch (event_type) {
            case CyfsStackEventType.Http:
                // 暂时不支持http回调模式
                throw new Error('ts sdk not support CyfsStackEventType.Http');
            case CyfsStackEventType.WebSocket:
                console.assert(ws_url);
                const ws = new RouterWSEventManager(ws_url!);
                ws.start();
                this.ws = ws;
                break;
            default:
                console.warn('unknown event type', event_type);
                break;
        }
    }

    get_dec_id(): ObjectId|undefined {
        return this.dec_id
    }

    async add_test_event(
        id: string,
        index: number,
        routine: RouterEventTestEventRoutine
    ): Promise<BuckyResult<void>> {
        const req_codec = new EmptyEventParamJsonCodec();
        const resp_codec = new EmptyEventParamJsonCodec();

        return await this.add_event(id, index, RouterEventCategory.TestEvent, req_codec, resp_codec, routine);
    }

    async add_zone_role_changed_event(
        id: string,
        index: number,
        routine: RouterEventZoneRoleChangedEventRoutine
    ): Promise<BuckyResult<void>> {
        const req_codec = new ZoneRoleChangedEventRequestJsonCodec();
        const resp_codec = new EmptyEventParamJsonCodec();

        return await this.add_event(id, index, RouterEventCategory.ZoneRoleChanged, req_codec, resp_codec, routine);
    }

    async add_event<REQ, RESP>(
        id: string,
        index: number,
        category: RouterEventCategory,
        req_codec: JsonCodec<REQ>,
        resp_codec: JsonCodec<RESP>,
        routine: EventListenerAsyncRoutineT<RouterEventRequest<REQ>, RouterEventResponse<RESP>>
    ): Promise<BuckyResult<void>> {
        if (this.ws) {
            return await this.ws.add_event(id, this.get_dec_id(), index, category, req_codec, resp_codec, routine);
        } else {
            throw new Error('router handler require ws');
        }
    }

    async remove_event(category: RouterEventCategory, id: string): Promise<BuckyResult<boolean>> {
        if (this.ws) {
            return await this.ws.remove_event(category, id);
        } else {
            throw new Error('remove_handler require ws');
        }
    }
}