import { RouterHandlerCategory } from "../category";
import { BuckyError, BuckyErrorCode, BuckyResult, Err, None, Ok, Option, Some } from "../../../cyfs-base";
import { RouterHandlerAction } from "../action";
import { WebSocketRequestHandler, WebSocketRequestManager } from "../../ws/request";
import {
    ROUTER_WS_HANDLER_CMD_ADD,
    ROUTER_WS_HANDLER_CMD_EVENT,
    ROUTER_WS_HANDLER_CMD_REMOVE,
    RouterAddHandlerParam,
    RouterWSAddHandlerParam,
    RouterWSRemoveHandlerParam,
    RouterWSHandlerEventParam,
    RouterWSHandlerEventResponse,
    RouterWSHandlerResponse
} from "./request";
import { WebSocketSession } from "../../ws/session";
import { WebSocketClient } from "../../ws/client";
import { RouterHandlerAnyRoutine, RouterHandlerEventRoutineT } from "../handler";
import { EventListenerAsyncRoutine } from '../../base/event';


class RouterHandlerItem {
    constructor(
        public category: RouterHandlerCategory,
        public index: number,
        public id: string,
        private filter: string,
        private default_action: RouterHandlerAction,
        private routine: Option<RouterHandlerAnyRoutine>,
    ) {
    }

    set_routine(routine: Option<RouterHandlerAnyRoutine>) {
        this.routine = routine;
    }

    async emit(param: string): Promise<BuckyResult<RouterHandlerAction>> {
        if (this.routine.is_none()) {
            console.error('emit on_pre_put_to_noc event but routine is none!');
            return Ok(this.default_action);
        }

        let ret;
        try {
            ret = await this.routine.unwrap().emit(param);
        } catch (error) {
            const msg = `emit handler routine error! id=${this.id}, param=${param}, err=${error.toString()}`;
            console.error(msg);

            return Err(new BuckyError(BuckyErrorCode.Failed, msg));
        }

        return ret;
    }

    async register(requestor: WebSocketRequestManager) {
        console.log(`ws will add handler: id=${this.id}, sid=${requestor.sid}, routine=${this.routine.is_some()}`);
        const param: RouterAddHandlerParam = {
            filter: this.filter,
            index: this.index,
            default_action: this.default_action,
        };

        if (this.routine.is_some()) {
            param.routine = requestor.sid.toString();
        }

        const req: RouterWSAddHandlerParam = {
            category: this.category,
            id: this.id.toString(),
            param,
        }

        const msg = JSON.stringify(req);
        const ret = await requestor.post_req(ROUTER_WS_HANDLER_CMD_ADD, msg);
        if (ret.err) {
            console.error(`ws add handler failed! category=${req.category}, id=${req.id}, ${ret}`);
        } else {
            console.info(`ws add handler success: id=${req.id}`);
        }
    }
}

export class RouterHandlerUnregisterItem {
    constructor(private category: RouterHandlerCategory, public id: string) {

    }

    async unregister(requestor: WebSocketRequestManager): Promise<BuckyResult<boolean>> {
        console.log(`ws will remove handler: category=${this.category}, id=${this.id}, sid=${requestor.sid}`);

        const req: RouterWSRemoveHandlerParam = {
            category: this.category,
            id: this.id,
        };

        const msg = JSON.stringify(req);
        const resp = await requestor.post_req(ROUTER_WS_HANDLER_CMD_REMOVE, msg);

        const respJSON: RouterWSHandlerResponse = JSON.parse(resp.unwrap());
        if (respJSON.err === 0) {
            console.log(`ws remove handler success! category=${this.category}, id=${this.id}`);
            return Ok(true);
        } else {
            console.warn(`ws remove handler failed! category=${this.category}, id=${this.id}, ${respJSON}`);
            return Ok(false);
        }
    }
}

export class RouterWSHandlerHandlerManagerImpl {
    handlers: { [name: string]: RouterHandlerItem } = {};
    unregister_handlers: { [name: string]: RouterHandlerUnregisterItem } = {};
    session: Option<WebSocketSession> = None;

    get_handler(handler_id: string): RouterHandlerItem {
        return this.handlers[handler_id];
    }

    async add_handler(handler_item: RouterHandlerItem): Promise<BuckyResult<void>> {
        if (this.handlers[handler_item.id]) {
            console.error(`router handler already exists! id=${handler_item.id}`);
            return Err(BuckyError.from(BuckyErrorCode.AlreadyExists));
        }

        console.info(`will add router handler item: id=${handler_item.id}, item=`, handler_item);

        this.handlers[handler_item.id] = handler_item;
        if (this.session.is_some()) {
            const session = this.session.unwrap();
            await handler_item.register(session.requestor!);
        }

        return Ok(void (0));
    }

    static async remove_handler(manager: RouterWSHandlerHandlerManagerImpl, category: RouterHandlerCategory, id: string): Promise<BuckyResult<boolean>> {
        const unregister_item = manager.remove_handler_op(category, id);
        if (manager.session.is_some()) {
            return unregister_item.unregister(manager.session.unwrap().requestor!);
        } else {
            const msg = `remove ws router handler but not connect: category=${category}, id=${id}`;
            console.warn(msg);

            return Err(new BuckyError(BuckyErrorCode.NotConnected, msg));
        }
    }

    remove_handler_op(category: RouterHandlerCategory, id: string): RouterHandlerUnregisterItem {
        const ret = this.handlers[id];
        delete this.handlers[id];
        if (ret) {
            const item = ret;
            console.assert(item.category === category);
            console.assert(item.id === id);
            console.log(`will remove ws router handler: category=${category}, id=${id}`);
        } else {
            console.log(`will remove ws router handler without exists: category=${category}, id=${id}`);
        }

        const unregister_item = new RouterHandlerUnregisterItem(
            category,
            id,
        );

        this.unregister_handlers[id] = unregister_item;
        return unregister_item;
    }

    static async on_event(manager: RouterWSHandlerHandlerManagerImpl, content: string): Promise<BuckyResult<Option<string>>> {
        const event: RouterWSHandlerEventParam = JSON.parse(content);
        const handler = manager.get_handler(event.id);
        if (handler == null) {
            const msg = `router ws event not found! handler_category=${event.category}, handler_id=${event.id}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.NotFound, msg));
        }

        const action = await handler.emit(event.param);
        const resp: RouterWSHandlerEventResponse = { action: action.unwrap() };
        return Ok(Some(JSON.stringify(resp)))
    }


    static async on_session_begin(manager: RouterWSHandlerHandlerManagerImpl,
        session: WebSocketSession) {
        console.log(`ws handler session begin: sid=${session.sid}`);
        console.assert(manager.session.is_none());
        manager.session = Some(session);

        await this.unregister_all(manager, session);
        await this.register_all(manager, session);
    }

    static async register_all(manager: RouterWSHandlerHandlerManagerImpl,
        session: WebSocketSession) {
        const handlers = manager.handlers;
        if (Object.keys(handlers).length === 0) {
            return;
        }

        const requestor = session.requestor!;
        for (const v of Object.values(manager.handlers)) {
            await v.register(requestor);
        }
    }

    static async unregister_all(manager: RouterWSHandlerHandlerManagerImpl,
        session: WebSocketSession) {
        const handlers = manager.handlers;
        if (Object.keys(handlers).length === 0) {
            return;
        }

        const requestor = session.requestor!;
        for (const v of Object.values(manager.unregister_handlers)) {
            const r = await v.unregister(requestor);
            if (r.ok) {
                delete manager.unregister_handlers[v.id];
            }
        }
    }

    static async on_session_end(manager: RouterWSHandlerHandlerManagerImpl,
        session: WebSocketSession) {
        console.log(`ws handler session end: sid=${session.sid}`);
        console.assert(manager.session.is_some());
        manager.session = None;
    }
}

class RouterWSHandlerRequestHandler implements WebSocketRequestHandler {
    constructor(private owner: RouterWSHandlerHandlerManagerImpl) {

    }

    async on_request(requestor: WebSocketRequestManager,
        cmd: number,
        content: string): Promise<BuckyResult<Option<string>>> {
        switch (cmd) {
            case ROUTER_WS_HANDLER_CMD_EVENT:
                return await RouterWSHandlerHandlerManagerImpl.on_event(this.owner, content);
            default:
                const msg = `unknown ws handler cmd: sid=${requestor.sid}, cmd=${cmd}`;
                console.error(msg);
                return Err(new BuckyError(BuckyErrorCode.UnSupport, msg));
        }
    }

    async on_session_begin(session: WebSocketSession) {
        await RouterWSHandlerHandlerManagerImpl.on_session_begin(this.owner, session);
    }

    async on_session_end(session: WebSocketSession) {
        await RouterWSHandlerHandlerManagerImpl.on_session_end(this.owner, session);
    }

    clone_handler(): WebSocketRequestHandler {
        return this;
    }
}

export class RouterHandlerWSHandlerManager {
    manager = new RouterWSHandlerHandlerManagerImpl();
    client: WebSocketClient;
    constructor(private service_url: string) {
        const handler = new RouterWSHandlerRequestHandler(this.manager);
        this.client = new WebSocketClient(service_url, handler);
    }

    start() {
        this.client.start();
    }

    async add_handler(
        id: string,
        index: number,
        category: RouterHandlerCategory,
        filter: string,
        default_action: RouterHandlerAction,
        routine: Option<EventListenerAsyncRoutine<RouterHandlerAction>>): Promise<BuckyResult<void>> {
        const handler_item = new RouterHandlerItem(
            category,
            index,
            id,
            filter,
            default_action,
            None,
        );

        if (routine.is_some()) {
            handler_item.set_routine(Some(new RouterHandlerEventRoutineT(routine.unwrap())));
        }

        return this.manager.add_handler(handler_item);
    }

    async remove_handler(category: RouterHandlerCategory, id: string): Promise<BuckyResult<boolean>> {
        return RouterWSHandlerHandlerManagerImpl.remove_handler(this.manager, category, id);
    }
}
