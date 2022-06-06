import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../base/results";
import { RawEncode, RawDecode } from "../base/raw_encode";
import {} from "../base/buffer";
import { HashValue } from "../crypto/hash";

//
// ObjectTypeCode
//

export enum ObjectTypeCode{
    Device = 1,
    People = 2,
    SimpleGroup = 3,
    Org = 4,
    AppGroup = 5,
    UnionAccount = 6,
    Chunk = 7,
    File = 8,
    Dir = 9,
    Diff = 10,
    ProofOfService = 11,
    Tx = 12,
    Action = 13,
    ObjectMap = 14,
    Contract = 15,
    Custom = 16,
}

export function number_2_obj_type_code(x:number): ObjectTypeCode{
    if (typeof ObjectTypeCode[x] === 'undefined') {
        // console.error('Invalid ObjectTypeCode number');
        return ObjectTypeCode.Custom;
    }
    return x as ObjectTypeCode;
}

export function number_2_obj_type_code_name(x:number): string{
    if (typeof ObjectTypeCode[x] === 'undefined') {
        // console.error('Invalid ObjectTypeCode number');
        return "ObjectTypeCode.Custom";
    }
    switch(x){
        case ObjectTypeCode.Device: return "ObjectTypeCode.Device";
        case ObjectTypeCode.People: return "ObjectTypeCode.People";
        case ObjectTypeCode.SimpleGroup: return "ObjectTypeCode.SimpleGroup";
        case ObjectTypeCode.Org: return "ObjectTypeCode.Org";
        case ObjectTypeCode.AppGroup: return "ObjectTypeCode.AppGroup";
        case ObjectTypeCode.UnionAccount: return "ObjectTypeCode.UnionAccount";
        case ObjectTypeCode.Chunk: return "ObjectTypeCode.Chunk";
        case ObjectTypeCode.File: return "ObjectTypeCode.File";
        case ObjectTypeCode.Dir: return "ObjectTypeCode.Dir";
        case ObjectTypeCode.Diff: return "ObjectTypeCode.Diff";
        case ObjectTypeCode.ProofOfService: return "ObjectTypeCode.ProofOfService";
        case ObjectTypeCode.Tx: return "ObjectTypeCode.Tx";
        case ObjectTypeCode.Action: return "ObjectTypeCode.Action";
        case ObjectTypeCode.ObjectMap: return "ObjectTypeCode.ObjectMap";
        case ObjectTypeCode.Contract: return "ObjectTypeCode.Contract";
        default: return "ObjectTypeCode.Custom";
    }
}

export function obj_type_code_raw_check(buf:Uint8Array):ObjectTypeCode{
    const flag = buf[0];
    // 11000000
    if((flag>>6)!==1){
        return ObjectTypeCode.Custom;
    }else{
        // obj_bits[. .]type_code[. . . .] country[. .]
        // 63 => 111111
        const obj_type_code = ((flag&63)>>2);
        return number_2_obj_type_code(obj_type_code);
    }
}

export class ObjectTypeCodeEncoder implements RawEncode{
    value: ObjectTypeCode;

    constructor(value: ObjectTypeCode){
        this.value = value;
    }

    raw_measure(): BuckyResult<number>{
        // u16
        return Ok(2);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        const view = buf.offsetView(0);
        view.setUint16(0, this.value);
        buf = buf.offset(2);
        return Ok(buf);
    }
}

export class ObjectTypeCodeDecoder implements RawDecode<ObjectTypeCode>{
    raw_decode(buf: Uint8Array): BuckyResult<[ObjectTypeCode,Uint8Array]>{
        const view = buf.offsetView(0);
        const code = number_2_obj_type_code(view.getUint16(0));
        buf = buf.offset(2);

        const ret:[ObjectTypeCode,Uint8Array] = [code,buf];

        return Ok(ret);
    }
}