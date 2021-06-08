import { RouterRuleCategory } from "../category";
import { BuckyError, BuckyErrorCode, BuckyResult, Err, None, Ok, Option, Some } from "../../../cyfs-base";
import { RouterEventFilter } from "../filter";
import { RouterAction } from "../action";
import { WebSocketRequestHandler, WebSocketRequestManager } from "../../ws/request";
import {
    ROUTER_WS_RULE_CMD_ADD,
    ROUTER_WS_RULE_CMD_EVENT,
    ROUTER_WS_RULE_CMD_REMOVE,
    RouterAddRuleParam,
    RouterWSAddRuleParam,
    RouterWSRemoveRuleParam,
    RouterWSRuleEventParam,
    RouterWSRuleEventResponse,
    RouterWSRuleResponse
} from "./request";
import { WebSocketSession } from "../../ws/session";
import { WebSocketClient } from "../../ws/client";
import { RouterRuleAnyRoutine, RouterRuleEventRoutineT } from "../handler";
import { EventListenerAsyncRoutine } from '../../base/event';


class RouterRuleItem {
    constructor(
        public category: RouterRuleCategory,
        public id: string,
        private filter: RouterEventFilter,
        private default_action: RouterAction,
        private routine: Option<RouterRuleAnyRoutine>,
    ) {
    }

    set_routine(routine: Option<RouterRuleAnyRoutine>) {
        this.routine = routine;
    }

    async emit(param: string): Promise<BuckyResult<RouterAction>> {
        if (this.routine.is_none()) {
            console.error('emit on_pre_put_to_noc event but routine is none!');
            return Ok(this.default_action);
        }

        let ret;
        try {
            ret = await this.routine.unwrap().emit(param);
        } catch (error) {
            const msg = `emit rule routine error! id=${this.id}, param=${param}, err=${error.toString()}`;
            console.error(msg);

            return Err(new BuckyError(BuckyErrorCode.Failed, msg));
        }

        return ret;
    }

    async register(requestor: WebSocketRequestManager) {
        console.log(`ws will add rule: id=${this.id}, sid=${requestor.sid}, routine=${this.routine.is_some()}`);
        const param: RouterAddRuleParam = {
            filter: this.filter,
            default_action: this.default_action,

        };

        if (this.routine.is_some()) {
            param.routine = requestor.sid.toString();
        }

        const req: RouterWSAddRuleParam = {
            category: this.category,
            id: this.id.toString(),
            param,
        }

        const msg = JSON.stringify(req);
        const ret = await requestor.post_req(ROUTER_WS_RULE_CMD_ADD, msg);
        if (ret.err) {
            console.error(`ws add rule failed! category=${req.category}, id=${req.id}, ${ret}`);
        } else {
            console.info(`ws add rule success: id=${req.id}`);
        }
    }
}

export class RouterRuleUnregisterItem {
    constructor(private category: RouterRuleCategory, public id: string) {

    }

    async unregister(requestor: WebSocketRequestManager): Promise<BuckyResult<boolean>> {
        console.log(`ws will remove rule: category=${this.category}, id=${this.id}, sid=${requestor.sid}`);

        const req: RouterWSRemoveRuleParam = {
            category: this.category,
            id: this.id,
        };

        const msg = JSON.stringify(req);
        const resp = await requestor.post_req(ROUTER_WS_RULE_CMD_REMOVE, msg);

        const respJSON: RouterWSRuleResponse = JSON.parse(resp.unwrap());
        if (respJSON.err === 0) {
            console.log(`ws remove rule success! category=${this.category}, id=${this.id}`);
            return Ok(true);
        } else {
            console.warn(`ws remove rule failed! category=${this.category}, id=${this.id}, ${respJSON}`);
            return Ok(false);
        }
    }
}

export class RouterWSRuleHandlerManagerImpl {
    rules: { [name: string]: RouterRuleItem } = {};
    unregister_rules: { [name: string]: RouterRuleUnregisterItem } = {};
    session: Option<WebSocketSession> = None;

    get_rule(rule_id: string): RouterRuleItem {
        return this.rules[rule_id];
    }

    async add_rule(rule_item: RouterRuleItem): Promise<BuckyResult<void>> {
        if (this.rules[rule_item.id]) {
            console.error(`router rule already exists! id=${rule_item.id}`);
            return Err(BuckyError.from(BuckyErrorCode.AlreadyExists));
        }

        console.info(`will add router rule item: id=${rule_item.id}, item=`, rule_item);

        this.rules[rule_item.id] = rule_item;
        if (this.session.is_some()) {
            const session = this.session.unwrap();
            await rule_item.register(session.requestor!);
        }

        return Ok(void (0));
    }

    static async remove_rule(manager: RouterWSRuleHandlerManagerImpl, category: RouterRuleCategory, id: string): Promise<BuckyResult<boolean>> {
        const unregister_item = manager.remove_rule_op(category, id);
        if (manager.session.is_some()) {
            return unregister_item.unregister(manager.session.unwrap().requestor!);
        } else {
            const msg = `remove ws router rule but not connect: category=${category}, id=${id}`;
            console.warn(msg);

            return Err(new BuckyError(BuckyErrorCode.NotConnected, msg));
        }
    }

    remove_rule_op(category: RouterRuleCategory, id: string): RouterRuleUnregisterItem {
        const ret = this.rules[id];
        delete this.rules[id];
        if (ret) {
            const item = ret;
            console.assert(item.category === category);
            console.assert(item.id === id);
            console.log(`will remove ws router rule: category=${category}, id=${id}`);
        } else {
            console.log(`will remove ws router rule without exists: category=${category}, id=${id}`);
        }

        const unregister_item = new RouterRuleUnregisterItem(
            category,
            id,
        );

        this.unregister_rules[id] = unregister_item;
        return unregister_item;
    }

    static async on_event(manager: RouterWSRuleHandlerManagerImpl, content: string): Promise<BuckyResult<Option<string>>> {
        const event: RouterWSRuleEventParam = JSON.parse(content);
        const rule = manager.get_rule(event.id);
        if (rule == null) {
            const msg = `router ws event not found! rule_category=${event.category}, rule_id=${event.id}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.NotFound, msg));
        }

        const action = await rule.emit(event.param);
        const resp: RouterWSRuleEventResponse = { action: action.unwrap() };
        return Ok(Some(JSON.stringify(resp)))
    }


    static async on_session_begin(manager: RouterWSRuleHandlerManagerImpl,
        session: WebSocketSession) {
        console.log(`ws rule session begin: sid=${session.sid}`);
        console.assert(manager.session.is_none());
        manager.session = Some(session);

        await this.unregister_all(manager, session);
        await this.register_all(manager, session);
    }

    static async register_all(manager: RouterWSRuleHandlerManagerImpl,
        session: WebSocketSession) {
        const rules = manager.rules;
        if (Object.keys(rules).length === 0) {
            return;
        }

        const requestor = session.requestor!;
        for (const v of Object.values(manager.rules)) {
            await v.register(requestor);
        }
    }

    static async unregister_all(manager: RouterWSRuleHandlerManagerImpl,
        session: WebSocketSession) {
        const rules = manager.rules;
        if (Object.keys(rules).length === 0) {
            return;
        }

        const requestor = session.requestor!;
        for (const v of Object.values(manager.unregister_rules)) {
            const r = await v.unregister(requestor);
            if (r.ok) {
                delete manager.unregister_rules[v.id];
            }
        }
    }

    static async on_session_end(manager: RouterWSRuleHandlerManagerImpl,
        session: WebSocketSession) {
        console.log(`ws rule session end: sid=${session.sid}`);
        console.assert(manager.session.is_some());
        manager.session = None;
    }
}

class RouterWSRuleRequestHandler implements WebSocketRequestHandler {
    constructor(private owner: RouterWSRuleHandlerManagerImpl) {

    }

    async on_request(requestor: WebSocketRequestManager,
        cmd: number,
        content: string): Promise<BuckyResult<Option<string>>> {
        switch (cmd) {
            case ROUTER_WS_RULE_CMD_EVENT:
                return await RouterWSRuleHandlerManagerImpl.on_event(this.owner, content);
            default:
                const msg = `unknown ws rule cmd: sid=${requestor.sid}, cmd=${cmd}`;
                console.error(msg);
                return Err(new BuckyError(BuckyErrorCode.UnSupport, msg));
        }
    }

    async on_session_begin(session: WebSocketSession) {
        await RouterWSRuleHandlerManagerImpl.on_session_begin(this.owner, session);
    }

    async on_session_end(session: WebSocketSession) {
        await RouterWSRuleHandlerManagerImpl.on_session_end(this.owner, session);
    }

    clone_handler(): WebSocketRequestHandler {
        return this;
    }
}

export class RouterRuleWSHandlerManager {
    manager = new RouterWSRuleHandlerManagerImpl();
    client: WebSocketClient;
    constructor(private service_url: string) {
        const handler = new RouterWSRuleRequestHandler(this.manager);
        this.client = new WebSocketClient(service_url, handler);
    }

    start() {
        this.client.start();
    }

    async add_rule(id: string,
        category: RouterRuleCategory,
        filter: RouterEventFilter,
        default_action: RouterAction,
        routine: Option<EventListenerAsyncRoutine<RouterAction>>): Promise<BuckyResult<void>> {
        const rule_item = new RouterRuleItem(
            category,
            id,
            filter,
            default_action,
            None,
        );

        if (routine.is_some()) {
            rule_item.set_routine(Some(new RouterRuleEventRoutineT(routine.unwrap())));
        }

        return this.manager.add_rule(rule_item);
    }

    async remove_rule(category: RouterRuleCategory, id: string): Promise<BuckyResult<boolean>> {
        return RouterWSRuleHandlerManagerImpl.remove_rule(this.manager, category, id);
    }
}
