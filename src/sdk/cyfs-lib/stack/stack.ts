import { BaseRequestor, HttpRequestor, WSHttpRequestor } from "../base/base_requestor";
import { Device, DeviceId } from "../../cyfs-base/objects/device";
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
    ObjectId,
    ObjectMapSimpleContentType,
} from "../../cyfs-base";
import { CYFS_RUNTIME_NON_STACK_HTTP_PORT, CYFS_RUNTIME_NON_STACK_WS_PORT, NON_STACK_HTTP_PORT, NON_STACK_WS_PORT } from "../../cyfs-base/base/port";
import { TransRequestor } from '../trans/requestor';
import { RouterHandlerManager } from '../router_handler/handler';
import JSBI from 'jsbi';
import { NONRequestor } from "../non/requestor";
import { NDNRequestor } from "../ndn/requestor";
import { CryptoRequestor } from "../crypto/requestor";
import { GlobalStateRequestor, GlobalStateAccessorRequestor } from "../root_state/requestor"
import { GlobalStateStub, GlobalStateAccessorStub } from "../root_state/stub"
import { GlobalStateCategory } from '../root_state/def';
import { SyncRequestor } from "../sync/requestor";
import { StateStorage } from "../storage/state_storage";
import { RouterEventManager } from "../events/handler";
import { GlobalStateMetaRequestor } from "../rmeta/requestor";
import { GlobalStateMetaStub } from "../rmeta/stub";


export enum CyfsStackEventType {
    Http,
    WebSocket,
}

export enum CyfsStackRequestorType {
    Http,
    WebSocket,
}

export interface CyfsStackRequestorConfig {
    non_service: CyfsStackRequestorType,
    ndn_service: CyfsStackRequestorType,
    util_service: CyfsStackRequestorType,
    trans_service: CyfsStackRequestorType,
    crypto_service: CyfsStackRequestorType,
    root_state: CyfsStackRequestorType,
    local_cache: CyfsStackRequestorType,
    sync_service: CyfsStackRequestorType,
}


export class SharedCyfsStackParam {
    constructor(
        public service_url: string,
        public event_type: CyfsStackEventType,
        public dec_id: ObjectId,
        public ws_url?: string,
        public requestor_config?: CyfsStackRequestorConfig
    ) {
        if (this.requestor_config == null) {
            this.requestor_config = SharedCyfsStackParam.default_requestor_config();
        }
    }

    static default_requestor_config(): CyfsStackRequestorConfig {
        return {
            non_service: CyfsStackRequestorType.Http,
            ndn_service: CyfsStackRequestorType.Http,
            util_service: CyfsStackRequestorType.Http,
            trans_service: CyfsStackRequestorType.Http,
            crypto_service: CyfsStackRequestorType.Http,
            root_state: CyfsStackRequestorType.Http,
            local_cache: CyfsStackRequestorType.Http,
            sync_service: CyfsStackRequestorType.Http,
        }
    }

    static ws_requestor_config(): CyfsStackRequestorConfig {
        return {
            non_service: CyfsStackRequestorType.WebSocket,
            ndn_service: CyfsStackRequestorType.WebSocket,
            util_service: CyfsStackRequestorType.WebSocket,
            trans_service: CyfsStackRequestorType.WebSocket,
            crypto_service: CyfsStackRequestorType.WebSocket,
            root_state: CyfsStackRequestorType.WebSocket,
            local_cache: CyfsStackRequestorType.WebSocket,
            sync_service: CyfsStackRequestorType.WebSocket,
        }
    }

    static default(dec_id: ObjectId): SharedCyfsStackParam {
        const url = `http://127.0.0.1:${NON_STACK_HTTP_PORT}`;
        const ws_url = `ws://127.0.0.1:${NON_STACK_WS_PORT}`;

        return new SharedCyfsStackParam(
            url,
            CyfsStackEventType.WebSocket,
            dec_id,
            ws_url,
        );
    }

    static default_with_ws_event(dec_id: ObjectId): SharedCyfsStackParam {
        return new SharedCyfsStackParam(
            NON_STACK_HTTP_URL,
            CyfsStackEventType.WebSocket,
            dec_id,
            NON_STACK_WS_URL,
        );
    }

    // runtime协议栈默认都是websocket事件系统，端口也是固定的
    static default_runtime(dec_id: ObjectId): SharedCyfsStackParam {
        const url = `http://127.0.0.1:${CYFS_RUNTIME_NON_STACK_HTTP_PORT}`;
        const ws_url = `ws://127.0.0.1:${CYFS_RUNTIME_NON_STACK_WS_PORT}`;

        return new SharedCyfsStackParam(
            url,
            CyfsStackEventType.WebSocket,
            dec_id,
            ws_url,
        );
    }

    // 使用指定的url打开协议栈，并使用http事件系统
    static new_with_http_event(service_url: string, dec_id: ObjectId): BuckyResult<SharedCyfsStackParam> {
        return Ok(new SharedCyfsStackParam(
            service_url,
            CyfsStackEventType.Http,
            dec_id
        ));
    }

    // 使用指定的端口打开协议栈，并使用http事件系统
    static new_with_http_event_ports(service_http_port: number, dec_id: ObjectId): BuckyResult<SharedCyfsStackParam> {
        const service_url = `http://127.0.0.1:${service_http_port}`;

        return Ok(new SharedCyfsStackParam(
            service_url,
            CyfsStackEventType.Http,
            dec_id
        ));
    }

    // 使用指定的url打开协议栈，并使用websocket事件系统
    static new_with_ws_event(service_url: string, ws_url: string, dec_id: ObjectId): BuckyResult<SharedCyfsStackParam> {
        return Ok(new SharedCyfsStackParam(
            service_url,
            CyfsStackEventType.WebSocket,
            dec_id,
            ws_url
        ));
    }

    // 使用指定的端口打开协议栈，并使用websocket事件系统
    static new_with_ws_event_ports(service_http_port: number, ws_port: number, dec_id: ObjectId): BuckyResult<SharedCyfsStackParam> {
        console.assert(service_http_port !== ws_port);

        const service_url = `http://127.0.0.1:${service_http_port}`;
        const ws_url = `ws://127.0.0.1:${ws_port}`;

        console.info(`new_with_ws_event_ports: ${service_url}, ${ws_url}`);

        return Ok(new SharedCyfsStackParam(
            service_url,
            CyfsStackEventType.WebSocket,
            dec_id,
            ws_url
        ));
    }

    clone(): SharedCyfsStackParam {
        return new SharedCyfsStackParam(this.service_url, this.event_type, this.dec_id, this.ws_url, this.requestor_config);
    }
}

export class SharedCyfsStack {
    // 所属的dec_id
    public dec_id: ObjectId;
    private m_util_service: UtilRequestor;
    private m_non_service: NONRequestor;
    private m_ndn_service: NDNRequestor;
    private m_trans_service: TransRequestor;
    private m_crypto: CryptoRequestor;
    private m_root_state: GlobalStateRequestor;
    private m_local_cache: GlobalStateRequestor;

    private m_root_state_accessor :GlobalStateAccessorRequestor;
    private m_local_cache_accessor :GlobalStateAccessorRequestor;

    private m_root_state_meta: GlobalStateMetaRequestor;
    private m_local_cache_meta: GlobalStateMetaRequestor;

    // router handlers事件处理器
    private m_router_handlers: RouterHandlerManager;

    // event事件处理器
    private m_router_events: RouterEventManager;

    private m_sync_service: SyncRequestor;

    // 当前协议栈的device
    private m_device_id?: DeviceId;
    private m_device?: Device;

    private m_param: SharedCyfsStackParam;

    private constructor(param: SharedCyfsStackParam) {
        this.m_param = param;
        const ws_url = param.ws_url;

        console.log('create SharedCyfsStack', JSON.stringify(param));

        this.dec_id = param.dec_id;

        this.m_util_service = new UtilRequestor(SharedCyfsStack.select_requestor(param, param.requestor_config!.util_service), this.dec_id);
        this.m_non_service = new NONRequestor(SharedCyfsStack.select_requestor(param, param.requestor_config!.non_service), this.dec_id);
        this.m_ndn_service = new NDNRequestor(SharedCyfsStack.select_requestor(param, param.requestor_config!.ndn_service), this.dec_id);
        this.m_trans_service = new TransRequestor(SharedCyfsStack.select_requestor(param, param.requestor_config!.trans_service), this.dec_id);
        this.m_crypto = new CryptoRequestor(SharedCyfsStack.select_requestor(param, param.requestor_config!.crypto_service), this.dec_id);
        this.m_root_state = new GlobalStateRequestor(GlobalStateCategory.RootState, SharedCyfsStack.select_requestor(param, param.requestor_config!.root_state), this.dec_id);
        this.m_local_cache = new GlobalStateRequestor(GlobalStateCategory.LocalCache, SharedCyfsStack.select_requestor(param, param.requestor_config!.local_cache), this.dec_id);

        this.m_root_state_accessor = GlobalStateAccessorRequestor.new_root_state_accessor(SharedCyfsStack.select_requestor(param, param.requestor_config!.root_state), this.dec_id);
        this.m_local_cache_accessor = GlobalStateAccessorRequestor.new_local_cache_accessor(SharedCyfsStack.select_requestor(param, param.requestor_config!.local_cache), this.dec_id);

        this.m_root_state_meta = GlobalStateMetaRequestor.new_root_state(SharedCyfsStack.select_requestor(param, param.requestor_config!.root_state), this.dec_id);
        this.m_local_cache_meta = GlobalStateMetaRequestor.new_local_cache(SharedCyfsStack.select_requestor(param, param.requestor_config!.root_state), this.dec_id);

        this.m_router_handlers = new RouterHandlerManager(CyfsStackEventType.WebSocket, ws_url, this.dec_id);

        this.m_router_events = new RouterEventManager(CyfsStackEventType.WebSocket, ws_url, this.dec_id);

        this.m_sync_service = new SyncRequestor(SharedCyfsStack.select_requestor(param, param.requestor_config!.sync_service), this.dec_id);
    }

    private static select_requestor(param: SharedCyfsStackParam, requestor_type: CyfsStackRequestorType,): BaseRequestor {
        if (requestor_type === CyfsStackRequestorType.WebSocket) {
            console.assert(param.ws_url != null);

            const requestor = new WSHttpRequestor(param.ws_url!);
            return requestor;
        } else {
            console.assert(requestor_type === CyfsStackRequestorType.Http);
            console.assert(param.service_url != null);

            const url = new URL(param.service_url);
            const addr = `${url.host}`;
            const requestor = new HttpRequestor(addr);
            return requestor;
        }
    }

    static default_with_ws_event(dec_id: ObjectId): SharedCyfsStack {
        const p = SharedCyfsStackParam.default_with_ws_event(dec_id);
        const self = new SharedCyfsStack(p);
        return self;
    }

    static open_default(dec_id: ObjectId): SharedCyfsStack {
        return new SharedCyfsStack(SharedCyfsStackParam.default(dec_id));
    }

    static open_default_with_ws_event(dec_id: ObjectId): SharedCyfsStack {
        return new SharedCyfsStack(SharedCyfsStackParam.default_with_ws_event(dec_id));
    }

    static open_runtime(dec_id: ObjectId): SharedCyfsStack {
        return new SharedCyfsStack(SharedCyfsStackParam.default_runtime(dec_id));
    }

    static open(param: SharedCyfsStackParam): SharedCyfsStack {
        return new SharedCyfsStack(param);
    }

    fork_with_new_dec(dec_id?: ObjectId): SharedCyfsStack {
        const new_param = this.m_param.clone();
        if (dec_id) {
            new_param.dec_id = dec_id;
        }

        const stack = new SharedCyfsStack(new_param);
        stack.m_device = this.m_device;
        stack.m_device_id = this.m_device_id;
        return stack;
    }

    public async wait_online(timeoutInMicroSeconds?: JSBI): Promise<BuckyResult<null>> {
        console.info(`stack will online: dec=${this.dec_id}`);
        const begin = bucky_time_now();
        for (; ;) {
            const ret = await this.online();
            if (ret.ok) {
                break;
            }

            if (timeoutInMicroSeconds) {
                const now = bucky_time_now();
                if (JSBI.GE(JSBI.subtract(now, begin), timeoutInMicroSeconds)) {
                    console.error(`stack online timeout! dur=${timeoutInMicroSeconds}μs`,);
                    return Err(new BuckyError(BuckyErrorCode.Timeout, `stack online timeout`));
                }
            }

            console.error(`stack online error: `, ret.val);
            await sleep(1000 * 5);
        }

        console.info(`stack online success!`);
        return Ok(null);
    }

    public async online(): Promise<BuckyResult<null>> {
        // 多次调用online不会重复取device
        if (this.m_device && this.m_device_id) {
            return Ok(null);
        }

        const ret = await this.m_util_service.get_device({ common: { flags: 0 } });
        if (ret.err) {
            return ret;
        }

        const resp = ret.unwrap();
        this.m_device = resp.device;
        this.m_device_id = resp.device_id;

        return Ok(null);
    }

    // 下面两个方法必须在online成功后才可以调用
    local_device_id(): DeviceId {
        return this.m_device_id!;
    }

    local_device(): Device {
        return this.m_device!;
    }

    non_service(): NONRequestor {
        return this.m_non_service;
    }

    ndn_service(): NDNRequestor {
        return this.m_ndn_service;
    }

    crypto(): CryptoRequestor {
        return this.m_crypto;
    }

    util(): UtilRequestor {
        return this.m_util_service;
    }

    trans(): TransRequestor {
        return this.m_trans_service;
    }

    sync(): SyncRequestor {
        return this.m_sync_service;
    }

    router_handlers(): RouterHandlerManager {
        return this.m_router_handlers;
    }

    router_events(): RouterEventManager {
        return this.m_router_events;
    }

    // root_state methods
    root_state(): GlobalStateRequestor {
        return this.m_root_state;
    }

    root_state_stub(target?: ObjectId, dec_id?: ObjectId): GlobalStateStub {
        return new GlobalStateStub(this.root_state(), target, dec_id);
    }

    // local_cache methods
    local_cache(): GlobalStateRequestor {
        return this.m_local_cache;
    }

    local_cache_stub(target?: ObjectId, dec_id?: ObjectId): GlobalStateStub {
        return new GlobalStateStub(this.local_cache(), target, dec_id);
    }

    root_state_accessor(): GlobalStateAccessorRequestor {
        return this.m_root_state_accessor;
    }

    root_state_accessor_stub(target?: ObjectId, dec_id?: ObjectId): GlobalStateAccessorStub {
        return new GlobalStateAccessorStub(this.root_state_accessor(), target, dec_id);
    }

    local_cache_accessor(): GlobalStateAccessorRequestor {
        return this.m_local_cache_accessor;
    }

    local_cache_accessor_stub(dec_id?: ObjectId): GlobalStateAccessorStub {
        return new GlobalStateAccessorStub(this.local_cache_accessor(), undefined, dec_id);
    }

    root_state_meta(): GlobalStateMetaRequestor {
        return this.m_root_state_meta;
    }

    root_state_meta_stub(target?: ObjectId, dec_id?: ObjectId): GlobalStateMetaStub {
        return new GlobalStateMetaStub(this.root_state_meta(), target, dec_id);
    }

    local_cache_meta(): GlobalStateMetaRequestor {
        return this.m_local_cache_meta;
    }

    local_cache_meta_stub(dec_id?: ObjectId): GlobalStateMetaStub {
        return new GlobalStateMetaStub(this.local_cache_meta(), undefined, dec_id);
    }

    // state_storage
    global_state_storage(
        category: GlobalStateCategory,
        path: string,
        content_type: ObjectMapSimpleContentType,
    ): StateStorage {
        return new StateStorage(
            this,
            category,
            path,
            content_type,
            undefined,
            this.dec_id,
        )
    }

    global_state_storage_ex(
        category: GlobalStateCategory,
        path: string,
        content_type: ObjectMapSimpleContentType,
        target?: ObjectId,
        dec_id?: ObjectId,
    ): StateStorage {
        return new StateStorage(
            this,
            category,
            path,
            content_type,
            target,
            dec_id,
        )
    }
}