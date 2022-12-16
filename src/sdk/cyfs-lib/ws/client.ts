import { WebSocketSession } from "./session";
import { WebSocketRequestHandler } from "./request";
import { WebSocketSessionManager } from "./session_manager";


const WS_CONNECT_RETRY_MIN_INTERVAL_SECS = 2;
const WS_CONNECT_RETRY_MAX_INTERVAL_SECS = 60;


export class WebSocketClient {
    ws?: WebSocket;
    session_manager: WebSocketSessionManager;
    constructor(public service_url: string, public handler: WebSocketRequestHandler) {
        this.session_manager = new WebSocketSessionManager(handler);
    }

    select_session(): WebSocketSession | undefined {
        return this.session_manager.select_session();
    }

    async run(): Promise<void> {
        let retry_interval = WS_CONNECT_RETRY_MIN_INTERVAL_SECS;

        while (1) {
            console.log(`[WebSocketClient] will ws connect to ${this.service_url}`);

            try {
                await this.run_once();
                console.log('[WebSocketClient] ws session complete');
            } catch (e) {
                console.error(`[WebSocketClient] ws session complete with error: ${JSON.stringify(e)}`);
            }

            await new Promise((resolve) => setTimeout(resolve, retry_interval * 1000));

            retry_interval *= 2;
            if (retry_interval >= WS_CONNECT_RETRY_MAX_INTERVAL_SECS) {
                retry_interval = WS_CONNECT_RETRY_MAX_INTERVAL_SECS;
            }
        }
    }

    async run_once() {
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
                console.info(`[WebSocketClient] ws connect success: ${this.service_url}`);
                resolve(await this.session_manager.run_client_session(this.service_url, ws));
            };
        });
    }


    start(): void {
        this.run();
    }
}