import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../base/results";
import { RawEncode, RawDecode } from "../base/raw_encode";
import { } from "../base/buffer";
import { ObjectTypeCode } from "./object_type_info";
import { ObjectId, ObjectLink } from "./object_id";
import { ObjectDesc, ObjectMutBody, ObjectSigns, DescContent, DescTypeInfo, SubDescType, BodyContent } from "./object";
import { None, Option } from "../base/option";
import { Vec } from "../base/vec";
import { HashValue } from "../crypto/hash";
import { Area } from "./area";
import { PublicKey, MNPublicKey } from "../crypto/public_key";
import bs58 from 'bs58';
//const bs58 = require('../base/bs58');

// Chunk 存活状态机、
// * 默认不存在
// * 如果应用层表示感兴趣并且没有在被忽略路由里，则进入New状态
// * 如果从关联的DeviceInfo获得或者被动收到广播，则进入Ready状态
// * 如果在路由里配置了忽略，则进入Ignore状态
export enum ChunkState {
    NotFound = 0,
    New = 1,
    Pending = 2,
    Ready = 3,
    Ignore = 4,
}

export class ChunkStateUtil {
    static map_store(state: ChunkState): BuckyResult<ChunkState> {
        switch (state) {
            case ChunkState.NotFound: {
                return Err(new BuckyError(BuckyErrorCode.ErrorState, "should not store"));
            }
            case ChunkState.Pending: {
                return Ok(ChunkState.New);
            }
            default: {
                return Ok(state);
            }
        }
    }

    static try_from(value: number): BuckyResult<ChunkState> {
        const array = [ChunkState.NotFound, ChunkState.New, ChunkState.Pending, ChunkState.Ready, ChunkState.Ignore];
        const v = array[value];
        if (v == null) {
            return Err(new BuckyError(BuckyErrorCode.InvalidData, "unknown chunk-state"));
        } else {
            return Ok(v);
        }
    }
}

export const CHUNK_ID_LEN: number = 32;

export class ChunkIdDesc extends ObjectDesc {
    private m_chunk_id: ChunkId;

    constructor(chunk_id: ChunkId) {
        super(ObjectTypeCode.Chunk);
        this.m_chunk_id = chunk_id;
    }

    chunk_id(): ChunkId {
        return this.m_chunk_id;
    }

    // 计算 id
    calculate_id(): ObjectId {
        return new ObjectId(this.m_chunk_id.as_slice());
    }

    // 获取所属 DECApp 的 id
    dec_id(): Option<ObjectId> {
        return None;
    }


    // 链接对象列表
    ref_objs(): Option<Vec<ObjectLink>> {
        return None;
    }

    // 前一个版本号
    prev(): Option<ObjectId> {
        return None;
    }


    // 创建时的 BTC Hash
    create_timestamp(): Option<HashValue> {
        return None;
    }


    // 创建时间戳，如果不存在，则返回0
    create_time(): bigint {
        return BigInt(0);
    }


    // 过期时间戳
    expired_time(): Option<bigint> {
        return None;
    }

    owner(): Option<ObjectId> | undefined {
        return undefined;
    }

    area(): Option<Area> | undefined {
        return undefined;
    }

    author(): Option<ObjectId> | undefined {
        return undefined;
    }

    public_key(): PublicKey | undefined {
        return undefined;
    }

    mn_key(): MNPublicKey | undefined {
        return undefined;
    }
}


export class ChunkDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return ObjectTypeCode.Chunk;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "disable",   // 是否有主，"disable": 禁用，"option": 可选
            area_type: "disable",    // 是否有区域信息，"disable": 禁用，"option": 可选
            author_type: "disable",  // 是否有作者，"disable": 禁用，"option": 可选
            key_type: "disable"      // 公钥类型，"disable": 禁用，"single_key": 单PublicKey，"mn_key": M-N 公钥对
        }
    }
}

export const CHUNK_DESC_TYPE_INFO = new ChunkDescTypeInfo();

export class ChunkDescContent implements DescContent {
    constructor() {
        //
    }

    type_info(): DescTypeInfo {
        return CHUNK_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return Ok(buf);
    }
}

export class ChunkBodyContent extends BodyContent {
    type_info(): DescTypeInfo {
        return CHUNK_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return Ok(buf);
    }
}

export class ChunkId implements RawEncode {
    private m_buf: Uint8Array;
    // private m_desc: ChunkIdDesc;

    constructor(buf: Uint8Array) {
        if (buf.length !== CHUNK_ID_LEN) {
            throw new Error(`invalid hash length:${buf.length}`);
        }

        this.m_buf = buf;
        // this.m_desc = new ChunkIdDesc(this);
    }

    as_slice(): Uint8Array {
        return this.m_buf;
    }

    length(): number {
        const v = this.m_buf.offsetView(1);
        return v.getUint32(0, true);
    }

    toString(): string {
        return this.to_base_58();
    }

    to_string(): string {
        return this.m_buf.toString();
    }

    to_base_58(): string {
        return bs58.encode(this.as_slice());
    }

    static from_base_58(s: string): ChunkId {
        const buf = bs58.decode(s);
        return new ChunkId(buf);
    }

    static default(): ChunkId {
        return new ChunkId(new Uint8Array(CHUNK_ID_LEN));
    }

    static copy_from_slice(buf: Uint8Array): ChunkId {
        return new ChunkId(buf.slice(0, CHUNK_ID_LEN));
    }

    raw_measure(): BuckyResult<number> {
        return Ok(CHUNK_ID_LEN);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        buf.set(this.as_slice());
        return Ok(buf.offset(this.as_slice().length));
    }

    encode_to_buf(): BuckyResult<Uint8Array> {
        let buf_len;
        {
            let r = this.raw_measure();
            if (r.err) {
                return r;
            }
            buf_len = r.unwrap();
        }

        let buf = new Uint8Array(buf_len);
        let r = this.raw_encode(buf);
        if (r.err) {
            return r;
        }

        return Ok(buf);
    }

    desc(): ObjectDesc {
        return new ChunkIdDesc(this);
    }

    body(): Option<ObjectMutBody<ChunkDescContent, ChunkBodyContent>> {
        return None;
    }

    signs(): ObjectSigns {
        return new ObjectSigns(None, None);
    }

    nonce(): Option<bigint> {
        return None;
    }

    static calculate(data: Uint8Array): BuckyResult<ChunkId> {
        const hash = HashValue.hash_data(data).as_slice();
        const len = data.length;
        let chunk = new Uint8Array(CHUNK_ID_LEN);
        let view = chunk.offsetView(0);
        view.setUint8(0, ObjectTypeCode.Chunk);
        view.setUint32(1, len, true);
        chunk.set(hash.slice(0, 27), 5);
        return Ok(new ChunkId(chunk));
    }
}

export class ChunkIdDecoder implements RawDecode<ChunkId> {
    raw_decode(buf: Uint8Array): BuckyResult<[ChunkId, Uint8Array]> {
        const buffer = buf.slice(0, CHUNK_ID_LEN);
        buf = buf.offset(CHUNK_ID_LEN);

        const ret: [ChunkId, Uint8Array] = [new ChunkId(buffer), buf];

        return Ok(ret);
    }
}