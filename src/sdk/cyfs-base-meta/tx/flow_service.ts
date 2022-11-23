/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import {
    SubDescType,
    DescTypeInfo, DescContent, DescContentDecoder,
    BodyContent, BodyContentDecoder,
    NamedObjectId, NamedObjectIdDecoder,
    NamedObjectDesc, NamedObjectDescDecoder,
    NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "../../cyfs-base/objects/object"

import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { ObjectId } from "../../cyfs-base/objects/object_id";
import JSBI from 'jsbi';

// 定义App对象的类型信息
export class FlowServiceDescTypeInfo extends DescTypeInfo {

    // 每个对象需要一个应用App唯一的编号
    obj_type(): number {
        return 0;
    }

    // 配置该对象具有哪些能力
    sub_desc_type(): SubDescType {
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }

    }

}

// 定义一个类型实例
const FLOWSERVICE_DESC_TYPE_INFO = new FlowServiceDescTypeInfo();

// 每个对象包含Desc/Body/Signs/nonce四个部分，对象的格式参考文档
// 每个用户自定义对象，需要提供DescContent和BodyContent部分的自定义
export class FlowServiceDescContent extends DescContent {

    constructor(
    ) {
        super();
    }

    // 类型信息
    type_info(): DescTypeInfo {
        return FLOWSERVICE_DESC_TYPE_INFO;
    }

    // 编码需要的字节
    raw_measure(): BuckyResult<number> {
        const size = 0;
        return Ok(size);
    }

    // 编码
    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return Ok(buf);
    }

}

// 同时需要提供DescContent和BodyContent对应的解码器
export class FlowServiceDescContentDecoder extends DescContentDecoder<FlowServiceDescContent>{
    // 类型信息
    type_info(): DescTypeInfo {
        return FLOWSERVICE_DESC_TYPE_INFO;
    }

    // 解码
    raw_decode(buf: Uint8Array): BuckyResult<[FlowServiceDescContent, Uint8Array]> {
        const ret: [FlowServiceDescContent, Uint8Array] = [new FlowServiceDescContent(), buf];
        return Ok(ret);
    }

}

// 自定义BodyContent
export class FlowServiceBodyContent extends BodyContent {
    constructor(
        public price: JSBI,
    ) {
        super();
    }

    raw_measure(): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('i64', this.price).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('i64', this.price).raw_encode(buf).unwrap();
        return Ok(buf);
    }

}

// 自定义BodyContent的解码器
export class FlowServiceBodyContentDecoder extends BodyContentDecoder<FlowServiceBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[FlowServiceBodyContent, Uint8Array]> {
        let price;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [price, buf] = r.unwrap();
        }

        const ret: [FlowServiceBodyContent, Uint8Array] = [new FlowServiceBodyContent(price.toBigInt()), buf];
        return Ok(ret);
    }

}

// 使用自定义的DescCotent对象，通过命名对象构造器来定义对象的Desc
export class FlowServiceDesc extends NamedObjectDesc<FlowServiceDescContent>{
    // ignore
}

// 定义Desc的解码器
export class FlowServiceDescDecoder extends NamedObjectDescDecoder<FlowServiceDescContent>{
    constructor() {
        super(new FlowServiceDescContentDecoder());
    }

}

// 定义一个对象的Builder
export class FlowServiceBuilder extends NamedObjectBuilder<FlowServiceDescContent, FlowServiceBodyContent>{
    // ignore
}

// 定义对象的Id，对象的Id是从Desc提供的calc_id方法计算，Desc发生改变，则Id发生改变
export class FlowServiceId extends NamedObjectId<FlowServiceDescContent, FlowServiceBodyContent>{
    constructor(id: ObjectId) {
        super(0, id);
    }

    static default(): FlowServiceId {
        return named_id_gen_default(0);
    }

    static from_base_58(s: string): BuckyResult<FlowServiceId> {
        return named_id_from_base_58(0, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<FlowServiceId> {
        return named_id_try_from_object_id(0, id);
    }

}

// 定义Id的解码器
export class FlowServiceIdDecoder extends NamedObjectIdDecoder<FlowServiceDescContent, FlowServiceBodyContent>{
    constructor() {
        super(0);
    }

}

// 现在，我们完成对象的定义
export class FlowService extends NamedObject<FlowServiceDescContent, FlowServiceBodyContent>{
    // 提供一个静态的创建方法
    static create(owner: ObjectId, price: JSBI): FlowService {
        // 创建DescContent部分
        const desc_content = new FlowServiceDescContent();

        // 创建BodyContent部分
        const body_content = new FlowServiceBodyContent(price);

        // 创建一个Builder，并完成对象的构建
        const builder = new FlowServiceBuilder(desc_content, body_content);

        // 构造，这是一个有主对象
        return builder
            .owner(owner)
            .build(FlowService);
    }

}

// 同时，我们为对象提供对应的解码器
export class FlowServiceDecoder extends NamedObjectDecoder<FlowServiceDescContent, FlowServiceBodyContent, FlowService>{
    constructor() {
        super(new FlowServiceDescContentDecoder(), new FlowServiceBodyContentDecoder(), FlowService);
    }
}
