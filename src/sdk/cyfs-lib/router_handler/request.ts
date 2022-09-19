import { EventListenerAsyncRoutineT, BuckyError, BuckyErrorCode, BuckyResult, Err, Ok } from '../../cyfs-base';
import { AclHandlerRequest, AclHandlerResponse } from '../acl/request';
import { BuckyResultJsonCodec, JsonCodec } from '../base/codec';
import { CryptoSignObjectInputRequest, CryptoSignObjectInputResponse, CryptoVerifyObjectInputRequest, CryptoVerifyObjectInputResponse } from '../crypto/input_request';
import { NDNDeleteDataInputRequest, NDNDeleteDataInputResponse, NDNGetDataInputRequest, NDNGetDataInputResponse, NDNPutDataInputRequest, NDNPutDataInputResponse } from '../ndn/input_request';
import { NONDeleteObjectInputRequest, NONDeleteObjectInputResponse, NONGetObjectInputRequest, NONGetObjectInputResponse, NONPostObjectInputRequest, NONPostObjectInputResponse, NONPutObjectInputRequest, NONPutObjectInputResponse, NONSelectObjectInputRequest, NONSelectObjectInputResponse } from '../non/input_request';
import { RouterHandlerAction } from './def';

export interface RouterHandlerRequest<REQ, RESP> {
    request: REQ,
    response?: BuckyResult<RESP>,
}

// router handler的应答
export interface RouterHandlerResponse<REQ, RESP> {
    action: RouterHandlerAction,
    request?: REQ,
    response?: BuckyResult<RESP>,
}

export type RouterHandlerPutObjectRequest = RouterHandlerRequest<NONPutObjectInputRequest, NONPutObjectInputResponse>;
export type RouterHandlerGetObjectRequest = RouterHandlerRequest<NONGetObjectInputRequest, NONGetObjectInputResponse>;
export type RouterHandlerPostObjectRequest = RouterHandlerRequest<NONPostObjectInputRequest, NONPostObjectInputResponse>;
export type RouterHandlerSelectObjectRequest = RouterHandlerRequest<NONSelectObjectInputRequest, NONSelectObjectInputResponse>;
export type RouterHandlerDeleteObjectRequest = RouterHandlerRequest<NONDeleteObjectInputRequest, NONDeleteObjectInputResponse>;

export type RouterHandlerPutDataRequest =
    RouterHandlerRequest<NDNPutDataInputRequest, NDNPutDataInputResponse>;
export type RouterHandlerGetDataRequest =
    RouterHandlerRequest<NDNGetDataInputRequest, NDNGetDataInputResponse>;
export type RouterHandlerDeleteDataRequest =
    RouterHandlerRequest<NDNDeleteDataInputRequest, NDNDeleteDataInputResponse>;

export type RouterHandlerSignObjectRequest =
    RouterHandlerRequest<CryptoSignObjectInputRequest, CryptoSignObjectInputResponse>;
export type RouterHandlerVerifyObjectRequest =
    RouterHandlerRequest<CryptoVerifyObjectInputRequest, CryptoVerifyObjectInputResponse>;

export type RouterHandlerAclRequest = 
    RouterHandlerRequest<AclHandlerRequest, AclHandlerResponse>;

export type RouterHandlerPutObjectResult = RouterHandlerResponse<NONPutObjectInputRequest, NONPutObjectInputResponse>;
export type RouterHandlerGetObjectResult =
    RouterHandlerResponse<NONGetObjectInputRequest, NONGetObjectInputResponse>;
export type RouterHandlerPostObjectResult =
    RouterHandlerResponse<NONPostObjectInputRequest, NONPostObjectInputResponse>;
export type RouterHandlerSelectObjectResult =
    RouterHandlerResponse<NONSelectObjectInputRequest, NONSelectObjectInputResponse>;
export type RouterHandlerDeleteObjectResult =
    RouterHandlerResponse<NONDeleteObjectInputRequest, NONDeleteObjectInputResponse>;

export type RouterHandlerPutDataResult =
    RouterHandlerResponse<NDNPutDataInputRequest, NDNPutDataInputResponse>;
export type RouterHandlerGetDataResult =
    RouterHandlerResponse<NDNGetDataInputRequest, NDNGetDataInputResponse>;
export type RouterHandlerDeleteDataResult =
    RouterHandlerResponse<NDNDeleteDataInputRequest, NDNDeleteDataInputResponse>;

export type RouterHandlerSignObjectResult =
    RouterHandlerResponse<CryptoSignObjectInputRequest, CryptoSignObjectInputResponse>;
export type RouterHandlerVerifyObjectResult =
    RouterHandlerResponse<CryptoVerifyObjectInputRequest, CryptoVerifyObjectInputResponse>;

export type RouterHandlerAclResult =
    RouterHandlerResponse<AclHandlerRequest, AclHandlerResponse>;

export type RouterHandlerPutObjectRoutine = EventListenerAsyncRoutineT<RouterHandlerPutObjectRequest, RouterHandlerPutObjectResult>;
export type RouterHandlerGetObjectRoutine = EventListenerAsyncRoutineT<RouterHandlerGetObjectRequest, RouterHandlerGetObjectResult>;
export type RouterHandlerPostObjectRoutine = EventListenerAsyncRoutineT<RouterHandlerPostObjectRequest, RouterHandlerPostObjectResult>;
export type RouterHandlerSelectObjectRoutine = EventListenerAsyncRoutineT<RouterHandlerSelectObjectRequest, RouterHandlerSelectObjectResult>;
export type RouterHandlerDeleteObjectRoutine = EventListenerAsyncRoutineT<RouterHandlerDeleteObjectRequest, RouterHandlerDeleteObjectResult>;

export type RouterHandlerPutDataRoutine = EventListenerAsyncRoutineT<RouterHandlerPutDataRequest, RouterHandlerPutDataResult>;
export type RouterHandlerGetDataRoutine = EventListenerAsyncRoutineT<RouterHandlerGetDataRequest, RouterHandlerGetDataResult>;
export type RouterHandlerDeleteDataRoutine = EventListenerAsyncRoutineT<RouterHandlerDeleteDataRequest, RouterHandlerDeleteDataResult>;

export type RouterHandlerSignObjectRoutine = EventListenerAsyncRoutineT<RouterHandlerSignObjectRequest, RouterHandlerSignObjectResult>;
export type RouterHandlerVerifyObjectRoutine = EventListenerAsyncRoutineT<RouterHandlerVerifyObjectRequest, RouterHandlerVerifyObjectResult>;
export type RouterHandlerAclRoutine = EventListenerAsyncRoutineT<RouterHandlerAclRequest, RouterHandlerAclResult>;



export class RouterHandlerRequestJsonCodec<REQ, RESP> extends JsonCodec<RouterHandlerRequest<REQ, RESP>> {
    constructor(private req_codec: JsonCodec<REQ>, private resp_codec: JsonCodec<RESP>) {
        super();
    }

    public encode_object(param: RouterHandlerRequest<REQ, RESP>): any {
        const o: any = {
        };

        if (param.request != null) {
            o.request = this.req_codec.encode_object(param.request);
        }
        if (param.response != null) {
            const codec = new BuckyResultJsonCodec(this.resp_codec);
            o.response = codec.encode_object(param.response);
        }

        return o;
    }

    public decode_object(o: any): BuckyResult<RouterHandlerRequest<REQ, RESP>> {
        let request: REQ | undefined;
        let response: BuckyResult<RESP> | undefined;

        if (o.request) {
            const ret = this.req_codec.decode_object(o.request);
            if (ret.err) {
                return ret;
            }

            request = ret.unwrap();
        } else {
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, `invalid router handler request: ${o}`));
        }

        if (o.response) {
            const codec = new BuckyResultJsonCodec(this.resp_codec);
            const ret = codec.decode_object(o.response);
            if (ret.err) {
                return ret;
            }

            response = ret.unwrap();
        }

        const result: RouterHandlerRequest<REQ, RESP> = {
            request,
            response,
        };

        return Ok(result);
    }
}

export class RouterHandlerResponseJsonCodec<REQ, RESP> extends JsonCodec<RouterHandlerResponse<REQ, RESP>> {
    constructor(private req_codec: JsonCodec<REQ>, private resp_codec: JsonCodec<RESP>) {
        super();
    }

    public encode_object(param: RouterHandlerResponse<REQ, RESP>): any {
        const o: any = {
            action: param.action as string,
        };

        if (param.request != null) {
            o.request = this.req_codec.encode_object(param.request);
        }
        if (param.response != null) {
            const codec = new BuckyResultJsonCodec(this.resp_codec);
            o.response = codec.encode_object(param.response);
        }

        return o;
    }

    public decode_object(o: any): BuckyResult<RouterHandlerResponse<REQ, RESP>> {
        const action: RouterHandlerAction = o.action as RouterHandlerAction;
        let request: REQ | undefined;
        let response: BuckyResult<RESP> | undefined;

        if (o.request) {
            const ret = this.req_codec.decode_object(o.request);
            if (ret.err) {
                return ret;
            }

            request = ret.unwrap();
        }

        if (o.response) {
            const codec = new BuckyResultJsonCodec(this.resp_codec);
            const ret = codec.decode_object(o.response);
            if (ret.err) {
                return ret;
            }

            response = ret.unwrap();
        }

        const result: RouterHandlerResponse<REQ, RESP> = {
            action,
            request,
            response,
        };

        return Ok(result);
    }
}

export type RouterHandlerPutObjectRequestJsonCodec = RouterHandlerRequestJsonCodec<NONPutObjectInputRequest, NONPutObjectInputResponse>;
export type RouterHandlerGetObjectRequestJsonCodec = RouterHandlerRequestJsonCodec<NONGetObjectInputRequest, NONGetObjectInputResponse>;
export type RouterHandlerPostObjectRequestJsonCodec = RouterHandlerRequestJsonCodec<NONPostObjectInputRequest, NONPostObjectInputResponse>;
export type RouterHandlerSelectObjectRequestJsonCodec = RouterHandlerRequestJsonCodec<NONSelectObjectInputRequest, NONSelectObjectInputResponse>;
export type RouterHandlerDeleteObjectRequestJsonCodec = RouterHandlerRequestJsonCodec<NONDeleteObjectInputRequest, NONDeleteObjectInputResponse>;

export type RouterHandlerSignObjectRequestJsonCodec = RouterHandlerRequestJsonCodec<CryptoSignObjectInputRequest, CryptoSignObjectInputResponse>;
export type RouterHandlerVerifyObjectRequestJsonCodec = RouterHandlerRequestJsonCodec<CryptoVerifyObjectInputRequest, CryptoVerifyObjectInputResponse>;