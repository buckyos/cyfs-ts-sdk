import { WebSocketRequestHandler } from "./request";
import { WebSocketSession } from "./session";
import { Err } from "ts-results";

class WebSocketSessionManagerInner {

    list: { [id: number]: WebSocketSession } = {};
    next_sid: number;

    constructor(private handler: WebSocketRequestHandler) {
        this.next_sid = Math.floor(Math.random() * 1000);
        console.info(`ws sid start at ${this.next_sid}`);
    }

    get_session(sid: number): WebSocketSession {
        return this.list[sid];
    }

    new_session(source: string): WebSocketSession {
        const sid = this.next_sid;
        this.next_sid += 1;
        const session = new WebSocketSession(sid, source, this.handler);
        this.list[sid] = session;
        return session;
    }

    remove_session(sid: number): WebSocketSession {
        const ret = this.list[sid];
        delete this.list[sid];
        return ret;
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