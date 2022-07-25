import { BuckyResult, ObjectId, Ok } from "../../../cyfs-base";
import { JsonCodec } from "../../base/codec";
import { RouterWSHandlerResponse } from "../../router_handler/ws/request";
import { RouterEventCategory } from "../def";

export interface RouterWSAddEventParam {
    category: RouterEventCategory,
    id: string,
    dec_id?: ObjectId,
    index: number,
    routine: string,
}

export interface RouterWSRemoveEventParam {
    category: RouterEventCategory,
    id: string,
    dec_id?: ObjectId,
}

export class RouterWSAddEventParamJsonCodec extends JsonCodec<RouterWSAddEventParam> {
    encode_object(param: RouterWSAddEventParam): any {
        const ret: any = {
            category: param.category,
            id: param.id,
            index: param.index,
            routine: param.routine
        }
        if (param.dec_id) {
            ret.dec_id = param.dec_id.to_base_58()
        }

        return ret;
    }

    decode_object(o: any): BuckyResult<RouterWSAddEventParam> {
        const ret: RouterWSAddEventParam= {
            category: o.category as RouterEventCategory,
            id: o.id,
            index: o.index,
            routine: o.routine
        }

        if (o.dec_id) {
            const r = ObjectId.from_base_58(o.dec_id);
            if (r.err) {
                return r;
            }

            ret.dec_id = r.unwrap()
        }

        return Ok(ret)
    }
}

export class RouterWSRemoveEventParamJsonCodec extends JsonCodec<RouterWSRemoveEventParam> {
    encode_object(param: RouterWSRemoveEventParam): any {
        const ret: any = {
            category: param.category,
            id: param.id,
        }
        if (param.dec_id) {
            ret.dec_id = param.dec_id.to_base_58()
        }

        return ret;
    }

    decode_object(o: any): BuckyResult<RouterWSRemoveEventParam> {
        const ret: RouterWSRemoveEventParam = {
            category: o.category as RouterEventCategory,
            id: o.id,
        }

        if (o.dec_id) {
            const r = ObjectId.from_base_58(o.dec_id);
            if (r.err) {
                return r;
            }

            ret.dec_id = r.unwrap()
        }

        return Ok(ret)
    }
}

export type RouterWSEventResponse = RouterWSHandlerResponse;

export interface RouterWSEventEmitParam {
    category: RouterEventCategory,
    id: string,
    param: string,
}

export class RouterWSEventEmitParamJsonCodec extends JsonCodec<RouterWSEventEmitParam> {}