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
    RawDecode,
    RawEncode,
} from "../base/raw_encode";
import { Err, Ok, BuckyResult } from "../base/results";
import { ObjectId } from "./object_id";

// 1. 定义一个Desc类型信息
export class ActionDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return ObjectTypeCode.Action;
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
const ACTION_DESC_TYPE_INFO = new ActionDescTypeInfo();

// 3. 定义DescContent，继承自DescContent
export class ActionDescContent extends DescContent {
    type_info(): DescTypeInfo {
        return ACTION_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return Ok(buf);
    }
}

// 4. 定义一个DescContent的解码器
export class ActionDescContentDecoder extends DescContentDecoder<ActionDescContent>{
    type_info(): DescTypeInfo {
        return ACTION_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[ActionDescContent, Uint8Array]> {
        const self = new ActionDescContent();
        const ret: [ActionDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

// 5. 定义一个BodyContent，继承自RawEncode
export class ActionBodyContent extends BodyContent {
    raw_measure(): BuckyResult<number> {
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {

        return Ok(buf);
    }
}

// 6. 定义一个BodyContent的解码器
export class ActionBodyContentDecoder extends BodyContentDecoder<ActionBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[ActionBodyContent, Uint8Array]> {

        const body_content = new ActionBodyContent();
        const ret: [ActionBodyContent, Uint8Array] = [body_content, buf];

        return Ok(ret);
    }
}

// 7. 定义组合类型
export class ActionDesc extends NamedObjectDesc<ActionDescContent>{
    //
}

export class ActionDescDecoder extends NamedObjectDescDecoder<ActionDescContent>{
    constructor() {
        super(new ActionDescContentDecoder());
    }
}

export class ActionBuilder extends NamedObjectBuilder<ActionDescContent, ActionBodyContent>{
    //
}

// 通过继承的方式具体化
export class ActionId extends NamedObjectId<ActionDescContent, ActionBodyContent>{
    constructor(id: ObjectId) {
        super(ACTION_DESC_TYPE_INFO.obj_type(), id);
    }

    static default(): ActionId {
        return named_id_gen_default(ACTION_DESC_TYPE_INFO.obj_type());
    }

    static from_base_58(s: string): BuckyResult<ActionId> {
        return named_id_from_base_58(ACTION_DESC_TYPE_INFO.obj_type(), s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<ActionId> {
        return named_id_try_from_object_id(ACTION_DESC_TYPE_INFO.obj_type(), id);
    }
}

export class ActionIdDecoder extends NamedObjectIdDecoder<ActionDescContent, ActionBodyContent>{
    constructor() {
        super(ObjectTypeCode.Action);
    }
}


// 8. 定义Action对象
// 继承自NamedObject<ActionDescContent, ActionBodyContent>
// 提供创建方法和其他自定义方法
export class Action extends NamedObject<ActionDescContent, ActionBodyContent>{
    static create(build?: (builder: ActionBuilder) => void): Action {
        const desc_content = new ActionDescContent();
        const body_content = new ActionBodyContent();
        const builder = new ActionBuilder(desc_content, body_content);
        if (build) {
            build!(builder);
        }

        return builder.build(Action);
    }

    action_id(): ActionId {
        return ActionId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }

    connect_info(): ActionBodyContent {
        return this.body_expect().content();
    }
}

// 9. 定义Action解码器
export class ActionDecoder extends NamedObjectDecoder<ActionDescContent, ActionBodyContent, Action>{
    constructor() {
        super(new ActionDescContentDecoder(), new ActionBodyContentDecoder(), Action);
    }
}