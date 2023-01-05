import { BuckyError, BuckyErrorCode, BuckyResult } from '../../cyfs-base';
import { WebSocketRequestHandler } from "./request";
import { WebSocketSession } from "./session";
import { Err, Ok } from "ts-results";

class WebSocketSessionManagerInner {

    // list: { [id: number]: WebSocketSession } = {};
    list: WebSocketSession[] = [];
    next_sid: number;

    constructor(protected handler: WebSocketRequestHandler | undefined) {
        this.next_sid = Math.floor(Math.random() * 1000);
        console.info(`ws sid start at ${this.next_sid}`);
    }

    get_session(sid: number): WebSocketSession | undefined {
        for (const item of this.list) {
            if (item.sid === sid) {
                return item;
            }
        }
        console.error(`ws session not found! sid=${sid}`);
        return undefined;
    }

    // 随机选择一个session
    select_session(): WebSocketSession | undefined {
        const count = this.list.length;
        if (count === 1) {
            return this.list[0];
        } else if (count <= 0) {
            return undefined;
        } else {
            const index = Math.floor(Math.random() * count);
            return this.list[index];
        }
    }

    new_session(source: string): BuckyResult<WebSocketSession> {
        if (this.handler == null) {
            const msg = `new ws session but request handler is empty! source=${source}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.ErrorState, msg));
        }

        const sid = this.next_sid;
        this.next_sid += 1;
        const session = new WebSocketSession(sid, source, this.handler!);

        this.list.push(session);

        return Ok(session);
    }

    remove_session(sid: number): WebSocketSession | undefined {
        for (let i = 0; i < this.list.length; ++i) {
            const item = this.list[i];
            if (item.sid === sid) {
                console.info(`will remove ws session: sid=${sid}`);
                this.list.splice(i, 1);
                return item;
            }
        }

        console.error(`remove ws session but not found! sid=${sid}`);
        return undefined;
    }
}

export class WebSocketSessionManager extends WebSocketSessionManagerInner {
    constructor(handler: WebSocketRequestHandler) {
        super(handler);
    }

    async run_client_session(service_url: string, session: WebSocketSession, ws: WebSocket): Promise<BuckyResult<void>> {
        console.info(`will run client session ${service_url}, sid=${session.sid}`);

        const ret = await WebSocketSession.run_client(session, ws);

        if (this.remove_session(session.sid) == null) {
            throw new Error(`session not exists! sid=${session.sid}`);
        }

        return ret;
    }

    public stop(): void {
        console.assert(this.handler != null);
        this.handler = undefined;
    }
}