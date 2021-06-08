import { AnyNamedObject, DeviceId, ObjectId } from '../../cyfs-base';
import { SelectFilter, SelectOption } from '../base/select_request';
import { ZoneDirection } from '../events/def';
import { RouterHandlerAction } from './action';


export interface RouterHandlerResponse<P> {
    action: RouterHandlerAction,
    request?: P,
}

export interface RouterHandlerRequestRouterInfo {
    // 来源设备
    source: DeviceId,

    // 最终target和方向
    target?: DeviceId,
    direction?: ZoneDirection,

    // 下一条设备和方向
    next_hop?: DeviceId,
    next_direction?: ZoneDirection,
}

export interface RouterHandlerPutObjectRequest {
    router: RouterHandlerRequestRouterInfo,

    object_id: ObjectId,
    object_raw: Uint8Array,
    object: AnyNamedObject,

    dec_id?: ObjectId,
    flags: number,
}

export interface RouterHandlerGetObjectRequest {
    router: RouterHandlerRequestRouterInfo,

    object_id: ObjectId,

    dec_id?: ObjectId,
    flags: number,
}

export interface RouterHandlerSelectObjectRequest {
    router: RouterHandlerRequestRouterInfo,

    filter: SelectFilter,
    opt?: SelectOption,

    dec_id?: ObjectId,
    flags: number,
}

export interface RouterHandlerDeleteObjectRequest {
    router: RouterHandlerRequestRouterInfo,

    object_id: ObjectId,

    dec_id?: ObjectId,
    flags: number,
}