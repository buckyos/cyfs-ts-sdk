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

import { TxCaller } from './tx_caller';
import { TxCallerDecoder } from './tx_caller';
import { TxCondition } from './tx_condition';
import { TxConditionDecoder } from './tx_condition';
import { MetaTxBody } from './meta_tx_body';
import { MetaTxBodyDecoder } from './meta_tx_body';
import { MetaTxExt } from './meta_tx_ext'

// 定义App对象的类型信息
import { CoreObjectType } from "../../cyfs-core";
export class MetaTxDescTypeInfo extends DescTypeInfo{

    // 每个对象需要一个应用App唯一的编号
    obj_type() : number{
        return CoreObjectType.MetaTx;
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
const METATX_DESC_TYPE_INFO = new MetaTxDescTypeInfo();

// 每个对象包含Desc/Body/Signs/nonce四个部分，对象的格式参考文档
// 每个用户自定义对象，需要提供DescContent和BodyContent部分的自定义
export class MetaTxDescContent extends DescContent {

    constructor(
        public nonce: bigint,
        public caller: TxCaller,
        public gas_coin_id: number,
        public gas_price: number,
        public max_fee: number,
        public condition: Option<TxCondition>,
        public body: MetaTxBody[],
    ){
        super();
    }

    // 类型信息
    type_info(): DescTypeInfo{
        return METATX_DESC_TYPE_INFO;
    }

    // 编码需要的字节
    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += new BuckyNumber('i64', this.nonce).raw_measure().unwrap();
        size += this.caller.raw_measure().unwrap();
        size += new BuckyNumber('u8', this.gas_coin_id).raw_measure().unwrap();
        size += new BuckyNumber('u16', this.gas_price).raw_measure().unwrap();
        size += new BuckyNumber('u32', this.max_fee).raw_measure().unwrap();
        size += OptionEncoder.from(this.condition, (v:TxCondition)=>v).raw_measure().unwrap();
        size += Vec.from(this.body, (v:MetaTxBody)=>v).raw_measure().unwrap();
        return Ok(size);
    }

    // 编码
    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('i64', this.nonce).raw_encode(buf).unwrap();
        buf = this.caller.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u8', this.gas_coin_id).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u16', this.gas_price).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.max_fee).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.condition, (v:TxCondition)=>v).raw_encode(buf).unwrap();
        buf = Vec.from(this.body, (v:MetaTxBody)=>v).raw_encode(buf).unwrap();
        return Ok(buf);
    }

}

// 同时需要提供DescContent和BodyContent对应的解码器
export class MetaTxDescContentDecoder extends DescContentDecoder<MetaTxDescContent>{
    // 类型信息
    type_info(): DescTypeInfo{
        return METATX_DESC_TYPE_INFO;
    }

    // 解码
    raw_decode(buf: Uint8Array): BuckyResult<[MetaTxDescContent, Uint8Array]>{
        let nonce;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [nonce, buf] = r.unwrap();
        }

        let caller;
        {
            const r = new TxCallerDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [caller, buf] = r.unwrap();
        }

        let gas_coin_id;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [gas_coin_id, buf] = r.unwrap();
        }

        let gas_price;
        {
            const r = new BuckyNumberDecoder('u16').raw_decode(buf);
            if(r.err){
                return r;
            }
            [gas_price, buf] = r.unwrap();
        }

        let max_fee;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [max_fee, buf] = r.unwrap();
        }

        let condition;
        {
            const r = new OptionDecoder(new TxConditionDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [condition, buf] = r.unwrap();
        }

        let body;
        {
            const r = new VecDecoder(new MetaTxBodyDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [body, buf] = r.unwrap();
        }

        const ret:[MetaTxDescContent, Uint8Array] = [new MetaTxDescContent(nonce.toBigInt(), caller, gas_coin_id.toNumber(), gas_price.toNumber(), max_fee.toNumber(), condition.to((v:TxCondition)=>v), body.to((v:MetaTxBody)=>v)), buf];
        return Ok(ret);
    }

}

// 自定义BodyContent
export class MetaTxBodyContent extends BodyContent{
    constructor(
        public data: Uint8Array,
    ){
        super();
    }

    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += new BuckyBuffer(this.data).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf = new BuckyBuffer(this.data).raw_encode(buf).unwrap();
        return Ok(buf);
    }

}

// 自定义BodyContent的解码器
export class MetaTxBodyContentDecoder extends BodyContentDecoder<MetaTxBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[MetaTxBodyContent, Uint8Array]>{
        let data;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [data, buf] = r.unwrap();
        }

        const ret:[MetaTxBodyContent, Uint8Array] = [new MetaTxBodyContent(data.value()), buf];
        return Ok(ret);
    }

}

// 使用自定义的DescCotent对象，通过命名对象构造器来定义对象的Desc
export class MetaTxDesc extends NamedObjectDesc<MetaTxDescContent>{
    // ignore
}

// 定义Desc的解码器
export  class MetaTxDescDecoder extends NamedObjectDescDecoder<MetaTxDescContent>{
    constructor(){
        super(new MetaTxDescContentDecoder());
    }

}

// 定义一个对象的Builder
export class MetaTxBuilder extends NamedObjectBuilder<MetaTxDescContent, MetaTxBodyContent>{
    // ignore
}

// 定义对象的Id，对象的Id是从Desc提供的calc_id方法计算，Desc发生改变，则Id发生改变
export class MetaTxId extends NamedObjectId<MetaTxDescContent, MetaTxBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.MetaTx, id);
    }

    static default(): MetaTxId{
        return named_id_gen_default(CoreObjectType.MetaTx);
    }

    static from_base_58(s: string): BuckyResult<MetaTxId> {
        return named_id_from_base_58(CoreObjectType.MetaTx, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<MetaTxId>{
        return named_id_try_from_object_id(CoreObjectType.MetaTx, id);
    }

}

// 定义Id的解码器
export class MetaTxIdDecoder extends NamedObjectIdDecoder<MetaTxDescContent, MetaTxBodyContent>{
    constructor(){
        super(CoreObjectType.MetaTx);
    }

}

// 现在，我们完成对象的定义
export class MetaTx extends NamedObject<MetaTxDescContent, MetaTxBodyContent>{
    private m_ext?: MetaTxExt;

    // 提供一个静态的创建方法
    static create(nonce: bigint, caller: TxCaller, gas_coin_id: number, gas_price: number, max_fee: number, condition: Option<TxCondition>, body: MetaTxBody[], data: Uint8Array): MetaTx{
        // 创建DescContent部分
        const desc_content = new MetaTxDescContent(nonce, caller, gas_coin_id, gas_price, max_fee, condition, body);

        // 创建BodyContent部分
        const body_content = new MetaTxBodyContent(data);

        // 创建一个Builder，并完成对象的构建
        const builder = new MetaTxBuilder(desc_content, body_content);

        // 构造，这是一个有主对象
        const self:NamedObject<MetaTxDescContent, MetaTxBodyContent> =
            builder
            .build();

        // 这是一个绕过typescript类型的trick，通过重新调用对象构造函数（继承自父对象）, 使得返回的对象类型是具体化后的MetaTx
        return new MetaTx(self.desc(), self.body(), self.signs(), self.nonce());
    }

    ext():MetaTxExt{
        if(this.m_ext==null){
            this.m_ext = new MetaTxExt(this);
        }
        return this.m_ext;
    }

}

// 同时，我们为对象提供对应的解码器
export class MetaTxDecoder extends NamedObjectDecoder<MetaTxDescContent, MetaTxBodyContent, MetaTx>{
    constructor(){
        super(new MetaTxDescContentDecoder(), new MetaTxBodyContentDecoder(), MetaTx);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[MetaTx, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new MetaTx(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [MetaTx, Uint8Array];
        });
    }
}
