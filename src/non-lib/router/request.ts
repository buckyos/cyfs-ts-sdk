import { SelectOption, SelectFilter, SelectResponse } from "../base/select_request";
import { AnyNamedObject, Option } from "../../cyfs-base";
import { ObjectId } from "../../cyfs-base/objects/object_id";

export interface RouterPutObjectRequest {
    object_id: ObjectId;
    object_raw: Uint8Array;

    target?: ObjectId;
    dec_id?: ObjectId;
    flags: number;
}

export interface RouterGetObjectRequest {
    object_id: ObjectId;
    
    target?: ObjectId;
    dec_id?: ObjectId;
    flags: number;
}

export interface RouterSelectObjectRequest {
    filter: SelectFilter;
    opt: Option<SelectOption>;

    target?: ObjectId;
    dec_id?: ObjectId;
    flags: number;
}

// pub type RouterSelectObjectResponse = SelectResponse;
export type RouterSelectObjectResponse = SelectResponse;

export interface RouterGetObjectResponse {
    object_raw: Uint8Array;
    object: AnyNamedObject;
}