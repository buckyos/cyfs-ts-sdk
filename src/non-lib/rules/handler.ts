import { None, Option, Some, BuckyResult } from "../../cyfs-base";
import { RouterRuleWSHandlerManager } from "./ws/handler";
import { ObjectStackEventType } from "../stack/stack";
import { EventListenerAsyncRoutine } from "../base/event";
import { RouterAction } from "./action";
import { RouterEventFilter } from "./filter";
import { RouterRuleCategory } from "./category";

export interface RouterRuleAnyRoutine {
    emit(param: string): Promise<BuckyResult<RouterAction>>;
}

export class RouterRuleEventRoutineT implements RouterRuleAnyRoutine {
    constructor(private listener: EventListenerAsyncRoutine<RouterAction>) {

    }

    async emit(param: string): Promise<BuckyResult<RouterAction>> {
        const p = JSON.parse(param);
        return this.listener.call(p);
    }
}

export class RouterRuleManager {
    // http: Option<RouterRuleHttpHandlerManager> = None;
    ws: Option<RouterRuleWSHandlerManager> = None;

    constructor(event_type: ObjectStackEventType, ws_url?: string) {
        switch (event_type) {
            case ObjectStackEventType.Http:
                throw new Error('ts sdk not support ObjectStackEventType.Http');
            case ObjectStackEventType.WebSocket:
                console.assert(ws_url);
                const ws = new RouterRuleWSHandlerManager(ws_url!);
                ws.start();
                this.ws = Some(ws);
                break;
            default:
                console.warn('unknown event type', event_type);
                break;
        }
    }

    add_rule(id: string,
        category: RouterRuleCategory,
        filter: RouterEventFilter,
        default_action: RouterAction,
        routine: Option<EventListenerAsyncRoutine<RouterAction>>) {
        if (this.ws.is_some()) {
            return this.ws.unwrap().add_rule(id, category, filter, default_action, routine);
        } else {
            throw new Error('add_rule require ws');
        }
    }

    remove_rule(category: RouterRuleCategory, id: string) {
        if (this.ws.is_some()) {
            return this.ws.unwrap().remove_rule(category, id);
        } else {
            throw new Error('remove_rule require ws');
        }
    }
}