import { RouterHandlerCategory } from "../category";
import { BuckyError, BuckyErrorCode, BuckyResult, Err, None, Ok, Option, Some, EventListenerAsyncRoutineT, ObjectId } from "../../../cyfs-base";
import { RouterHandlerAction } from "../action";
import { WebSocketRequestHandler, WebSocketRequestManager } from "../../ws/request";
import {
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
import { RouterHandlerRequest, RouterHandlerResponse } from '../request';
import { RouterEventResponseJsonCodec } from '../../events/def';
import { JsonCodec } from '../../base/codec';
import { RouterHandlerChain } from '../chain';
import { ROUTER_WS_HANDLER_CMD_ADD, ROUTER_WS_HANDLER_CMD_EVENT, ROUTER_WS_HANDLER_CMD_REMOVE } from '../../base/protocol';


class RouterHandlerItem {
    constructor(
        public chain: RouterHandlerChain,
        public category: RouterHandlerCategory,
        public index: number,
        public id: string,
        public dec_id: Option<ObjectId>,
        private filter: string,
        private default_action: RouterHandlerAction,
        private routine: Option<RouterHandlerAnyRoutine>,
    ) {
    }

    set_routine(routine: Option<RouterHandlerAnyRoutine>) {
        this.routine = routine;
    }

    get_dec_id(): ObjectId | undefined {
        return this.dec_id.is_some()? this.dec_id.unwrap() : undefined;
    }

    async emit(param: string): Promise<BuckyResult<string>> {
        if (this.routine.is_none()) {
            console.error(`emit on_pre_put_to_noc event but routine is none! chain=${this.chain}, category=${this.category}, id=${this.id}`);
            return Ok(this.default_action);
        }

        let ret;
        try {
            ret = await this.routine.unwrap().emit(param);
        } catch (error) {
            const msg = `emit handler routine error! chain=${this.chain}, category=${this.category}, id=${this.id}, param=${param}, err=${error.toString()}`;
            console.error(msg);

            return Err(new BuckyError(BuckyErrorCode.Failed, msg));
        }

        return ret;
    }

    async register(requestor: WebSocketRequestManager) {
        console.log(`will add ws router handler: chain=${this.chain}, category=${this.category}, id=${this.id}, index=${this.index}, sid=${requestor.sid}, routine=${this.routine.is_some()}`);
        const param: RouterAddHandlerParam = {
            filter: this.filter,
            index: this.index,
            default_action: this.default_action,
        };

        if (this.routine.is_some()) {
            param.routine = requestor.sid.toString();
        }

        const req: RouterWSAddHandlerParam = {
            chain: this.chain,
            category: this.category,
            id: this.id.toString(),
            dec_id: this.get_dec_id(),
            param,
        }

        const msg = JSON.stringify(req);
        const ret = await requestor.post_req(ROUTER_WS_HANDLER_CMD_ADD, msg);
        if (ret.err) {
            console.error(`add ws router handler error! chain=${req.chain}, category=${req.category}, id=${req.id}`, ret);
        } else {
            const codec = new RouterEventResponseJsonCodec();
            const resp: RouterWSHandlerResponse = codec.decode_string(ret.unwrap()).unwrap();
            if (resp.err !== 0) {
                console.error(`add ws router handler failed! chain=${this.chain}, category=${this.category}, id=${req.id}, err=${resp.err}, msg=${resp.msg}`);
            } else {
                console.info(`add ws router handler success! chain=${this.chain}, category=${this.category}, id=${req.id}`);
            }
        }
    }
}

export class RouterHandlerUnregisterItem {
    constructor(private chain: RouterHandlerChain, private category: RouterHandlerCategory, public id: string, public dec_id: Option<ObjectId>) {

    }

    get_dec_id(): ObjectId | undefined {
        return this.dec_id.is_some()? this.dec_id.unwrap() : undefined;
    }

    async unregister(requestor: WebSocketRequestManager): Promise<BuckyResult<boolean>> {
        console.log(`will remove ws router handler: chain=${this.chain}, category=${this.category}, id=${this.id}, sid=${requestor.sid}`);

        const req: RouterWSRemoveHandlerParam = {
            chain: this.chain,
            category: this.category,
            id: this.id,
            dec_id: this.get_dec_id(),
        };

        const msg = JSON.stringify(req);
        const ret = await requestor.post_req(ROUTER_WS_HANDLER_CMD_REMOVE, msg);
        if (ret.err) {
            console.error(`remove ws router handler error! chain=${req.chain}, category=${req.category}, id=${req.id}`, ret);
            return ret;
        } else {
            const codec = new RouterEventResponseJsonCodec();
            const resp: RouterWSHandlerResponse = codec.decode_string(ret.unwrap()).unwrap();
            if (resp.err === 0) {
                console.log(`remove ws router handler success! chain=${this.chain}, category=${this.category}, id=${this.id}`);
                return Ok(true);
            } else {
                console.warn(`remove ws router handler failed! chain=${this.chain}, category=${this.category}, id=${this.id}, ${JSON.stringify(resp)}`);
                return Ok(false);
            }
        }
    }
}

export class RouterWSHandlerHandlerManagerImpl {
    // 均使用full_id作为索引
    handlers: { [name: string]: RouterHandlerItem } = {};
    unregister_handlers: { [name: string]: RouterHandlerUnregisterItem } = {};
    session: Option<WebSocketSession> = None;

    private static gen_full_id(chain: RouterHandlerChain, category: RouterHandlerCategory, id: string): string {
        console.assert(chain != null && chain.length > 0);
        console.assert(category != null && category.length > 0);
        console.assert(id != null && id.length > 0);

        return `${chain}_${category}_${id}`;
    }

    private get_handler(full_id: string): RouterHandlerItem {
        return this.handlers[full_id];
    }

    async add_handler(handler_item: RouterHandlerItem): Promise<BuckyResult<void>> {
        const full_id = RouterWSHandlerHandlerManagerImpl.gen_full_id(handler_item.chain, handler_item.category, handler_item.id);

        // 相同id的允许覆盖
        if (this.handlers[full_id]) {
            console.info(`will replace ws router handler! chain=${handler_item.chain}, category=${handler_item.category}, id=${handler_item.id}`);
            // return Err(BuckyError.from(BuckyErrorCode.AlreadyExists));
        } else {
            console.info(`will add ws router handler item: chain=${handler_item.chain}, category=${handler_item.category}, id=${handler_item.id}, item=`, handler_item);
        }

        this.handlers[full_id] = handler_item;
        if (this.session.is_some()) {
            const session = this.session.unwrap();
            await handler_item.register(session.requestor!);
        }

        return Ok(void (0));
    }

    static async remove_handler(manager: RouterWSHandlerHandlerManagerImpl, chain: RouterHandlerChain, category: RouterHandlerCategory, id: string, dec_id: Option<ObjectId>): Promise<BuckyResult<boolean>> {
        const unregister_item = manager.remove_handler_op(chain, category, id, dec_id);
        if (manager.session.is_some()) {
            return unregister_item.unregister(manager.session.unwrap().requestor!);
        } else {
            const msg = `remove ws router handler but not connect: chain=${chain}, category=${category}, id=${id}`;
            console.warn(msg);

            return Err(new BuckyError(BuckyErrorCode.NotConnected, msg));
        }
    }

    remove_handler_op(chain: RouterHandlerChain, category: RouterHandlerCategory, id: string, dec_id: Option<ObjectId>): RouterHandlerUnregisterItem {
        const full_id = RouterWSHandlerHandlerManagerImpl.gen_full_id(chain, category, id);

        const ret = this.handlers[full_id];
        delete this.handlers[full_id];
        if (ret) {
            const item = ret;
            console.assert(item.category === category);
            console.assert(item.id === id);
            console.log(`will remove ws router handler: chain=${chain}, category=${category}, id=${id}`);
        } else {
            console.warn(`will remove ws router handler without local exists: chain=${chain}, category=${category}, id=${id}`);
        }

        const unregister_item = new RouterHandlerUnregisterItem(
            chain,
            category,
            id,
            dec_id,
        );

        this.unregister_handlers[full_id] = unregister_item;
        return unregister_item;
    }

    static async on_event(manager: RouterWSHandlerHandlerManagerImpl, content: string): Promise<BuckyResult<Option<string>>> {
        const event: RouterWSHandlerEventParam = JSON.parse(content);
        const full_id = RouterWSHandlerHandlerManagerImpl.gen_full_id(event.chain, event.category, event.id);

        const handler = manager.get_handler(full_id);
        if (handler == null) {
            const msg = `ws router handler not found! chain=${event.chain}, category=${event.category}, id=${event.id}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.NotFound, msg));
        }

        console.debug(`will emit handler: full_id=${full_id}, param=${event.param}`);
        const ret = await handler.emit(event.param);
        if (ret.err) {
            return ret;
        }

        const resp = ret.unwrap();
        return Ok(Some(resp));
    }


    static async on_session_begin(manager: RouterWSHandlerHandlerManagerImpl,
        session: WebSocketSession) {
        console.log(`ws router handler session begin: sid=${session.sid}`);
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

class RouterWSHandlerRequestHandler extends WebSocketRequestHandler {
    constructor(private owner: RouterWSHandlerHandlerManagerImpl) {
        super();
    }

    async on_string_request(requestor: WebSocketRequestManager,
        cmd: number,
        content: string): Promise<BuckyResult<Option<string>>> {
        switch (cmd) {
            case ROUTER_WS_HANDLER_CMD_EVENT:
                return await RouterWSHandlerHandlerManagerImpl.on_event(this.owner, content);
            default:
                const msg = `unknown ws router handler cmd: sid=${requestor.sid}, cmd=${cmd}`;
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
    constructor(private service_url: string, private dec_id?: ObjectId) {
        const handler = new RouterWSHandlerRequestHandler(this.manager);
        this.client = new WebSocketClient(service_url, handler);
    }

    start() {
        this.client.start();
    }

    get_dec_id(): Option<ObjectId> {
        return this.dec_id ? Some(this.dec_id) : None;
    }

    async add_handler<REQ, RESP>(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        category: RouterHandlerCategory,
        req_codec: JsonCodec<REQ>,
        resp_codec: JsonCodec<RESP>,
        filter: string,
        default_action: RouterHandlerAction,
        routine: Option<EventListenerAsyncRoutineT<RouterHandlerRequest<REQ, RESP>, RouterHandlerResponse<REQ, RESP>>>): Promise<BuckyResult<void>> {
        const handler_item = new RouterHandlerItem(
            chain,
            category,
            index,
            id,
            this.get_dec_id(),
            filter,
            default_action,
            None,
        );

        if (routine.is_some()) {
            const t = new RouterHandlerEventRoutineT(req_codec,
                resp_codec, routine.unwrap());
            handler_item.set_routine(Some(t));
        }

        return this.manager.add_handler(handler_item);
    }

    async remove_handler(chain: RouterHandlerChain, category: RouterHandlerCategory, id: string): Promise<BuckyResult<boolean>> {
        return RouterWSHandlerHandlerManagerImpl.remove_handler(this.manager, chain, category, id, this.get_dec_id());
    }
}
