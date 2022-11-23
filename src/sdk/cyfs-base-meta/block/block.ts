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
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { HashValue, HashValueDecoder } from "../../cyfs-base/crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";

import { MetaTx } from '../tx/meta_tx';
import { MetaTxDecoder } from '../tx/meta_tx';
import { Receipt } from '../tx/receipt';
import { ReceiptDecoder } from '../tx/receipt';
import { BlockExt } from './block_ext';
import JSBI from 'jsbi';

// 定义App对象的类型信息
import { CoreObjectType } from "../../cyfs-core";
export class BlockDescTypeInfo extends DescTypeInfo {

    // 每个对象需要一个应用App唯一的编号
    obj_type(): number {
        return CoreObjectType.BlockV2;
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
const BLOCK_DESC_TYPE_INFO = new BlockDescTypeInfo();

// 每个对象包含Desc/Body/Signs/nonce四个部分，对象的格式参考文档
// 每个用户自定义对象，需要提供DescContent和BodyContent部分的自定义
export class BlockDescContent extends DescContent {

    constructor(
        public number: JSBI,
        public coinbase: ObjectId,
        public state_hash: HashValue,
        public pre_block_hash: ObjectId,
        public transactions_hash: HashValue,
        public receipts_hash: HashValue,
    ) {
        super();
    }

    // 类型信息
    type_info(): DescTypeInfo {
        return BLOCK_DESC_TYPE_INFO;
    }

    // 编码需要的字节
    raw_measure(): BuckyResult<number> {
        let size = 0;
        size += new BuckyNumber('i64', this.number).raw_measure().unwrap();
        size += this.coinbase.raw_measure().unwrap();
        size += this.state_hash.raw_measure().unwrap();
        size += this.pre_block_hash.raw_measure().unwrap();
        size += this.transactions_hash.raw_measure().unwrap();
        size += this.receipts_hash.raw_measure().unwrap();
        return Ok(size);
    }

    // 编码
    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('i64', this.number).raw_encode(buf).unwrap();
        buf = this.coinbase.raw_encode(buf).unwrap();
        buf = this.state_hash.raw_encode(buf).unwrap();
        buf = this.pre_block_hash.raw_encode(buf).unwrap();
        buf = this.transactions_hash.raw_encode(buf).unwrap();
        buf = this.receipts_hash.raw_encode(buf).unwrap();
        return Ok(buf);
    }

}

// 同时需要提供DescContent和BodyContent对应的解码器
export class BlockDescContentDecoder extends DescContentDecoder<BlockDescContent>{
    // 类型信息
    type_info(): DescTypeInfo {
        return BLOCK_DESC_TYPE_INFO;
    }

    // 解码
    raw_decode(buf: Uint8Array): BuckyResult<[BlockDescContent, Uint8Array]> {
        let number;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [number, buf] = r.unwrap();
        }

        let coinbase;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [coinbase, buf] = r.unwrap();
        }

        let state_hash;
        {
            const r = new HashValueDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [state_hash, buf] = r.unwrap();
        }

        let pre_block_hash;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [pre_block_hash, buf] = r.unwrap();
        }

        let transactions_hash;
        {
            const r = new HashValueDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [transactions_hash, buf] = r.unwrap();
        }

        let receipts_hash;
        {
            const r = new HashValueDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [receipts_hash, buf] = r.unwrap();
        }

        const ret: [BlockDescContent, Uint8Array] = [new BlockDescContent(number.toBigInt(), coinbase, state_hash, pre_block_hash, transactions_hash, receipts_hash), buf];
        return Ok(ret);
    }

}

// 自定义BodyContent
export class BlockBodyContent extends BodyContent {
    constructor(
        public transactions: MetaTx[],
        public receipts: Receipt[],
    ) {
        super();
    }

    raw_measure(): BuckyResult<number> {
        let size = 0;
        size += Vec.from(this.transactions, (v: MetaTx) => v).raw_measure().unwrap();
        size += Vec.from(this.receipts, (v: Receipt) => v).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        buf = Vec.from(this.transactions, (v: MetaTx) => v).raw_encode(buf).unwrap();
        buf = Vec.from(this.receipts, (v: Receipt) => v).raw_encode(buf).unwrap();
        return Ok(buf);
    }

}

// 自定义BodyContent的解码器
export class BlockBodyContentDecoder extends BodyContentDecoder<BlockBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[BlockBodyContent, Uint8Array]> {
        let transactions;
        {
            const r = new VecDecoder(new MetaTxDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [transactions, buf] = r.unwrap();
        }

        let receipts;
        {
            const r = new VecDecoder(new ReceiptDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [receipts, buf] = r.unwrap();
        }

        const ret: [BlockBodyContent, Uint8Array] = [new BlockBodyContent(transactions.to((v: MetaTx) => v), receipts.to((v: Receipt) => v)), buf];
        return Ok(ret);
    }

}

// 使用自定义的DescCotent对象，通过命名对象构造器来定义对象的Desc
export class BlockDesc extends NamedObjectDesc<BlockDescContent>{
    // ignore
}

// 定义Desc的解码器
export class BlockDescDecoder extends NamedObjectDescDecoder<BlockDescContent>{
    constructor() {
        super(new BlockDescContentDecoder());
    }

}

// 定义一个对象的Builder
export class BlockBuilder extends NamedObjectBuilder<BlockDescContent, BlockBodyContent>{
    // ignore
}

// 定义对象的Id，对象的Id是从Desc提供的calc_id方法计算，Desc发生改变，则Id发生改变
export class BlockId extends NamedObjectId<BlockDescContent, BlockBodyContent>{
    constructor(id: ObjectId) {
        super(CoreObjectType.BlockV2, id);
    }

    static default(): BlockId {
        return named_id_gen_default(CoreObjectType.BlockV2);
    }

    static from_base_58(s: string): BuckyResult<BlockId> {
        return named_id_from_base_58(CoreObjectType.BlockV2, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<BlockId> {
        return named_id_try_from_object_id(CoreObjectType.BlockV2, id);
    }

}

// 定义Id的解码器
export class BlockIdDecoder extends NamedObjectIdDecoder<BlockDescContent, BlockBodyContent>{
    constructor() {
        super(CoreObjectType.BlockV2);
    }

}

// 现在，我们完成对象的定义
export class Block extends NamedObject<BlockDescContent, BlockBodyContent>{
    private m_ext?: BlockExt;

    // 提供一个静态的创建方法
    static create(number: JSBI, coinbase: ObjectId, state_hash: HashValue, pre_block_hash: ObjectId, transactions_hash: HashValue, receipts_hash: HashValue, transactions: MetaTx[], receipts: Receipt[]): Block {
        // 创建DescContent部分
        const desc_content = new BlockDescContent(number, coinbase, state_hash, pre_block_hash, transactions_hash, receipts_hash);

        // 创建BodyContent部分
        const body_content = new BlockBodyContent(transactions, receipts);

        // 创建一个Builder，并完成对象的构建
        const builder = new BlockBuilder(desc_content, body_content);

        return builder.build(Block);
    }

    ext(): BlockExt {
        if (this.m_ext == null) {
            this.m_ext = new BlockExt(this);
        }
        return this.m_ext;
    }

}

// 同时，我们为对象提供对应的解码器
export class BlockDecoder extends NamedObjectDecoder<BlockDescContent, BlockBodyContent, Block>{
    constructor() {
        super(new BlockDescContentDecoder(), new BlockBodyContentDecoder(), Block);
    }
}
