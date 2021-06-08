import { WebSocketRequestHandler, WebSocketRequestManager } from "./request";
import { WSPacket } from "./packet";
import { BuckyResult, Ok } from "../../cyfs-base";


export class WebSocketSession {
    private ws?: WebSocket;
    public requestor: WebSocketRequestManager;
    constructor(public sid: number, source: string, public handler: WebSocketRequestHandler) {
        console.log(`new ws session: sid=${sid}, source=${source}`);
        this.requestor = new WebSocketRequestManager(handler);
    }

    public post_msg(msg: Uint8Array): BuckyResult<void> {
        console.debug(`ws will send msg, sid=${this.sid}, len=${msg.length}`);

        this.ws?.send(msg);
        return Ok(void (0));
    }

    static async run_client(session: WebSocketSession, ws: WebSocket) {
        return WebSocketSession.run(session, ws, false);
    }

    static async run(session: WebSocketSession, ws: WebSocket, as_server: boolean) {
        console.info(`will run session sid=${session.sid}, as_server=${as_server}`);

        session.ws = ws;

        ws.onmessage = async (evt: MessageEvent<Blob>) => {
            console.debug(`ws recv evt: sid=${session.sid}, evt=`, evt);

            let packet: WSPacket;
            try {
                let data: Uint8Array;
                if (typeof window !== "undefined") {
                    data = new Uint8Array(await evt.data.arrayBuffer());
                } else {
                    data = new Uint8Array(evt.data as any);
                }

                packet = WSPacket.new_from_buffer(data);
            } catch (error) {
                console.error(`invalid ws msg! sid=${session.sid}, {}`, error);
                return;
            }
           
            console.debug(`ws recv packet: sid=${session.sid}`);

            // 异步的处理消息
            WebSocketRequestManager.on_msg(session.requestor, packet).then(() => {
                console.debug(`ws process packet complete: sid=${session.sid}, cmd=${packet.header.cmd}, seq=${packet.header.seq}`);
            }, (error) => {
                console.error(`ws process packet error: sid=${session.sid}, err=`, error);
            });
        }

        ws.onerror = (event) => {
            console.error(`ws on error, sid=${session.sid}, err=`, event);
        };

        session.requestor.bind_session(session);

        await session.handler.on_session_begin(session);

        let resolveClose: () => void;
        session.ws.onclose = (evt) => {
            session.handler.on_session_end(session);
            session.requestor.unbind_session();
            session.ws = undefined;

            console.log(`websocket on close, sid=${session.sid}`);
            resolveClose();
        }

        return new Promise<void>(resolve => resolveClose = resolve);
    }
}