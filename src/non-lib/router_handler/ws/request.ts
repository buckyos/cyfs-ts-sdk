import { RouterHandlerAction } from "../action";
import { RouterHandlerCategory } from "../category";

// CMD=0表示是response，大于0表示request
export const ROUTER_WS_HANDLER_CMD_ADD = 11;
export const ROUTER_WS_HANDLER_CMD_REMOVE = 12;
export const ROUTER_WS_HANDLER_CMD_EVENT = 13;

export interface RouterAddHandlerParam {
    filter: string;
    index: number,
    default_action: RouterHandlerAction;
    routine?: string;
}

export interface RouterWSAddHandlerParam {
    category: RouterHandlerCategory;
    id: string;
    param: RouterAddHandlerParam;
}

export interface RouterWSRemoveHandlerParam {
    category: RouterHandlerCategory;

    id: string;
}

export interface RouterHandlerResponse {
    err: number;
    msg: string;
}

export type RouterWSHandlerResponse = RouterHandlerResponse;

export interface RouterWSHandlerEventParam {
    category: RouterHandlerCategory,
    id: string,
    param: string,
}

export interface RouterWSHandlerEventResponse {
    action: RouterHandlerAction,
}