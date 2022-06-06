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

import{ DeviceDesc, DeviceDescDecoder } from '../../cyfs-base/objects/device'
import { MinerGroupExt } from './miner_group_ext'

// 定义App对象的类型信息
import { CoreObjectType } from "../../cyfs-core";
export class MinerGroupDescTypeInfo extends DescTypeInfo{

    // 每个对象需要一个应用App唯一的编号
    obj_type() : number{
        return CoreObjectType.MetaMinerGroup;
    }

    // 配置该对象具有哪些能力
    sub_desc_type(): SubDescType{
        return {
            owner_type: "disable",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }

    }

}

// 定义一个类型实例
const MINERGROUP_DESC_TYPE_INFO = new MinerGroupDescTypeInfo();

// 每个对象包含Desc/Body/Signs/nonce四个部分，对象的格式参考文档
// 每个用户自定义对象，需要提供DescContent和BodyContent部分的自定义
export class MinerGroupDescContent extends DescContent {

    constructor(
    ){
        super();
    }

    // 类型信息
    type_info(): DescTypeInfo{
        return MINERGROUP_DESC_TYPE_INFO;
    }

    // 编码需要的字节
    raw_measure(): BuckyResult<number>{
        const size = 0;
        return Ok(size);
    }

    // 编码
    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return Ok(buf);
    }

}

// 同时需要提供DescContent和BodyContent对应的解码器
export class MinerGroupDescContentDecoder extends DescContentDecoder<MinerGroupDescContent>{
    // 类型信息
    type_info(): DescTypeInfo{
        return MINERGROUP_DESC_TYPE_INFO;
    }

    // 解码
    raw_decode(buf: Uint8Array): BuckyResult<[MinerGroupDescContent, Uint8Array]>{
        const ret:[MinerGroupDescContent, Uint8Array] = [new MinerGroupDescContent(), buf];
        return Ok(ret);
    }

}

// 自定义BodyContent
export class MinerGroupBodyContent extends BodyContent{
    constructor(
        public members: DeviceDesc[],
    ){
        super();
    }

    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += Vec.from(this.members, (v:DeviceDesc)=>v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf = Vec.from(this.members, (v:DeviceDesc)=>v).raw_encode(buf).unwrap();
        return Ok(buf);
    }

}

// 自定义BodyContent的解码器
export class MinerGroupBodyContentDecoder extends BodyContentDecoder<MinerGroupBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[MinerGroupBodyContent, Uint8Array]>{
        let members;
        {
            const r = new VecDecoder(new DeviceDescDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [members, buf] = r.unwrap();
        }

        const ret:[MinerGroupBodyContent, Uint8Array] = [new MinerGroupBodyContent(members.to((v:DeviceDesc)=>v)), buf];
        return Ok(ret);
    }

}

// 使用自定义的DescCotent对象，通过命名对象构造器来定义对象的Desc
export class MinerGroupDesc extends NamedObjectDesc<MinerGroupDescContent>{
    // ignore
}

// 定义Desc的解码器
export  class MinerGroupDescDecoder extends NamedObjectDescDecoder<MinerGroupDescContent>{
    constructor(){
        super(new MinerGroupDescContentDecoder());
    }

}

// 定义一个对象的Builder
export class MinerGroupBuilder extends NamedObjectBuilder<MinerGroupDescContent, MinerGroupBodyContent>{
    // ignore
}

// 定义对象的Id，对象的Id是从Desc提供的calc_id方法计算，Desc发生改变，则Id发生改变
export class MinerGroupId extends NamedObjectId<MinerGroupDescContent, MinerGroupBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.MetaMinerGroup, id);
    }

    static default(): MinerGroupId{
        return named_id_gen_default(CoreObjectType.MetaMinerGroup);
    }

    static from_base_58(s: string): BuckyResult<MinerGroupId> {
        return named_id_from_base_58(CoreObjectType.MetaMinerGroup, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<MinerGroupId>{
        return named_id_try_from_object_id(CoreObjectType.MetaMinerGroup, id);
    }

}

// 定义Id的解码器
export class MinerGroupIdDecoder extends NamedObjectIdDecoder<MinerGroupDescContent, MinerGroupBodyContent>{
    constructor(){
        super(CoreObjectType.MetaMinerGroup);
    }

}

// 现在，我们完成对象的定义
export class MinerGroup extends NamedObject<MinerGroupDescContent, MinerGroupBodyContent>{
    private m_ext?: MinerGroupExt;

    // 提供一个静态的创建方法
    static create(members: DeviceDesc[]): MinerGroup{
        // 创建DescContent部分
        const desc_content = new MinerGroupDescContent();

        // 创建BodyContent部分
        const body_content = new MinerGroupBodyContent(members);

        // 创建一个Builder，并完成对象的构建
        const builder = new MinerGroupBuilder(desc_content, body_content);

        // 构造
        return builder
            .build(MinerGroup);
    }

    ext():MinerGroupExt{
        if(this.m_ext==null){
            this.m_ext = new MinerGroupExt(this);
        }
        return this.m_ext;
    }

}

// 同时，我们为对象提供对应的解码器
export class MinerGroupDecoder extends NamedObjectDecoder<MinerGroupDescContent, MinerGroupBodyContent, MinerGroup>{
    constructor(){
        super(new MinerGroupDescContentDecoder(), new MinerGroupBodyContentDecoder(), MinerGroup);
    }
}
