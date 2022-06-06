

// 1. 定义一个Desc类型信息
import {
    DescContent,
    DescContentDecoder,
    DescTypeInfo, named_id_gen_default, named_id_from_base_58, named_id_try_from_object_id, NamedObject,
    NamedObjectBuilder, NamedObjectDecoder,
    NamedObjectDesc, NamedObjectId, NamedObjectIdDecoder,
    BodyContent,
    BodyContentDecoder,
    SubDescType,
    NamedObjectDescDecoder
} from "./object";
import { ObjectTypeCode } from "./object_type_info";

import {
    BuckyNumberDecoder,
    BuckyResult,
} from "..";
import { BuckyError, BuckyErrorCode, Err, Ok } from "../base/results";
import { ObjectId } from "./object_id";
import JSBI from 'jsbi';

export class ObjectMapDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return ObjectTypeCode.ObjectMap;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "option",   // 是否有主，"disable": 禁用，"option": 可选
            area_type: "disable",    // 是否有区域信息，"disable": 禁用，"option": 可选
            author_type: "disable",  // 是否有作者，"disable": 禁用，"option": 可选
            key_type: "disable"  // 公钥类型，"disable": 禁用，"single_key": 单PublicKey，"mn_key": M-N 公钥对
        }
    }
}

// 2. 定义一个类型信息常量
const OBJECT_MAP_DESC_TYPE_INFO = new ObjectMapDescTypeInfo();

export enum ObjectMapClass {
    Root = 0,
    Sub = 1,
}

export enum ObjectMapSimpleContentType {
    Map = "map",
    DiffMap = "diffmap",
    Set = "set",
    DiffSet = "diffset",
}

function number_2_content_type(v: number): BuckyResult<ObjectMapSimpleContentType> {
    switch (v) {
        case 0: return Ok(ObjectMapSimpleContentType.Map);
        case 1: return Ok(ObjectMapSimpleContentType.DiffMap);
        case 2: return Ok(ObjectMapSimpleContentType.Set);
        case 3: return Ok(ObjectMapSimpleContentType.DiffSet);
        default: {
            const msg = `unknown ObjectMapSimpleContentType value: ${v}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.Unknown, msg));
        }
    }
}

// 3. 定义DescContent，继承自DescContent
export class ObjectMapDescContent extends DescContent {
    readonly m_class: ObjectMapClass;
    readonly m_total: JSBI;
    readonly m_size: JSBI;
    readonly m_depth: number;
    readonly m_content_type: ObjectMapSimpleContentType;
    readonly m_encode_buf: Uint8Array;

    constructor(encode_buf: Uint8Array, cls: ObjectMapClass, total: JSBI, size: JSBI, depth: number, content_type: ObjectMapSimpleContentType) {
        super();

        this.m_encode_buf = encode_buf;
        this.m_class = cls;
        this.m_total = total;
        this.m_size = size;
        this.m_depth = depth;
        this.m_content_type = content_type;
    }

    type_info(): DescTypeInfo {
        return OBJECT_MAP_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(this.m_encode_buf.byteLength);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        buf.set(this.m_encode_buf);
        buf = buf.offset(this.m_encode_buf.byteLength);
        return Ok(buf);
    }

    class(): ObjectMapClass {
        return this.m_class;
    }

    total(): JSBI {
        return this.m_total;
    }

    size(): JSBI {
        return this.m_size;
    }

    depth(): number {
        return this.m_depth;
    }

    content_type(): ObjectMapSimpleContentType {
        return this.m_content_type;
    }
}

// 4. 定义一个DescContent的解码器
export class ObjectMapDescContentDecoder extends DescContentDecoder<ObjectMapDescContent>{
    type_info(): DescTypeInfo {
        return OBJECT_MAP_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[ObjectMapDescContent, Uint8Array]> {
        let cls;
        let total;
        let size;
        let depth;
        let content_type;

        const origin_buf = buf;
        {
            const ret = new BuckyNumberDecoder('u8').raw_decode(buf);
            if (ret.err) {
                console.error("ObjectMapDescContentDecoder::raw_decode class error:", ret.val);
                return ret;
            }

            let value;
            [value, buf] = ret.unwrap();
            cls = value.toNumber() as ObjectMapClass;
        }

        {
            const ret = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (ret.err) {
                console.error("ObjectMapDescContentDecoder::raw_decode total error:", ret.val);
                return ret;
            }

            let value;
            [value, buf] = ret.unwrap();
            total = value.toBigInt();
        }

        {
            const ret = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (ret.err) {
                console.error("ObjectMapDescContentDecoder::raw_decode size error:", ret.val);
                return ret;
            }

            let value;
            [value, buf] = ret.unwrap();
            size = value.toBigInt();
        }

        {
            const ret = new BuckyNumberDecoder('u8').raw_decode(buf);
            if (ret.err) {
                console.error("ObjectMapDescContentDecoder::raw_decode depth error:", ret.val);
                return ret;
            }

            let value;
            [value, buf] = ret.unwrap();
            depth = value.toNumber();
        }

        {
            const ret = new BuckyNumberDecoder('u8').raw_decode(buf);
            if (ret.err) {
                console.error("ObjectMapDescContentDecoder::raw_decode content_type error:", ret.val);
                return ret;
            }

            let value;
            [value, buf] = ret.unwrap();
            const cret = number_2_content_type(value.toNumber());
            if (cret.err) {
                return cret;
            }

            content_type = cret.unwrap();
        }

        const self = new ObjectMapDescContent(origin_buf, cls, total, size, depth, content_type);
        const result: [ObjectMapDescContent, Uint8Array] = [self, origin_buf.offset(origin_buf.byteLength)];

        return Ok(result);
    }
}

// 5. 定义一个BodyContent，继承自RawEncode
export class ObjectMapBodyContent extends BodyContent {
    private readonly m_encode_buf: Uint8Array;

    constructor(encode_buf: Uint8Array) {
        super();
        this.m_encode_buf = encode_buf;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(this.m_encode_buf.byteLength);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return Ok(this.m_encode_buf);
    }
}

// 6. 定义一个BodyContent的解码器
export class ObjectMapBodyContentDecoder extends BodyContentDecoder<ObjectMapBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[ObjectMapBodyContent, Uint8Array]> {

        const body_content = new ObjectMapBodyContent(buf);
        const ret: [ObjectMapBodyContent, Uint8Array] = [body_content, buf];

        return Ok(ret);
    }
}

// 7. 定义组合类型
export class ObjectMapDesc extends NamedObjectDesc<ObjectMapDescContent>{
    //
}

export class ObjectMapDescDecoder extends NamedObjectDescDecoder<ObjectMapDescContent>{
    constructor() {
        super(new ObjectMapDescContentDecoder());
    }
}

export class ObjectMapBuilder extends NamedObjectBuilder<ObjectMapDescContent, ObjectMapBodyContent>{
    //
}

// 通过继承的方式具体化
export class ObjectMapId extends NamedObjectId<ObjectMapDescContent, ObjectMapBodyContent>{
    constructor(id: ObjectId) {
        super(OBJECT_MAP_DESC_TYPE_INFO.obj_type(), id);
    }

    static default(): ObjectMapId {
        return named_id_gen_default(OBJECT_MAP_DESC_TYPE_INFO.obj_type());
    }

    static from_base_58(s: string): BuckyResult<ObjectMapId> {
        return named_id_from_base_58(OBJECT_MAP_DESC_TYPE_INFO.obj_type(), s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<ObjectMapId> {
        return named_id_try_from_object_id(OBJECT_MAP_DESC_TYPE_INFO.obj_type(), id);
    }
}

export class ObjectMapIdDecoder extends NamedObjectIdDecoder<ObjectMapDescContent, ObjectMapBodyContent>{
    constructor() {
        super(ObjectTypeCode.ObjectMap);
    }
}


// 8. 定义ObjectMap对象
// 继承自NamedObject<ObjectMapDescContent, ObjectMapBodyContent>
// 提供创建方法和其他自定义方法
export class ObjectMap extends NamedObject<ObjectMapDescContent, ObjectMapBodyContent>{
    object_map_id(): ObjectMapId {
        return ObjectMapId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }
}

// 9. 定义ObjectMap解码器
export class ObjectMapDecoder extends NamedObjectDecoder<ObjectMapDescContent, ObjectMapBodyContent, ObjectMap>{
    constructor() {
        super(new ObjectMapDescContentDecoder(), new ObjectMapBodyContentDecoder(), ObjectMap);
    }
}