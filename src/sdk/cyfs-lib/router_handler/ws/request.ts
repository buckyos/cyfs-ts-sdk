import { BuckyResult, ObjectId, Ok } from '../../../cyfs-base';
import { JsonCodec, JsonCodecHelper } from '../../base/codec';
import { RouterHandlerAction, RouterHandlerCategory, RouterHandlerChain } from "../def";

export interface RouterAddHandlerParam {
    filter?: string;
    req_path?: string;
    index: number,
    default_action: RouterHandlerAction;
    routine?: string;
}

export interface RouterWSAddHandlerParam {
    chain: RouterHandlerChain,
    category: RouterHandlerCategory;
    id: string;
    dec_id?: ObjectId,
    param: RouterAddHandlerParam;
}

export interface RouterWSRemoveHandlerParam {
    chain: RouterHandlerChain,
    category: RouterHandlerCategory;
    id: string;
    dec_id?: ObjectId,
}

export interface RouterWSHandlerEventParam {
    chain: RouterHandlerChain,
    category: RouterHandlerCategory,
    id: string,
    param: string,
}

export interface RouterWSHandlerEventResponse {
    action: RouterHandlerAction,
}

export interface RouterWSHandlerResponse {
    err: number;
    msg?: string;
}

export class RouterWSHandlerResponseJsonCodec extends JsonCodec<RouterWSHandlerResponse> {
    public decode_object(o: any): BuckyResult<RouterWSHandlerResponse> {
        const ret = JsonCodecHelper.decode_number(o.err);
        if (ret.err) {
            return ret;
        }

        const resp: RouterWSHandlerResponse = {
            err: ret.unwrap(),
            msg: o.msg as string,
        };

        return Ok(resp);
    }
}