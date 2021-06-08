import {bucky_time_now, BuckyError, BuckyErrorCode, BuckyResult, Err, None, Ok, Option, Some} from "../../cyfs-base";
import {WebSocketSession} from "./session";
import {WSPacket} from "./packet";


export interface WebSocketRequestHandler {
    on_request(
        requestor: WebSocketRequestManager,
        cmd: number,
        content: string,
    ): Promise<BuckyResult<Option<string>>>;

    on_session_begin(session: WebSocketSession): Promise<void>;
    on_session_end(session: WebSocketSession): Promise<void>;

    clone_handler(): WebSocketRequestHandler;
}

class AbortHandle {
    abort() {

    }
}

export class RequestItem {

    resp: Option<BuckyResult<string>> = None;
    isTimeout = false;
    resolve?: () => void;
    waker: Promise<void>;

    constructor(public seq: number, public send_tick: bigint) {
        this.waker = new Promise<void>(resolve => {
            this.resolve = resolve;
        });
    }

    timeout() {
        if (this.resp.is_none()) {
            this.resp = Some(Err(BuckyError.from(BuckyErrorCode.Timeout)));
        } else {
            console.warn(`ws request timeout but already has resp! send_tick=${this.send_tick}, seq=${this.seq}`);
        }
        this.isTimeout = true;
    }
}

interface RequestResult {
    seq: number;
    req_item: RequestItem;
    list: { [n: number]: RequestItem };
}

export class WebSocketRequestContainer {
    next_seq = 1;
    list: { [n: number]: RequestItem } = {};

    new_request(sid: number): RequestResult {
        const seq = this.next_seq;
        if (this.next_seq === 0) {
            console.warn(`ws request seq roll back! sid=${sid}`);
            this.next_seq = 1;
        }

        const req_item = new RequestItem(seq, bucky_time_now());
        const old_item = this.list[seq];
        if (old_item) {
            console.error(`replace old with same seq! sid=${sid}, seq=${old_item.seq}, send_tick=${old_item.send_tick}`);
        }
        this.list[seq] = req_item;

        return {
            seq,
            req_item,
            list: {},
        };
    }

    remove_request(seq: number): RequestItem {
        const ret = this.list[seq];
        delete this.list[seq];
        return ret;
    }

    check_timeout() {
        // TODO: 直接清除过期的元素，不能迭代这些元素，否则会导致这些元素被更新时间戳
        // let (_, list) = self.list.notify_get(&0);

        return {};
    }

    clear() {
        this.list = {};
    }

    static on_timeout(sid: number, list: { [n: number]: RequestItem }) {
        for (const seq of Object.keys(list)) {
            const item = list[parseInt(seq, 10)];

            console.warn(`ws request droped on timeout! sid=${sid}, seq=${seq}`);
            // TODO: let mut item = item.lock().unwrap();
        }
    }
}

export class WebSocketRequestManager {
    is_monitor = true;
    sid = 0;
    session: Option<WebSocketSession> = None;
    reqs: WebSocketRequestContainer = new WebSocketRequestContainer();
    constructor(
        public handler: WebSocketRequestHandler) {
    }

    is_session_valid() {
        return this.session.is_some();
    }

    bind_session(session: WebSocketSession) {
        console.assert(this.session.is_none(), `bind_session ${this.session}`);
        this.session = Some(session);
        this.monitor();
    }

    unbind_session() {
        this.stop_monitor();
        this.reqs.clear();
        this.session = None;
    }

    static async on_msg(requestor: WebSocketRequestManager, packet: WSPacket): Promise<BuckyResult<void>> {
        // console.log('on_msg', packet);
        const cmd = packet.header.cmd;
        if (cmd > 0) {
            const seq = packet.header.seq;
            const de = new TextDecoder();
            const content = de.decode(packet.content);
            
            console.debug(`recv ws cmd packet: sid=${requestor.session.unwrap().sid}, seq=${seq}, content=`, content);

            const ret = await requestor.handler.on_request(requestor, cmd, content);
            if (ret.err) {
                return ret;
            }

            const resp = ret.unwrap();
            if (resp.is_none()) {
                console.assert(seq === 0);
            } else {
                console.assert(seq > 0);

                const resp_packet = WSPacket.new_from_string(seq, 0, resp.unwrap());
                const buf = resp_packet.encode();
                (await requestor.post_to_session(buf)).unwrap();
            }
        } else {
            // console.debug(`recv ws resp packet: sid=${requestor.session.unwrap().sid}, seq=${packet.header.seq}`);
            (await requestor.on_resp(packet)).unwrap();
        }

        return Ok(void(0));
    }

    async post_req(cmd: number, msg: string): Promise<BuckyResult<string>> {
        const { seq, req_item: item, list } = this.reqs.new_request(this.sid);
        if (Object.values(list).length) {
            WebSocketRequestContainer.on_timeout(this.sid, list);
        }

        const packet = WSPacket.new_from_string(seq, cmd, msg);
        const buf = packet.encode();
        const ret = await this.post_to_session(buf);
        if (ret.err) {
            this.reqs.remove_request(seq);
            return ret;
        }

        await item.waker!;
        return Ok(item.resp.unwrap().unwrap());
    }

    // 收到了应答
    async on_resp(packet: WSPacket): Promise<BuckyResult<void>> {
        console.assert(packet.header.cmd === 0);
        console.assert(packet.header.seq > 0);
        const seq = packet.header.seq;
        const ret = this.reqs.remove_request(seq);
        if (ret == null) {
            const msg = `ws request recv resp but already been removed! sid=${this.sid}, seq=${seq}`;
            console.warn(msg);
            return Err(new BuckyError(BuckyErrorCode.NotFound, msg));
        }

        const item = ret;
        const de = new TextDecoder();
        const resp = de.decode(packet.content);
        // 保存应答并唤醒
        item.resp = Some(Ok(resp));

        console.log(`ws recv resp, sid=${this.sid}, seq=${item.seq}, resp=`, resp);

        item.resolve!();
        return Ok(void(0));
    }

    async monitor() {
        const reqs = this.reqs;
        const sid = this.sid;

        while (this.is_monitor) {
            await new Promise(resolve => setTimeout(resolve, 15 * 1000));
            const list = reqs.check_timeout();
            if (Object.keys(list).length) {
                WebSocketRequestContainer.on_timeout(sid, list);
            }
        }
    }

    stop_monitor() {
        this.is_monitor = false;
    }

    async post_to_session(buf: Uint8Array): Promise<BuckyResult<void>> {
        return this.session.unwrap().post_msg(buf);
    }

    post_req_without_resp(cmd: number, msg: string): BuckyResult<void> {
        const packet = WSPacket.new_from_string(0, cmd, msg);
        const buf = packet.encode();
        return this.session.unwrap().post_msg(buf);
    }
}