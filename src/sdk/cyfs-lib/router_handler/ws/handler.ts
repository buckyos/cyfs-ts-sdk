import { RouterHandlerCategory, RouterHandlerAction, RouterHandlerChain } from "../def";
import { BuckyError, BuckyErrorCode, BuckyResult, Err, Ok, EventListenerAsyncRoutineT, ObjectId } from "../../../cyfs-base";
import { WebSocketRequestHandler, WebSocketRequestManager } from "../../ws/request";
import {
    RouterAddHandlerParam,
    RouterWSAddHandlerParam,
    RouterWSRemoveHandlerParam,
    RouterWSHandlerEventParam,
    RouterWSHandlerResponseJsonCodec,
    RouterWSHandlerResponse
} from "./request";

import { WebSocketSession } from "../../ws/session";
import { WebSocketClient } from "../../ws/client";
import { RouterHandlerAnyRoutine, RouterHandlerEventRoutineT } from "../handler";
import { RouterHandlerRequest, RouterHandlerResponse } from '../request';
import { JsonCodec } from '../../base/codec';
import { ROUTER_WS_HANDLER_CMD_ADD, ROUTER_WS_HANDLER_CMD_EVENT, ROUTER_WS_HANDLER_CMD_REMOVE } from '../../base/protocol';


class RouterHandlerItem {
    constructor(
        public chain: RouterHandlerChain,
        public category: RouterHandlerCategory,
        public index: number,
        public id: string,
        public dec_id: ObjectId | undefined,
        private filter: string | undefined,
        private req_path: string | undefined,
        private default_action: RouterHandlerAction,
        private routine?: RouterHandlerAnyRoutine,
    ) {
    }

    set_routine(routine?: RouterHandlerAnyRoutine) {
        this.routine = routine;
    }

    async emit(param: string): Promise<BuckyResult<string>> {
        if (!this.routine) {
            console.error(`emit on_pre_put_to_noc event but routine is none! chain=${this.chain}, category=${this.category}, id=${this.id}`);
            return Ok(this.default_action);
        }

        let ret;
        try {
            ret = await this.routine.emit(param);
        } catch (error) {
            const msg = `emit handler routine error! chain=${this.chain}, category=${this.category}, id=${this.id}, param=${param}, err=${error.toString()}`;
            console.error(msg);

            return Err(new BuckyError(BuckyErrorCode.Failed, msg));
        }

        return ret;
    }

    async register(requestor: WebSocketRequestManager) {
        console.log(`will add ws router handler: chain=${this.chain}, category=${this.category}, id=${this.id}, index=${this.index}, sid=${requestor.sid}, routine=${!!this.routine}`);
        const param: RouterAddHandlerParam = {
            filter: this.filter,
            req_path: this.req_path,
            index: this.index,
            default_action: this.default_action,
        };

        if (this.routine) {
            param.routine = requestor.sid.toString();
        }

        const req: RouterWSAddHandlerParam = {
            chain: this.chain,
            category: this.category,
            id: this.id,
            dec_id: this.dec_id,
            param,
        }

        const msg = JSON.stringify(req);
        const ret = await requestor.post_req(ROUTER_WS_HANDLER_CMD_ADD, msg);
        if (ret.err) {
            console.error(`add ws router handler error! chain=${req.chain}, category=${req.category}, id=${req.id}`, ret);
        } else {
            const codec = new RouterWSHandlerResponseJsonCodec();
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
    constructor(private chain: RouterHandlerChain, private category: RouterHandlerCategory, public id: string, public dec_id?: ObjectId) {

    }

    async unregister(requestor: WebSocketRequestManager): Promise<BuckyResult<boolean>> {
        console.log(`will remove ws router handler: chain=${this.chain}, category=${this.category}, id=${this.id}, sid=${requestor.sid}`);

        const req: RouterWSRemoveHandlerParam = {
            chain: this.chain,
            category: this.category,
            id: this.id,
            dec_id: this.dec_id,
        };

        const msg = JSON.stringify(req);
        const ret = await requestor.post_req(ROUTER_WS_HANDLER_CMD_REMOVE, msg);
        if (ret.err) {
            console.error(`remove ws router handler error! chain=${req.chain}, category=${req.category}, id=${req.id}`, ret);
            return ret;
        } else {
            const codec = new RouterWSHandlerResponseJsonCodec();
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
    session?: WebSocketSession;

    private static gen_full_id(chain: RouterHandlerChain, category: RouterHandlerCategory, id: string): string {
        console.assert(chain != null && chain.length > 0);
        console.assert(category != null && category.length > 0);
        console.assert(id != null && id.length > 0);

        return `${chain}_${category}_${id}`;
    }

    sid(): number | undefined {
        if (this.session) {
            return this.session.sid;
        } else {
            return undefined;
        }
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
        if (this.session) {
            const session = this.session;
            await handler_item.register(session.requestor!);
        }

        return Ok(void (0));
    }

    static async remove_handler(manager: RouterWSHandlerHandlerManagerImpl, chain: RouterHandlerChain, category: RouterHandlerCategory, id: string, dec_id?: ObjectId): Promise<BuckyResult<boolean>> {
        const unregister_item = manager.remove_handler_op(chain, category, id, dec_id);
        if (manager.session) {
            return unregister_item.unregister(manager.session.requestor!);
        } else {
            const msg = `remove ws router handler but not connect: chain=${chain}, category=${category}, id=${id}`;
            console.warn(msg);

            return Err(new BuckyError(BuckyErrorCode.NotConnected, msg));
        }
    }

    remove_handler_op(chain: RouterHandlerChain, category: RouterHandlerCategory, id: string, dec_id?: ObjectId): RouterHandlerUnregisterItem {
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

    static async on_event(manager: RouterWSHandlerHandlerManagerImpl, content: string): Promise<BuckyResult<string | undefined>> {
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
        return Ok(resp);
    }


    static async on_session_begin(manager: RouterWSHandlerHandlerManagerImpl,
        session: WebSocketSession): Promise<void> {
        console.log(`ws router handler session begin: sid=${session.sid}`);
        console.assert(!manager.session);
        manager.session = session;

        await this.unregister_all(manager, session);
        await this.register_all(manager, session);
    }

    static async register_all(manager: RouterWSHandlerHandlerManagerImpl,
        session: WebSocketSession): Promise<void> {
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
        session: WebSocketSession): Promise<void> {
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
        session: WebSocketSession): Promise<void> {
        console.log(`ws handler session end: sid=${session.sid}`);
        console.assert(!!manager.session);
        manager.session = undefined;
    }
}

class RouterWSHandlerRequestHandler extends WebSocketRequestHandler {
    constructor(private owner: RouterWSHandlerHandlerManagerImpl) {
        super();
    }

    async on_string_request(requestor: WebSocketRequestManager,
        cmd: number,
        content: string): Promise<BuckyResult<string | undefined>> {
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

    start(): void {
        this.client.start();
    }

    stop(): void {
        console.info(`will stop router handler manager! sid=${this.manager.sid()}`);

        this.client.stop();
    }

    get_dec_id(): ObjectId | undefined {
        return this.dec_id;
    }

    async add_handler<REQ, RESP>(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        category: RouterHandlerCategory,
        req_codec: JsonCodec<REQ>,
        resp_codec: JsonCodec<RESP>,
        filter: string | undefined,
        req_path: string | undefined,
        default_action: RouterHandlerAction,
        routine?: EventListenerAsyncRoutineT<RouterHandlerRequest<REQ, RESP>, RouterHandlerResponse<REQ, RESP>>): Promise<BuckyResult<void>> {
        const handler_item = new RouterHandlerItem(
            chain,
            category,
            index,
            id,
            this.dec_id,
            filter,
            req_path,
            default_action
        );

        if (routine) {
            const t = new RouterHandlerEventRoutineT(req_codec,
                resp_codec, routine);
            handler_item.set_routine(t);
        }

        return this.manager.add_handler(handler_item);
    }

    async remove_handler(chain: RouterHandlerChain, category: RouterHandlerCategory, id: string): Promise<BuckyResult<boolean>> {
        return RouterWSHandlerHandlerManagerImpl.remove_handler(this.manager, chain, category, id, this.dec_id);
    }
}
