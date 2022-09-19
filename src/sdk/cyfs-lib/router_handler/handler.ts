import { None, Option, Some, BuckyResult, Ok, EventListenerAsyncRoutineT, ObjectId } from "../../cyfs-base";
import { RouterHandlerWSHandlerManager } from "./ws/handler";
import { CyfsStackEventType } from "../stack/stack";
import { RouterHandlerCategory, RouterHandlerAction, RouterHandlerChain } from "./def";
import {
    RouterHandlerAclRoutine,
    RouterHandlerDeleteDataRoutine,
    RouterHandlerDeleteObjectRoutine,
    RouterHandlerGetDataRoutine,
    RouterHandlerGetObjectRoutine,
    RouterHandlerPostObjectRoutine,
    RouterHandlerPutDataRoutine,
    RouterHandlerPutObjectRoutine,
    RouterHandlerRequest,
    RouterHandlerRequestJsonCodec,
    RouterHandlerResponse,
    RouterHandlerResponseJsonCodec,
    RouterHandlerSelectObjectRoutine,
    RouterHandlerSignObjectRoutine,
    RouterHandlerVerifyObjectRoutine
} from './request';
import { JsonCodec } from '../base/codec';
import { NONDeleteObjectInputRequestJsonCodec, NONDeleteObjectInputResponseJsonCodec, NONGetObjectInputRequestJsonCodec, NONGetObjectInputResponseJsonCodec, NONPostObjectInputRequestJsonCodec, NONPostObjectInputResponseJsonCodec, NONPutObjectInputRequestJsonCodec, NONPutObjectInputResponseJsonCodec } from '../non/input_request';
import { NONSelectObjectOutputRequestJsonCodec, NONSelectObjectOutputResponseJsonCodec } from '../non/output_request';
import { CryptoSignObjectInputRequestJsonCodec, CryptoVerifyObjectInputRequestJsonCodec } from "../crypto/input_request";
import { CryptoSignObjectOutputResponseJsonCodec, CryptoVerifyObjectOutputResponseJsonCodec } from "../crypto/output_request";
import { AclHandlerRequestJsonCodec, AclHandlerResponseJsonCodec } from "../acl/request";
import { NDNDeleteDataInputRequestJsonCodec, NDNDeleteDataInputResponseJsonCodec, NDNGetDataInputRequestJsonCodec, NDNGetDataInputResponseJsonCodec, NDNPutDataInputRequestJsonCodec, NDNPutDataInputResponseJsonCodec } from "../ndn/input_request";

export interface RouterHandlerAnyRoutine {
    emit(param: string): Promise<BuckyResult<string>>;
}

export class RouterHandlerEventRoutineT<REQ, RESP> implements RouterHandlerAnyRoutine {
    private request_codec: RouterHandlerRequestJsonCodec<REQ, RESP>;
    private result_codec: RouterHandlerResponseJsonCodec<REQ, RESP>;
   
    constructor(
        req_codec: JsonCodec<REQ>,
        resp_codec: JsonCodec<RESP>,
        private listener: EventListenerAsyncRoutineT<RouterHandlerRequest<REQ, RESP>, RouterHandlerResponse<REQ, RESP>>) {

        this.request_codec = new RouterHandlerRequestJsonCodec<REQ, RESP>(req_codec, resp_codec);
        this.result_codec = new RouterHandlerResponseJsonCodec<REQ, RESP>(req_codec, resp_codec);
    }

    async emit(param: string): Promise<BuckyResult<string>> {
        let p: RouterHandlerRequest<REQ, RESP>;
        {
            const ret = this.request_codec.decode_string(param);
            if (ret.err) {
                return ret;
            }
            p = ret.unwrap();
        }

        const result = await this.listener.call(p);
        if (result.err) {
            return result;
        }

        return Ok(this.result_codec.encode_string(result.unwrap()));
    }
}


export class RouterHandlerManager {
    // http: Option<RouterHandlerHttpHandlerManager> = None;
    ws: Option<RouterHandlerWSHandlerManager> = None;

    constructor(event_type: CyfsStackEventType, ws_url?: string, private dec_id?: ObjectId) {
        switch (event_type) {
            case CyfsStackEventType.Http:
                // 暂时不支持http回调模式
                throw new Error('ts sdk not support CyfsStackEventType.Http');
            case CyfsStackEventType.WebSocket:
                console.assert(ws_url);
                const ws = new RouterHandlerWSHandlerManager(ws_url!, dec_id);
                ws.start();
                this.ws = Some(ws);
                break;
            default:
                console.warn('unknown event type', event_type);
                break;
        }
    }

    add_put_object_handler(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        filter: string|undefined,
        req_path: string|undefined,
        default_action: RouterHandlerAction,
        routine?: RouterHandlerPutObjectRoutine
    ): Promise<BuckyResult<void>> {
        const req_codec = new NONPutObjectInputRequestJsonCodec();
        const resp_codec = new NONPutObjectInputResponseJsonCodec();

        return this.add_handler(chain, id, index, RouterHandlerCategory.PutObject, req_codec, resp_codec,
            filter, req_path, default_action, routine);
    }

    add_get_object_handler(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        filter: string|undefined,
        req_path: string|undefined,
        default_action: RouterHandlerAction,
        routine?: RouterHandlerGetObjectRoutine
    ): Promise<BuckyResult<void>> {
        const req_codec = new NONGetObjectInputRequestJsonCodec();
        const resp_codec = new NONGetObjectInputResponseJsonCodec();

        return this.add_handler(chain, id, index, RouterHandlerCategory.GetObject, req_codec, resp_codec,
            filter, req_path, default_action, routine);
    }

    add_post_object_handler(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        filter: string|undefined,
        req_path: string|undefined,
        default_action: RouterHandlerAction,
        routine?: RouterHandlerPostObjectRoutine
    ): Promise<BuckyResult<void>> {
        const req_codec = new NONPostObjectInputRequestJsonCodec();
        const resp_codec = new NONPostObjectInputResponseJsonCodec();

        return this.add_handler(chain, id, index, RouterHandlerCategory.PostObject, req_codec, resp_codec,
            filter, req_path, default_action, routine);
    }

    add_select_object_handler(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        filter: string|undefined,
        req_path: string|undefined,
        default_action: RouterHandlerAction,
        routine?: RouterHandlerSelectObjectRoutine
    ): Promise<BuckyResult<void>> {
        const req_codec = new NONSelectObjectOutputRequestJsonCodec();
        const resp_codec = new NONSelectObjectOutputResponseJsonCodec();

        return this.add_handler(chain, id, index, RouterHandlerCategory.SelectObject, req_codec, resp_codec,
            filter, req_path, default_action, routine);
    }

    add_delete_object_handler(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        filter: string|undefined,
        req_path: string|undefined,
        default_action: RouterHandlerAction,
        routine?: RouterHandlerDeleteObjectRoutine
    ): Promise<BuckyResult<void>> {
        const req_codec = new NONDeleteObjectInputRequestJsonCodec();
        const resp_codec = new NONDeleteObjectInputResponseJsonCodec();

        return this.add_handler(chain, id, index, RouterHandlerCategory.DeleteObject, req_codec, resp_codec,
            filter, req_path, default_action, routine);
    }

    add_put_data_handler(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        filter: string|undefined,
        req_path: string|undefined,
        default_action: RouterHandlerAction,
        routine?: RouterHandlerPutDataRoutine
    ): Promise<BuckyResult<void>> {
        const req_codec = new NDNPutDataInputRequestJsonCodec();
        const resp_codec = new NDNPutDataInputResponseJsonCodec();

        return this.add_handler(chain, id, index, RouterHandlerCategory.PutData, req_codec, resp_codec,
            filter, req_path, default_action, routine);
    }

    add_get_data_handler(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        filter: string|undefined,
        req_path: string|undefined,
        default_action: RouterHandlerAction,
        routine?: RouterHandlerGetDataRoutine
    ): Promise<BuckyResult<void>> {
        const req_codec = new NDNGetDataInputRequestJsonCodec();
        const resp_codec = new NDNGetDataInputResponseJsonCodec();

        return this.add_handler(chain, id, index, RouterHandlerCategory.GetData, req_codec, resp_codec,
            filter, req_path, default_action, routine);
    }

    add_delete_data_handler(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        filter: string|undefined,
        req_path: string|undefined,
        default_action: RouterHandlerAction,
        routine?: RouterHandlerDeleteDataRoutine
    ): Promise<BuckyResult<void>> {
        const req_codec = new NDNDeleteDataInputRequestJsonCodec();
        const resp_codec = new NDNDeleteDataInputResponseJsonCodec();

        return this.add_handler(chain, id, index, RouterHandlerCategory.DeleteData, req_codec, resp_codec,
            filter, req_path, default_action, routine);
    }

    add_sign_object_handler(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        filter: string|undefined,
        req_path: string|undefined,
        default_action: RouterHandlerAction,
        routine?: RouterHandlerSignObjectRoutine
    ): Promise<BuckyResult<void>> {
        const req_codec = new CryptoSignObjectInputRequestJsonCodec();
        const resp_codec = new CryptoSignObjectOutputResponseJsonCodec();

        return this.add_handler(chain, id, index, RouterHandlerCategory.SignObject, req_codec, resp_codec,
            filter, req_path, default_action, routine);
    }

    add_verify_object_handler(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        filter: string|undefined,
        req_path: string|undefined,
        default_action: RouterHandlerAction,
        routine?: RouterHandlerVerifyObjectRoutine
    ): Promise<BuckyResult<void>> {
        const req_codec = new CryptoVerifyObjectInputRequestJsonCodec();
        const resp_codec = new CryptoVerifyObjectOutputResponseJsonCodec();

        return this.add_handler(chain, id, index, RouterHandlerCategory.VerifyObject, req_codec, resp_codec,
            filter, req_path, default_action, routine);
    }

    add_acl_handler(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        filter: string|undefined,
        req_path: string|undefined,
        default_action: RouterHandlerAction,
        routine?: RouterHandlerAclRoutine
    ): Promise<BuckyResult<void>> {
        const req_codec = new AclHandlerRequestJsonCodec();
        const resp_codec = new AclHandlerResponseJsonCodec();

        return this.add_handler(chain, id, index, RouterHandlerCategory.Acl, req_codec, resp_codec,
            filter, req_path, default_action, routine);
    }

    add_handler<REQ, RESP>(
        chain: RouterHandlerChain,
        id: string,
        index: number,
        category: RouterHandlerCategory,
        req_codec: JsonCodec<REQ>,
        resp_codec: JsonCodec<RESP>,
        filter: string|undefined,
        req_path: string|undefined,
        default_action: RouterHandlerAction,
        routine?: EventListenerAsyncRoutineT<RouterHandlerRequest<REQ, RESP>, RouterHandlerResponse<REQ, RESP>>
    ): Promise<BuckyResult<void>> {
        if (this.ws.is_some()) {
            return this.ws.unwrap().add_handler(chain, id, index, category, req_codec, resp_codec, filter, req_path, default_action, routine);
        } else {
            throw new Error('router handler require ws');
        }
    }

    async remove_handler(chain: RouterHandlerChain, category: RouterHandlerCategory, id: string): Promise<BuckyResult<boolean>> {
        if (this.ws.is_some()) {
            return await this.ws.unwrap().remove_handler(chain, category, id);
        } else {
            throw new Error('remove_handler require ws');
        }
    }
}