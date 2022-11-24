/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import {
    SubDescType,
    DescTypeInfo, DescContent, DescContentDecoder,
    BodyContentDecoder,
    NamedObjectId, NamedObjectIdDecoder,
    NamedObjectDesc, NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "../../cyfs-base/objects/object"

import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { OptionDecoder, OptionEncoder, } from "../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { ObjectId } from "../../cyfs-base/objects/object_id";

import { TxCaller } from './tx_caller';
import { TxCallerDecoder } from './tx_caller';
import { TxCondition } from './tx_condition';
import { TxConditionDecoder } from './tx_condition';
import { TxExt } from './tx_ext'

// 定义App对象的类型信息
import { ObjectTypeCode } from "../../cyfs-base";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { TypeBuffer, TypeBufferDecoder } from "../../cyfs-base/base/type_buffer";
import { MetaTxBody, MetaTxBodyDecoder } from "./meta_tx_body";
import JSBI from 'jsbi';
import { ProtobufBodyContent } from "../../cyfs-base/codec";
import { protos } from "../../cyfs-base/codec";


export class TxDescTypeInfo extends DescTypeInfo {

    // 每个对象需要一个应用App唯一的编号
    obj_type(): number {
        return ObjectTypeCode.Tx;
    }

    // 配置该对象具有哪些能力
    sub_desc_type(): SubDescType {
        return {
            owner_type: "disable",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }

    }

}

// 定义一个类型实例
const TX_DESC_TYPE_INFO = new TxDescTypeInfo();

// 每个对象包含Desc/Body/Signs/nonce四个部分，对象的格式参考文档
// 每个用户自定义对象，需要提供DescContent和BodyContent部分的自定义
export class TxDescContent<T extends RawEncode> extends DescContent {
    constructor(
        public nonce: JSBI,
        public caller: TxCaller,
        public gas_coin_id: number,
        public gas_price: number,
        public max_fee: number,
        public condition: TxCondition|undefined,
        public body: T,
    ) { super(); }

    // 类型信息
    type_info(): DescTypeInfo {
        return TX_DESC_TYPE_INFO;
    }

    // 编码需要的字节
    raw_measure(): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('i64', this.nonce).raw_measure().unwrap();
        size += this.caller.raw_measure().unwrap();
        size += new BuckyNumber('u8', this.gas_coin_id).raw_measure().unwrap();
        size += new BuckyNumber('u16', this.gas_price).raw_measure().unwrap();
        size += new BuckyNumber('u32', this.max_fee).raw_measure().unwrap();
        size += OptionEncoder.from(this.condition).raw_measure().unwrap();
        size += this.body.raw_measure().unwrap();
        return Ok(size);
    }

    // 编码
    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('i64', this.nonce).raw_encode(buf).unwrap();
        buf = this.caller.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u8', this.gas_coin_id).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u16', this.gas_price).raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.max_fee).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.condition).raw_encode(buf).unwrap();
        buf = this.body.raw_encode(buf).unwrap();
        return Ok(buf);
    }

}

// 同时需要提供DescContent和BodyContent对应的解码器
export class TxDescContentDecoder<T extends RawEncode, D extends RawDecode<T>> extends DescContentDecoder<TxDescContent<T>>{
    constructor(private inner_decoder: D) { super(); }
    // 类型信息
    type_info(): DescTypeInfo {
        return TX_DESC_TYPE_INFO;
    }

    // 解码
    raw_decode(buf: Uint8Array): BuckyResult<[TxDescContent<T>, Uint8Array]> {
        let nonce;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [nonce, buf] = r.unwrap();
        }

        let caller;
        {
            const r = new TxCallerDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [caller, buf] = r.unwrap();
        }

        let gas_coin_id;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [gas_coin_id, buf] = r.unwrap();
        }

        let gas_price;
        {
            const r = new BuckyNumberDecoder('u16').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [gas_price, buf] = r.unwrap();
        }

        let max_fee;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [max_fee, buf] = r.unwrap();
        }

        let condition;
        {
            const r = new OptionDecoder(new TxConditionDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [condition, buf] = r.unwrap();
        }

        let body;
        {
            const r = this.inner_decoder.raw_decode(buf);
            if (r.err) {
                return r;
            }
            [body, buf] = r.unwrap();
        }

        const ret = [new TxDescContent(nonce.toBigInt(), caller, gas_coin_id.toNumber(), gas_price.toNumber(), max_fee.toNumber(), condition.value(), body), buf];
        return Ok(ret as [TxDescContent<T>, Uint8Array]);
    }

}

// 自定义BodyContent
export class TxBodyContent extends ProtobufBodyContent {
    try_to_proto(): BuckyResult<protos.TxBodyContent> {
        const target = new protos.TxBodyContent();
        target.setData(this.data);

        return Ok(target);
    }

    constructor(
        public data: Uint8Array,
    ) {
        super();
    }
}

// 自定义BodyContent的解码器
export class TxBodyContentDecoder extends BodyContentDecoder<TxBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[TxBodyContent, Uint8Array]> {
        let data;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [data, buf] = r.unwrap();
        }

        const ret: [TxBodyContent, Uint8Array] = [new TxBodyContent(data.value()), buf];
        return Ok(ret);
    }

}

export type MetaTxDescContentType = TxDescContent<TypeBuffer<Vec<MetaTxBody>>>;

// 使用自定义的DescCotent对象，通过命名对象构造器来定义对象的Desc
export class TxDesc extends NamedObjectDesc<MetaTxDescContentType>{
    // ignore
}

// 定义一个对象的Builder
export class TxBuilder extends NamedObjectBuilder<MetaTxDescContentType, TxBodyContent>{
    // ignore
}

// 定义对象的Id，对象的Id是从Desc提供的calc_id方法计算，Desc发生改变，则Id发生改变
export class TxId extends NamedObjectId<MetaTxDescContentType, TxBodyContent>{
    constructor(id: ObjectId) {
        super(ObjectTypeCode.Tx, id);
    }

    static default(): TxId {
        return named_id_gen_default(ObjectTypeCode.Tx);
    }

    static from_base_58(s: string): BuckyResult<TxId> {
        return named_id_from_base_58(ObjectTypeCode.Tx, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<TxId> {
        return named_id_try_from_object_id(ObjectTypeCode.Tx, id);
    }

}

// 定义Id的解码器
export class TxIdDecoder extends NamedObjectIdDecoder<MetaTxDescContentType, TxBodyContent>{
    constructor() {
        super(ObjectTypeCode.Tx);
    }

}

// 现在，我们完成对象的定义
export class Tx extends NamedObject<MetaTxDescContentType, TxBodyContent>{
    private m_ext?: TxExt;

    // 提供一个静态的创建方法
    static create(nonce: JSBI, caller: TxCaller, gas_coin_id: number, gas_price: number, max_fee: number, condition: TxCondition|undefined, body: MetaTxBody, data: Uint8Array): Tx {
        return Tx.create_with_multi_body(nonce, caller, gas_coin_id, gas_price, max_fee, condition, [body], data)
    }

    static create_with_multi_body(nonce: JSBI, caller: TxCaller, gas_coin_id: number, gas_price: number, max_fee: number, condition: TxCondition|undefined, bodys: MetaTxBody[], data: Uint8Array): Tx {
        // 创建DescContent部分
        const desc_content = new TxDescContent(nonce, caller, gas_coin_id, gas_price, max_fee, condition, new TypeBuffer(new Vec(bodys)));

        // 创建BodyContent部分
        const body_content = new TxBodyContent(data);

        // 创建一个Builder，并完成对象的构建
        const builder = new TxBuilder(desc_content, body_content);

        // 构造，这是一个有主对象

        // 这是一个绕过typescript类型的trick，通过重新调用对象构造函数（继承自父对象）, 使得返回的对象类型是具体化后的Tx
        return builder.build(Tx);
    }

    ext(): TxExt {
        if (this.m_ext == null) {
            this.m_ext = new TxExt(this);
        }
        return this.m_ext;
    }

}

// 同时，我们为对象提供对应的解码器
export class TxDecoder extends NamedObjectDecoder<MetaTxDescContentType, TxBodyContent, Tx>{
    constructor() {
        super(new TxDescContentDecoder(new TypeBufferDecoder<Vec<MetaTxBody>, VecDecoder<MetaTxBody>>(new VecDecoder(new MetaTxBodyDecoder()))), new TxBodyContentDecoder(), Tx);
    }
}
