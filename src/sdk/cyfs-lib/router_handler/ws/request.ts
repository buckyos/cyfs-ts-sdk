import { RouterEventResponse } from '../../events/def';
import { RouterHandlerAction } from "../action";
import { RouterHandlerCategory } from "../category";
import { RouterHandlerChain } from '../chain';


export interface RouterAddHandlerParam {
    filter: string;
    index: number,
    default_action: RouterHandlerAction;
    routine?: string;
}

export interface RouterWSAddHandlerParam {
    chain: RouterHandlerChain,
    category: RouterHandlerCategory;
    id: string;
    param: RouterAddHandlerParam;
}

export interface RouterWSRemoveHandlerParam {
    chain: RouterHandlerChain,
    category: RouterHandlerCategory;
    id: string;
}

export type RouterWSHandlerResponse = RouterEventResponse;

export interface RouterWSHandlerEventParam {
    chain: RouterHandlerChain,
    category: RouterHandlerCategory,
    id: string,
    param: string,
}

export interface RouterWSHandlerEventResponse {
    action: RouterHandlerAction,
}