

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
    BuckyResult,
    RawDecode,
    RawEncode,
} from "..";
import { Err, Ok } from "../base/results";
import { ObjectId } from "./object_id";

export class AppGroupDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return ObjectTypeCode.AppGroup;
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
const APPGROUP_DESC_TYPE_INFO = new AppGroupDescTypeInfo();

// 3. 定义DescContent，继承自DescContent
export class AppGroupDescContent extends DescContent {

    type_info(): DescTypeInfo {
        return APPGROUP_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return Ok(buf);
    }
}

// 4. 定义一个DescContent的解码器
export class AppGroupDescContentDecoder extends DescContentDecoder<AppGroupDescContent>{
    type_info(): DescTypeInfo {
        return APPGROUP_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[AppGroupDescContent, Uint8Array]> {
        const self = new AppGroupDescContent();
        const ret: [AppGroupDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

// 5. 定义一个BodyContent，继承自RawEncode
export class AppGroupBodyContent extends BodyContent {
    raw_measure(): BuckyResult<number> {
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return Ok(buf);
    }
}

// 6. 定义一个BodyContent的解码器
export class AppGroupBodyContentDecoder extends BodyContentDecoder<AppGroupBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[AppGroupBodyContent, Uint8Array]> {

        const body_content = new AppGroupBodyContent();
        const ret: [AppGroupBodyContent, Uint8Array] = [body_content, buf];

        return Ok(ret);
    }
}

// 7. 定义组合类型
export class AppGroupDesc extends NamedObjectDesc<AppGroupDescContent>{
    //
}

export class AppGroupDescDecoder extends NamedObjectDescDecoder<AppGroupDescContent>{
    constructor() {
        super(new AppGroupDescContentDecoder());
    }
}

export class AppGroupBuilder extends NamedObjectBuilder<AppGroupDescContent, AppGroupBodyContent>{
    //
}

// 通过继承的方式具体化
export class AppGroupId extends NamedObjectId<AppGroupDescContent, AppGroupBodyContent>{
    constructor(id: ObjectId) {
        super(APPGROUP_DESC_TYPE_INFO.obj_type(), id);
    }

    static default(): AppGroupId {
        return named_id_gen_default(APPGROUP_DESC_TYPE_INFO.obj_type());
    }

    static from_base_58(s: string): BuckyResult<AppGroupId> {
        return named_id_from_base_58(APPGROUP_DESC_TYPE_INFO.obj_type(), s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AppGroupId> {
        return named_id_try_from_object_id(APPGROUP_DESC_TYPE_INFO.obj_type(), id);
    }
}

export class AppGroupIdDecoder extends NamedObjectIdDecoder<AppGroupDescContent, AppGroupBodyContent>{
    constructor() {
        super(ObjectTypeCode.AppGroup);
    }
}


// 8. 定义AppGroup对象
// 继承自NamedObject<AppGroupDescContent, AppGroupBodyContent>
// 提供创建方法和其他自定义方法
export class AppGroup extends NamedObject<AppGroupDescContent, AppGroupBodyContent>{
    static create(build?: (builder: AppGroupBuilder) => void): AppGroup {
        const desc_content = new AppGroupDescContent();
        const body_content = new AppGroupBodyContent();
        const builder = new NamedObjectBuilder<AppGroupDescContent, AppGroupBodyContent>(desc_content, body_content);
        if (build) {
            build(builder);
        }

        return builder.build(AppGroup);
    }

    appgroup_id(): AppGroupId {
        return AppGroupId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }

    connect_info(): AppGroupBodyContent {
        return this.body_expect().content();
    }
}

// 9. 定义AppGroup解码器
export class AppGroupDecoder extends NamedObjectDecoder<AppGroupDescContent, AppGroupBodyContent, AppGroup>{
    constructor() {
        super(new AppGroupDescContentDecoder(), new AppGroupBodyContentDecoder(), AppGroup);
    }
}