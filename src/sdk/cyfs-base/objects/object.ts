import { bucky_time_now } from "../base/time";
import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../base/results";
import { } from "../base/buffer";
import { RawEncode, RawDecode, RawHexDecode, Compareable, RawEncodePurpose, ContentRawDecodeContext, } from "../base/raw_encode";
import { raw_hash_encode } from "../base/raw_encode_util";
import { BuckyNumber, BuckyNumberDecoder } from "../base/bucky_number";
import { Vec, VecDecoder } from "../base/vec";
import { HashValue, HashValueDecoder } from "../crypto/hash";
import { PublicKey, PublicKeyDecoder, MNPublicKey, MNPublicKeyDecoder, Signature, SignatureDecoder } from "../crypto/public_key";
import { Area, AreaDecoder } from "./area";
import { ObjectTypeCode, number_2_obj_type_code } from "./object_type_info";
import { ObjectId, ObjectIdDecoder, ObjectLink, ObjectLinkDecoder, } from "./object_id";
import { base_trace } from "../base/log";
import JSBI from 'jsbi';
import { OBJECT_CONTENT_CODEC_FORMAT_RAW } from '../codec';
import { BuckySize, BuckySizeDecoder } from '../base/bucky_usize';
import { OptionEncoder } from "../base";

export class ObjectIdBuilder<T extends RawEncode & ObjectDesc> {
    m_t: T;
    m_obj_type_code: ObjectTypeCode;
    m_area?:Area;
    m_has_owner: boolean;
    m_has_single_key: boolean;
    m_has_mn_key: boolean;

    constructor(t: T, obj_type_code: ObjectTypeCode) {
        this.m_t = t;
        this.m_obj_type_code = obj_type_code;
        this.m_area = undefined;
        this.m_has_owner = false;
        this.m_has_single_key = false;
        this.m_has_mn_key = false;
    }

    area(area?:Area): ObjectIdBuilder<T> {
        this.m_area = area;
        return this;
    }

    owner(value: boolean): ObjectIdBuilder<T> {
        this.m_has_owner = value;
        return this;
    }

    single_key(value: boolean): ObjectIdBuilder<T> {
        this.m_has_single_key = value;
        return this;
    }

    mn_key(value: boolean): ObjectIdBuilder<T> {
        this.m_has_mn_key = value;
        return this;
    }

    build(): ObjectId {
        const ret = raw_hash_encode(this.m_t);
        const hash_value = ret.unwrap().as_slice();

        // base_trace("hash_value:", hash_value);

        // 清空前 40 bit
        hash_value[0] = 0;
        hash_value[1] = 0;
        hash_value[2] = 0;
        hash_value[3] = 0;
        hash_value[4] = 0;

        if (!this.m_t.is_standard_object()) {
            // 用户类型
            // 4个可用flag
            let type_code;
            if (this.m_t.obj_type() > OBJECT_TYPE_CORE_END) {
                // 这是一个dec app 对象
                // 高2bits固定为11
                type_code = parseInt("00110000", 2);
            } else {
                // base_trace("xxxx");
                // 这是一个core 对象
                // 高2bits固定为10，
                type_code = parseInt("00100000", 2);
            }

            // | 是否有area_code | 是否有public_key | 是否是多Key对象 | 是否有owner |
            if (this.m_area) {
                type_code = type_code | parseInt("00001000", 2);
            }

            if (this.m_has_single_key) {
                type_code = type_code | parseInt("00000100", 2);
            }

            if (this.m_has_mn_key) {
                type_code = type_code | parseInt("00000010", 2);
            }

            if (this.m_has_owner) {
                type_code = type_code | parseInt("00000001", 2);
            }

            if (this.m_area) {
                const area = this.m_area;
                // --------------------------------------------
                // (2bit)(4bit)(国家编码8bits)+(运营商编码4bits)+城市编码(14bits)+inner(8bits) = 40 bit
                // --------------------------------------------
                // 0 obj_bits[. .]type_code[. . . .] country[. .]
                // 1 country[. . . . . .]carrier[x x x x . .]
                // 2 carrier[. .]city[0][x x . . . . . . ]
                // 3 city[1][. . . . . . . . ]
                // 4 inner[. . . . . . . . ]
                hash_value[0] = type_code << 2 | (area.country << 7 >> 14);
                hash_value[1] = (area.country << 1) | (area.carrier << 4 >> 7);
                hash_value[2] = area.carrier << 5 | (area.city >> 8);
                hash_value[3] = (area.city << 8 >> 8);
                hash_value[4] = area.inner;
            } else {
                // base_trace("calc_id_hash_x:", hash_value);
                // base_trace("calc_id_hash_2:", (type_code & parseInt('00111111', 2)) << 2);

                // 前 6 bit 写入类型信息
                hash_value[0] = type_code << 2;
                // base_trace("calc_id_hash_3:", hash_value[0]);
            }
        } else {
            // 标准类型
            // 6bits的类型(高2bits固定为01，4bits的内置对象类型）+ option<34bits>的区域编码构成
            const type_code = this.m_obj_type_code;

            if (this.m_area) {
                // --------------------------------------------
                // (2bit)(4bit)(国家编码8bits)+(运营商编码4bits)+城市编码(14bits)+inner(8bits) = 40 bit
                // --------------------------------------------
                // 0 obj_bits[. .]type_code[. . . .] country[. .]
                // 1 country[. . . . . .]carrier[x x x x . .]
                // 2 carrier[. .]city[0][x x . . . . . . ]
                // 3 city[1][. . . . . . . . ]
                // 4 inner[. . . . . . . . ]
                const area = this.m_area;
                hash_value[0] = parseInt("01000000", 2) | (type_code << 4 >> 2) | (area.country << 7 >> 14);
                hash_value[1] = (area.country << 1) | (area.carrier << 4 >> 7);
                hash_value[2] = (area.carrier << 5) | (area.city >> 8);
                hash_value[3] = (area.city << 8 >> 8);
                hash_value[4] = area.inner;
            } else {
                hash_value[0] = parseInt("01000000", 2) | type_code << 4 >> 2;
            }
        }

        // base_trace("calc_id_hash:", hash_value[0]);
        // base_trace("calc_id_hash:", hash_value);

        const id = new ObjectId(hash_value);

        return id;
    }
}

// obj_flags: number
// ========
// * 前5个bits是用来指示编码状态，不计入hash计算。（计算时永远填0）
// * 剩下的11bits用来标识desc header
//
// 段编码标志位
// --------
// 0:  是否加密 crypto（现在未定义加密结构，一定填0)
// 1:  是否包含 mut_body
// 2:  是否包含 desc_signs
// 3:  是否包含 body_signs
// 4:  是否包含 nonce
//
// ObjectDesc编码标志位
// --------
// 5:  是否包含 dec_id
// 6:  是否包含 ref_objecs
// 7:  是否包含 prev
// 8:  是否包含 create_timestamp
// 9:  是否包含 create_time
// 10: 是否包含 expired_time
//
// OwnerObjectDesc/AreaObjectDesc/AuthorObjectDesc/PublicKeyObjectDesc 标志位
// ---------
// 11: 是否包含 owner
// 12: 是否包含 area
// 13: 是否包含 author
// 14: 是否包含 public_key
// 15: 保留，目前为0

export const OBJECT_FLAG_CTYPTO = 0x01;
export const OBJECT_FLAG_MUT_BODY: number = 0x01 << 1;
export const OBJECT_FLAG_DESC_SIGNS: number = 0x01 << 2;
export const OBJECT_FLAG_BODY_SIGNS: number = 0x01 << 3;
export const OBJECT_FLAG_NONCE: number = 0x01 << 4;

export const OBJECT_FLAG_DESC_ID: number = 0x01 << 5;
export const OBJECT_FLAG_REF_OBJECTS: number = 0x01 << 6;
export const OBJECT_FLAG_PREV: number = 0x01 << 7;
export const OBJECT_FLAG_CREATE_TIMESTAMP: number = 0x01 << 8;
export const OBJECT_FLAG_CREATE_TIME: number = 0x01 << 9;
export const OBJECT_FLAG_EXPIRED_TIME: number = 0x01 << 10;

export const OBJECT_FLAG_OWNER: number = 0x01 << 11;
export const OBJECT_FLAG_AREA: number = 0x01 << 12;
export const OBJECT_FLAG_AUTHOR: number = 0x01 << 13;
export const OBJECT_FLAG_PUBLIC_KEY: number = 0x01 << 14;

// 是否包含扩展字段，预留的非DescContent部分的扩展，包括一个u16长度+对应的content
export const OBJECT_FLAG_EXT: number = 0x01 << 15;

// 左闭右闭 区间定义
export const OBJECT_TYPE_ANY = 0;
export const OBJECT_TYPE_STANDARD_START = 1;
export const OBJECT_TYPE_STANDARD_END = 16;
export const OBJECT_TYPE_CORE_START = 17;
export const OBJECT_TYPE_CORE_END = 32767;
export const OBJECT_TYPE_DECAPP_START = 32768;
export const OBJECT_TYPE_DECAPP_END = 65535;

export const OBJECT_PUBLIC_KEY_NONE = 0x00;
export const OBJECT_PUBLIC_KEY_SINGLE = 0x01;
export const OBJECT_PUBLIC_KEY_MN = 0x02;

export const OBJECT_BODY_FLAG_PREV = 0x01;
export const OBJECT_BODY_FLAG_USER_DATA: number = 0x01 << 1;

// 是否包含扩展字段，格式和desc一致
export const OBJECT_BODY_FLAG_EXT: number = 0x01 << 2;

export function is_standard_object(object_type: number): boolean {
    return object_type >= OBJECT_TYPE_STANDARD_START && object_type <= OBJECT_TYPE_STANDARD_END;
}

export function is_core_object(object_type: number): boolean {
    return object_type >= OBJECT_TYPE_CORE_START && object_type <= OBJECT_TYPE_CORE_END;
}

export function is_dec_app_object(object_type: number): boolean {
    return object_type >= OBJECT_TYPE_DECAPP_START && object_type <= OBJECT_TYPE_DECAPP_END;
}


export abstract class ObjectDesc {
    private m_obj_type: number;

    constructor(obj_type: number) {
        this.m_obj_type = obj_type;
    }

    obj_type(): number {
        return this.m_obj_type;
    }

    // 默认实现，从obj_type 转 obj_type_code
    obj_type_code(): ObjectTypeCode {
        return number_2_obj_type_code(this.m_obj_type);
    }

    is_standard_object(): boolean {
        const c = this.obj_type_code();
        return c !== ObjectTypeCode.Custom;
    }

    is_core_object(): boolean {
        const t = this.obj_type();
        const c = this.obj_type_code();
        return c === ObjectTypeCode.Custom && (t >= OBJECT_TYPE_CORE_START && t <= OBJECT_TYPE_CORE_END);
    }

    is_dec_app_object(): boolean {
        const t = this.obj_type();
        const c = this.obj_type_code();
        return c === ObjectTypeCode.Custom && (t >= OBJECT_TYPE_DECAPP_START && t <= OBJECT_TYPE_DECAPP_END);
    }

    // 计算 id
    abstract calculate_id(): ObjectId;

    // 获取所属 DECApp 的 id
    abstract dec_id(): ObjectId | undefined;

    // 链接对象列表
    abstract ref_objs(): Vec<ObjectLink> | undefined;

    // 前一个版本号
    abstract prev(): ObjectId | undefined;

    // 创建时的 BTC Hash
    abstract create_timestamp(): HashValue | undefined;

    // 创建时间戳，如果不存在，则返回0
    abstract create_time(): JSBI;

    // 过期时间戳
    abstract expired_time(): JSBI | undefined;

    // 所有者
    abstract owner(): ObjectId | undefined;
}

export class NamedObjectBodyContext {
    private m_body_content_cached_size?: number;

    cache_body_content_size(size: number): NamedObjectBodyContext {
        console.assert(this.m_body_content_cached_size == null);
        this.m_body_content_cached_size = size;
        return this;
    }

    get_body_content_cached_size(): number {
        console.assert(this.m_body_content_cached_size != null);
        return this.m_body_content_cached_size!;
    }
}

export class NamedObjectContext implements RawEncode {
    private m_obj_type: number;
    private m_obj_flags: number;
    private m_obj_type_code: ObjectTypeCode;

    // DescContent缓存的大小
    private m_desc_content_cached_size?: number;

    private m_body_context: NamedObjectBodyContext;

    constructor(obj_type: number, obj_flags: number) {
        this.m_obj_type = obj_type;
        this.m_obj_flags = obj_flags;
        this.m_obj_type_code = number_2_obj_type_code(this.m_obj_type);
        this.m_body_context = new NamedObjectBodyContext();
    }

    get obj_type_code(): ObjectTypeCode {
        return this.m_obj_type_code;
    }

    get obj_type(): number {
        return this.m_obj_type;
    }

    get obj_flags(): number {
        return this.m_obj_flags;
    }

    is_standard_object(): boolean {
        return this.obj_type <= 16;
    }

    is_core_object(): boolean {
        return this.obj_type >= OBJECT_TYPE_CORE_START && this.obj_type <= OBJECT_TYPE_CORE_END;
    }

    is_dec_app_object(): boolean {
        return this.obj_type >= OBJECT_TYPE_DECAPP_START && this.obj_type <= OBJECT_TYPE_DECAPP_END;
    }

    has_flag(flag_pos: number): boolean {
        return (this.m_obj_flags & flag_pos) === flag_pos;
    }

    //
    // common
    //

    with_crypto(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_CTYPTO;
        return this;
    }

    has_crypto(): boolean {
        return this.has_flag(OBJECT_FLAG_CTYPTO);
    }

    with_mut_body(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_MUT_BODY;
        return this;
    }

    has_mut_body(): boolean {
        return this.has_flag(OBJECT_FLAG_MUT_BODY);
    }

    with_desc_signs(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_DESC_SIGNS;
        return this;
    }

    has_desc_signs(): boolean {
        return this.has_flag(OBJECT_FLAG_DESC_SIGNS);
    }

    with_body_signs(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_BODY_SIGNS;
        return this;
    }

    has_body_signs(): boolean {
        return this.has_flag(OBJECT_FLAG_BODY_SIGNS);
    }

    with_nonce(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_NONCE;
        return this;
    }

    has_nonce(): boolean {
        return this.has_flag(OBJECT_FLAG_NONCE);
    }

    //
    // ObjectDesc
    //

    with_dec_id(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_DESC_ID;
        return this;
    }

    has_dec_id(): boolean {
        return this.has_flag(OBJECT_FLAG_DESC_ID);
    }

    with_ref_objects(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_REF_OBJECTS;
        return this;
    }

    has_ref_objects(): boolean {
        return this.has_flag(OBJECT_FLAG_REF_OBJECTS);
    }

    with_prev(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_PREV;
        return this;
    }

    has_prev(): boolean {
        return this.has_flag(OBJECT_FLAG_PREV);
    }

    with_create_timestamp(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_CREATE_TIMESTAMP;
        return this;
    }

    has_create_time_stamp(): boolean {
        return this.has_flag(OBJECT_FLAG_CREATE_TIMESTAMP);
    }

    with_create_time(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_CREATE_TIME;
        return this;
    }

    has_create_time(): boolean {
        return this.has_flag(OBJECT_FLAG_CREATE_TIME);
    }

    with_expired_time(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_EXPIRED_TIME;
        return this;
    }

    has_expired_time(): boolean {
        return this.has_flag(OBJECT_FLAG_EXPIRED_TIME);
    }

    //
    // OwnderObjectDesc/AreaObjectDesc/AuthorObjectDesc/PublicKeyObjectDesc
    //

    with_owner(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_OWNER;
        return this;
    }

    has_owner(): boolean {
        return this.has_flag(OBJECT_FLAG_OWNER);
    }

    with_area(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_AREA;
        return this;
    }

    has_area(): boolean {
        return this.has_flag(OBJECT_FLAG_AREA);
    }


    with_public_key(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_PUBLIC_KEY;
        return this;
    }

    has_public_key(): boolean {
        return this.has_flag(OBJECT_FLAG_PUBLIC_KEY);
    }

    with_author(): NamedObjectContext {
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_AUTHOR;
        return this;
    }

    has_author(): boolean {
        return this.has_flag(OBJECT_FLAG_AUTHOR);
    }

    has_ext(): boolean {
        return this.has_flag(OBJECT_FLAG_EXT);
    }

    // desc_content的缓存大小
    cache_desc_content_size(size: number): NamedObjectContext {
        console.assert(this.m_desc_content_cached_size == null);
        this.m_desc_content_cached_size = size;

        return this;
    }

    get_desc_content_cached_size(): number {
        console.assert(this.m_desc_content_cached_size != null);
        return this.m_desc_content_cached_size!;
    }

    // body_context
    body_context(): NamedObjectBodyContext {
        return this.m_body_context;
    }


    raw_measure(): BuckyResult<number> {
        // obj_type: u16
        // obj_flags: u16

        return Ok(4);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        // obj type
        {
            const d = new BuckyNumber("u16", this.m_obj_type);
            const r = d.raw_encode(buf);
            if (r.err) {
                return r;
            }
            buf = r.unwrap();
        }

        // obj flags
        {
            const d = new BuckyNumber("u16", this.m_obj_flags);
            const r = d.raw_encode(buf);
            if (r.err) {
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }
}

export class NamedObjectContextDecoder extends RawHexDecode<NamedObjectContext>{
    constructor() {
        super();
    }

    raw_decode(buf: Uint8Array): BuckyResult<[NamedObjectContext, Uint8Array]> {
        // obj type
        let obj_type;
        {
            const r = new BuckyNumberDecoder("u16").raw_decode(buf);
            if (r.err) {
                return r;
            }
            [obj_type, buf] = r.unwrap();
        }

        // obj flags
        let obj_flags;
        {
            const r = new BuckyNumberDecoder("u16").raw_decode(buf);
            if (r.err) {
                return r;
            }
            [obj_flags, buf] = r.unwrap();
        }

        const ret: [NamedObjectContext, Uint8Array] = [new NamedObjectContext(obj_type.toNumber(), obj_flags.toNumber()), buf];

        return Ok(ret);
    }
}

/**
 * NamedObject的可变Body部分的建构器
 */
export class ObjectMutBodyBuilder<
    DC extends DescContent,
    BC extends BodyContent
    >{
    private m_prev_version?:HashValue;   // 上个版本的MutBody Hash
    private m_update_time: JSBI;               // 时间戳
    private m_content: BC;                       // 根据不同的类型，可以有不同的MutBody
    private m_user_data?:Uint8Array;     // 可以嵌入任意数据。（比如json?)
    private m_obj_type: number;

    constructor(obj_type: number, content: BC) {
        this.m_update_time = bucky_time_now();
        this.m_content = content;
        this.m_obj_type = obj_type;
    }

    update_time(value: JSBI): ObjectMutBodyBuilder<DescContent, BC> {
        this.m_update_time = value;
        return this;
    }

    option_update_time(value?:JSBI): ObjectMutBodyBuilder<DC, BC> {
        if (value !== undefined) {
            this.m_update_time = value;
        }
        return this;
    }

    prev_version(value: HashValue): ObjectMutBodyBuilder<DC, BC> {
        this.m_prev_version = value;
        return this;
    }

    option_prev_version(value?:HashValue): ObjectMutBodyBuilder<DC, BC> {
        this.m_prev_version = value;
        return this;
    }

    user_data(value: Uint8Array): ObjectMutBodyBuilder<DC, BC> {
        this.m_user_data = value;
        return this;
    }

    option_user_data(value?:Uint8Array): ObjectMutBodyBuilder<DC, BC> {
        this.m_user_data = value;
        return this;
    }

    build(): ObjectMutBody<DC, BC> {
        return new ObjectMutBody<DescContent, BC>(
            this.m_obj_type,
            this.m_prev_version,
            this.m_update_time,
            this.m_content,
            this.m_user_data,
        );
    }
}

/**
 * NamedObject的可变Body部分
 */
export class ObjectMutBody<
    DC extends DescContent,
    BC extends BodyContent
    > implements RawEncode {
    private m_prev_version?:HashValue;   // 上个版本的MutBody Hash
    private m_update_time: JSBI;               // 时间戳
    private m_content: BC;              // 根据不同的类型，可以有不同的MutBody
    private m_user_data?:Uint8Array;     // 可以嵌入任意数据。（比如json?)
    private m_obj_type: number;
    private m_trace?: number;

    toString() {
        return `ObjectMutBody:{{ prev_version:${this.prev_version}, update_time:${this.update_time}, content:${this.content}, user_data: ... }}`;
    }

    constructor(obj_type: number, prev_version:HashValue|undefined, update_time: JSBI, content: BC, user_data?:Uint8Array) {
        this.m_obj_type = obj_type;
        this.m_prev_version = prev_version;
        this.m_update_time = update_time;
        this.m_content = content;
        this.m_user_data = user_data;
    }

    set_trace_id(trace: number) {
        this.m_trace = trace;
    }

    trace_id(): number | undefined {
        return this.m_trace;
    }

    convert_to<RBC extends BodyContent>(map: (t: BC) => BuckyResult<RBC>): BuckyResult<ObjectMutBody<DC, RBC>> {

        const r = map(this.m_content);
        if (r.err) {
            return r;
        }

        const content = r.unwrap();

        return Ok(new ObjectMutBodyBuilder<DC, RBC>(this.m_obj_type, content)
            .option_prev_version(this.prev_version())
            .update_time(this.update_time())
            .option_user_data(this.user_data())
            .build());
    }

    prev_version(): HashValue | undefined {
        return this.m_prev_version;
    }

    update_time(): JSBI {
        return this.m_update_time;
    }

    content(): BC {
        return this.m_content
    }

    user_data(): Uint8Array | undefined {
        return this.m_user_data;
    }

    set_update_time(value: JSBI) {
        this.m_update_time = value;
    }

    // 更新时间，并且确保大于旧时间
    increase_update_time(value: JSBI) {
        if (JSBI.lessThan(value, this.m_update_time)) {
            console.warn(`object body new time is older than current time! now=${value.toString()}, cur=${this.m_update_time.toString()}`);
            value = JSBI.add(this.m_update_time, JSBI.BigInt(1));
        }

        this.set_update_time(value);
    }

    set_userdata(user_data: Uint8Array) {
        this.m_user_data = user_data;
        this.m_update_time = bucky_time_now();
    }

    raw_measure(ctx: NamedObjectBodyContext, purpose?: RawEncodePurpose): BuckyResult<number> {
        // body_flags:u8
        let bytes = 1;

        // prev_version
        if (this.m_prev_version) {
            const r = this.m_prev_version.raw_measure();
            if (r.err) {
                console.error("ObjectMutBody<B, O>::raw_measure/prev_version error:", r.val);
                return r;
            }
            bytes += r.unwrap();
        }

        // update_time u64
        bytes += 8;

        // verison+format, 8bits * 2
        bytes += 2;

        // content,包含usize+content
        let body_size;
        {
            const r = this.m_content.raw_measure(purpose);
            if (r.err) {
                console.error("ObjectMutBody<B, O>::raw_measure/m_content error", r.val);
                return r;
            }
            body_size = r.unwrap();
        }

        bytes += new BuckySize(body_size).raw_measure(undefined, purpose).unwrap();
        bytes += body_size;

        // 缓存body_size
        ctx.cache_body_content_size(body_size);

        // user_data(len+buffer)
        if (this.m_user_data) {
            const user_data = this.m_user_data;
            const len = user_data.length;

            bytes += 8; // u64
            bytes += len;
        } else {
            // ignore
        }

        return Ok(bytes);
    }

    raw_encode(buf: Uint8Array, ctx: NamedObjectBodyContext, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        // body_flags
        {
            let body_flags = 0;
            if (this.m_prev_version) {
                body_flags = body_flags | OBJECT_BODY_FLAG_PREV;
            }

            if (this.m_user_data) {
                body_flags = body_flags | OBJECT_BODY_FLAG_USER_DATA;
            }

            buf[0] = body_flags;
            buf = buf.offset(1);
        }
        base_trace(`[body(${this.trace_id()})] raw_encode, body_flags, buf len:`, buf.length);

        // prev_version
        if (this.m_prev_version) {
            const r = this.m_prev_version.raw_encode(buf);
            if (r.err) {
                console.error("ObjectMutBody<B, O>::raw_encode/prev_version error:", r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[body(${this.trace_id()})] raw_encode, prev_version, buf len:`, buf.length);

        // update_time
        {
            const r = new BuckyNumber("u64", this.m_update_time).raw_encode(buf);
            if (r.err) {
                console.error("ObjectMutBody<B, O>::raw_encode/update_time error:", r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[body(${this.trace_id()})] raw_encode, update_time, buf len:`, buf.length);

        // version+format
        // 编码version，8bits
        {
            const r = new BuckyNumber("u8", this.m_content.codec_info().version).raw_encode(buf);
            if (r.err) {
                console.error(`ObjectMutBody::raw_encode/version error, obj_type=${this.m_obj_type},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }

        // 编码format，8bits
        {
            const r = new BuckyNumber("u8", this.m_content.codec_info().format).raw_encode(buf);
            if (r.err) {
                console.error(`ObjectMutBody::raw_encode/format error:{}, obj_type=${this.m_obj_type},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }

        // content_len + content
        const body_size = ctx.get_body_content_cached_size();
        {
            const r = new BuckySize(body_size).raw_encode(buf);
            if (r.err) {
                console.error("ObjectMutBody::raw_encode/content_len error:", r.val);
                return r;
            }
            buf = r.unwrap();
            base_trace(`[body(${this.trace_id()})] raw_encode, BodyContentFormat.Typed, body_size:${body_size}, buf len:`, buf.length);
        }

        // 对body_content编码，采用精确大小的buf
        {
            const body_buf = buf.subarray(0, body_size);
            const r = this.m_content.raw_encode(body_buf);
            if (r.err) {
                console.error("ObjectMutBody<B, O>::raw_encode/content error:", r.val);
                return r;
            }

            // 正确编码完毕，应该消耗完整个buf
            const remain_buf = r.unwrap();
            if (remain_buf.byteOffset - buf.byteOffset !== body_size) {
                console.warn(`encode body content but return nonempty remain buf! obj_type=${this.m_obj_type}, remain=${remain_buf.byteOffset - buf.byteOffset}`);
            }

            buf = buf.offset(body_size);

            base_trace(`[body(${this.trace_id()})] raw_encode, BodyContentFormat.Typed, m_content, buf len:`, buf.length);
        }


        // user_data
        if (this.m_user_data) {
            const user_data = this.m_user_data;
            const len = user_data.length;

            // user_data_len: u64
            const len_encode_ret = new BuckyNumber("u64", len).raw_encode(buf);
            if (len_encode_ret.err) {
                console.error("ObjectMutBody<B, O>::raw_encode/user_data_len error:", len_encode_ret.val);
                return len_encode_ret;
            }
            buf = len_encode_ret.unwrap();

            // user_data
            buf.set(user_data);
            buf = buf.offset(len);
        }
        base_trace(`[body(${this.trace_id()})] raw_encode, m_user_data, buf len:`, buf.length);

        return Ok(buf);
    }

    encode_to_buf(purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        // 使用raw_measure_ctx替代raw_measure，减少一次内部的raw_measure调用
        const ctx = new NamedObjectBodyContext();
        const r = this.raw_measure(ctx, purpose);
        if (r.err) {
            console.error(`ObjectMutBody::raw_measure error, obj_type=${this.m_obj_type},`, r.val);
            return r;
        }

        const size = r.unwrap();
        const buf = new Uint8Array(size);
        {
            const r = this.raw_encode(buf, ctx, purpose);
            if (r.err) {
                return r;
            }
        }

        return Ok(buf);
    }

    raw_hash_encode(): BuckyResult<HashValue> {
        const r = this.encode_to_buf(RawEncodePurpose.Hash);
        if (r.err) {
            return r;
        }

        const buf = r.unwrap();
        const hash_value = HashValue.hash_data(buf);
        return new Ok(hash_value);
    }
}

/**
 * NamedObject的可变Body部分的解码器
 */
export class ObjectMutBodyDecoder<
    DC extends DescContent,
    BC extends BodyContent
    > implements RawDecode<ObjectMutBody<DC, BC>> {
    private readonly content_decoder: BodyContentDecoder<BC>;
    private readonly obj_type: number;
    private m_trace?: number;

    constructor(obj_type: number, content_decoder: BodyContentDecoder<BC>) {
        this.content_decoder = content_decoder;
        this.obj_type = obj_type;
    }

    set_trace_id(trace: number) {
        this.m_trace = trace;
    }

    trace_id(): number | undefined {
        return this.m_trace;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[ObjectMutBody<DC, BC>, Uint8Array]> {
        // body_flags
        const body_flags = buf[0];
        buf = buf.offset(1);
        base_trace(`[body(${this.trace_id()})] raw_decode, body_flags, buf len:`, buf.length);

        // prev_version
        let prev_version = undefined;
        if ((body_flags & OBJECT_BODY_FLAG_PREV) === OBJECT_BODY_FLAG_PREV) {
            const r = new HashValueDecoder().raw_decode(buf);
            if (r.err) {
                console.error("ObjectMutBody<B, O>::raw_decode/prev_version error:", r.val);
                return r;
            }
            let _prev_version;
            [_prev_version, buf] = r.unwrap();
            prev_version = _prev_version;
        }
        base_trace(`[body(${this.trace_id()})] raw_decode, prev_version, buf len:`, buf.length);

        // update_time
        let update_time;
        {
            const r = new BuckyNumberDecoder("u64").raw_decode(buf);
            if (r.err) {
                console.error("ObjectMutBody<B, O>::raw_decode/update_time error:", r.val);
                return r;
            }
            [update_time, buf] = r.unwrap();
        }
        base_trace(`[body(${this.trace_id()})] raw_decode, update_time, buf len:`, buf.length);

        // 预留的扩展字段
        if ((body_flags & OBJECT_BODY_FLAG_EXT) === OBJECT_BODY_FLAG_EXT) {
            const r = new BuckyNumberDecoder('u16').raw_decode(buf);
            if (r.err) {
                console.error("ObjectMutBody::raw_decode/body.ext error:{}",
                    r.val);
                return r;
            }
            let ext_len;
            [ext_len, buf] = r.unwrap();

            console.warn(`read unknown body ext content! len=${ext_len.toNumber()}, obj_type=${this.obj_type}`);

            // 跳过此段不识别的内容
            buf = buf.offset(ext_len.toNumber());
        }

        // 解码version
        let version: BuckyNumber;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if (r.err) {
                console.error(`ObjectMutBody::raw_decode/body.version error! obj_type=${this.obj_type},`, r.val,);
                return r;
            }
            [version, buf] = r.unwrap();
        }

        // 解码format
        let format: BuckyNumber;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if (r.err) {
                console.error(`ObjectMutBody::raw_decode/body.format error, obj_type=${this.obj_type},`, r.val,);
                return r;
            }
            [format, buf] = r.unwrap();
        }

        // content_len
        let body_size;
        {
            const r = new BuckySizeDecoder().raw_decode(buf);
            if (r.err) {
                console.error("ObjectMutBody<B, O>::raw_decode/_content_encode_len error:", r.val);
                return r;
            }
            [body_size, buf] = r.unwrap();
            base_trace(`[body(${this.trace_id()})] raw_decode, BodyContentFormat.Typed, len:${body_size}, buf len:`, buf.length);
        }

        const opt = new ContentRawDecodeContext(version.toNumber(), format.toNumber());

        // body_content
        let content: BC;
        {
            const body_buf = buf.subarray(0, body_size);
            const r = this.content_decoder.raw_decode(body_buf, opt);
            if (r.err) {
                console.error("ObjectMutBody<B, O>::raw_decode/content error:", r.val);
                return r;
            }

            let remain_buf;
            [content, remain_buf] = r.unwrap();

            // 正确编码完毕，应该消耗完整个buf
            if (remain_buf.byteOffset - buf.byteOffset !== body_size) {
                console.warn(`decode body content but return nonempty remain buf! obj_type=${this.obj_type}, remain=${remain_buf.byteOffset - buf.byteOffset}`);
            }

            buf = buf.offset(body_size);
        }

        base_trace(`[body(${this.trace_id()})] raw_decode, BodyContentFormat.Typed, content, buf len:`, buf.length);

        // user_data
        let user_data = undefined;
        if ((body_flags & OBJECT_BODY_FLAG_USER_DATA) === OBJECT_BODY_FLAG_USER_DATA) {
            // user_data_len
            let user_data_len;
            const len_ret = new BuckyNumberDecoder("u64").raw_decode(buf);
            if (len_ret.err) {
                console.error("ObjectMutBody<B, O>::raw_decode/user_data len error:", len_ret.val);
                return len_ret;
            }
            [user_data_len, buf] = len_ret.unwrap();

            // user_data
            user_data = buf.slice(0, user_data_len.toNumber());
            buf = buf.offset(user_data_len.toNumber());
        }
        base_trace(`[body(${this.trace_id()})] raw_decode, BodyContentFormat.Typed, user_data, buf len=${buf.byteLength}`,);

        // 构造ObjMutBody
        const obj: ObjectMutBody<DC, BC> =
            new ObjectMutBodyBuilder(this.obj_type, content)
                .option_prev_version(prev_version)
                .update_time(update_time.toBigInt())
                .option_user_data(user_data)
                .build();

        const result: [ObjectMutBody<DC, BC>, Uint8Array] = [obj, buf];

        return Ok(result);
    }
}

/**
 * NamedObject 的签名建构器
 */
export class ObjectSignsBuilder {
    constructor(private desc_signs?: Vec<Signature>, private body_signs?: Vec<Signature>) {
    }

    // 重置desc签名
    reset_desc_sign(sign: Signature): ObjectSignsBuilder {
        this.desc_signs = new Vec([sign]);
        return this;
    }

    // 重置body签名
    reset_body_sign(sign: Signature): ObjectSignsBuilder {
        this.desc_signs = new Vec([sign]);
        return this;
    }

    // 追加desc签名
    push_desc_sign(sign: Signature): ObjectSignsBuilder {
        if (this.desc_signs) {
            this.desc_signs.value().push(sign)
        } else {
            this.desc_signs = new Vec([sign]);
        }
        return this;
    }

    // 追加body签名
    push_body_sign(sign: Signature): ObjectSignsBuilder {
        if (this.body_signs) {
            this.body_signs.value().push(sign)
        } else {
            this.body_signs = new Vec([sign]);
        }
        return this;
    }

    build(): ObjectSigns {
        return new ObjectSigns(this.desc_signs, this.body_signs);
    }
}

/**
 * NamedObject 的签名部分
 */
export class ObjectSigns implements RawEncode {
    // 对Desc部分的签名，可以是多个，sign结构有的时候需要说明是“谁的签名”
    // 表示对Desc内容的认可。
    // 对MutBody部分的签名，可以是多个。依赖MutBody的稳定编码
    constructor(private m_desc_signs?: Vec<Signature>, private m_body_signs?: Vec<Signature>) {
    }

    desc_signs(): Signature[]|undefined {
        if (this.m_desc_signs) {
            return this.m_desc_signs.value();
        } else {
            return undefined;
        }
    }

    body_signs(): Signature[]|undefined {
        if (this.m_body_signs) {
            return this.m_body_signs.value();
        } else {
            return undefined;
        }
    }

    // 重置desc签名
    reset_desc_sign(sign: Signature) {
        this.m_desc_signs = new Vec([sign]);
    }

    // 重置body签名
    reset_body_sign(sign: Signature) {
        this.m_body_signs = new Vec([sign]);
    }

    // 追加desc签名
    push_desc_sign(sign: Signature) {
        if (this.m_desc_signs) {
            this.m_desc_signs.value().push(sign)
        } else {
            this.m_desc_signs = new Vec([sign]);
        }
    }

    // 追加body签名
    push_body_sign(sign: Signature) {
        if (this.m_body_signs) {
            this.m_body_signs.value().push(sign);
        } else {
            this.m_body_signs = new Vec([sign]);
        }
    }

    // 最后的desc签名时间
    latest_desc_sign_time(): JSBI {
        let latest_time = JSBI.BigInt(0);
        if (this.m_desc_signs) {
            for (const sign of this.m_desc_signs.value()) {
                if (JSBI.lessThan(latest_time, sign.sign_time)) {
                    latest_time = sign.sign_time;
                }
            }
        }
        return latest_time;
    }

    // 最后的body签名时间
    latest_body_sign_time(): JSBI {
        let latest_time = JSBI.BigInt(0);
        if (this.m_body_signs) {
            for (const sign of this.m_body_signs.value()) {
                if (JSBI.lessThan(latest_time, sign.sign_time)) {
                    latest_time = sign.sign_time;
                }
            }
        }
        return latest_time;
    }

    raw_measure(ctx: NamedObjectContext): BuckyResult<number> {
        let bytes = 0;

        if (this.m_desc_signs) {
            ctx.with_desc_signs();
            const r = this.m_desc_signs.raw_measure();
            if (r.err) {
                console.error("ObjectSigns::raw_measure_with_context/desc_signs error:", r.val);
                return r;
            }
            bytes += r.unwrap();
        }

        if (this.m_body_signs) {
            ctx.with_body_signs();
            const r = this.m_body_signs.raw_measure();
            if (r.err) {
                console.error("ObjectSigns::raw_measure_with_context/desc_signs error:", r.val);
                return r;
            }
            bytes += r.unwrap();
        }

        return Ok(bytes);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        if (this.m_desc_signs) {
            const r = this.m_desc_signs.raw_encode(buf);
            if (r.err) {
                console.error("ObjectSigns::raw_measure_with_context/desc_signs error:", r.val);
                return r;
            }
            buf = r.unwrap();
        }

        if (this.m_body_signs) {
            const r = this.m_body_signs.raw_encode(buf);
            if (r.err) {
                console.error("ObjectSigns::raw_measure_with_context/desc_signs error:", r.val);
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }

    static default(): ObjectSigns {
        return new ObjectSigns();
    }
}

/**
 * NamedObject 的签名解码器
 */
export class ObjectSignsDecoder implements RawDecode<ObjectSigns> {
    raw_decode(buf: Uint8Array, ctx: NamedObjectContext): BuckyResult<[ObjectSigns, Uint8Array]> {
        let desc_signs = undefined;
        if (ctx.has_desc_signs()) {
            const r = new VecDecoder<Signature>(new SignatureDecoder()).raw_decode(buf);
            if (r.err) {
                console.error("ObjectSigns::raw_decode_with_context/desc_signs error:", r.val);
                return r;
            }
            let _desc_signs;
            [_desc_signs, buf] = r.unwrap();
            desc_signs = _desc_signs;
        }

        let body_signs = undefined;
        if (ctx.has_body_signs()) {
            const r = new VecDecoder<Signature>(new SignatureDecoder()).raw_decode(buf);
            if (r.err) {
                console.error("ObjectSigns::raw_decode_with_context/body_signs error:", r.val);
                return r;
            }
            let _body_signs;
            [_body_signs, buf] = r.unwrap();
            body_signs = _body_signs;
        }

        const signs = new ObjectSigns(desc_signs, body_signs);
        const result: [ObjectSigns, Uint8Array] = [signs, buf];

        return Ok(result);
    }
}

/**
 * 强类型命名对象Id
 */
export class NamedObjectId<
    DC extends DescContent,
    BC extends BodyContent
    > implements RawEncode, Compareable<NamedObjectId<DC, BC>> {
    private m_object_id?: ObjectId;
    private readonly obj_type: number;

    constructor(obj_type: number, object_id: ObjectId) {
        this.obj_type = obj_type;
        this.m_object_id = object_id;
    }

    get object_id(): ObjectId {
        return this.m_object_id!;
    }

    hashCode(): symbol {
        return this.m_object_id!.hashCode();
    }

    equals<ODC extends DescContent, OBC extends BodyContent>(other: NamedObjectId<ODC, OBC>): boolean {
        if (this.obj_type !== other.obj_type) return false;
        return this.m_object_id!.equals(other.object_id!);
    }

    // 转移所有权
    into(): ObjectId {
        const obj_id = this.object_id;
        this.m_object_id = undefined;
        return obj_id;
    }

    gen(object_id: ObjectId) {
        const hash_value = object_id.as_slice();
        if (!is_standard_object(this.obj_type)) {
            // 用户类型
            // 4个可用flag
            let type_code;
            if (is_dec_app_object(this.obj_type)) {
                // 这是一个dec app 对象
                type_code = parseInt("110000", 2);
            } else {
                // 这是一个core 对象
                type_code = parseInt("100000", 2);
            }

            // 前 6 bit 写入类型信息
            hash_value[0] = type_code << 2;
        } else {
            // 标准类型
            const type_code = this.obj_type;

            hash_value[0] = parseInt("01000000", 2) | (type_code << 4 >> 2);
        }
    }

    toString(): string {
        return `(ObjectId: ${this.object_id.toString()}, obj_type:${this.obj_type})`;
    }

    toJSON(): string {
        return this.to_base_58();
    }

    to_string(): string {
        return `(ObjectId: ${this.object_id.toString()}, obj_type:${this.obj_type})`;
    }

    to_base_58(): string {
        return this.object_id.to_base_58();
    }

    to_base_36(): string {
        return this.object_id.to_base_36();
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        return this.object_id.raw_measure();
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        return this.object_id.raw_encode(buf);
    }
}

/*
// TODO 装饰器无法实现静态类型编译
export function named_object_id_impl<DC extends DescContent,
BC extends BodyContent,
O extends NamedObjectId<DescContent, BodyContent>>(c: any) {
    c.get_obj_type = (): number => {
        // tslint:disable-next-line:no-string-literal
        const obj_type = c['obj_type'];
        console.assert(typeof obj_type === 'number');
        return obj_type;
    };

    c.default = (): O => {
        return named_id_gen_default(c.get_obj_type()) as O;
    }

    c.from_base_58 = (s: string): BuckyResult<O> => {
        return named_id_from_base_58<DC, BC>(c.get_obj_type(), s).map(r => r as O);
    }

    c.try_from_object_id = (id: ObjectId): BuckyResult<O> => {
        return named_id_try_from_object_id(c.get_obj_type(), id).map(r => r as O);
    }

    return c;
}

// TODO 静态方法的模板化目前没有很好的办法
export function NamedObjectIdEx<
    DC extends DescContent,
    BC extends BodyContent,
    O extends NamedObjectId<DescContent, BodyContent>
>()  {
    class NamedObjectIdEx1 extends NamedObjectId<DC, BC> {
        public constructor(object_id: ObjectId) {
            super(NamedObjectIdEx1.get_obj_type(), object_id);
        }

        public static get_obj_type(): number {
            // tslint:disable-next-line:no-string-literal
            const obj_type = (this as any)['obj_type'];
            console.assert(typeof obj_type === 'number');
            return obj_type;
        }

        public static default(): O {
            return named_id_gen_default(this.get_obj_type()) as O;
        }

        public static from_base_58(s: string): BuckyResult<O> {
            return named_id_from_base_58<DC, BC>(this.get_obj_type(), s).map(r => r as O);
        }

        public static try_from_object_id(id: ObjectId): BuckyResult<O> {
            return named_id_try_from_object_id(this.get_obj_type(), id).map(r => r as O);
        }
    }

    return NamedObjectIdEx1;
}
*/

export function named_id_gen_default<
    DC extends DescContent,
    BC extends BodyContent,
    O extends NamedObjectId<DC, BC>>(obj_type: number): O {

    const id = ObjectId.default();
    const named_id = new NamedObjectId<DC, BC>(obj_type, id);
    const hash_value = id.as_slice();
    if (!is_standard_object(obj_type)) {
        // 用户类型
        // 4个可用flag
        let type_code;
        if (is_dec_app_object(obj_type)) {
            // 这是一个dec app 对象
            type_code = parseInt("110000", 2);
        } else {
            // 这是一个core 对象
            type_code = parseInt("100000", 2);
        }

        // 前 6 bit 写入类型信息
        hash_value[0] = type_code << 2;
    } else {
        // 标准类型
        const type_code = obj_type;

        hash_value[0] = parseInt("01000000", 2) | (type_code << 4 >> 2);
    }
    return named_id as O;
}

export function named_id_from_base_58<
    DC extends DescContent,
    BC extends BodyContent,
    >(obj_type: number, s: string): BuckyResult<NamedObjectId<DC, BC>> {
    const r = ObjectId.from_base_58(s);
    if (r.err) {
        return r;
    }

    return named_id_try_from_object_id(obj_type, r.unwrap());
    // return Ok(new NamedObjectId<DC, BC>(obj_type, r.unwrap()));
}

export function named_id_try_from_object_id<
    DC extends DescContent,
    BC extends BodyContent
>(obj_type: number, id: ObjectId): BuckyResult<NamedObjectId<DC, BC>> {

    const obj_type_code = number_2_obj_type_code(obj_type);

    const code = id.obj_type_code();

    if (code === obj_type_code) {
        return Ok(new NamedObjectId(obj_type, id));
    } else {
        const msg = `try convert from object id to named object id failed, mismatch obj_type_code, expect obj_type_code is: ${obj_type_code}, current obj_type_code is:${code}`;
        console.error(msg);
        return Err(new BuckyError(
            BuckyErrorCode.InvalidParam,
            msg
        ));
    }
}

/**
 * NamedObjectId 解码器
 */
export class NamedObjectIdDecoder<
    DC extends DescContent,
    BC extends BodyContent
    > implements RawDecode<NamedObjectId<DC, BC>> {
    readonly m_obj_type: number;
    constructor(obj_type: number) {
        this.m_obj_type = obj_type;
    }

    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[NamedObjectId<DC, BC>, Uint8Array]> {

        // id
        let id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                console.error("decode NamedObjectId/object_id failed, err:", r.val);
                return r;
            }
            [id, buf] = r.unwrap();
        }

        // named_id
        let named_id;
        {
            const r = named_id_try_from_object_id<DC, BC>(this.m_obj_type, id);
            if (r.err) {
                return r;
            }

            named_id = r.unwrap();
        }

        const result: [NamedObjectId<DC, BC>, Uint8Array] = [named_id, buf];

        return Ok(result);
    }
}

export interface SubDescType {
    // 是否有主，
    // "disable": 禁用，
    // "option": 可选
    owner_type: "disable" | "option",

    // 是否有区域信息，
    // "disable": 禁用，
    // "option": 可选
    area_type: "disable" | "option",

    // 是否有作者，
    // "disable": 禁用，
    // "option": 可选
    author_type: "disable" | "option",

    // 公钥类型，
    // "disable": 禁用，
    // "single_key": 单PublicKey，
    // "mn_key": M-N 公钥对,
    // "any": 任意类型(内部用)
    key_type: "disable" | "single_key" | "mn_key" | "any"
}

// DescContent和BodyContent的编码相关信息
export class ContentCodecInfo {
    // 如果想要实现解码的向前兼容，那么需要提供此值
    public version: number;

    // 编码方式，如果想实现非Raw格式的编码，需要提供此值
    public format: number;

    constructor(version: number, format: number) {
        this.version = version;
        this.format = format;
    }

    static default(): ContentCodecInfo {
        return new ContentCodecInfo(0, OBJECT_CONTENT_CODEC_FORMAT_RAW);
    }
}

const OBJECT_CONTENT_DEFAULT_CODEC_INFO = ContentCodecInfo.default();

export abstract class DescTypeInfo {
    get_sub_obj_type(): number {
        return this.obj_type();
    }

    set_sub_obj_type(v: number) {
        //
    }

    abstract obj_type(): number;
    abstract sub_desc_type(): SubDescType;
}

export abstract class DescContent implements RawEncode {
    abstract type_info(): DescTypeInfo;

    // 修改了默认编码信息(version or format)，那么需要覆盖此默认实现
    codec_info(): ContentCodecInfo {
        return OBJECT_CONTENT_DEFAULT_CODEC_INFO;
    }

    abstract raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number>;
    abstract raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array>;
}

export abstract class DescContentDecoder<T extends DescContent> implements RawDecode<T> {
    abstract type_info(): DescTypeInfo;

    abstract raw_decode(buf: Uint8Array, ctx: ContentRawDecodeContext): BuckyResult<[T, Uint8Array]>;
}

///////////////////////////////
// 默认的DescContent空实现 
export class EmptyDescContent extends DescContent {
    constructor(private m_type_info: DescTypeInfo) {
        super();
    }

    type_info(): DescTypeInfo {
        return this.m_type_info;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return Ok(buf);
    }
}

export class EmptyDescContentDecoder extends DescContentDecoder<EmptyDescContent> {
    constructor(private m_type_info: DescTypeInfo) {
        super();
    }

    type_info(): DescTypeInfo {
        return this.m_type_info;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[EmptyDescContent, Uint8Array]> {
        const self = new EmptyDescContent(this.m_type_info);
        const ret: [EmptyDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

////////////////////////////

export abstract class BodyContent implements RawEncode {

    // 如果修改了默认编码信息(version or format)，那么需要覆盖此默认实现
    codec_info(): ContentCodecInfo {
        return OBJECT_CONTENT_DEFAULT_CODEC_INFO;
    }

    abstract raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number>;
    abstract raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array>;
}

export abstract class BodyContentDecoder<T extends BodyContent> implements RawDecode<T> {
    abstract raw_decode(buf: Uint8Array, ctx: ContentRawDecodeContext): BuckyResult<[T, Uint8Array]>;
}

export class NamedObjectDescBuilder<T extends DescContent> {
    private m_dec_id?: ObjectId;
    private m_ref_objects?: Vec<ObjectLink>;
    private m_prev?: ObjectId;
    private m_create_timestamp?: HashValue;
    private m_create_time?: JSBI;
    private m_expired_time?: JSBI;
    private m_owner?: ObjectId;
    private m_area?: Area;
    private m_author?: ObjectId;
    private m_public_key?: PublicKey | MNPublicKey;
    private m_desc_content: T;

    constructor(obj_type: number, desc_content: T) {
        this.m_create_time = bucky_time_now();

        this.m_desc_content = desc_content;
        const sub_desc_type = desc_content.type_info().sub_desc_type();
    }

    // ObjectDesc

    dec_id(value: ObjectId): NamedObjectDescBuilder<T> {
        this.m_dec_id = value;
        return this;
    }

    option_dec_id(value?: ObjectId): NamedObjectDescBuilder<T> {
        this.m_dec_id = value;
        return this;
    }

    ref_objects(value: Vec<ObjectLink>): NamedObjectDescBuilder<T> {
        this.m_ref_objects = value;
        return this;
    }

    option_ref_objects(value?: Vec<ObjectLink>): NamedObjectDescBuilder<T> {
        this.m_ref_objects = value;
        return this;
    }

    prev(value: ObjectId): NamedObjectDescBuilder<T> {
        this.m_prev = value;
        return this;
    }

    option_prev(value?: ObjectId): NamedObjectDescBuilder<T> {
        this.m_prev = value;
        return this;
    }

    create_timestamp(value: HashValue): NamedObjectDescBuilder<T> {
        this.m_create_timestamp = value;
        return this;
    }

    option_create_timestamp(value?: HashValue): NamedObjectDescBuilder<T> {
        this.m_create_timestamp = value;
        return this;
    }

    create_time(value: JSBI): NamedObjectDescBuilder<T> {
        this.m_create_time = value;
        return this;
    }

    option_create_time(value?: JSBI): NamedObjectDescBuilder<T> {
        this.m_create_time = value;
        return this;
    }

    expired_time(value: JSBI): NamedObjectDescBuilder<T> {
        this.m_expired_time = value;
        return this;
    }

    option_expired_time(value?: JSBI): NamedObjectDescBuilder<T> {
        this.m_expired_time = value;
        return this;
    }

    // Owner/Area/Author/PublicKey
    owner(value: ObjectId): NamedObjectDescBuilder<T> {
        switch (this.m_desc_content.type_info().sub_desc_type().owner_type) {
            case "option": {
                this.m_owner = value;
                break;
            }
            case "disable": {
                console.error(`set owner on owner disabled object!`)
            }
        }
        return this;
    }

    option_owner(value?: ObjectId): NamedObjectDescBuilder<T> {
        switch (this.m_desc_content.type_info().sub_desc_type().owner_type) {
            case "option": {
                this.m_owner = value;
                break;
            }
            case "disable": {
                console.error(`set owner on owner disabled object!`)
            }
        }
        return this;
    }

    area(value: Area): NamedObjectDescBuilder<T> {
        switch (this.m_desc_content.type_info().sub_desc_type().area_type) {
            case "option": {
                this.m_area = value;
                break;
            }
            case "disable": {
                console.error(`set area on area disabled object!`)
            }
        }
        return this;
    }

    option_area(value?: Area): NamedObjectDescBuilder<T> {
        switch (this.m_desc_content.type_info().sub_desc_type().area_type) {
            case "option": {
                this.m_area = value;
                break;
            }
            case "disable": {
                console.error(`set area on area disabled object!`)
            }
        }
        return this;
    }

    author(value: ObjectId): NamedObjectDescBuilder<T> {
        switch (this.m_desc_content.type_info().sub_desc_type().author_type) {
            case "option": {
                this.m_author = value;
                break;
            }
            case "disable": {
                console.error(`set author on author disabled object!`)
            }
        }
        return this;
    }

    option_author(value?: ObjectId): NamedObjectDescBuilder<T> {
        switch (this.m_desc_content.type_info().sub_desc_type().author_type) {
            case "option": {
                this.m_author = value;
                break;
            }
            case "disable": {
                console.error(`set author on author disabled object!`)
            }
        }
        return this;
    }

    single_key(value: PublicKey): NamedObjectDescBuilder<T> {
        switch (this.m_desc_content.type_info().sub_desc_type().key_type) {
            case "single_key": {
                this.m_public_key = value;
                break;
            }
            default: {
                console.error(`set single_key on key ${this.m_desc_content.type_info().sub_desc_type().key_type} object!`)
            }
        }
        return this;
    }

    option_single_key(value?: PublicKey): NamedObjectDescBuilder<T> {
        switch (this.m_desc_content.type_info().sub_desc_type().key_type) {
            case "single_key": {
                this.m_public_key = value;
                break;
            }
            default: {
                console.error(`set single_key on key ${this.m_desc_content.type_info().sub_desc_type().key_type} object!`)
            }
        }
        return this;
    }

    mn_key(value: MNPublicKey): NamedObjectDescBuilder<T> {
        switch (this.m_desc_content.type_info().sub_desc_type().key_type) {
            case "mn_key": {
                this.m_public_key = value;
                break;
            }
            default: {
                console.error(`set mn_key on key ${this.m_desc_content.type_info().sub_desc_type().key_type} object!`)
            }
        }
        return this;
    }

    option_mn_key(value?: MNPublicKey): NamedObjectDescBuilder<T> {
        switch (this.m_desc_content.type_info().sub_desc_type().key_type) {
            case "mn_key": {
                this.m_public_key = value;
                break;
            }
            default: {
                console.error(`set mn_key on key ${this.m_desc_content.type_info().sub_desc_type().key_type} object!`)
            }
        }
        return this;
    }

    option_key(value?: PublicKey | MNPublicKey): NamedObjectDescBuilder<T> {
        switch (this.m_desc_content.type_info().sub_desc_type().key_type) {
            case "single_key":
            case "mn_key": {
                this.m_public_key = value;
                break;
            }
            default: {
                console.error(`set key on key ${this.m_desc_content.type_info().sub_desc_type().key_type} object!`)
            }
        }
        return this;
    }

    key(value: PublicKey | MNPublicKey): NamedObjectDescBuilder<T> {
        switch (this.m_desc_content.type_info().sub_desc_type().key_type) {
            case "single_key":
            case "mn_key": {
                this.m_public_key = value;
                break;
            }
            default: {
                console.error(`set key on key ${this.m_desc_content.type_info().sub_desc_type().key_type} object!`)
            }
        }
        return this;
    }

    build(): NamedObjectDesc<T> {
        return new NamedObjectDesc(
            this.m_dec_id,
            this.m_ref_objects,
            this.m_prev,
            this.m_create_timestamp,
            this.m_create_time,
            this.m_expired_time,
            this.m_desc_content,
            this.m_owner,
            this.m_area,
            this.m_author,
            this.m_public_key,
        );
    }
}

export class NamedObjectDesc<T extends DescContent> extends ObjectDesc implements RawEncode {
    // 基本部分 ObjectDesc
    private m_dec_id?: ObjectId;
    private m_ref_objects?: Vec<ObjectLink>;
    private m_prev?: ObjectId;
    private m_create_timestamp?: HashValue;
    private m_create_time?: JSBI;
    private m_expired_time?: JSBI;
    private m_owner?: ObjectId;
    private m_area?: Area;
    private m_author?: ObjectId;
    private m_public_key?: PublicKey | MNPublicKey;
    private m_desc_content: T;
    private m_trace: number;

    constructor(
        dec_id: ObjectId|undefined,
        ref_objects: Vec<ObjectLink>|undefined,
        prev: ObjectId|undefined,
        create_timestamp: HashValue|undefined,
        create_time: JSBI|undefined,
        expired_time: JSBI|undefined,

        // desc content
        desc_content: T,

        // sub desc
        owner?: ObjectId,
        area?: Area,
        author?: ObjectId,
        public_key?: PublicKey | MNPublicKey,
    ) {
        super(desc_content.type_info().get_sub_obj_type());
        this.m_dec_id = dec_id;
        this.m_ref_objects = ref_objects;
        this.m_prev = prev;
        this.m_create_timestamp = create_timestamp;
        this.m_create_time = create_time;
        this.m_expired_time = expired_time;

        this.m_desc_content = desc_content;

        const sub_desc_type = desc_content.type_info().sub_desc_type();

        switch (sub_desc_type.owner_type) {
            case "option": {
                this.m_owner = owner!;
                break;
            }
        }

        switch (sub_desc_type.area_type) {
            case "option": {
                this.m_area = area!;
                break;
            }
        }

        switch (sub_desc_type.author_type) {
            case "option": {
                this.m_author = author!;
                break;
            }
        }

        switch (sub_desc_type.key_type) {
            case "any": {
                this.m_public_key = public_key;
                break;
            }
            case "single_key": {
                this.m_public_key = public_key! as PublicKey;
                if (this.m_public_key == null) {
                    throw Error("single_key can not be null");
                }
                break;
            }
            case "mn_key": {
                this.m_public_key = public_key! as MNPublicKey;
                if (this.m_public_key == null) {
                    throw Error("mn_key can not be null");
                }
                break;
            }
        }

        this.m_trace = Math.floor(Math.random() * Math.floor(65535));
    }

    trace_id(): number {
        return this.m_trace;
    }

    convert_to<U extends DescContent>(map: (t: T) => BuckyResult<U>): BuckyResult<NamedObjectDesc<U>> {

        const u = map(this.m_desc_content);
        if (u.err) {
            return u;
        }

        const desc = u.unwrap();


        return Ok(new NamedObjectDescBuilder<U>(this.obj_type(), desc)
            .option_dec_id(this.dec_id())
            .option_ref_objects(this.ref_objs())
            .option_prev(this.prev())
            .option_create_timestamp(this.create_timestamp())
            .create_time(this.create_time())
            .option_expired_time(this.expired_time())
            .option_owner(this.owner())
            .option_area(this.area())
            .option_author(this.author())
            .option_key(this.m_public_key)
            .build());
    }

    //
    // desc content
    //

    content(): T {
        return this.m_desc_content;
    }

    //
    // ObjectDesc
    //

    dec_id(): ObjectId|undefined {
        return this.m_dec_id;
    }

    ref_objs(): Vec<ObjectLink>|undefined {
        return this.m_ref_objects
    }

    prev(): ObjectId|undefined {
        return this.m_prev;
    }

    create_timestamp(): HashValue|undefined {
        return this.m_create_timestamp;
    }

    create_time(): JSBI {
        if (this.m_create_time) {
            return this.m_create_time;
        } else {
            return JSBI.BigInt(0);
        }
    }

    expired_time(): JSBI|undefined {
        return this.m_expired_time;
    }

    object_id(): ObjectId {
        return this.calculate_id();
    }

    calculate_id(): ObjectId {
        const has_single_key = !!this.public_key();
        const has_mn_key = !!this.mn_key();
        const has_owner = !!this.owner();

        return new ObjectIdBuilder(this, this.obj_type_code())
            .area(this.m_area)
            .single_key(has_single_key)
            .mn_key(has_mn_key)
            .owner(has_owner)
            .build();
    }

    //
    // other Desc
    //

    owner(): ObjectId | undefined {
        return this.m_owner;
    }

    area(): Area | undefined {
        return this.m_area;
    }

    author(): ObjectId | undefined {
        return this.m_author;
    }

    public_key(): PublicKey | undefined {
        if (this.m_public_key == null) {
            return undefined;
        }

        if (this.m_public_key!.threshold < 0) {
            return this.m_public_key as PublicKey;
        }

        return undefined;
    }

    mn_key(): MNPublicKey | undefined {
        if (this.m_public_key == null) {
            return undefined;
        }

        if (this.m_public_key!.threshold < 0) {
            return undefined;
        }

        return this.m_public_key as MNPublicKey;
    }

    // ObjectDesc支持独立编码，需要把NamedObjectContext也编码进去
    // Encode
    //
    raw_measure(ctx?: NamedObjectContext, purpose?: RawEncodePurpose): BuckyResult<number> {
        let size = 0;

        if (ctx == null) {
            ctx = new NamedObjectContext(this.m_desc_content.type_info().get_sub_obj_type(), 0);
            size += ctx.raw_measure().unwrap();
        }

        size += this.raw_measure_with_context(ctx, purpose).unwrap();
        return Ok(size);
    }

    raw_measure_with_context(ctx: NamedObjectContext, purpose?: RawEncodePurpose): BuckyResult<number> {
        let size = 0;

        //
        // ObjectDesc
        //
        if (this.m_dec_id) {
            ctx.with_dec_id();
            const r = this.m_dec_id.raw_measure();
            if (r.err) {
                console.error(`NamedObjectDesc::raw_measure/dec_id error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            size += r.unwrap();
        }

        if (this.m_ref_objects) {
            ctx.with_ref_objects();
            const r = this.m_ref_objects.raw_measure();
            if (r.err) {
                console.error(`NamedObjectDesc::raw_measure/ref_objects error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            size += r.unwrap();
        }

        if (this.m_prev) {
            ctx.with_prev();
            const r = this.m_prev.raw_measure();
            if (r.err) {
                console.error(`NamedObjectDesc::raw_measure/m_prev error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            size += r.unwrap();
        }

        if (this.m_create_timestamp) {
            ctx.with_create_timestamp();
            const r = this.m_create_timestamp.raw_measure();
            if (r.err) {
                console.error(`NamedObjectDesc::raw_measure/m_create_timestamp error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            size += r.unwrap();
        }

        if (this.m_create_time) {
            ctx.with_create_time();
            size += 8; // u64
        }

        if (this.m_expired_time) {
            ctx.with_expired_time(); // u64
            size += 8;
        }

        //
        // OwnderObjectDesc/AreaObjectDesc/AuthorObjectDesc/PublicKeyObjectDesc
        //
        if (this.m_owner) {
            ctx.with_owner();
            const r = this.m_owner.raw_measure();
            if (r.err) {
                console.error(`NamedObjectDesc::raw_measure/m_owner error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            size += r.unwrap();
        }

        if (this.m_area) {
            ctx.with_area();
            const r = this.m_area.raw_measure();
            if (r.err) {
                console.error(`NamedObjectDesc::raw_measure/m_area error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            size += r.unwrap();
        }

        if (this.m_author) {
            ctx.with_author();
            const r = this.m_author.raw_measure();
            if (r.err) {
                console.error(`NamedObjectDesc::raw_measure/m_author error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            size += r.unwrap();
        }

        if (this.m_public_key) {
            ctx.with_public_key();
            const r = this.m_public_key!.raw_measure();
            if (r.err) {
                console.error(`NamedObjectDesc::raw_measure/m_public_key error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            size += 1; // u8 key_type
            size += r.unwrap();
        }

        // 新版本起默认带version+format, 8bit * 2
        size += 2;


        // desc_content，包括一个(u16长度 + DescContent)内容
        {
            const r = this.m_desc_content!.raw_measure(undefined, purpose);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_measure/m_desc_content error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()}, `,
                    r.val);
                return r;
            }
            const desc_content_usize = r.unwrap();
            if (desc_content_usize > 65535) {
                const msg = `desc content encode length extend max limit! len=${desc_content_usize}, max=65535`;
                console.error(msg);

                return Err(new BuckyError(BuckyErrorCode.OutOfLimit, msg));
            }

            // desc content包含一个u16的固定size
            size += 2;
            size += desc_content_usize;

            // 缓存desc_content大小
            ctx.cache_desc_content_size(desc_content_usize);
        }

        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: NamedObjectContext, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        if (ctx == null) {
            // base_trace("this.m_desc_content.type_info():", this.m_desc_content.type_info().obj_type());
            ctx = new NamedObjectContext(this.m_desc_content.type_info().get_sub_obj_type(), 0);
            {
                const r = this.raw_measure_with_context(ctx, purpose);
                if (r.err) {
                    return r;
                }
            }

            {
                const r = ctx.raw_encode(buf);
                if (r.err) {
                    return r;
                }
                buf = r.unwrap();
            }
        }

        return this.raw_encode_with_context(buf, ctx, purpose);
    }

    // encode之前，必须已经调用过raw_measure_with_context
    raw_encode_with_context(buf: Uint8Array, ctx: NamedObjectContext, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        console.assert(ctx);

        //
        // ObjectDesc
        //
        if (this.m_dec_id) {
            const r = this.m_dec_id.raw_encode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/dec_id error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_dec_id :`, buf.length);

        if (this.m_ref_objects) {
            const r = this.m_ref_objects.raw_encode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/ref_objects error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_ref_objects :`, buf.length);

        if (this.m_prev) {
            const r = this.m_prev.raw_encode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/prev error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_prev :`, buf.length);

        if (this.m_create_timestamp) {
            const r = this.m_create_timestamp.raw_encode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/create_timestamp error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_create_timestamp :`, buf.length);

        if (this.m_create_time) {
            const r = new BuckyNumber("u64", this.m_create_time).raw_encode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/create_time error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace("[desc] raw_encode, buffer len m_create_time :", buf.length);

        if (this.m_expired_time) {
            const r = new BuckyNumber("u64", this.m_expired_time).raw_encode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/expired_time error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_expired_time :`, buf.length);

        //
        // OwnderObjectDesc/AreaObjectDesc/AuthorObjectDesc/PublicKeyObjectDesc
        //
        if (this.m_owner) {
            const r = this.m_owner.raw_encode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/owner error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_owner :`, buf.length);

        if (this.m_area) {
            const r = this.m_area.raw_encode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/area error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_area :`, buf.length);

        if (this.m_author) {
            const r = this.m_author.raw_encode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/author error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len author:`, buf.length);

        if (this.m_public_key) {

            let key_type: number;
            if (this.m_public_key!.threshold < 0) {
                key_type = OBJECT_PUBLIC_KEY_SINGLE;
            } else {
                key_type = OBJECT_PUBLIC_KEY_MN;
            }
            buf[0] = key_type;
            buf = buf.offset(1);

            const r = this.m_public_key!.raw_encode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/public_key error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len public_key :`, buf.length);

        // 编码version，8bits
        {
            const r = new BuckyNumber("u8", this.m_desc_content.codec_info().version).raw_encode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/desc_content.version error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }

        // 编码format，8bits
        {
            const r = new BuckyNumber("u8", this.m_desc_content.codec_info().format).raw_encode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/desc_content.format error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }

        //
        // desc content，包括一个u16的长度和对应的desc_content
        //

        // calc desc_content_size
        const desc_content_size = ctx.get_desc_content_cached_size();
        console.assert(desc_content_size != null);
        {
            const r = new BuckyNumber("u16", desc_content_size).raw_encode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/expired_time error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }
            buf = r.unwrap();
        }

        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_desc_content length :`, buf.length);

        // desc_content
        {
            // 必须使用精确长度的buf编码
            const desc_content_buf = buf.subarray(0, desc_content_size);
            const r = this.m_desc_content.raw_encode(desc_content_buf, undefined, purpose);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_encode/desc_content error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                    r.val);
                return r;
            }

            // console.info(`content buf: len=${desc_content_size}, `, buf.subarray(0, desc_content_size).toString());

            const remain_buf = r.unwrap();
            // 正确编码完毕，应该消耗完整个buf
            if (remain_buf.byteOffset - buf.byteOffset !== desc_content_size) {
                console.warn(`encode desc content but return nonempty remain buf! obj_type=${this.obj_type()}, remain=${remain_buf.byteOffset - buf.byteOffset}`);
            }
            buf = buf.offset(desc_content_size);
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len desc_content :`, buf.length);

        return Ok(buf);
    }

    encode_to_buf(purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        const ctx = new NamedObjectContext(this.m_desc_content.type_info().get_sub_obj_type(), 0);
        let size = ctx.raw_measure().unwrap();
        {
            const r = this.raw_measure_with_context(ctx, RawEncodePurpose.Hash);
            if (r.err) {
                return r;
            }
            size += r.unwrap();
        }

        let buf = new Uint8Array(size);
        const origin_buf = buf;
        {
            const r = ctx.raw_encode(buf);
            if (r.err) {
                return r;
            }
            buf = r.unwrap();
        }

        {
            const r = this.raw_encode_with_context(buf, ctx, RawEncodePurpose.Hash);
            if (r.err) {
                return r;
            }
            buf = r.unwrap();
            console.assert(buf.length === 0);
        }

        return Ok(origin_buf);
    }

    // 提供优化版本的hash_encode
    raw_hash_encode(): BuckyResult<HashValue> {

        const r = this.encode_to_buf(RawEncodePurpose.Hash);
        if (r.err) {
            return r;
        }

        const buf = r.unwrap();
        const hash_value = HashValue.hash_data(buf);

        return new Ok(hash_value);
    }
}

export class NamedObjectDescDecoder<T extends DescContent> implements RawDecode<NamedObjectDesc<T>>{
    private readonly m_desc_content_decoder: DescContentDecoder<T>;
    private m_trace: number;
    constructor(desc_content_decoder: DescContentDecoder<T>) {
        this.m_desc_content_decoder = desc_content_decoder;
        this.m_trace = Math.floor(Math.random() * Math.floor(65535));
    }

    trace_id(): number {
        return this.m_trace;
    }

    raw_decode(buf: Uint8Array, ctx?: NamedObjectContext): BuckyResult<[NamedObjectDesc<T>, Uint8Array]> {
        // 对于独立编码的ObjectDesc，解码时候需要先解码Context(object_type+object_flags)
        if (ctx == null) {
            const r = new NamedObjectContextDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [ctx, buf] = r.unwrap();
        }

        //
        // ObjectDesc
        //
        let dec_id = undefined;
        if (ctx.has_dec_id()) {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_decode_with_context/dec_id error:`, r.val);
                return r;
            }
            const [_value, _buf] = r.unwrap();
            [dec_id, buf] = [_value, _buf];
        }
        base_trace(`[desc(${this.trace_id()})]  raw_decode, buffer len dec_id : `, buf.length);

        let ref_objects = undefined;
        if (ctx.has_ref_objects()) {
            const d = new VecDecoder(new ObjectLinkDecoder());
            const r = d.raw_decode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc:: raw_decode_with_context / ref_objects error: `, r.val);
                return r;
            }
            const [ref_objects1, buf1] = r.unwrap();
            ref_objects = ref_objects1;
            buf = buf1;
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer ref_objects :`, buf.length);

        let prev = undefined;
        if (ctx.has_prev()) {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_decode_with_context/prev error:`, r.val);
                return r;
            }
            const [_value, _buf] = r.unwrap();
            [prev, buf] = [_value, _buf];
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer prev : `, buf.length);

        let create_timestamp = undefined;
        if (ctx.has_create_time_stamp()) {
            const r = new HashValueDecoder().raw_decode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc:: raw_decode_with_context / create_timestamp error: `, r.val);
                return r;
            }
            const [_value, _buf] = r.unwrap();
            [create_timestamp, buf] = [_value, _buf];
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer create_timestamp :`, buf.length);

        let create_time = undefined;
        if (ctx.has_create_time()) {
            const r = new BuckyNumberDecoder("u64").raw_decode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_decode_with_context/create_time error:`, r.val);
                return r;
            }
            const [_value, _buf] = r.unwrap();
            [create_time, buf] = [_value.toBigInt(), _buf];
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer create_time : `, buf.length);

        let expired_time = undefined;
        if (ctx.has_expired_time()) {
            const r = new BuckyNumberDecoder("u64").raw_decode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc:: raw_decode_with_context / expired_time error: `, r.val);
                return r;
            }
            const [_value, _buf] = r.unwrap();
            [expired_time, buf] = [_value.toBigInt(), _buf];
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer expired_time :`, buf.length);

        //
        // OwnderObjectDesc/AreaObjectDesc/AuthorObjectDesc/PublicKeyObjectDesc
        //
        let owner = undefined
        if (ctx.has_owner()) {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_decode_with_context/owner error:`, r.val);
                return r;
            }
            let _owner;
            [_owner, buf] = r.unwrap();
            owner = _owner;
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer owner : `, buf.length);

        let area = undefined;
        if (ctx.has_area()) {
            const r = new AreaDecoder().raw_decode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc:: raw_decode_with_context / area error: `, r.val);
                return r;
            }
            let _area;
            [_area, buf] = r.unwrap();
            area = _area;
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer area :`, buf.length);

        let author = undefined
        if (ctx.has_author()) {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_decode_with_context/author error:`, r.val);
                return r;
            }
            let _author;
            [_author, buf] = r.unwrap();
            author = _author;
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer author: `, buf.length);

        let public_key: PublicKey | MNPublicKey | undefined;
        if (ctx.has_public_key()) {
            const key_type = buf[0];
            buf = buf.offset(1);

            switch (key_type) {
                case OBJECT_PUBLIC_KEY_SINGLE: {
                    const r = new PublicKeyDecoder().raw_decode(buf);
                    if (r.err) {
                        console.error(`NamedObjectDesc:: raw_decode_with_context/single_key error: `, r.val);
                        return r;
                    }
                    [public_key, buf] = r.unwrap();
                    break;
                }
                case OBJECT_PUBLIC_KEY_MN: {
                    const r = new MNPublicKeyDecoder().raw_decode(buf);
                    if (r.err) {
                        console.error(`NamedObjectDesc::raw_decode_with_context/mn_key error:`, r.val);
                        return r;
                    }
                    [public_key, buf] = r.unwrap();
                    break;
                }
                default: {
                    return Err(new BuckyError(BuckyErrorCode.InvalidData, "invalid public key type"));
                }
            }
        } else {
            public_key = undefined;
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer public_key: `, buf.length);

        // 预留的扩展字段
        if (ctx.has_ext()) {
            const r = new BuckyNumberDecoder('u16').raw_decode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_decode_with_context/desc.ext error! obj_type:=${this.m_desc_content_decoder.type_info().obj_type()}`,
                    r.val);
                return r;
            }
            let ext_len;
            [ext_len, buf] = r.unwrap();

            console.warn(`read unknown ext content! len = ${ext_len.toNumber()}, obj_type=${this.m_desc_content_decoder.type_info().obj_type()}`);

            // 跳过此段不识别的内容
            buf = buf.offset(ext_len.toNumber());
        }

        // 解码version
        let version: BuckyNumber;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_decode_with_context/desc_content.version error! obj_type=${this.m_desc_content_decoder.type_info().obj_type()}`,
                    r.val);
                return r;
            }
            [version, buf] = r.unwrap();
        }

        // 解码format
        let format: BuckyNumber;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_decode_with_context/desc_content.format error! obj_type=${this.m_desc_content_decoder.type_info().obj_type()}`,
                    r.val);
                return r;
            }
            [format, buf] = r.unwrap();
        }

        const opt = new ContentRawDecodeContext(version.toNumber(), format.toNumber());

        // desc_content
        // 首先读取u16的长度
        let desc_content_size: number;
        {
            const r = new BuckyNumberDecoder('u16').raw_decode(buf);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_decode_with_context/desc_content_len error! obj_type=${this.m_desc_content_decoder.type_info().obj_type()}`,
                    r.val);
                return r;
            }

            let size;
            [size, buf] = r.unwrap();
            desc_content_size = size.toNumber();
        }

        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer desc_content length: `, buf.length);

        let desc_content: T;
        {
            // 必须使用精确长度的buf解码
            const desc_content_buf = buf.subarray(0, desc_content_size);

            const r = this.m_desc_content_decoder.raw_decode(desc_content_buf, opt);
            if (r.err) {
                console.error(`NamedObjectDesc::raw_decode_with_context / desc_content error! obj_type=${this.m_desc_content_decoder.type_info().obj_type()},`,
                    r.val);
                return r;
            }
            let remain_buf;
            [desc_content, remain_buf] = r.unwrap();

            // 正确编码完毕，应该消耗完整个buf
            if (remain_buf.byteOffset - buf.byteOffset !== desc_content_size) {
                console.warn(`decode desc content but return nonempty remain buf! obj_type=${this.m_desc_content_decoder.type_info().obj_type()}, remain = ${remain_buf.byteOffset - buf.length},`);
            }
        }

        buf = buf.offset(desc_content_size);

        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer desc_content: `, buf.length);

        desc_content.type_info().set_sub_obj_type(ctx.obj_type);

        const desc = new NamedObjectDesc(
            dec_id,
            ref_objects,
            prev,
            create_timestamp,
            create_time,
            expired_time,
            desc_content,
            owner,
            area,
            author,
            public_key,
        );

        const result: [NamedObjectDesc<T>, Uint8Array] = [desc, buf];

        return Ok(result);
    }
}

export class NamedObject<
    DC extends DescContent,
    BC extends BodyContent,
    > implements RawEncode {
    private m_desc: NamedObjectDesc<DC>;
    private m_body?: ObjectMutBody<DC, BC>;
    private m_signs: ObjectSigns;
    private m_nonce?: JSBI; // u128
    private m_obj_type: number;
    private m_obj_type_code: ObjectTypeCode;

    constructor(
        desc: NamedObjectDesc<DC>,
        body: ObjectMutBody<DC, BC> | undefined,
        signs: ObjectSigns,
        nonce?: JSBI
    ) {
        this.m_desc = desc;
        this.m_body = body;
        this.m_signs = signs;
        this.m_nonce = nonce;
        this.m_obj_type = desc.obj_type();
        this.m_obj_type_code = desc.obj_type_code();

        // 不再缓存id
        // this.m_object_id = this.desc().calculate_id();

        if (this.m_body) {
            this.m_body.set_trace_id(this.m_desc.trace_id());
        }
    }

    obj_type(): number {
        return this.m_obj_type;
    }

    obj_type_code(): number {
        return this.m_obj_type_code;
    }

    // 获取缓存的object_id
    //get_cached_object_id(): ObjectId {
    //   return this.m_object_id;
    //}

    // 计算object_id并更新缓存
    calculate_id(): ObjectId {
        const id = this.desc().calculate_id();

        return id;
    }

    protected obj_flags(): number {
        const [_, ctx] = this.raw_measure_ctx().unwrap();
        return ctx.obj_flags;
    }

    private raw_measure_ctx(purpose?: RawEncodePurpose): BuckyResult<[number, NamedObjectContext]> {
        const ctx = new NamedObjectContext(this.m_obj_type, 0);

        let size = ctx.raw_measure().unwrap();

        // desc
        {
            const r = this.m_desc.raw_measure(ctx, purpose);
            if (r.err) {
                console.error(`NamedObject::raw_measure_ex/desc error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                   r.val);
                return r;
            }
            size += r.unwrap();
        }

        // body
        if (this.m_body) {
            ctx.with_mut_body();
            const r = this.m_body.raw_measure(ctx.body_context(), purpose);
            if (r.err) {
                console.error(`NamedObject::raw_measure_ex/body error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                   r.val);
                return r;
            }
            size += r.unwrap();
        }

        // signs
        {
            const r = this.m_signs.raw_measure(ctx);
            if (r.err) {
                console.error(`NamedObject::raw_measure_ex/signs error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                   r.val);
                return r;
            }
            size += r.unwrap();
        }

        // nonce
        if (this.m_nonce) {
            ctx.with_nonce();

            // TODO: u128
            const r = new BuckyNumber("u128", this.m_nonce).raw_measure();
            if (r.err) {
                console.error(`NamedObject::raw_measure_ex/nonce error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                   r.val);
                return r;
            }
            size += r.unwrap();
        }

        //this.m_obj_flags = Some(ctx.obj_flags);
        //this.m_ctx = Some(ctx);

        const result: [number, NamedObjectContext] = [size, ctx];
        return Ok(result);
    }

    to_vec(): BuckyResult<Uint8Array> {
        return this.encode_to_buf();
    }

    to_hex(): BuckyResult<string> {
        const r = this.to_vec();
        if (r.err) {
            return r;
        }

        const vec = r.unwrap();
        return Ok(vec.toHex());
    }

    toString(): string {
        return this.to_string();
    }

    to_string(): string {
        const r = this.to_hex();
        if (r.err) {
            return `get hex string err:{${r.err}}`
        } else {
            return r.unwrap();
        }
    }

    toJSON(): string {
        return this.toString();
    }

    desc(): NamedObjectDesc<DC> {
        return this.m_desc;
    }

    body(): ObjectMutBody<DC, BC>|undefined {
        return this.m_body;
    }

    set_body(body?: ObjectMutBody<DC, BC>) {
        this.m_body = body;
    }

    body_expect(msg?: string): ObjectMutBody<DC, BC> {
        if (!this.m_body) {
            throw new Error(`expect body but empty, ${msg}`)
        }
        return this.m_body!;
    }

    signs(): ObjectSigns {
        return this.m_signs;
    }

    nonce(): JSBI|undefined {
        return this.m_nonce;
    }

    raw_measure(_ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        console.assert(_ctx == null);

        const r = this.raw_measure_ctx(purpose);
        if (r.err) {
            console.error(`NamedObject::raw_measure/raw_measure_ex error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
               r.val);
            return r;
        }

        const [size, ctx] = r.unwrap();

        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: NamedObjectContext, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        let size;
        if (ctx == null) {
            const r = this.raw_measure_ctx(purpose);
            if (r.err) {
                console.error(`NamedObject::raw_encode/raw_measure_ex error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                   r.val);
                return r;
            }

            [size, ctx] = r.unwrap();
            console.assert(buf.length <= size);
        }

        // obj_type + obj_flags
        {
            const r = ctx.raw_encode(buf);
            if (r.err) {
                console.error(`NamedObject::raw_encode/obj_type + obj_flags error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                   r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc.trace_id()})] raw_encode, ctx`);

        // desc
        {
            const r = this.m_desc.raw_encode(buf, ctx, purpose);
            if (r.err) {
                console.error(`NamedObject::raw_encode/desc error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                   r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc.trace_id()})] raw_encode, desc`);

        // body
        if (this.m_body) {
            const r = this.m_body.raw_encode(buf, ctx.body_context(), purpose);
            if (r.err) {
                console.error(`NamedObject::raw_encode/body error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                   r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc.trace_id()})] raw_encode, body`);

        // signs
        {
            const r = this.m_signs.raw_encode(buf);
            if (r.err) {
                console.error(`NamedObject::raw_encode/signs error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                   r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc.trace_id()})] raw_encode, signs`);

        // nonce
        if (this.m_nonce) {
            // TODO: u128
            const r = new BuckyNumber("u128", this.m_nonce).raw_encode(buf);
            if (r.err) {
                console.error(`NamedObject::raw_encode/nonce error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
                   r.val);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc.trace_id()})] raw_encode, nonce`);

        return Ok(buf);
    }

    encode_to_buf(purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        // 使用raw_measure_ctx替代raw_measure，减少一次内部的raw_measure调用
        const r = this.raw_measure_ctx(purpose);
        if (r.err) {
            console.error(`NamedObject::raw_measure/raw_measure_ctx error! obj_type=${this.obj_type()}, obj_type_code=${this.obj_type_code()},`,
               r.val);
            return r;
        }

        const [size, ctx] = r.unwrap();

        const buf = new Uint8Array(size);
        {
            const r = this.raw_encode(buf, ctx, purpose);
            if (r.err) {
                return r;
            }
        }

        return Ok(buf);
    }

    raw_hash_encode(): BuckyResult<HashValue> {
        const r = this.encode_to_buf(RawEncodePurpose.Hash);
        if (r.err) {
            return r;
        }

        const buf = r.unwrap();
        const hash_value = HashValue.hash_data(buf);
        return new Ok(hash_value);
    }
}

export class NamedObjectDecoder<
    DC extends DescContent,
    BC extends BodyContent,
    O extends NamedObject<DC, BC>
    > implements RawDecode<NamedObject<DC, BC>>
{
    private readonly m_desc_content_decoder: DescContentDecoder<DC>;
    private readonly m_body_content_decoder: RawDecode<BC>;
    private readonly m_desc_decoder: NamedObjectDescDecoder<DC>;
    private readonly m_body_decoder: ObjectMutBodyDecoder<DC, BC>;
    private readonly m_sign_decoder: ObjectSignsDecoder;
    private readonly m_object_builder: new (...constructorArgs: any[]) => O;

    constructor(desc_content_decoer: DescContentDecoder<DC>, body_content_decoder: BodyContentDecoder<BC>, obj_builder: new (...constructorArgs: any[]) => O) {
        this.m_desc_content_decoder = desc_content_decoer;
        this.m_body_content_decoder = body_content_decoder;
        this.m_desc_decoder = new NamedObjectDescDecoder(this.m_desc_content_decoder);
        this.m_body_decoder = new ObjectMutBodyDecoder<DC, BC>(this.m_desc_content_decoder.type_info().obj_type(), body_content_decoder);
        this.m_sign_decoder = new ObjectSignsDecoder();
        this.m_object_builder = obj_builder;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[O, Uint8Array]> {
        const t = this.m_desc_content_decoder.type_info();

        // obj_type+obj_flags
        let ctx: NamedObjectContext;
        {
            const r = new NamedObjectContextDecoder().raw_decode(buf);
            if (r.err) {
                console.error(`NamedObject::raw_decode/ctx error! obj_type=${t.obj_type()},`, r.val);
                return r;
            }
            [ctx, buf] = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc_decoder.trace_id()})] raw_decode, ctx`);

        // 只有 TypelessObjectType 类型才不接受检查
        if (t.obj_type() !== OBJECT_TYPE_ANY) {
            if (t.obj_type() !== ctx.obj_type) {
                const msg = `unmatch obj_type_code: ctx obj_type=${ctx.obj_type}, got=${t.obj_type()}`;
                console.error(msg);
                return Err(new BuckyError(BuckyErrorCode.NotMatch, msg));
            }
        }

        // desc
        let desc;
        {
            const r = this.m_desc_decoder.raw_decode(buf, ctx);
            if (r.err) {
                console.error(`NamedObject::raw_decode/desc error! obj_type=${t.obj_type()},`, r.val);
                return r;
            }
            [desc, buf] = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc_decoder.trace_id()})] raw_decode, desc`);

        // body
        let body = undefined;
        if (ctx.has_mut_body()) {
            const r = this.m_body_decoder.raw_decode(buf);
            if (r.err) {
                console.error(`NamedObject::raw_decode/body error! obj_type=${t.obj_type()},`, r.val);
                return r;
            }
            let _body;
            [_body, buf] = r.unwrap();
            body = _body;
        }
        base_trace(`[named_object(${this.m_desc_decoder.trace_id()})] raw_decode, body`);

        // signs
        let signs;
        {
            const r = this.m_sign_decoder.raw_decode(buf, ctx);
            if (r.err) {
                console.error(`NamedObject::raw_decode/signs error! obj_type=${t.obj_type()}`, r.val);
                return r;
            }
            [signs, buf] = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc_decoder.trace_id()})] raw_decode, signs`);

        // nonce
        let nonce = undefined;
        if (ctx.has_nonce()) {
            const r = new BuckyNumberDecoder("u128").raw_decode(buf);
            if (r.err) {
                return r;
            }
            let _nonce;
            [_nonce, buf] = r.unwrap();
            nonce = _nonce.toBigInt();
        }
        base_trace(`[named_object(${this.m_desc_decoder.trace_id()})] raw_decode, nonce`);

        const obj = new this.m_object_builder(desc, body, signs, nonce);

        // const desc_json = JSON.stringify(desc, (key, value) => (value instanceof JSBI ? value.toString() : value), 2);
        // base_trace("desc:", desc_json);

        const ret: [O, Uint8Array] = [obj, buf];

        return Ok(ret);
    }

    from_raw(buf: Uint8Array): BuckyResult<O> {
        const ret = this.raw_decode(buf);
        if (ret.err) {
            return ret;
        }

        return Ok(ret.unwrap()[0]);
    }

    from_hex(hex: string): BuckyResult<O> {
        const buf = Uint8Array.prototype.fromHex(hex);
        if (buf.err) {
            return buf;
        }
        return this.from_raw(buf.unwrap());
    }
}

export class NamedObjectBuilder<
    DC extends DescContent,
    BC extends BodyContent,
    >{
    private m_desc_builder: NamedObjectDescBuilder<DC>;
    private m_body_builder: ObjectMutBodyBuilder<DC, BC>;
    private m_signs_builder: ObjectSignsBuilder;
    private m_nonce?: JSBI;
    private m_nobody: boolean;

    constructor(desc_content: DC, body_content: BC) {
        this.m_desc_builder = new NamedObjectDescBuilder(desc_content.type_info().obj_type(), desc_content);
        this.m_body_builder = new ObjectMutBodyBuilder<DC, BC>(desc_content.type_info().obj_type(), body_content);
        this.m_signs_builder = new ObjectSignsBuilder();
        this.m_nobody = false;
    }

    // desc

    dec_id(dec_id: ObjectId): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder.dec_id(dec_id);
        return this;
    }

    option_dec_id(dec_id?: ObjectId): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder.option_dec_id(dec_id);
        return this;
    }

    ref_objects(ref_objects: Vec<ObjectLink>): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder.ref_objects(ref_objects);
        return this;
    }

    option_ref_objects(ref_objects?: Vec<ObjectLink>): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder.option_ref_objects(ref_objects);
        return this;
    }

    prev(prev: ObjectId): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder.prev(prev);
        return this;
    }

    option_prev(prev?: ObjectId): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder.option_prev(prev);
        return this;
    }

    create_timestamp(create_timestamp: HashValue): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder.create_timestamp(create_timestamp);
        return this;
    }

    option_create_timestamp(create_timestamp?: HashValue): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder.option_create_timestamp(create_timestamp);
        return this;
    }

    no_create_time(): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder.option_create_time();
        return this;
    }

    create_time(create_time: JSBI): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder.create_time(create_time);
        return this;
    }

    // 传入None，表示自动取当前时间，传入Some(x)，表示设置为具体时间
    option_create_time(create_time?: JSBI): NamedObjectBuilder<DC, BC> {
        if (create_time) {
            this.m_desc_builder.create_time(create_time);
        }
        return this;
    }

    expired_time(expired_time: JSBI): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder.expired_time(expired_time);
        return this;
    }

    option_expired_time(expired_time?: JSBI): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder.option_expired_time(expired_time);
        return this;
    }

    // sub desc

    owner(value: ObjectId): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder = this.m_desc_builder.owner(value);
        return this;
    }

    option_owner(value?: ObjectId): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder = this.m_desc_builder.option_owner(value);
        return this;
    }

    area(value: Area): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder = this.m_desc_builder.area(value);
        return this;
    }

    option_area(value?: Area): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder = this.m_desc_builder.option_area(value);
        return this;
    }

    author(value: ObjectId): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder = this.m_desc_builder.author(value);
        return this;
    }

    option_author(value?: ObjectId): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder = this.m_desc_builder.option_author(value);
        return this;
    }

    single_key(value: PublicKey): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder = this.m_desc_builder.single_key(value);
        return this;
    }

    option_single_key(value?: PublicKey): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder = this.m_desc_builder.option_single_key(value);
        return this;
    }

    mn_key(value: MNPublicKey): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder = this.m_desc_builder.mn_key(value);
        return this;
    }

    option_mn_key(value?: MNPublicKey): NamedObjectBuilder<DC, BC> {
        this.m_desc_builder = this.m_desc_builder.option_mn_key(value);
        return this;
    }

    // body

    no_body(): NamedObjectBuilder<DC, BC> {
        this.m_nobody = true;
        return this;
    }

    update_time(update_time: JSBI): NamedObjectBuilder<DC, BC> {
        this.m_body_builder = this.m_body_builder.update_time(update_time);
        return this;
    }

    prev_version(prev_version: HashValue): NamedObjectBuilder<DC, BC> {
        this.m_body_builder = this.m_body_builder.prev_version(prev_version);
        return this;
    }

    user_data(user_data: Uint8Array): NamedObjectBuilder<DC, BC> {
        this.m_body_builder = this.m_body_builder.user_data(user_data);
        return this;
    }

    // signs
    reset_desc_sign(sign: Signature): NamedObjectBuilder<DC, BC> {
        this.m_signs_builder = this.m_signs_builder.reset_desc_sign(sign);
        return this;
    }

    reset_body_sign(sign: Signature): NamedObjectBuilder<DC, BC> {
        this.m_signs_builder = this.m_signs_builder.reset_body_sign(sign);
        return this;
    }

    push_desc_sign(sign: Signature): NamedObjectBuilder<DC, BC> {
        this.m_signs_builder = this.m_signs_builder.push_desc_sign(sign);
        return this;
    }

    push_body_sign(sign: Signature): NamedObjectBuilder<DC, BC> {
        this.m_signs_builder = this.m_signs_builder.push_body_sign(sign);
        return this;
    }

    // nonce
    nonce(nonce: JSBI): NamedObjectBuilder<DC, BC> {
        this.m_nonce = nonce;
        return this;
    }

    // build
    build_ex(): [
        NamedObjectDesc<DC>,
        ObjectMutBody<DC, BC>|undefined,
        ObjectSigns,
        JSBI|undefined
    ] {
        const desc = this.m_desc_builder.build();
        const body = this.m_nobody ? undefined : this.m_body_builder.build();
        const signs = this.m_signs_builder.build();
        const nonce = this.m_nonce;

        return [desc, body, signs, nonce];
    }

    build<T extends NamedObject<DC, BC>>(
        obj_constructor: new (
            desc: NamedObjectDesc<DC>,
            body: ObjectMutBody<DC, BC>|undefined,
            signs: ObjectSigns,
            nonce?: JSBI
        ) => T): T {
        return new obj_constructor(...this.build_ex());
    }
}