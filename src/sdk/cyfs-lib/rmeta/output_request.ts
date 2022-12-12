import { ObjectId } from "../../cyfs-base";
import { GlobalStateObjectMetaItem, GlobalStatePathAccessItem, GlobalStatePathLinkItem } from "./def";

export interface MetaOutputRequestCommon {
    // 来源DEC
    dec_id?: ObjectId,

    // 目标DEC
    target_dec_id?: ObjectId,

    // 用以默认行为
    target?: ObjectId,
    
    flags: number,
}

export interface GlobalStateMetaAddAccessOutputRequest {
    common: MetaOutputRequestCommon,

    item: GlobalStatePathAccessItem,
}

export interface GlobalStateMetaAddAccessOutputResponse {
    updated: boolean,
}

export type GlobalStateMetaRemoveAccessOutputRequest = GlobalStateMetaAddAccessOutputRequest;

export interface GlobalStateMetaRemoveAccessOutputResponse {
    item?: GlobalStatePathAccessItem,
}

export interface GlobalStateMetaClearAccessOutputRequest {
    common: MetaOutputRequestCommon,
}

export interface GlobalStateMetaClearAccessOutputResponse {
    count: number,
}

export interface GlobalStateMetaAddLinkOutputRequest {
    common: MetaOutputRequestCommon,

    source: string,
    target: string,
}

export interface GlobalStateMetaAddLinkOutputResponse {
    updated: boolean,
}

export interface GlobalStateMetaRemoveLinkOutputRequest {
    common: MetaOutputRequestCommon,

    source: string,
}

export interface GlobalStateMetaRemoveLinkOutputResponse {
    item?: GlobalStatePathLinkItem,
}

export interface GlobalStateMetaClearLinkOutputRequest {
    common: MetaOutputRequestCommon,
}

export interface GlobalStateMetaClearLinkOutputResponse {
    count: number,
}


export interface GlobalStateMetaAddObjectMetaOutputRequest {
    common: MetaOutputRequestCommon,

    item: GlobalStateObjectMetaItem,
}

export interface GlobalStateMetaAddObjectMetaOutputResponse {
    updated: boolean,
}

export type GlobalStateMetaRemoveObjectMetaOutputRequest = GlobalStateMetaAddObjectMetaOutputRequest;

export interface GlobalStateMetaRemoveObjectMetaOutputResponse {
    item?: GlobalStateObjectMetaItem,
}


export interface GlobalStateMetaClearObjectMetaOutputRequest {
    common: MetaOutputRequestCommon,
}

export interface GlobalStateMetaClearObjectMetaOutputResponse {
    count: number,
}