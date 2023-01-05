import { WebSocketRequestHandler, WebSocketRequestManager } from "./request";
import { WSPacket } from "./packet";
import { BuckyError, BuckyErrorCode, BuckyResult, Err, Ok } from "../../cyfs-base";


export class WebSocketSession {
    private ws?: WebSocket;
    private stopped: boolean;
    public requestor: WebSocketRequestManager;
    constructor(public sid: number, source: string, public handler: WebSocketRequestHandler) {
        console.log(`new ws session: sid=${sid}, source=${source}`);
        this.requestor = new WebSocketRequestManager(handler);
        this.stopped = false;
    }

    public post_msg(msg: Uint8Array): BuckyResult<void> {
        console.debug(`ws will send msg, sid=${this.sid}, len=${msg.length}`);

        this.ws?.send(msg);
        return Ok(void (0));
    }

    public stop(): void {
        console.assert(!this.stopped);
        this.stopped = true;

        if (this.ws) {
            this.ws!.close(BuckyErrorCode.Aborted, `ws session aborted! sid=${this.sid}`);
        }
    }

    static async run_client(session: WebSocketSession, ws: WebSocket): Promise<BuckyResult<void>> {
        return WebSocketSession.run(session, ws, false);
    }

    static async run(session: WebSocketSession, ws: WebSocket, as_server: boolean): Promise<BuckyResult<void>> {
        console.info(`will run session sid=${session.sid}, as_server=${as_server}`);

        if (session.stopped) {
            const msg = `ws session already been aborted! sid=${session.sid}`;
            console.error(msg);
            ws.close(BuckyErrorCode.Aborted, msg);
            return Err(new BuckyError(BuckyErrorCode.Aborted, msg));
        }

        session.ws = ws;

        ws.onmessage = async (evt: MessageEvent<Blob>) => {
            // console.debug(`ws recv evt: sid=${session.sid}, evt=`, evt);

            let packet: WSPacket;
            try {
                /* IFTRUE_h5
                const data = new Uint8Array(await evt.data.arrayBuffer());
                FITRUE_h5 */

                /* IFTRUE_node */
                const data = new Uint8Array(evt.data as any);
                /* FITRUE_node */

                /* IFTRUE_rn
                const data = new Uint8Array(evt.data as any);
                FITRUE_rn */

                packet = WSPacket.decode_from_buffer(data);
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

        let resolveClose: (err: BuckyResult<void>) => void;
        session.ws.onclose = (evt) => {
            session.handler.on_session_end(session);
            session.requestor.unbind_session();
            session.ws = undefined;

            console.log(`websocket on close, sid=${session.sid}, code=${evt.code}. reason=${evt.reason}`);
            const err = new BuckyError(evt.code, evt.reason);
            resolveClose(Err(err));
        }

        return new Promise<BuckyResult<void>>(resolve => resolveClose = resolve);
    }
}