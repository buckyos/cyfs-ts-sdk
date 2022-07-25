/* eslint-disable @typescript-eslint/no-empty-interface */
import {BuckyError, BuckyErrorCode, BuckyResult, Err, EventListenerAsyncRoutineT, Ok} from '../../cyfs-base'
import { BuckyResultJsonCodec, JsonCodec } from '../base/codec';
import { ZoneRole } from '../zone/def';


export interface RouterEventRequest<REQ> {
    request: REQ,
}

export interface RouterEventResponse<RESP> {
    handled: boolean,
    call_next: boolean,
    response?: BuckyResult<RESP>,
}

export class RouterEventRequestJsonCodec<REQ> extends JsonCodec<RouterEventRequest<REQ>> {
    constructor(private req_codec: JsonCodec<REQ>) {
        super();
    }

    public encode_object(param: RouterEventRequest<REQ>): any {
        const o: any = {
        };

        o.request = this.req_codec.encode_object(param.request);

        return o;
    }

    public decode_object(o: any): BuckyResult<RouterEventRequest<REQ>> {
        let request: REQ | undefined;

        if (o.request) {
            const ret = this.req_codec.decode_object(o.request);
            if (ret.err) {
                return ret;
            }

            request = ret.unwrap();
        } else {
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid router event request: ${o}`));
        }

        const result: RouterEventRequest<REQ> = {
            request
        };

        return Ok(result);
    }
}

export class RouterEventResponseJsonCodec<RESP> extends JsonCodec<RouterEventResponse<RESP>> {
    constructor(private resp_codec: JsonCodec<RESP>) {
        super();
    }

    public encode_object(param: RouterEventResponse<RESP>): any {
        const o: any = {
            handled: param.handled,
            call_next: param.call_next
        };

        if (param.response != null) {
            const codec = new BuckyResultJsonCodec(this.resp_codec);
            o.response = codec.encode_object(param.response);
        }

        return o;
    }

    public decode_object(o: any): BuckyResult<RouterEventResponse<RESP>> {
        let response: BuckyResult<RESP> | undefined;

        if (o.response) {
            const codec = new BuckyResultJsonCodec(this.resp_codec);
            const ret = codec.decode_object(o.response);
            if (ret.err) {
                return ret;
            }

            response = ret.unwrap();
        }

        const result: RouterEventResponse<RESP> = {
            handled: o.handled,
            call_next: o.call_next,
            response,
        };

        return Ok(result);
    }
}

export interface EmptyEventParam {

}

export class EmptyEventParamJsonCodec extends JsonCodec<EmptyEventParam> {

}

// zone role changed
export interface ZoneRoleChangedEventRequest {
    current_role: ZoneRole,
    new_role: ZoneRole,
}

// request
export type RouterEventTestEventRequest = RouterEventRequest<EmptyEventParam>;

// response
export type RouterEventTestEventResult = RouterEventResponse<EmptyEventParam>;

export class ZoneRoleChangedEventRequestJsonCodec extends JsonCodec<ZoneRoleChangedEventRequest> {

}

// request
export type RouterEventZoneRoleChangedEventRequest = RouterEventRequest<ZoneRoleChangedEventRequest>;

// response
export type RouterEventZoneRoleChangedEventResult = RouterEventResponse<EmptyEventParam>;

export type RouterEventTestEventRoutine = EventListenerAsyncRoutineT<RouterEventTestEventRequest, RouterEventTestEventResult>;
export type RouterEventZoneRoleChangedEventRoutine = EventListenerAsyncRoutineT<RouterEventZoneRoleChangedEventRequest, RouterEventZoneRoleChangedEventResult>;