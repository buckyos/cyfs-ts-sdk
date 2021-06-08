import {RouterEventFilter} from "../filter";
import {RouterAction} from "../action";
import {RouterRuleCategory} from "../category";

// CMD=0表示是response，大于0表示request
export const ROUTER_WS_RULE_CMD_ADD = 1;
export const ROUTER_WS_RULE_CMD_REMOVE = 2;
export const ROUTER_WS_RULE_CMD_EVENT = 3;

export interface RouterAddRuleParam {
    filter: RouterEventFilter;
    default_action: RouterAction;
    routine?: string;
}

export interface RouterWSAddRuleParam {
    category: RouterRuleCategory;
    id: string;
    param: RouterAddRuleParam;
}

export interface RouterWSRemoveRuleParam {
    category: RouterRuleCategory;

    id: String;
}

export interface RouterRuleResponse {
    err: number;
    msg: string;
}

export type RouterWSRuleResponse = RouterRuleResponse;

export interface RouterWSRuleEventParam {
    category: RouterRuleCategory,
    id: string,
    param: string,
}

export interface RouterWSRuleEventResponse {
    action: RouterAction,
}