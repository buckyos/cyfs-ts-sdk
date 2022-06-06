import { WebSocketRequestHandler } from "./request";
import { WebSocketSession } from "./session";
import { Err } from "ts-results";

class WebSocketSessionManagerInner {

    // list: { [id: number]: WebSocketSession } = {};
    list: WebSocketSession[] = [];
    next_sid: number;

    constructor(private handler: WebSocketRequestHandler) {
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

    new_session(source: string): WebSocketSession {
        const sid = this.next_sid;
        this.next_sid += 1;
        const session = new WebSocketSession(sid, source, this.handler);

        this.list.push(session);

        return session;
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

    async run_client_session(service_url: string, ws: WebSocket): Promise<WebSocketSession> {
        console.info(`will run client session ${service_url}`);

        const session = this.new_session(service_url);
        await WebSocketSession.run_client(session, ws);

        const ret = this.remove_session(session.sid);
        if (ret == null) {
            throw new Error(`session not exists! sid=${session.sid}`);
        }
        return ret;
    }
}