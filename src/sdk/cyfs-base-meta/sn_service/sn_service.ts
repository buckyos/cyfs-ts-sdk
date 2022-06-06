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

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../cyfs-base/base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { HashValue, HashValueDecoder } from "../../cyfs-base/crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";
import JSBI from 'jsbi';

// 定义App对象的类型信息
import { CoreObjectType } from "../../cyfs-core";
export class SNServiceDescTypeInfo extends DescTypeInfo {

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
const SNSERVICE_DESC_TYPE_INFO = new SNServiceDescTypeInfo();

// 每个对象包含Desc/Body/Signs/nonce四个部分，对象的格式参考文档
// 每个用户自定义对象，需要提供DescContent和BodyContent部分的自定义
export class SNServiceDescContent extends DescContent {

    constructor(
        public service_type: number,
        public price: JSBI,
    ) {
        super();
    }

    // 类型信息
    type_info(): DescTypeInfo {
        return SNSERVICE_DESC_TYPE_INFO;
    }

    // 编码需要的字节
    raw_measure(): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('u8', this.service_type).raw_measure().unwrap();
        size += new BuckyNumber('u64', this.price).raw_measure().unwrap();
        return Ok(size);
    }

    // 编码
    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('u8', this.service_type).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u64', this.price).raw_encode(buf).unwrap();
        return Ok(buf);
    }

}

// 同时需要提供DescContent和BodyContent对应的解码器
export class SNServiceDescContentDecoder extends DescContentDecoder<SNServiceDescContent>{
    // 类型信息
    type_info(): DescTypeInfo {
        return SNSERVICE_DESC_TYPE_INFO;
    }

    // 解码
    raw_decode(buf: Uint8Array): BuckyResult<[SNServiceDescContent, Uint8Array]> {
        let service_type;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [service_type, buf] = r.unwrap();
        }

        let price;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [price, buf] = r.unwrap();
        }

        const ret: [SNServiceDescContent, Uint8Array] = [new SNServiceDescContent(service_type.toNumber(), price.toBigInt()), buf];
        return Ok(ret);
    }

}

// 自定义BodyContent
export class SNServiceBodyContent extends BodyContent {
    constructor(
    ) {
        super();
    }

    raw_measure(): BuckyResult<number> {
        const size = 0;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return Ok(buf);
    }

}

// 自定义BodyContent的解码器
export class SNServiceBodyContentDecoder extends BodyContentDecoder<SNServiceBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[SNServiceBodyContent, Uint8Array]> {
        const ret: [SNServiceBodyContent, Uint8Array] = [new SNServiceBodyContent(), buf];
        return Ok(ret);
    }

}

// 使用自定义的DescCotent对象，通过命名对象构造器来定义对象的Desc
export class SNServiceDesc extends NamedObjectDesc<SNServiceDescContent>{
    // ignore
}

// 定义Desc的解码器
export class SNServiceDescDecoder extends NamedObjectDescDecoder<SNServiceDescContent>{
    constructor() {
        super(new SNServiceDescContentDecoder());
    }

}

// 定义一个对象的Builder
export class SNServiceBuilder extends NamedObjectBuilder<SNServiceDescContent, SNServiceBodyContent>{
    // ignore
}

// 定义对象的Id，对象的Id是从Desc提供的calc_id方法计算，Desc发生改变，则Id发生改变
export class SNServiceId extends NamedObjectId<SNServiceDescContent, SNServiceBodyContent>{
    constructor(id: ObjectId) {
        super(0, id);
    }

    static default(): SNServiceId {
        return named_id_gen_default(0);
    }

    static from_base_58(s: string): BuckyResult<SNServiceId> {
        return named_id_from_base_58(0, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<SNServiceId> {
        return named_id_try_from_object_id(0, id);
    }

}

// 定义Id的解码器
export class SNServiceIdDecoder extends NamedObjectIdDecoder<SNServiceDescContent, SNServiceBodyContent>{
    constructor() {
        super(0);
    }

}

// 现在，我们完成对象的定义
export class SNService extends NamedObject<SNServiceDescContent, SNServiceBodyContent>{
    // 提供一个静态的创建方法
    static create(owner: ObjectId, service_type: number, price: JSBI): SNService {
        // 创建DescContent部分
        const desc_content = new SNServiceDescContent(service_type, price);

        // 创建BodyContent部分
        const body_content = new SNServiceBodyContent();

        // 创建一个Builder，并完成对象的构建
        const builder = new SNServiceBuilder(desc_content, body_content);

        // 构造，这是一个有主对象
        return builder
                .owner(owner)
                .build(SNService);
    }

}

// 同时，我们为对象提供对应的解码器
export class SNServiceDecoder extends NamedObjectDecoder<SNServiceDescContent, SNServiceBodyContent, SNService>{
    constructor() {
        super(new SNServiceDescContentDecoder(), new SNServiceBodyContentDecoder(), SNService);
    }
}
