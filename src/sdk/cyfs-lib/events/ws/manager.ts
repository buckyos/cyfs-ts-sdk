import { BuckyError, BuckyErrorCode, BuckyResult, Err, EventListenerAsyncRoutineT, ObjectId, Ok } from "../../../cyfs-base";
import { JsonCodec } from "../../base/codec";
import { ROUTER_WS_EVENT_CMD_ADD, ROUTER_WS_EVENT_CMD_EVENT, ROUTER_WS_EVENT_CMD_REMOVE } from "../../base/protocol";
import { RouterWSHandlerResponseJsonCodec } from "../../router_handler/ws/request";
import { WebSocketClient } from "../../ws/client";
import { WebSocketRequestHandler, WebSocketRequestManager } from "../../ws/request";
import { WebSocketSession } from "../../ws/session";
import { RouterEventCategory } from "../def";
import { RouterEventAnyRoutine, RouterEventRoutineT } from "../handler";
import { RouterEventRequest, RouterEventResponse } from "../request";
import { RouterWSAddEventParam, RouterWSAddEventParamJsonCodec, RouterWSEventEmitParamJsonCodec, RouterWSRemoveEventParam, RouterWSRemoveEventParamJsonCodec } from "./request";

interface RouterEventId {
    category: RouterEventCategory,
    id: string,
}

class RouterEventItem {
    constructor(
        public category: RouterEventCategory,
        public id: string,
        public dec_id: ObjectId | undefined,
        public index: number,
        public routine: RouterEventAnyRoutine,
    ) { }

    async emit(param: string): Promise<BuckyResult<string>> {
        return await this.routine.emit(param)
    }

    async register(requestor: WebSocketRequestManager): Promise<BuckyResult<[]>> {
        console.info(
            `will add ws router event: category=${this.category}, id=${this.id}, index=${this.index}, sid=${requestor.sid}`,
        );

        const req: RouterWSAddEventParam = {
            category: this.category,
            id: this.id,
            dec_id: this.dec_id,
            index: this.index,
            routine: requestor.sid.toString(),
        };

        const msg = new RouterWSAddEventParamJsonCodec().encode_string(req);
        const resp_r = await requestor.post_req(ROUTER_WS_EVENT_CMD_ADD, msg);
        if (resp_r.err) {
            console.error(`ws add event failed! category=${req.category}, id=${req.id},`, resp_r.val)
            return resp_r;
        }

        const resp_r_r = new RouterWSHandlerResponseJsonCodec().decode_string(resp_r.unwrap())
        if (resp_r_r.err) {
            console.error(`decode add ws router event resp failed! resp=${resp_r.unwrap()},`, resp_r_r.val)
            return resp_r_r;
        }

        const resp = resp_r_r.unwrap()

        if (resp.err === 0) {
            console.info(
                `add ws router event success: category=${req.category}, id=${req.id}, index=${this.index}`,
            );
            return Ok([])
        } else {
            console.error(
                `add ws router event failed! category=${req.category}, id=${req.id}, err=${resp.err}, msg=${resp.msg}`
            );

            return Err(new BuckyError(resp.err, resp.msg || ""))
        }
    }
}

class RouterEventUnregisterItem {
    constructor(
        public category: RouterEventCategory,
        public id: string,
        public dec_id?: ObjectId,
    ) { }

    async unregister(requestor: WebSocketRequestManager): Promise<BuckyResult<boolean>> {
        console.info(
            `ws will remove event: category=${this.category}, id=${this.id}, sid=${requestor.sid}`
        );

        const req: RouterWSRemoveEventParam = {
            category: this.category,
            id: this.id,
            dec_id: this.dec_id,
        };

        const msg = new RouterWSRemoveEventParamJsonCodec().encode_string(req)

        const resp_r = await requestor.post_req(ROUTER_WS_EVENT_CMD_REMOVE, msg);
        if (resp_r.err) {
            console.error(`ws remove event failed! category=${this.category}, id=${this.id},`, resp_r.val)
            return resp_r;
        }

        const resp_r_r = new RouterWSHandlerResponseJsonCodec().decode_string(resp_r.unwrap())
        if (resp_r_r.err) {
            console.error(`decode ws remove event resp failed! resp=${resp_r.unwrap()},`, resp_r_r.val)
        }

        const resp = resp_r_r.unwrap()

        let ret;
        if (resp.err === 0) {
            console.info(`ws remove event success! category=${this.category}, id=${this.id}`);
            ret = true;
        } else {
            console.warn(`ws remove event failed! category=${this.category}, id=${this.id},`, resp);
            ret = false;
        }

        // 只要调用成功了，那么都认为当前unregister操作完毕了
        return Ok(ret)
    }
}

class RouterWSEventManagerImpl {
    // 均使用full_id作为索引
    events: { [name: string]: RouterEventItem };
    unregister_events: { [name: string]: RouterEventUnregisterItem };
    session?: WebSocketSession;

    private static gen_full_id(category: RouterEventCategory, id: string): string {
        return `${category}_${id}`;
    }

    constructor() {
        this.events = {};
        this.unregister_events = {};
    }

    sid(): number | undefined {
        if (this.session) {
            return this.session.sid;
        } else {
            return undefined;
        }
    }

    get_event(id: RouterEventId): RouterEventItem | undefined {
        const full_id = RouterWSEventManagerImpl.gen_full_id(id.category, id.id);
        return this.events[full_id]
    }

    async add_event(event_item: RouterEventItem): Promise<BuckyResult<void>> {
        const full_id = RouterWSEventManagerImpl.gen_full_id(event_item.category, event_item.id);

        if (this.events[full_id]) {
            console.error(`router event already exists! id=${event_item.id}`,);
            return Err(BuckyError.from(BuckyErrorCode.AlreadyExists));
        }

        this.events[full_id] = event_item

        if (this.session) {
            await event_item.register(this.session.requestor)
        }

        return Ok(void (0))
    }

    static async remove_event(
        manager: RouterWSEventManagerImpl,
        category: RouterEventCategory,
        id: string,
        dec_id?: ObjectId,
    ): Promise<BuckyResult<boolean>> {
        const unregister_item = manager.remove_event_op(category, id, dec_id);

        if (manager.session) {
            return await unregister_item.unregister(manager.session.requestor)
        } else {
            const msg = `remove ws router event but not connect: category=${category}, id=${id}`;
            console.warn(msg);

            return Err(new BuckyError(BuckyErrorCode.NotConnected, msg))
        }
    }

    remove_event_op(
        category: RouterEventCategory,
        id: string,
        dec_id?: ObjectId,
    ): RouterEventUnregisterItem {

        const full_id = RouterWSEventManagerImpl.gen_full_id(category, id);

        // 首先尝试从rules里面移除，可能存在也可能不存在
        if (this.events[full_id]) {
            delete this.events[full_id];
            console.info(`will remove ws router event: id=${id}, dec=${dec_id}`);
        } else {
            console.info(`will remove ws router event without exists: id=${id}, dec=${dec_id}`);
        }

        // 添加到反注册队列等待处理
        const unregister_item = new RouterEventUnregisterItem(category, id, dec_id);

        this.unregister_events[full_id] = unregister_item

        return unregister_item
    }

    static async on_event(
        manager: RouterWSEventManagerImpl,
        content: string,
    ): Promise<BuckyResult<string | undefined>> {
        const event_r = new RouterWSEventEmitParamJsonCodec().decode_string(content);
        if (event_r.err) {
            return event_r;
        }
        const event = event_r.unwrap()

        const id: RouterEventId = {
            category: event.category,
            id: event.id,
        };

        const item = manager.get_event(id);

        if (!item) {
            const msg = `router ws event not found! id=${id}`
            console.error(msg);

            return Err(new BuckyError(BuckyErrorCode.NotFound, msg));
        }

        const resp = await RouterWSEventManagerImpl.emit(item, event.param);
        if (resp.err) {
            return resp;
        }

        return Ok(resp.unwrap())
    }

    static async emit(event: RouterEventItem, param: string): Promise<BuckyResult<string>> {
        // 这里回调回来，一定是存在routine注册的，所以routine为空则标识有问题
        return await event.routine.emit(param)
    }

    static async on_session_begin(
        manager: RouterWSEventManagerImpl,
        session: WebSocketSession,
    ) {
        console.info("ws event session begin: sid=", session.sid);
        {
            console.assert(!manager.session)
            manager.session = session
        }
        await RouterWSEventManagerImpl.unregister_all(manager, session);

        await RouterWSEventManagerImpl.register_all(manager, session);
    }

    static async register_all(
        manager: RouterWSEventManagerImpl,
        session: WebSocketSession,
    ) {
        const events = manager.events;
        if (Object.keys(events).length === 0) {
            return;
        }

        const requestor = session.requestor;

        // 对存在的rules执行注册
        for (const v of Object.values(manager.events)) {
            await v.register(requestor);
        }
    }

    static async unregister_all(
        manager: RouterWSEventManagerImpl,
        session: WebSocketSession,
    ) {
        const events = manager.unregister_events;
        if (Object.keys(events).length === 0) {
            return;
        }
        const requestor = session.requestor;

        // 对存在的反注册操作，批量执行反注册
        for (const v of Object.values(manager.unregister_events)) {
            let r = await v.unregister(requestor);
            if (r.ok) {
                delete manager.unregister_events[v.id]
            }
        }
    }

    static async on_session_end(
        manager: RouterWSEventManagerImpl,
        session: WebSocketSession,
    ) {
        console.info("ws event session end: sid=", session.sid);

        {
            console.assert(manager.session)
            manager.session = undefined;
        }
    }
}

class RouterWSEventRequestEvent extends WebSocketRequestHandler {
    constructor(private owner: RouterWSEventManagerImpl) { super() }
    async on_string_request(
        requestor: WebSocketRequestManager,
        cmd: number,
        content: string,
    ): Promise<BuckyResult<string | undefined>> {
        if (cmd === ROUTER_WS_EVENT_CMD_EVENT) {
            return await RouterWSEventManagerImpl.on_event(this.owner, content)
        } else {
            const msg = `unknown ws event cmd: sid=${requestor.sid}, cmd=${cmd}`
            console.error(msg);

            return Err(new BuckyError(BuckyErrorCode.UnSupport, msg))
        }
    }
    async on_session_begin(session: WebSocketSession): Promise<void> {
        await RouterWSEventManagerImpl.on_session_begin(this.owner, session);
    }
    async on_session_end(session: WebSocketSession): Promise<void> {
        await RouterWSEventManagerImpl.on_session_end(this.owner, session);
    }
    clone_handler(): WebSocketRequestHandler {
        return this;
    }

}

export class RouterWSEventManager {
    manager: RouterWSEventManagerImpl
    client: WebSocketClient
    constructor(service_url: string) {
        this.manager = new RouterWSEventManagerImpl()
        const event = new RouterWSEventRequestEvent(this.manager);

        this.client = new WebSocketClient(service_url, event);
    }

    start(): void {
        this.client.start()
    }

    stop(): void {
        console.info(`will stop router event manager! sid=${this.manager.sid()}`);

        this.client.stop();
    }

    async add_event<REQ, RESP>(
        id: string,
        dec_id: ObjectId | undefined,
        index: number,
        category: RouterEventCategory,
        req_codec: JsonCodec<REQ>,
        resp_codec: JsonCodec<RESP>,
        routine: EventListenerAsyncRoutineT<RouterEventRequest<REQ>, RouterEventResponse<RESP>>): Promise<BuckyResult<void>> {
        const event_routine = new RouterEventRoutineT(req_codec, resp_codec, routine)

        const event_item = new RouterEventItem(category, id, dec_id, index, event_routine);

        return await this.manager.add_event(event_item)
    }

    async remove_event(
        category: RouterEventCategory,
        id: string,
        dec_id?: ObjectId,
    ): Promise<BuckyResult<boolean>> {
        console.info(
            `will remove event: category=${category}, id=${id}, dec=${dec_id}`
        );

        return await RouterWSEventManagerImpl.remove_event(this.manager, category, id, dec_id)
    }
}