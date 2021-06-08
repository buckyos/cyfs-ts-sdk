import {
    OBJECT_TYPE_DECAPP_START,
    OBJECT_TYPE_DECAPP_END,
} from '../cyfs-base/index'

export enum DECAppObjectType {
    // ZONE
    MessageList = OBJECT_TYPE_DECAPP_START + 1,

    // Error
    ErrObjType = OBJECT_TYPE_DECAPP_END,
}

export function number_2_dec_app_object_type(x:number): DECAppObjectType{
    if (typeof DECAppObjectType[x] === 'undefined') {
        return DECAppObjectType.ErrObjType;
    }
    return x as DECAppObjectType;
}

export function number_2_dec_app_object_name(x:number): string{
    if (typeof DECAppObjectType[x] === 'undefined') {
        return "DECAppObjectType.ErrObjType";
    }
    return `DECAppObjectType.${DECAppObjectType[number_2_dec_app_object_type(x)]}`;
}