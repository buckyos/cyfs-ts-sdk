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
} from "../object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../base/bucky_buffer";
import { Vec, VecDecoder } from "../../base/vec";
import { RawDecode, RawEncode } from "../../base/raw_encode";
import { HashValue, HashValueDecoder } from "../../crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../object_id";

import{ ProofData, ProofDataDecoder } from './proof_data'
import{ ProofTypeCode, ProofTypeCodeDecoder } from './proof_type_code'
import { ProofOfServiceExt } from './proof_of_service_ext'

// 定义App对象的类型信息
import { ObjectTypeCode } from "../object_type_info";
export class ProofOfServiceDescTypeInfo extends DescTypeInfo{

    // 每个对象需要一个应用App唯一的编号
    obj_type() : number{
        return ObjectTypeCode.ProofOfService;
    }

    // 配置该对象具有哪些能力
    sub_desc_type(): SubDescType{
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }

    }

}

// 定义一个类型实例
const PROOFOFSERVICE_DESC_TYPE_INFO = new ProofOfServiceDescTypeInfo();

// 每个对象包含Desc/Body/Signs/nonce四个部分，对象的格式参考文档
// 每个用户自定义对象，需要提供DescContent和BodyContent部分的自定义
export class ProofOfServiceDescContent extends DescContent {

    constructor(
        public proof_type: ProofTypeCode,
        public data: ProofData,
    ){
        super();
    }

    // 类型信息
    type_info(): DescTypeInfo{
        return PROOFOFSERVICE_DESC_TYPE_INFO;
    }

    // 编码需要的字节
    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += this.proof_type.raw_measure().unwrap();
        size += this.data.raw_measure().unwrap();
        return Ok(size);
    }

    // 编码
    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf = this.proof_type.raw_encode(buf).unwrap();
        buf = this.data.raw_encode(buf).unwrap();
        return Ok(buf);
    }

}

// 同时需要提供DescContent和BodyContent对应的解码器
export class ProofOfServiceDescContentDecoder extends DescContentDecoder<ProofOfServiceDescContent>{
    // 类型信息
    type_info(): DescTypeInfo{
        return PROOFOFSERVICE_DESC_TYPE_INFO;
    }

    // 解码
    raw_decode(buf: Uint8Array): BuckyResult<[ProofOfServiceDescContent, Uint8Array]>{
        let proof_type;
        {
            const r = new ProofTypeCodeDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [proof_type, buf] = r.unwrap();
        }

        let data;
        {
            const r = new ProofDataDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [data, buf] = r.unwrap();
        }

        const ret:[ProofOfServiceDescContent, Uint8Array] = [new ProofOfServiceDescContent(proof_type, data), buf];
        return Ok(ret);
    }

}

// 自定义BodyContent
export class ProofOfServiceBodyContent extends BodyContent{
    constructor(
        public data: ProofData,
    ){
        super();
    }

    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += this.data.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf = this.data.raw_encode(buf).unwrap();
        return Ok(buf);
    }

}

// 自定义BodyContent的解码器
export class ProofOfServiceBodyContentDecoder extends BodyContentDecoder<ProofOfServiceBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[ProofOfServiceBodyContent, Uint8Array]>{
        let data;
        {
            const r = new ProofDataDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [data, buf] = r.unwrap();
        }

        const ret:[ProofOfServiceBodyContent, Uint8Array] = [new ProofOfServiceBodyContent(data), buf];
        return Ok(ret);
    }

}

// 使用自定义的DescCotent对象，通过命名对象构造器来定义对象的Desc
export class ProofOfServiceDesc extends NamedObjectDesc<ProofOfServiceDescContent>{
    // ignore
}

// 定义Desc的解码器
export  class ProofOfServiceDescDecoder extends NamedObjectDescDecoder<ProofOfServiceDescContent>{
    constructor(){
        super(new ProofOfServiceDescContentDecoder());
    }

}

// 定义一个对象的Builder
export class ProofOfServiceBuilder extends NamedObjectBuilder<ProofOfServiceDescContent, ProofOfServiceBodyContent>{
    // ignore
}

// 定义对象的Id，对象的Id是从Desc提供的calc_id方法计算，Desc发生改变，则Id发生改变
export class ProofOfServiceId extends NamedObjectId<ProofOfServiceDescContent, ProofOfServiceBodyContent>{
    constructor(id: ObjectId){
        super(ObjectTypeCode.ProofOfService, id);
    }

    static default(): ProofOfServiceId{
        return named_id_gen_default(ObjectTypeCode.ProofOfService);
    }

    static from_base_58(s: string): BuckyResult<ProofOfServiceId> {
        return named_id_from_base_58(ObjectTypeCode.ProofOfService, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<ProofOfServiceId>{
        return named_id_try_from_object_id(ObjectTypeCode.ProofOfService, id);
    }

}

// 定义Id的解码器
export class ProofOfServiceIdDecoder extends NamedObjectIdDecoder<ProofOfServiceDescContent, ProofOfServiceBodyContent>{
    constructor(){
        super(ObjectTypeCode.ProofOfService);
    }

}

// 现在，我们完成对象的定义
export class ProofOfService extends NamedObject<ProofOfServiceDescContent, ProofOfServiceBodyContent>{
    private m_ext?: ProofOfServiceExt;

    // 提供一个静态的创建方法
    static create(owner: Option<ObjectId>, proof_type: ProofTypeCode, data_0: ProofData, data_1: ProofData): ProofOfService{
        // 创建DescContent部分
        const desc_content = new ProofOfServiceDescContent(proof_type, data_0);

        // 创建BodyContent部分
        const body_content = new ProofOfServiceBodyContent(data_1);

        // 创建一个Builder，并完成对象的构建
        const builder = new ProofOfServiceBuilder(desc_content, body_content);

        // 构造，这是一个有主对象
        return builder
            .option_owner(owner)
            .build(ProofOfService);
    }

    ext():ProofOfServiceExt{
        if(this.m_ext==null){
            this.m_ext = new ProofOfServiceExt(this);
        }
        return this.m_ext;
    }

}

// 同时，我们为对象提供对应的解码器
export class ProofOfServiceDecoder extends NamedObjectDecoder<ProofOfServiceDescContent, ProofOfServiceBodyContent, ProofOfService>{
    constructor(){
        super(new ProofOfServiceDescContentDecoder(), new ProofOfServiceBodyContentDecoder(), ProofOfService);
    }
}
