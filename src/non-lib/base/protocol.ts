import {
    BuckyError,
    BuckyErrorCode,
    BuckyResult,
    Err,
    Ok,
} from "../../cyfs-base";

// non_stack的http服务url
export const NON_STACK_HTTP_URL: string = "http://127.0.0.1:1318";
export const NON_STACK_WS_URL: string = "ws://127.0.0.1:1319";

export const RUNTIME_NON_STACK_HTTP_URL: string = "http://127.0.0.1:1322";
export const RUNTIME_NON_STACK_WS_URL: string = "ws://127.0.0.1:1323";

export enum ObjectProtocol {
    Local,
    Meta,
    HttpBdt,
    Http,
    DatagramBdt,
}

export function obj_protocol_to_str(p: ObjectProtocol):string{
    switch(p){
        case ObjectProtocol.Local: return "local";
        case ObjectProtocol.Meta: return "meta";
        case ObjectProtocol.HttpBdt: return "http_bdt";
        case ObjectProtocol.Http: return "http";
        case ObjectProtocol.DatagramBdt: return "datagram_bdt";
    }
}

export function obj_protocol_from_str(p: string):BuckyResult<ObjectProtocol>{
    switch(p){
        case "local": return Ok(ObjectProtocol.Local);
        case "meta": return Ok(ObjectProtocol.Meta);
        case "http_bdt": return Ok(ObjectProtocol.HttpBdt);
        case "http": return Ok(ObjectProtocol.Http);
        case "datagram_bdt": return Ok(ObjectProtocol.DatagramBdt);
        default: return Err(new BuckyError(BuckyErrorCode.InvalidFormat,"invalid object protocol value"));
    }
}