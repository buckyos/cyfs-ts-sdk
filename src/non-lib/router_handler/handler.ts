import { None, Option, Some, BuckyResult } from "../../cyfs-base";
import { RouterHandlerWSHandlerManager } from "./ws/handler";
import { ObjectStackEventType } from "../stack/stack";
import { EventListenerAsyncRoutine } from "../base/event";
import { RouterHandlerAction } from "./action";
import { RouterHandlerCategory } from "./category";

export interface RouterHandlerAnyRoutine {
    emit(param: string): Promise<BuckyResult<RouterHandlerAction>>;
}

export class RouterHandlerEventRoutineT implements RouterHandlerAnyRoutine {
    constructor(private listener: EventListenerAsyncRoutine<RouterHandlerAction>) {

    }

    async emit(param: string): Promise<BuckyResult<RouterHandlerAction>> {
        const p = JSON.parse(param);
        return this.listener.call(p);
    }
}

export class RouterHandlerManager {
    // http: Option<RouterHandlerHttpHandlerManager> = None;
    ws: Option<RouterHandlerWSHandlerManager> = None;

    constructor(event_type: ObjectStackEventType, ws_url?: string) {
        switch (event_type) {
            case ObjectStackEventType.Http:
                // 暂时不支持http回调模式
                throw new Error('ts sdk not support ObjectStackEventType.Http');
            case ObjectStackEventType.WebSocket:
                console.assert(ws_url);
                const ws = new RouterHandlerWSHandlerManager(ws_url!);
                ws.start();
                this.ws = Some(ws);
                break;
            default:
                console.warn('unknown event type', event_type);
                break;
        }
    }

    add_handler(
        id: string,
        index: number,
        category: RouterHandlerCategory,
        filter: string,
        default_action: RouterHandlerAction,
        routine: Option<EventListenerAsyncRoutine<RouterHandlerAction>>) {
        if (this.ws.is_some()) {
            return this.ws.unwrap().add_handler(id, index, category, filter, default_action, routine);
        } else {
            throw new Error('add_handler require ws');
        }
    }

    remove_handler(category: RouterHandlerCategory, id: string) {
        if (this.ws.is_some()) {
            return this.ws.unwrap().remove_handler(category, id);
        } else {
            throw new Error('remove_handler require ws');
        }
    }
}