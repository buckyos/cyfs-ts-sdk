import { WebSocketSession } from "./session";
import { WebSocketRequestHandler } from "./request";
import { WebSocketSessionManager } from "./session_manager";
import { BuckyError, BuckyErrorCode, BuckyResult, Err } from '../../cyfs-base';


const WS_CONNECT_RETRY_MIN_INTERVAL_SECS = 2;
const WS_CONNECT_RETRY_MAX_INTERVAL_SECS = 60;


export class WebSocketClient {
    ws?: WebSocket;
    session_manager: WebSocketSessionManager;

    stopped: boolean;
    session?: WebSocketSession;

    constructor(public service_url: string, public handler: WebSocketRequestHandler) {
        this.session_manager = new WebSocketSessionManager(handler);
        this.stopped = false;
    }

    select_session(): WebSocketSession | undefined {
        return this.session_manager.select_session();
    }

    async run(): Promise<void> {
        let retry_interval = WS_CONNECT_RETRY_MIN_INTERVAL_SECS;

        while (1) {
            console.log(`[WebSocketClient] will ws connect to ${this.service_url}`);

            let ret;
            try {
                ret = await this.run_once();
                console.log('[WebSocketClient] ws session complete');
            } catch (e) {
                console.error(`[WebSocketClient] ws session complete with error: ${JSON.stringify(e)}`);
            }

            if (ret && ret.err) {
                if (ret.val.code === BuckyErrorCode.Aborted) {
                    break;
                }
            }
            await new Promise((resolve) => setTimeout(resolve, retry_interval * 1000));

            retry_interval *= 2;
            if (retry_interval >= WS_CONNECT_RETRY_MAX_INTERVAL_SECS) {
                retry_interval = WS_CONNECT_RETRY_MAX_INTERVAL_SECS;
            }
        }

        console.log(`ws client stopped! url=${this.service_url}`);
    }

    async run_once(): Promise<BuckyResult<void>> {
        let ws: WebSocket;
        if (typeof WebSocket === 'undefined') {
            const w3cwebsocket = require('websocket').w3cwebsocket;
            ws = new w3cwebsocket(this.service_url);
        } else {
            ws = new WebSocket(this.service_url);
        }

        this.ws = ws;

        // ws.onmessage = (evt: MessageEvent<Uint8Array>) => {
        //     console.log( "Received Message: " + evt.data);
        // };
        //
        // ws.onclose = (evt) => {
        //     console.log("Connection closed.");
        // };

        return new Promise((resolve, reject) => {
            ws.onerror = async (evt) => {
                const msg = `[WebSocketClient] ws connect to ${this.service_url} error`;
                console.error(msg);
                reject(evt);
            }

            ws.onopen = async (evt) => {
                let ret;
                if (!this.stopped) {
                    console.info(`[WebSocketClient] ws connect success: ${this.service_url}`);
                    const sret = this.session_manager.new_session(this.service_url);
                    if (sret.ok) {
                        const session = sret.val;
                        console.assert(this.session == null);
                        this.session = session;

                        ret = await this.session_manager.run_client_session(this.service_url, session, ws);
                        this.session = undefined;
                    } else {
                        ret = sret;
                    }
                } else {
                    console.warn(`ws client run session but already stopped!`);
                    ret = Err(new BuckyError(BuckyErrorCode.Aborted, "ws client run session but already stopped!"));
                }

                resolve(ret);
            };
        });
    }


    start(): void {
        this.run();
    }

    public stop(): void {
        this.stopped = true;
        if (this.session) {
            const session = this.session;
            this.session = undefined;
            session.stop();
        }

        this.session_manager.stop();
    }
}