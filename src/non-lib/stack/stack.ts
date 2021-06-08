import { HttpRequestor } from "../base/base_requestor";
import { RouterRequestor } from "../router/requestor";
import { NONRequestor } from "../raw/non_requestor";
import { NDNRequestor } from "../raw/ndn_requestor";
import { NOCRequestor } from "../raw/noc_requestor";
import { Device, DeviceId } from "../../cyfs-base/objects/device";
import { RouterRuleManager } from "../rules/handler";
import { UtilRequestor } from "../util/requestor";
import {
    NON_STACK_HTTP_URL,
    NON_STACK_WS_URL
} from "../base/protocol";

import {
    BuckyError,
    BuckyErrorCode,
    BuckyResult,
    bucky_time_now,
    Err,
    Ok,
    sleep,
    Option,
} from "../../cyfs-base";
import { CYFS_RUNTIME_NON_STACK_HTTP_PORT, CYFS_RUNTIME_NON_STACK_WS_PORT, NON_STACK_HTTP_PORT, NON_STACK_WS_PORT } from "../../cyfs-base/base/port";
import { TransRequestor } from '../trans/requestor';
import { RouterHandlerManager } from '../router_handler/handler';


export enum ObjectStackEventType {
    Http,
    WebSocket,
}

export class SharedObjectStackParam {
    constructor(public service_url: string, public event_type: ObjectStackEventType, public event_url?: string) {
        // ignore
    }

    static default(): SharedObjectStackParam {
        const url = `http://127.0.0.1:${NON_STACK_HTTP_PORT}`;
        const ws_url = `ws://127.0.0.1:${NON_STACK_WS_PORT}`;

        return new SharedObjectStackParam(
            url,
            ObjectStackEventType.WebSocket,
            ws_url,
        );
    }

    static default_with_ws_event(): SharedObjectStackParam {
        return new SharedObjectStackParam(
            NON_STACK_HTTP_URL,
            ObjectStackEventType.WebSocket,
            NON_STACK_WS_URL,
        );
    }

    // runtime协议栈默认都是websocket事件系统，端口也是固定的
    static default_runtime(): SharedObjectStackParam {
        const url = `http://127.0.0.1:${CYFS_RUNTIME_NON_STACK_HTTP_PORT}`;
        const ws_url = `ws://127.0.0.1:${CYFS_RUNTIME_NON_STACK_WS_PORT}`;

        return new SharedObjectStackParam(
            url,
            ObjectStackEventType.WebSocket,
            ws_url,
        );
    }

    // 使用指定的url打开协议栈，并使用http事件系统
    static new_with_http_event(service_url: string): BuckyResult<SharedObjectStackParam> {
        return Ok(new SharedObjectStackParam(
            service_url,
            ObjectStackEventType.Http,
        ));
    }

    // 使用指定的端口打开协议栈，并使用http事件系统
    static new_with_http_event_ports(service_http_port: number): BuckyResult<SharedObjectStackParam> {
        const service_url = `http://127.0.0.1:${service_http_port}`;

        return Ok(new SharedObjectStackParam(
            service_url,
            ObjectStackEventType.Http,
        ));
    }

    // 使用指定的url打开协议栈，并使用websocket事件系统
    static new_with_ws_event(service_url: string, ws_event_url: string): BuckyResult<SharedObjectStackParam> {
        return Ok(new SharedObjectStackParam(
            service_url,
            ObjectStackEventType.WebSocket,
            ws_event_url
        ));
    }

    // 使用指定的端口打开协议栈，并使用websocket事件系统
    static new_with_ws_event_ports(service_http_port: number, ws_event_port: number): BuckyResult<SharedObjectStackParam> {
        console.assert(service_http_port !== ws_event_port);

        const service_url = `http://127.0.0.1:${service_http_port}`;
        const ws_event_url = `ws://127.0.0.1:${ws_event_port}`;

        console.info(`new_with_ws_event_ports: ${service_url}, ${ws_event_url}`);

        return Ok(new SharedObjectStackParam(
            service_url,
            ObjectStackEventType.WebSocket,
            ws_event_url
        ));
    }
}

export class SharedObjectStack {
    private m_util_service: UtilRequestor;
    private m_router_service: RouterRequestor;
    private m_non_service: NONRequestor;
    private m_ndn_service: NDNRequestor;
    private m_noc_service: NOCRequestor;
    private m_trans_service: TransRequestor;

    // rules事件处理器
    private m_router_rules: RouterRuleManager;

    // router handlers事件处理器
    private m_router_handlers: RouterHandlerManager;

    // 当前协议栈的device
    private m_device_id?: DeviceId;
    private m_device?: Device;

    private constructor(param: SharedObjectStackParam) {
        const service_url = param.service_url;
        const ws_url = param.event_url;

        console.log('create SharedObjectStack', { service_url, ws_url });
        const url = new URL(service_url);
        const addr = `${url.host}`;
        const requestor = new HttpRequestor(addr);

        this.m_util_service = new UtilRequestor(requestor);
        this.m_router_service = new RouterRequestor(requestor);
        this.m_non_service = new NONRequestor(requestor);
        this.m_ndn_service = new NDNRequestor(requestor);
        this.m_noc_service = new NOCRequestor(requestor);
        this.m_trans_service = new TransRequestor(requestor);

        this.m_router_rules = new RouterRuleManager(ObjectStackEventType.WebSocket, ws_url);
        this.m_router_handlers = new RouterHandlerManager(ObjectStackEventType.WebSocket, ws_url);
    }

    static default_with_ws_event(): SharedObjectStack {
        const p = SharedObjectStackParam.default_with_ws_event();
        const self = new SharedObjectStack(p);
        return self;
    }

    static open_default(): SharedObjectStack {
        return new SharedObjectStack(SharedObjectStackParam.default());
    }

    static open_default_with_ws_event(): SharedObjectStack {
        return new SharedObjectStack(SharedObjectStackParam.default_with_ws_event());
    }

    static open_runtime(): SharedObjectStack {
        return new SharedObjectStack(SharedObjectStackParam.default_runtime());
    }

    static open(param: SharedObjectStackParam): SharedObjectStack {
        return new SharedObjectStack(param);
    }

    public async wait_online(timeoutInMicroSeconds: Option<bigint>): Promise<BuckyResult<null>> {
        const begin = bucky_time_now();
        for (; ;) {
            const ret = await this.online();
            if (ret.ok) {
                break;
            }

            if (timeoutInMicroSeconds.is_some()) {
                const now = bucky_time_now();
                if (now - begin >= timeoutInMicroSeconds.unwrap()) {
                    console.error(`stack online timeout! dur=`, timeoutInMicroSeconds);
                    return Err(new BuckyError(BuckyErrorCode.Timeout, `stack online timeout`));
                }
            }

            await sleep(1000 * 5);
        }

        return Ok(null);
    }

    public async online(): Promise<BuckyResult<null>> {
        const ret = await this.m_util_service.get_current_device();
        if (ret.err) {
            return ret;
        }

        [this.m_device_id, this.m_device] = ret.unwrap();

        return Ok(null);
    }

    // 下面两个方法必须在online成功后才可以调用
    local_device_id(): DeviceId {
        return this.m_device_id!;
    }

    local_device(): Device {
        return this.m_device!;
    }

    noc_service(): NOCRequestor {
        return this.m_noc_service;
    }

    non_service(): NONRequestor {
        return this.m_non_service;
    }

    ndn_service(): NDNRequestor {
        return this.m_ndn_service;
    }

    util(): UtilRequestor {
        return this.m_util_service;
    }

    router(): RouterRequestor {
        return this.m_router_service;
    }

    trans(): TransRequestor {
        return this.m_trans_service;
    }

    router_rules(): RouterRuleManager {
        return this.m_router_rules;
    }

    router_handlers(): RouterHandlerManager {
        return this.m_router_handlers;
    }
}