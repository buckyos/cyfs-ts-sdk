import { bucky_time_now } from "../base/time";
import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../base/results";
import {} from "../base/buffer";
import { RawEncode, RawDecode, RawHexDecode, Compareable, RawEncodePurpose, } from "../base/raw_encode";
import { raw_hash_encode } from "../base/raw_encode_util";
import { BuckyNumber, BuckyNumberDecoder } from "../base/bucky_number";
import { Option, OptionDecoder, Some, None, OptionWrapper} from "../base/option";
import { Vec, VecDecoder } from "../base/vec";
import { HashValue, HashValueDecoder } from "../crypto/hash";
import { PublicKeyValue, PublicKey, PublicKeyDecoder, MNPublicKey, MNPublicKeyDecoder, Signature, SignatureDecoder } from "../crypto/public_key";
import { Area, AreaDecoder } from "./area";
import { ObjectTypeCode, number_2_obj_type_code } from "./object_type_info";
import { ObjectId, ObjectIdDecoder, ObjectLink, ObjectLinkDecoder, } from "./object_id";
import { base_error, base_trace } from "../base/log";


export class ObjectIdBuilder<T extends RawEncode & ObjectDesc> {
    m_t: T;
    m_obj_type_code: ObjectTypeCode;
    m_area: Option<Area>;
    m_has_owner: boolean;
    m_has_single_key: boolean;
    m_has_mn_key: boolean;

    constructor(t: T, obj_type_code: ObjectTypeCode){
        this.m_t = t;
        this.m_obj_type_code = obj_type_code;
        this.m_area = None;
        this.m_has_owner = false;
        this.m_has_single_key = false;
        this.m_has_mn_key = false;
    }

    area(area: Option<Area>): ObjectIdBuilder<T> {
        this.m_area = area;
        return this;
    }

    owner(value: boolean): ObjectIdBuilder<T>{
        this.m_has_owner = value;
        return this;
    }

    single_key(value: boolean): ObjectIdBuilder<T>{
        this.m_has_single_key = value;
        return this;
    }

    mn_key(value: boolean): ObjectIdBuilder<T>{
        this.m_has_mn_key = value;
        return this;
    }

    build(): ObjectId{
        const ret = raw_hash_encode(this.m_t);
        const hash_value = ret.unwrap().as_slice();

        // base_trace("hash_value:", hash_value);

        // 清空前 40 bit
        hash_value[0] = 0;
        hash_value[1] = 0;
        hash_value[2] = 0;
        hash_value[3] = 0;
        hash_value[4] = 0;

        if(!this.m_t.is_standard_object()) {
            // 用户类型
            // 4个可用flag
            let type_code;
            if(this.m_t.dec_id().is_some()) {
                // 这是一个dec app 对象
                // 高2bits固定为11
                type_code = parseInt("00110000", 2);
            }else{
                // base_trace("xxxx");
                // 这是一个core 对象
                // 高2bits固定为10，
                type_code = parseInt("00100000", 2);
            };

            // | 是否有area_code | 是否有public_key | 是否是多Key对象 | 是否有owner |
            if(this.m_area.is_some()) {
                type_code = type_code | parseInt("00001000", 2);
            }

            if(this.m_has_single_key) {
                type_code = type_code | parseInt("00000100", 2);
            }

            if(this.m_has_mn_key) {
                type_code = type_code | parseInt("00000010", 2);
            }

            if(this.m_has_owner) {
                type_code = type_code | parseInt("00000001", 2);
            }

            if(this.m_area.is_some()) {
                const area = this.m_area.unwrap();
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

            if(this.m_area.is_some()) {
                // --------------------------------------------
                // (2bit)(4bit)(国家编码8bits)+(运营商编码4bits)+城市编码(14bits)+inner(8bits) = 40 bit
                // --------------------------------------------
                // 0 obj_bits[. .]type_code[. . . .] country[. .]
                // 1 country[. . . . . .]carrier[x x x x . .]
                // 2 carrier[. .]city[0][x x . . . . . . ]
                // 3 city[1][. . . . . . . . ]
                // 4 inner[. . . . . . . . ]
                const area = this.m_area.unwrap();
                hash_value[0] = parseInt("01000000", 2) | (type_code<<4>>2) | (area.country << 7 >> 14);
                hash_value[1] = (area.country << 1) | (area.carrier << 4 >> 7);
                hash_value[2] = (area.carrier << 5) | (area.city >> 8);
                hash_value[3] = (area.city << 8 >> 8);
                hash_value[4] = area.inner;
            } else {
                hash_value[0] = parseInt("01000000", 2) | type_code<<4>>2;
            }
        };

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

export const OBJECT_FLAG_CTYPTO: number = 0x01;
export const OBJECT_FLAG_MUT_BODY: number = 0x01<<1;
export const OBJECT_FLAG_DESC_SIGNS: number = 0x01<<2;
export const OBJECT_FLAG_BODY_SIGNS: number = 0x01<<3;
export const OBJECT_FLAG_NONCE: number = 0x01<<4;

export const OBJECT_FLAG_DESC_ID: number = 0x01<<5;
export const OBJECT_FLAG_REF_OBJECTS: number = 0x01<<6;
export const OBJECT_FLAG_PREV: number = 0x01<<7;
export const OBJECT_FLAG_CREATE_TIMESTAMP: number = 0x01<<8;
export const OBJECT_FLAG_CREATE_TIME: number = 0x01<<9;
export const OBJECT_FLAG_EXPIRED_TIME: number = 0x01<<10;

export const OBJECT_FLAG_OWNER: number = 0x01<<11;
export const OBJECT_FLAG_AREA: number = 0x01<<12;
export const OBJECT_FLAG_AUTHOR: number = 0x01<<13;
export const OBJECT_FLAG_PUBLIC_KEY: number = 0x01<<14;

// 左闭右闭 区间定义
export const OBJECT_TYPE_ANY: number = 0;
export const OBJECT_TYPE_STANDARD_START: number = 1;
export const OBJECT_TYPE_STANDARD_END: number = 16;
export const OBJECT_TYPE_CORE_START: number = 17;
export const OBJECT_TYPE_CORE_END: number = 32767;
export const OBJECT_TYPE_DECAPP_START: number = 32768;
export const OBJECT_TYPE_DECAPP_END: number = 65535;

export const OBJECT_PUBLIC_KEY_NONE: number = 0x00;
export const OBJECT_PUBLIC_KEY_SINGLE: number = 0x01;
export const OBJECT_PUBLIC_KEY_MN: number = 0x02;

export const OBJECT_BODY_FLAG_PREV: number = 0x01;
export const OBJECT_BODY_FLAG_USER_DATA: number = 0x01<<1;

export function is_standard_object(object_type: number): boolean{
    return object_type >= OBJECT_TYPE_STANDARD_START && object_type <= OBJECT_TYPE_STANDARD_END;
}

export function is_core_object(object_type: number): boolean{
    return object_type >= OBJECT_TYPE_CORE_START && object_type <= OBJECT_TYPE_CORE_END;
}

export function is_dec_app_object(object_type: number): boolean{
    return object_type >= OBJECT_TYPE_DECAPP_START && object_type <= OBJECT_TYPE_DECAPP_END;
}


export abstract class ObjectDesc {
    private m_obj_type: number;

    constructor(obj_type: number){
        this.m_obj_type = obj_type;
    }

    obj_type(): number{
        return this.m_obj_type;
    }

    // 默认实现，从obj_type 转 obj_type_code
    obj_type_code(): ObjectTypeCode{
        const t = this.obj_type();
        return number_2_obj_type_code(this.m_obj_type);
    }

    is_standard_object(): boolean{
        const c = this.obj_type_code();
        return c!==ObjectTypeCode.Custom;
    }

    is_core_object(): boolean{
        const t = this.obj_type();
        const c = this.obj_type_code();
        return c===ObjectTypeCode.Custom && ( t>=OBJECT_TYPE_CORE_START && t<=OBJECT_TYPE_CORE_END);
    }

    is_dec_app_object(): boolean{
        const t = this.obj_type();
        const c = this.obj_type_code();
        return c===ObjectTypeCode.Custom && ( t>=OBJECT_TYPE_DECAPP_START && t<=OBJECT_TYPE_DECAPP_END);
    }

    // 计算 id
    abstract calculate_id(): ObjectId;

    // 获取所属 DECApp 的 id
    abstract dec_id(): Option<ObjectId>;

    // 链接对象列表
    abstract ref_objs(): Option<Vec<ObjectLink>>;

    // 前一个版本号
    abstract prev(): Option<ObjectId>;

    // 创建时的 BTC Hash
    abstract create_timestamp(): Option<HashValue>;

    // 创建时间戳，如果不存在，则返回0
    abstract create_time(): bigint;

    // 过期时间戳
    abstract expired_time(): Option<bigint>;

    // 所有者
    abstract owner(): Option<ObjectId> | undefined;
}

export class NamedObjectContext implements RawEncode{
    private m_obj_type: number;
    private m_obj_flags: number;
    private m_obj_type_code: ObjectTypeCode;

    constructor(obj_type: number, obj_flags: number){
        this.m_obj_type = obj_type;
        this.m_obj_flags = obj_flags;
        this.m_obj_type_code = number_2_obj_type_code(this.m_obj_type);
    }

    get obj_type_code(): ObjectTypeCode {
        return this.m_obj_type_code;
    }

    get obj_type():number{
        return this.m_obj_type;
    }

    get obj_flags():number{
        return this.m_obj_flags;
    }

    is_standard_object(): boolean{
        return this.obj_type<=16;
    }

    is_core_object(): boolean{
        return this.obj_type>=OBJECT_TYPE_CORE_START && this.obj_type<=OBJECT_TYPE_CORE_END;
    }

    is_dec_app_object(): boolean{
        return this.obj_type>=OBJECT_TYPE_DECAPP_START && this.obj_type<=OBJECT_TYPE_DECAPP_END;
    }

    has_flag(flag_pos: number):boolean{
        return (this.m_obj_flags & flag_pos)===flag_pos;
    }

    //
    // common
    //

    with_crypto(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_CTYPTO;
        return this;
    }

    has_crypto():boolean{
        return this.has_flag(OBJECT_FLAG_CTYPTO);
    }

    with_mut_body(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_MUT_BODY;
        return this;
    }

    has_mut_body():boolean{
        return this.has_flag(OBJECT_FLAG_MUT_BODY);
    }

    with_desc_signs(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_DESC_SIGNS;
        return this;
    }

    has_desc_signs():boolean{
        return this.has_flag(OBJECT_FLAG_DESC_SIGNS);
    }

    with_body_signs(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_BODY_SIGNS;
        return this;
    }

    has_body_signs():boolean{
        return this.has_flag(OBJECT_FLAG_BODY_SIGNS);
    }

    with_nonce(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_NONCE;
        return this;
    }

    has_nonce():boolean{
        return this.has_flag(OBJECT_FLAG_NONCE);
    }

    //
    // ObjectDesc
    //

    with_dec_id(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_DESC_ID;
        return this;
    }

    has_dec_id():boolean{
        return this.has_flag(OBJECT_FLAG_DESC_ID);
    }

    with_ref_objects(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_REF_OBJECTS;
        return this;
    }

    has_ref_objects():boolean{
        return this.has_flag(OBJECT_FLAG_REF_OBJECTS);
    }

    with_prev(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_PREV;
        return this;
    }

    has_prev():boolean{
        return this.has_flag(OBJECT_FLAG_PREV);
    }

    with_create_timestamp(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_CREATE_TIMESTAMP;
        return this;
    }

    has_create_time_stamp():boolean{
        return this.has_flag(OBJECT_FLAG_CREATE_TIMESTAMP);
    }

    with_create_time(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_CREATE_TIME;
        return this;
    }

    has_create_time():boolean{
        return this.has_flag(OBJECT_FLAG_CREATE_TIME);
    }

    with_expired_time(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_EXPIRED_TIME;
        return this;
    }

    has_expired_time():boolean{
        return this.has_flag(OBJECT_FLAG_EXPIRED_TIME);
    }

    //
    // OwnderObjectDesc/AreaObjectDesc/AuthorObjectDesc/PublicKeyObjectDesc
    //

    with_owner(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_OWNER;
        return this;
    }

    has_owner():boolean{
        return this.has_flag(OBJECT_FLAG_OWNER);
    }

    with_area(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_AREA;
        return this;
    }

    has_area():boolean{
        return this.has_flag(OBJECT_FLAG_AREA);
    }


    with_public_key(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_PUBLIC_KEY;
        return this;
    }

    has_public_key():boolean{
        return this.has_flag(OBJECT_FLAG_PUBLIC_KEY);
    }

    with_author(): NamedObjectContext{
        this.m_obj_flags = this.m_obj_flags | OBJECT_FLAG_AUTHOR;
        return this;
    }

    has_author():boolean{
        return this.has_flag(OBJECT_FLAG_AUTHOR);
    }

    raw_measure(): BuckyResult<number>{
        return Ok(4);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        // obj type
        {
            const d = new BuckyNumber("u16", this.m_obj_type);
            const r = d.raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        // obj flags
        {
            const d = new BuckyNumber("u16", this.m_obj_flags);
            const r = d.raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }
}

export class NamedObjectContextDecoder extends RawHexDecode<NamedObjectContext>{
    constructor(){
        super();
    }

    raw_decode(buf: Uint8Array): BuckyResult<[NamedObjectContext,Uint8Array]>{
        // obj type
        let obj_type;
        {
            const r = new BuckyNumberDecoder("u16").raw_decode(buf);
            if(r.err){
                return r;
            }
            [obj_type, buf] = r.unwrap();
        }

        // obj flags
        let obj_flags;
        {
            const r = new BuckyNumberDecoder("u16").raw_decode(buf);
            if(r.err){
                return r;
            }
            [obj_flags, buf] = r.unwrap();
        }

        const ret:[NamedObjectContext, Uint8Array] = [new NamedObjectContext(obj_type.toNumber(), obj_flags.toNumber()), buf];

        return Ok(ret);
    }
}

export enum BodyContentFormat{
    Typed = 0,
    Buffer = 1
}

/**
 * NamedObject的可变Body部分的建构器
 */
export class ObjectMutBodyBuilder<
    DC extends DescContent,
    BC extends BodyContent
>{
    private m_prev_version : Option<HashValue>;   // 上个版本的MutBody Hash
    private m_update_time : bigint;               // 时间戳
    private m_content : BC;                       // 根据不同的类型，可以有不同的MutBody
    private m_user_data : Option<Uint8Array>;     // 可以嵌入任意数据。（比如json?)
    private m_obj_type: number;

    constructor(obj_type:number, content : BC){
        this.m_prev_version = None;
        this.m_update_time = bucky_time_now();
        this.m_content = content;
        this.m_user_data = None;
        this.m_obj_type = obj_type;
    }

    update_time(value: bigint):ObjectMutBodyBuilder<DescContent, BC>{
        this.m_update_time = value;
        return this;
    }

    option_update_time(value: Option<bigint>):ObjectMutBodyBuilder<DC, BC>{
        if(value.is_some()){
            this.m_update_time = value.unwrap();
        }
        return this;
    }

    prev_version(value: HashValue):ObjectMutBodyBuilder<DC, BC>{
        this.m_prev_version = Some(value);
        return this;
    }

    option_prev_version(value: Option<HashValue>):ObjectMutBodyBuilder<DC, BC>{
        this.m_prev_version = value;
        return this;
    }

    user_data(value: Uint8Array):ObjectMutBodyBuilder<DC, BC>{
        this.m_user_data = Some(value);
        return this;
    }

    option_user_data(value: Option<Uint8Array>):ObjectMutBodyBuilder<DC, BC>{
        this.m_user_data = value;
        return this;
    }

    build():ObjectMutBody<DC, BC>{
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
    private m_prev_version : Option<HashValue>;   // 上个版本的MutBody Hash
    private m_update_time : bigint;               // 时间戳
    private m_content : BC;              // 根据不同的类型，可以有不同的MutBody
    private m_user_data : Option<Uint8Array>;     // 可以嵌入任意数据。（比如json?)
    private m_obj_type: number;
    private m_trace?:number;

    toString(){
        return `ObjectMutBody:{{ prev_version:${this.prev_version}, update_time:${this.update_time}, content:${this.content}, user_data: ... }}`;
    }

    constructor( obj_type: number, prev_version : Option<HashValue>, update_time : bigint, content : BC, user_data : Option<Uint8Array>){
        this.m_obj_type = obj_type;
        this.m_prev_version = prev_version;
        this.m_update_time = update_time;
        this.m_content = content;
        this.m_user_data = user_data;
    }

    set_trace_id(trace: number){
        this.m_trace = trace;
    }

    trace_id():number|undefined{
        return  this.m_trace;
    }

    convert_to<RBC extends BodyContent>(map:(t:BC)=>BuckyResult<RBC>):BuckyResult<ObjectMutBody<DC, RBC>>{

        const r = map(this.m_content);
        if(r.err){
            return r;
        }

        const content = r.unwrap();

        return Ok(new ObjectMutBodyBuilder<DC, RBC>(this.m_obj_type, content)
            .option_prev_version(this.prev_version())
            .update_time(this.update_time())
            .option_user_data(this.user_data())
            .build());
    }

    prev_version(): Option<HashValue> {
        return this.m_prev_version;
    }

    update_time(): bigint {
        return this.m_update_time;
    }

    content(): BC {
        return this.m_content
    }

    user_data(): Option<Uint8Array> {
        return this.m_user_data;
    }

    inc_update_time(value: bigint) {
        if (this.m_update_time < value) {
            this.m_update_time = value;
        } else {
            this.m_update_time += BigInt(1);
        }
    }

    set_update_time(value: bigint) {
        this.m_update_time = value;
    }

    set_userdata(user_data: Uint8Array) {
        this.m_user_data = Some(user_data);
        this.m_update_time = bucky_time_now();
    }

    raw_measure(): BuckyResult<number>{
        // body_flags:u8
        let bytes = 1;

        // prev_version
        if(this.m_prev_version.is_some()){
            const r = this.m_prev_version.unwrap().raw_measure();
            if(r.err){
                base_error("ObjectMutBody<B, O>::raw_measure/prev_version error:{}", r.err);
                return r;
            }
            bytes += r.unwrap();
        }

        // update_time u64
        bytes += 8;

        // content_len: u32
        if(this.m_content.body_content_type()===BodyContentFormat.Typed){
            bytes += 4;
        }

        // content
        {
            const r = this.m_content.raw_measure();
            if(r.err){
                base_error("ObjectMutBody<B, O>::raw_measure/m_content error:{}", r.err);
                return r;
            }
            bytes += r.unwrap();
        }

        // user_data(len+buffer)
        if(this.m_user_data.is_some()){
            const user_data = this.m_user_data.unwrap();
            const len = user_data.length;

            bytes += 8; // u64
            bytes += len;
        }else{
            // ignore
        }

        return Ok(bytes);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        // body_flags
        {
            let body_flags = 0;
            if(this.m_prev_version.is_some()){
                body_flags = body_flags | OBJECT_BODY_FLAG_PREV;
            }

            if(this.m_user_data.is_some()){
                body_flags  = body_flags | OBJECT_BODY_FLAG_USER_DATA;
            }

            buf[0] = body_flags;
            buf = buf.offset(1);
        }
        base_trace(`[body(${this.trace_id()})] raw_encode, body_flags, buf len:`, buf.length);

        // prev_version
        if(this.m_prev_version.is_some())
        {
            const r = this.m_prev_version.unwrap().raw_encode(buf);
            if(r.err){
                base_error!("ObjectMutBody<B, O>::raw_encode/prev_version error:{}", r.err);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[body(${this.trace_id()})] raw_encode, prev_version, buf len:`, buf.length);

        // update_time
        {
            const r = new BuckyNumber("u64", this.m_update_time).raw_encode(buf);
            if(r.err){
                base_error("ObjectMutBody<B, O>::raw_encode/update_time error:{}", r.err);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[body(${this.trace_id()})] raw_encode, update_time, buf len:`, buf.length);

        // content_len + content
        if(this.m_content.body_content_type()===BodyContentFormat.Buffer){
            const r = this.m_content.raw_encode(buf);
            if(r.err){
                base_error("ObjectMutBody<B, O>::raw_encode/content error:{}", r.err);
                return r;
            }
            buf = r.unwrap();
            base_trace(`[body(${this.trace_id()})] raw_encode, BodyContentFormat.Buffer, buf len:`, buf.length);
        }else{
            const len_ret = this.m_content.raw_measure();
            if(len_ret.err){
                base_error("ObjectMutBody<B, O>::raw_encode/content_raw_measure error:{}", len_ret.err);
                return len_ret;
            }
            const len = len_ret.unwrap();

            const len_encode_ret = new BuckyNumber("u32", len).raw_encode(buf);
            if(len_encode_ret.err){
                base_error("ObjectMutBody<B, O>::raw_encode/content_len error:{}", len_ret.err);
                return len_encode_ret;
            }
            buf = len_encode_ret.unwrap();
            base_trace(`[body(${this.trace_id()})] raw_encode, BodyContentFormat.Typed, len:${len}, buf len:`, buf.length);

            const r = this.m_content.raw_encode(buf);
            if(r.err){
                base_error("ObjectMutBody<B, O>::raw_encode/content error:{}", r.err);
                return r;
            }
            buf =  r.unwrap();
            base_trace(`[body(${this.trace_id()})] raw_encode, BodyContentFormat.Typed, m_content, buf len:`, buf.length);
        }


        // user_data
        if(this.m_user_data.is_some()){
            const user_data = this.m_user_data.unwrap();
            const len = user_data.length;

            // user_data_len: u64
            const len_encode_ret = new BuckyNumber("u64", len).raw_encode(buf);
            if(len_encode_ret.err){
                base_error("ObjectMutBody<B, O>::raw_encode/user_data_len error:{}", len_encode_ret.err);
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

    constructor(obj_type: number, content_decoder: BodyContentDecoder<BC>){
        this.content_decoder = content_decoder;
        this.obj_type = obj_type;
    }

    set_trace_id(trace: number){
        this.m_trace = trace;
    }

    trace_id():number|undefined{
        return  this.m_trace;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[ObjectMutBody<DC, BC>,Uint8Array]>{
        // body_flags
        const body_flags = buf[0];
        buf = buf.offset(1);
        base_trace(`[body(${this.trace_id()})] raw_decode, body_flags, buf len:`, buf.length);

        // prev_version
        let prev_version:Option<HashValue>;
        if((body_flags & OBJECT_BODY_FLAG_PREV) === OBJECT_BODY_FLAG_PREV){
            const r = new HashValueDecoder().raw_decode(buf);
            if(r.err){
                base_error("ObjectMutBody<B, O>::raw_decode/prev_version error:{}", r.err);
                return r;
            }
            let _prev_version;
            [_prev_version, buf] = r.unwrap();
            prev_version = Some(_prev_version);
        }else{
            prev_version = None;
        }
        base_trace(`[body(${this.trace_id()})] raw_decode, prev_version, buf len:`, buf.length);

        // update_time
        let update_time;
        {
            const r = new BuckyNumberDecoder("u64").raw_decode(buf);
            if(r.err){
                base_error("ObjectMutBody<B, O>::raw_decode/update_time error:{}", r.err);
                return r;
            }
            [update_time, buf] = r.unwrap();
        }
        base_trace(`[body(${this.trace_id()})] raw_decode, update_time, buf len:`, buf.length);

        // content_len
        if(this.content_decoder.body_content_type()===BodyContentFormat.Typed){
            const r = new BuckyNumberDecoder("u32").raw_decode(buf);
            if(r.err){
                base_error("ObjectMutBody<B, O>::raw_decode/_content_encode_len error:{}", r.err);
                return r;
            }
            let content_len;
            [content_len, buf] = r.unwrap();
            base_trace(`[body(${this.trace_id()})] raw_decode, BodyContentFormat.Typed, len:${content_len}, buf len:`, buf.length);
        }

        // content
        let content:BC;
        {
            const bd = this.content_decoder;
            const r = bd.raw_decode(buf);
            if(r.err){
                base_error("ObjectMutBody<B, O>::raw_decode/content error:{}", r.err);
                return r;
            }
            [content, buf] = r.unwrap();
        }
        base_trace(`[body(${this.trace_id()})] raw_decode, BodyContentFormat.Typed, content, buf len:`, buf.length);

        // user_data
        let user_data;
        if((body_flags & OBJECT_BODY_FLAG_USER_DATA)===OBJECT_BODY_FLAG_USER_DATA ){
            // user_data_len
            let user_data_len;
            const len_ret = new BuckyNumberDecoder("u64").raw_decode(buf);
            if(len_ret.err){
                base_error("ObjectMutBody<B, O>::raw_decode/user_data len error:{}", len_ret.err);
                return len_ret;
            }
            [user_data_len, buf] = len_ret.unwrap();

            // user_data
            user_data = Some(buf.slice(0, user_data_len.toNumber()));
            buf = buf.offset(user_data_len.toNumber());
        }else{
            user_data = None;
        }
        base_trace(`[body(${this.trace_id()})] raw_decode, BodyContentFormat.Typed, user_data, buf len:`, buf.length);

        // 构造ObjMutBody
        const obj: ObjectMutBody<DC, BC>  =
            new ObjectMutBodyBuilder(this.obj_type, content)
            .option_prev_version(prev_version)
            .update_time(update_time.toBigInt())
            .option_user_data(user_data)
            .build();

        const result:[ObjectMutBody<DC, BC>, Uint8Array] = [obj, buf];

        return Ok(result);
    }
}

/**
 * NamedObject 的签名建构器
 */
export class ObjectSignsBuilder{
    private desc_signs : Option<Vec<Signature>>;
    private body_signs : Option<Vec<Signature>>;

    constructor(){
        this.desc_signs = None;
        this.body_signs = None;
    }

    // 重置desc签名
    reset_desc_sign(sign: Signature):ObjectSignsBuilder {
        this.desc_signs = Some(new Vec([sign]));
        return this;
    }

    // 重置body签名
    reset_body_sign(sign: Signature):ObjectSignsBuilder {
        this.desc_signs = Some(new Vec([sign]));
        return this;
    }

    // 追加desc签名
    push_desc_sign(sign: Signature):ObjectSignsBuilder {
        if(this.desc_signs.is_some()){
            this.desc_signs.map( signs=>{
                signs.value().push(sign);
                return signs;
            });
        }else{
            this.desc_signs = Some(new Vec([sign]));
        }
        return this;
    }

    // 追加body签名
    push_body_sign(sign: Signature):ObjectSignsBuilder {
        if(this.body_signs.is_some()){
            this.body_signs.map( signs=>{
                signs.value().push(sign);
                return signs;
            });
        }else{
            this.body_signs = Some(new Vec([sign]));
        }
        return this;
    }

    build(): ObjectSigns{
        return new ObjectSigns(this.desc_signs, this.body_signs);
    }
}

/**
 * NamedObject 的签名部分
 */
export class ObjectSigns implements RawEncode {
    // 对Desc部分的签名，可以是多个，sign结构有的时候需要说明是“谁的签名”
    // 表示对Desc内容的认可。
    private m_desc_signs : Option<Vec<Signature>>;

    // 对MutBody部分的签名，可以是多个。依赖MutBody的稳定编码
    private m_body_signs : Option<Vec<Signature>>;

    constructor(desc_signs : Option<Vec<Signature>>, body_signs : Option<Vec<Signature>>){
        this.m_desc_signs = desc_signs;
        this.m_body_signs = body_signs;
    }

    desc_signs():Option<Signature[]>{
        if(this.m_desc_signs.is_some()){
            return Some(this.m_desc_signs.unwrap().value());
        }else{
            return None;
        }
    }

    body_signs():Option<Signature[]>{
        if(this.m_body_signs.is_some()){
            return Some(this.m_body_signs.unwrap().value());
        }else{
            return None;
        }
    }

    // 重置desc签名
    reset_desc_sign(sign: Signature) {
        this.m_desc_signs = Some(new Vec([sign]));
    }

    // 重置body签名
    reset_body_sign(sign: Signature) {
        this.m_desc_signs = Some(new Vec([sign]));
    }

    // 追加desc签名
    push_desc_sign(sign: Signature) {
        if(this.m_desc_signs.is_some()){
            this.m_desc_signs.map( signs=>{
                signs.value().push(sign);
                return signs;
            });
        }else{
            this.m_desc_signs = Some(new Vec([sign]));
        }
    }

    // 追加body签名
    push_body_sign(sign: Signature) {
        if(this.m_body_signs.is_some()){
            this.m_body_signs.map( signs=>{
                signs.value().push(sign);
                return signs;
            });
        }else{
            this.m_body_signs = Some(new Vec([sign]));
        }
    }

    // 最后的desc签名时间
    latest_desc_sign_time():bigint{
        let latest_time = BigInt(0);
        if(this.m_desc_signs.is_some()){
            const signs = this.m_desc_signs.unwrap();
            for(const sign of signs.value()){
                if(latest_time<sign.sign_time){
                    latest_time = sign.sign_time;
                }
            }
        }
        return latest_time;
    }

    // 最后的body签名时间
    latest_body_sign_time():bigint{
        let latest_time = BigInt(0);
        if(this.m_body_signs.is_some()){
            const signs = this.m_body_signs.unwrap();
            for(const sign of signs.value()){
                if(latest_time<sign.sign_time){
                    latest_time = sign.sign_time;
                }
            }
        }
        return latest_time;
    }

    raw_measure(ctx: NamedObjectContext): BuckyResult<number>{
        let bytes = 0;

        if(this.m_desc_signs.is_some()){
            ctx.with_desc_signs();
            const r = this.m_desc_signs.unwrap().raw_measure();
            if(r.err){
                base_error!("ObjectSigns::raw_measure_with_context/desc_signs error:{}", r.err);
                return r;
            }
            bytes += r.unwrap();
        }

        if(this.m_body_signs.is_some()){
            ctx.with_body_signs();
            const r = this.m_body_signs.unwrap().raw_measure();
            if(r.err){
                base_error!("ObjectSigns::raw_measure_with_context/desc_signs error:{}", r.err);
                return r;
            }
            bytes += r.unwrap();
        }

        return Ok(bytes);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        if(this.m_desc_signs.is_some()){
            const r = this.m_desc_signs.unwrap().raw_encode(buf);
            if(r.err){
                base_error!("ObjectSigns::raw_measure_with_context/desc_signs error:{}", r.err);
                return r;
            }
            buf = r.unwrap();
        }

        if(this.m_body_signs.is_some()){
            const r = this.m_body_signs.unwrap().raw_encode(buf);
            if(r.err){
                base_error!("ObjectSigns::raw_measure_with_context/desc_signs error:{}", r.err);
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }

    static default():ObjectSigns{
        return new ObjectSigns(None, None);
    }
}

/**
 * NamedObject 的签名解码器
 */
export class ObjectSignsDecoder implements RawDecode<ObjectSigns> {
    raw_decode(buf: Uint8Array, ctx: NamedObjectContext): BuckyResult<[ObjectSigns, Uint8Array]>{
        let desc_signs;
        if(ctx.has_desc_signs()){
            const r = new VecDecoder<Signature>( new SignatureDecoder()).raw_decode(buf);
            if(r.err){
                base_error("ObjectSigns::raw_decode_with_context/desc_signs error:{}", r.err);
                return r;
            }
            let _desc_signs;
            [_desc_signs, buf] = r.unwrap();
            desc_signs = Some(_desc_signs);
        }else{
            desc_signs = None;
        }

        let body_signs;
        if(ctx.has_body_signs()){
            const r = new VecDecoder<Signature>( new SignatureDecoder()).raw_decode(buf);
            if(r.err){
                base_error("ObjectSigns::raw_decode_with_context/body_signs error:{}", r.err);
                return r;
            }
            let _body_signs;
            [_body_signs, buf] = r.unwrap();
            body_signs = Some(_body_signs);
        }else{
            body_signs = None;
        }

        const signs = new ObjectSigns(desc_signs, body_signs);
        const result:[ObjectSigns, Uint8Array] = [signs, buf];

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

    constructor(obj_type:number, object_id: ObjectId){
        this.obj_type = obj_type;
        this.m_object_id = object_id;
    }

    get object_id(){
        return this.m_object_id!;
    }

    hashCode(): symbol{
        return this.m_object_id!.hashCode();
    }

    equals<ODC extends DescContent, OBC extends BodyContent>(other: NamedObjectId<ODC, OBC>): boolean{
        if(this.obj_type!==other.obj_type) return false;
        return this.m_object_id!.equals(other.object_id!);
    }

    // 转移所有权
    into():ObjectId{
        const obj_id = this.object_id;
        this.m_object_id = undefined;
        return obj_id;
    }

    gen(object_id: ObjectId){
        const hash_value = object_id.as_slice();
        if(!is_standard_object(this.obj_type)){
            // 用户类型
            // 4个可用flag
            let type_code;
            if(is_dec_app_object(this.obj_type)) {
                // 这是一个dec app 对象
                type_code = parseInt("110000",2);
            }else{
                // 这是一个core 对象
                type_code = parseInt("100000",2);
            };

            // 前 6 bit 写入类型信息
            hash_value[0] = type_code<<2;
        }else{
            // 标准类型
            const type_code = this.obj_type;

            hash_value[0] = parseInt("01000000",2) | (type_code<<4>>2);
        }
    }

    toString():string{
        return `(ObjectId: ${this.object_id.toString()}, obj_type:${this.obj_type})`;
    }

    toJSON():string {
        return this.to_base_58();
    }

    to_string():string{
        return `(ObjectId: ${this.object_id.toString()}, obj_type:${this.obj_type})`;
    }

    to_base_58():string{
        return this.object_id.to_base_58();
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        return this.object_id.raw_measure();
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        return this.object_id.raw_encode(buf);
    }
}

export function named_id_gen_default<
    DC extends DescContent,
    BC extends BodyContent,
>(obj_type: number):NamedObjectId<DC, BC>{

    const id = ObjectId.default();
    const named_id = new NamedObjectId<DC, BC>(obj_type, id);
    const hash_value = id.as_slice();
    if(!is_standard_object(obj_type)){
        // 用户类型
        // 4个可用flag
        let type_code;
        if(is_dec_app_object(obj_type)) {
            // 这是一个dec app 对象
            type_code = parseInt("110000",2);
        }else{
            // 这是一个core 对象
            type_code = parseInt("100000",2);
        };

        // 前 6 bit 写入类型信息
        hash_value[0] = type_code<<2;
    }else{
        // 标准类型
        const type_code = obj_type;

        hash_value[0] = parseInt("01000000",2) | (type_code<<4>>2);
    }
    return named_id;
}

export function named_id_from_base_58<
    DC extends DescContent,
    BC extends BodyContent
>(obj_type: number, s: string):BuckyResult<NamedObjectId<DC, BC>>{
    const r = ObjectId.from_base_58(s);
    if (r.err) {
        return r;
    }

    return Ok(new NamedObjectId<DC, BC>(obj_type, r.unwrap()));
}

export function named_id_try_from_object_id<
    DC extends DescContent,
    BC extends BodyContent
>(obj_type: number, id: ObjectId):BuckyResult<NamedObjectId<DC, BC>>{

    const obj_type_code = number_2_obj_type_code(obj_type);

    const r = id.obj_type_code();
    if(r.is_none()){
        return Err(new BuckyError(
            BuckyErrorCode.InvalidParam,
            `try convert from object id to named object id failed, get id obj_type_code failed, expect obj_type_code is:${obj_type_code}`
        ));
    }
    const code = r.unwrap();

    if(code===obj_type_code){
        return Ok(new NamedObjectId(obj_type, id));
    }else{
        return Err(new BuckyError(
            BuckyErrorCode.InvalidParam,
            `try convert from object id to named object id failed, mismatch obj_type_code, expect obj_type_code is: ${obj_type_code}, current obj_type_code is:${code}`
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
    constructor(obj_type: number){
        this.m_obj_type = obj_type;
    }

    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[NamedObjectId<DC, BC>, Uint8Array]>{

        // id
        let id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                base_error("decode NamedObjectId/object_id failed, err:{}", r.err);
                return r;
            }
            [id, buf] = r.unwrap();
        }

        // named_id
        let named_id;
        {
            const r = named_id_try_from_object_id<DC, BC>(this.m_obj_type, id);
            if(r.err){
                return r;
            }

            named_id = r.unwrap();
        }

        const result:[NamedObjectId<DC, BC>, Uint8Array] = [named_id, buf];

        return Ok(result);
    }
}

// NamedObject Implement
export enum DescContentFormat{
    Typed = 0,
    Buffer = 1
};

export interface SubDescType{
     // 是否有主，
     // "disable": 禁用，
     // "option": 可选
    owner_type: "disable"|"option",

    // 是否有区域信息，
    // "disable": 禁用，
    // "option": 可选
    area_type: "disable"|"option",

    // 是否有作者，
    // "disable": 禁用，
    // "option": 可选
    author_type: "disable"|"option",

    // 公钥类型，
    // "disable": 禁用，
    // "single_key": 单PublicKey，
    // "mn_key": M-N 公钥对,
    // "any": 任意类型(内部用)
    key_type: "disable"|"single_key"|"mn_key"|"any"
};

export abstract class DescTypeInfo {
    desc_content_format(): DescContentFormat{
        return DescContentFormat.Typed;
    }

    get_sub_obj_type(): number {
        return this.obj_type();
    }

    set_sub_obj_type(v: number) {
        //
    }

    abstract obj_type() : number;
    abstract sub_desc_type(): SubDescType;
}

export abstract class DescContent implements RawEncode {
    abstract type_info():DescTypeInfo;
    abstract raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number>;
    abstract raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array>;
}

export abstract class DescContentDecoder<T extends DescContent> implements RawDecode<T> {
    abstract type_info():DescTypeInfo;
    abstract raw_decode(buf: Uint8Array): BuckyResult<[T, Uint8Array]>;
}

export abstract class BodyContent implements RawEncode{
    body_content_type():BodyContentFormat{
        return BodyContentFormat.Typed;
    }
    abstract raw_measure(): BuckyResult<number>;
    abstract raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>;
}

export abstract class BodyContentDecoder<T extends BodyContent> implements RawDecode<T> {
    body_content_type():BodyContentFormat{
        return BodyContentFormat.Typed;
    }
    abstract raw_decode(buf: Uint8Array): BuckyResult<[T, Uint8Array]>;
}


export class NamedObjectDescBuilder<T extends DescContent> {
    private m_dec_id : Option<ObjectId>;
    private m_ref_objects: Option<Vec<ObjectLink>>;
    private m_prev : Option<ObjectId>;
    private m_create_timestamp : Option<HashValue>;
    private m_create_time : Option<bigint>;
    private m_expired_time : Option<bigint>;
    private m_owner: Option<ObjectId|undefined>;
    private m_area: Option<Area|undefined>;
    private m_author: Option<ObjectId|undefined>;
    private m_public_key: Option<PublicKey|MNPublicKey|undefined>;
    private m_desc_content: T;

    constructor(obj_type: number, desc_content: T){
        this.m_dec_id = None;
        this.m_ref_objects = None;
        this.m_prev = None;
        this.m_create_timestamp = None;
        this.m_create_time = Some(bucky_time_now());
        this.m_expired_time = None;

        this.m_desc_content = desc_content;
        const sub_desc_type = desc_content.type_info().sub_desc_type();

        switch(sub_desc_type.owner_type){
            case "option":{
                this.m_owner = None;
                break;
            }
            default:{
                this.m_owner = Some(undefined);
            }
        }

        switch(sub_desc_type.area_type){
            case "option":{
                this.m_area = None;
                break;
            }
            default:{
                this.m_area = Some(undefined);
            }
        }

        switch(sub_desc_type.author_type){
            case "option":{
                this.m_author = None;
                break;
            }
            default:{
                this.m_author = Some(undefined);
            }
        }

        switch(sub_desc_type.key_type){
            case "single_key":{
                this.m_public_key = None;
                break;
            }
            case "mn_key":{
                this.m_public_key = None;
                break;
            }
            default:{
                this.m_public_key = Some(undefined);
            }
        }
    }

    // ObjectDesc

    dec_id(value: ObjectId): NamedObjectDescBuilder<T>{
        this.m_dec_id = Some(value);
        return this;
    }

    option_dec_id(value: Option<ObjectId>): NamedObjectDescBuilder<T>{
        this.m_dec_id = value;
        return this;
    }

    ref_objects(value: Vec<ObjectLink>): NamedObjectDescBuilder<T>{
        this.m_ref_objects = Some(value);
        return this;
    }

    option_ref_objects(value: Option<Vec<ObjectLink>>): NamedObjectDescBuilder<T>{
        this.m_ref_objects = value;
        return this;
    }

    prev(value: ObjectId): NamedObjectDescBuilder<T>{
        this.m_prev = Some(value);
        return this;
    }

    option_prev(value: Option<ObjectId>): NamedObjectDescBuilder<T>{
        this.m_prev = value;
        return this;
    }

    create_timestamp(value: HashValue): NamedObjectDescBuilder<T>{
        this.m_create_timestamp = Some(value);
        return this;
    }

    option_create_timestamp(value: Option<HashValue>): NamedObjectDescBuilder<T>{
        this.m_create_timestamp = value;
        return this;
    }

    create_time(value: bigint): NamedObjectDescBuilder<T>{
        this.m_create_time = Some(value);
        return this;
    }

    option_create_time(value: Option<bigint>): NamedObjectDescBuilder<T>{
        this.m_create_time = value;
        return this;
    }

    expired_time(value: bigint): NamedObjectDescBuilder<T>{
        this.m_expired_time = Some(value);
        return this;
    }

    option_expired_time(value: Option<bigint>): NamedObjectDescBuilder<T>{
        this.m_expired_time = value;
        return this;
    }

    // Owner/Area/Author/PublicKey
    owner(value: ObjectId):NamedObjectDescBuilder<T> {
        switch(this.m_desc_content.type_info().sub_desc_type().owner_type){
            case "option":{
                this.m_owner = Some(value);
                break;
            }
        }
        return this;
    }

    option_owner(value: Option<ObjectId>):NamedObjectDescBuilder<T> {
        switch(this.m_desc_content.type_info().sub_desc_type().owner_type){
            case "option":{
                this.m_owner = value;
                break;
            }
        }
        return this;
    }

    area(value: Area):NamedObjectDescBuilder<T> {
        switch(this.m_desc_content.type_info().sub_desc_type().area_type){
            case "option":{
                this.m_area = Some(value);
                break;
            }
        }
        return this;
    }

    option_area(value: Option<Area>):NamedObjectDescBuilder<T> {
        switch(this.m_desc_content.type_info().sub_desc_type().area_type){
            case "option":{
                this.m_area = value;
                break;
            }
        }
        return this;
    }

    author(value: ObjectId):NamedObjectDescBuilder<T> {
        switch(this.m_desc_content.type_info().sub_desc_type().author_type){
            case "option":{
                this.m_author = Some(value);
                break;
            }
        }
        return this;
    }

    option_author(value: Option<ObjectId>):NamedObjectDescBuilder<T> {
        switch(this.m_desc_content.type_info().sub_desc_type().author_type){
            case "option":{
                this.m_author = value;
                break;
            }
        }
        return this;
    }

    single_key(value: PublicKey):NamedObjectDescBuilder<T> {
        switch(this.m_desc_content.type_info().sub_desc_type().key_type){
            case "single_key":{
                this.m_public_key = Some(value);
                break;
            }
        }
        return this;
    }

    option_single_key(value: Option<PublicKey>):NamedObjectDescBuilder<T> {
        switch(this.m_desc_content.type_info().sub_desc_type().key_type){
            case "single_key":{
                this.m_public_key = value;
                break;
            }
        }
        return this;
    }

    mn_key(value: MNPublicKey):NamedObjectDescBuilder<T> {
        switch(this.m_desc_content.type_info().sub_desc_type().key_type){
            case "mn_key":{
                this.m_public_key = Some(value);
                break;
            }
        }
        return this;
    }

    option_mn_key(value: Option<MNPublicKey>):NamedObjectDescBuilder<T> {
        switch(this.m_desc_content.type_info().sub_desc_type().key_type){
            case "mn_key":{
                this.m_public_key = value;
                break;
            }
        }
        return this;
    }

    option_key(value: Option<PublicKey|MNPublicKey|undefined>):NamedObjectDescBuilder<T> {
        switch(this.m_desc_content.type_info().sub_desc_type().key_type){
            case "single_key":
            case "mn_key":{
                this.m_public_key = value;
                break;
            }
        }
        return this;
    }

    key(value: PublicKey|MNPublicKey|undefined):NamedObjectDescBuilder<T> {
        switch(this.m_desc_content.type_info().sub_desc_type().key_type){
            case "single_key":
            case "mn_key":{
                this.m_public_key = Some(value);
                break;
            }
        }
        return this;
    }

    build():NamedObjectDesc<T> {

        const get = (o:any)=>{
            if(o.is_some()){
                const obj = o.unwrap();
                if(obj){
                    return Some(obj);
                }else{
                    return undefined;
                }
            }else{
                return undefined;
            }
        }

        const owner:Option<ObjectId>|undefined = get(this.m_owner);

        const area:Option<Area>|undefined = get(this.m_area);

        const author:Option<ObjectId>|undefined = get(this.m_author);

        return new NamedObjectDesc(
            this.m_dec_id,
            this.m_ref_objects,
            this.m_prev,
            this.m_create_timestamp,
            this.m_create_time,
            this.m_expired_time,
            this.m_desc_content,
            owner,
            area,
            author,
            this.m_public_key.unwrap(),
        );
    }
}

export class NamedObjectDesc<T extends DescContent> extends ObjectDesc implements RawEncode{
    // 基本部分 ObjectDesc
    private m_dec_id : Option<ObjectId>;
    private m_ref_objects: Option<Vec<ObjectLink>>;
    private m_prev : Option<ObjectId>;
    private m_create_timestamp : Option<HashValue>;
    private m_create_time : Option<bigint>;
    private m_expired_time : Option<bigint>;
    private m_owner?: Option<ObjectId>;
    private m_area?: Option<Area>;
    private m_author?: Option<ObjectId>;
    private m_public_key?: PublicKey|MNPublicKey;
    private m_desc_content: T;
    private m_trace: number;

    constructor(
        dec_id : Option<ObjectId>,
        ref_objects: Option<Vec<ObjectLink>>,
        prev : Option<ObjectId>,
        create_timestamp : Option<HashValue>,
        create_time : Option<bigint>,
        expired_time : Option<bigint>,

        // desc content
        desc_content: T,

        // sub desc
        owner?: Option<ObjectId>,
        area?: Option<Area>,
        author?: Option<ObjectId>,
        public_key?: PublicKey|MNPublicKey,
    ){
        super(desc_content.type_info().get_sub_obj_type());
        this.m_dec_id = dec_id;
        this.m_ref_objects = ref_objects;
        this.m_prev = prev;
        this.m_create_timestamp = create_timestamp;
        this.m_create_time = create_time;
        this.m_expired_time = expired_time;

        this.m_desc_content = desc_content;

        const sub_desc_type = desc_content.type_info().sub_desc_type();

        switch(sub_desc_type.owner_type){
            case "option":{
                this.m_owner = owner!;
                break;
            }
        }

        switch(sub_desc_type.area_type){
            case "option":{
                this.m_area = area!;
                break;
            }
        }

        switch(sub_desc_type.author_type){
            case "option":{
                this.m_author = author!;
                break;
            }
        }

        switch(sub_desc_type.key_type){
            case "any":{
                this.m_public_key = public_key;
                break;
            }
            case "single_key":{
                this.m_public_key = public_key! as PublicKey;
                if(this.m_public_key==null){
                    throw Error("single_key can not be null");
                }
                break;
            }
            case "mn_key":{
                this.m_public_key = public_key! as MNPublicKey;
                if(this.m_public_key==null){
                    throw Error("mn_key can not be null");
                }
                break;
            }
        }

        this.m_trace = Math.floor(Math.random() * Math.floor(65535));
    }

    trace_id():number{
        return this.m_trace;
    }

    convert_to<U extends DescContent>(map:(t:T)=>BuckyResult<U>):BuckyResult<NamedObjectDesc<U>>{

        const u = map(this.m_desc_content);
        if(u.err){
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
            .option_owner(this.owner()??None)
            .option_area(this.area()??None)
            .option_author(this.author()??None)
            .key(this.m_public_key)
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

    dec_id(): Option<ObjectId>  {
        return this.m_dec_id;
    }

    ref_objs(): Option<Vec<ObjectLink>> {
        return this.m_ref_objects;
    }

    prev(): Option<ObjectId> {
        return this.m_prev;
    }

    create_timestamp(): Option<HashValue> {
        return this.m_create_timestamp;
    }

    create_time(): bigint {
        if(this.m_create_time.is_some()){
            return this.m_create_time.unwrap();
        }else{
            return BigInt(0);
        }
    }

    expired_time(): Option<bigint> {
        return this.m_expired_time;
    }

    calculate_id(): ObjectId{
        const t: RawEncode & ObjectDesc = this;

        let area;
        if(this.m_area!=null){
            area = this.m_area!;
        }else{
            area = None;
        }

        const has_single_key = this.public_key()!=null;
        const has_mn_key = this.mn_key()!=null;
        const has_owner = this.owner()==null?false:this.owner()!.is_some();

        return new ObjectIdBuilder(t, this.obj_type_code())
            .area(area)
            .single_key(has_single_key)
            .mn_key(has_mn_key)
            .owner(has_owner)
            .build();
    }

    //
    // other Desc
    //

    owner(): Option<ObjectId>|undefined{
        return this.m_owner;
    }

    area(): Option<Area>|undefined{
        return this.m_area;
    }

    author(): Option<ObjectId>|undefined{
        return this.m_author;
    }

    public_key(): PublicKey|undefined {
        if(this.m_public_key==null){
            return undefined;
        }

        if(this.m_public_key!.threshold<0){
            return this.m_public_key as PublicKey;
        }

        return undefined;
    }

    mn_key(): MNPublicKey|undefined {
        if(this.m_public_key==null){
            return undefined;
        }

        if(this.m_public_key!.threshold<0){
            return undefined;
        }

        return this.m_public_key as MNPublicKey;
    }

    //
    // Encode
    //

    raw_measure(_ctx?:NamedObjectContext, purpose?: RawEncodePurpose): BuckyResult<number>{
        let size = 0;

        let ctx;
        if(_ctx){
            ctx = _ctx;
        }else{
            ctx = new NamedObjectContext(this.m_desc_content.type_info().get_sub_obj_type(), 0);
            size += ctx.raw_measure().unwrap();
        }

        size += this.raw_measure_with_context(ctx, purpose).unwrap();
        return Ok(size);
    }

    raw_measure_with_context(ctx:NamedObjectContext, purpose?: RawEncodePurpose): BuckyResult<number>{
        let size = 0;

        //
        // ObjectDesc
        //
        if(this.m_dec_id.is_some()){
            ctx.with_dec_id();
            const r = this.m_dec_id.unwrap().raw_measure();
            if(r.err){
                base_error("NamedObjectDesc::raw_measure/dec_id error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            size += r.unwrap();
        }

        if(this.m_ref_objects.is_some()){
            ctx.with_ref_objects();
            const r = this.m_ref_objects.unwrap().raw_measure();
            if(r.err){
                base_error("NamedObjectDesc::raw_measure/ref_objects error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            size += r.unwrap();
        }

        if(this.m_prev.is_some()){
            ctx.with_prev();
            const r = this.m_prev.unwrap().raw_measure();
            if(r.err){
                base_error("NamedObjectDesc::raw_measure/m_prev error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            size += r.unwrap();
        }

        if(this.m_create_timestamp.is_some()){
            ctx.with_create_timestamp();
            const r = this.m_create_timestamp.unwrap().raw_measure();
            if(r.err){
                base_error("NamedObjectDesc::raw_measure/m_create_timestamp error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            size += r.unwrap();
        }

        if(this.m_create_time.is_some()){
            ctx.with_create_time();
            size += 8; // u64
        }

        if(this.m_expired_time.is_some()){
            ctx.with_expired_time(); // u64
            size += 8;
        }

        //
        // OwnderObjectDesc/AreaObjectDesc/AuthorObjectDesc/PublicKeyObjectDesc
        //
        if(this.m_owner&&this.m_owner!.is_some()){
            ctx.with_owner();
            const r = this.m_owner!.unwrap().raw_measure();
            if(r.err){
                base_error("NamedObjectDesc::raw_measure/m_owner error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            size += r.unwrap();
        }

        if(this.m_area&&this.m_area!.is_some()){
            ctx.with_area();
            const r = this.m_area!.unwrap().raw_measure();
            if(r.err){
                base_error("NamedObjectDesc::raw_measure/m_area error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            size += r.unwrap();
        }

        if(this.m_author&&this.m_author!.is_some()){
            ctx.with_author();
            const r = this.m_author!.unwrap().raw_measure();
            if(r.err){
                base_error("NamedObjectDesc::raw_measure/m_author error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            size += r.unwrap();
        }

        if(this.m_public_key){
            ctx.with_public_key();
            const r = this.m_public_key!.raw_measure();
            if(r.err){
                base_error("NamedObjectDesc::raw_measure/m_public_key error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            size += 1; // u8 key_type
            size += r.unwrap();
        }

        //
        // desc content length
        //
        if(this.m_desc_content.type_info().desc_content_format()===DescContentFormat.Typed){
            size += 2;
        }

        // desc content
        {
            const r = this.m_desc_content!.raw_measure(undefined, purpose);
            if(r.err){
                base_error("NamedObjectDesc::raw_measure/m_desc_content error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            size += r.unwrap();
        }

        return Ok(size);
    }

    raw_encode(buf: Uint8Array, _ctx?:NamedObjectContext, purpose?: RawEncodePurpose): BuckyResult<Uint8Array>{
        if(_ctx){
            return this.raw_encode_with_context(buf, _ctx, purpose);
        }else{
            // base_trace("this.m_desc_content.type_info():", this.m_desc_content.type_info().obj_type());
            const ctx = new NamedObjectContext(this.m_desc_content.type_info().get_sub_obj_type(), 0);
            {
                const r = this.raw_measure_with_context(ctx, purpose);
                if(r.err){
                    return r;
                }
            }

            {
                const r = ctx.raw_encode(buf);
                if(r.err){
                    return r;
                }
                buf = r.unwrap();
            }
            return this.raw_encode_with_context(buf, ctx, purpose);
        }
    }

    raw_encode_with_context(buf: Uint8Array, ctx:NamedObjectContext, purpose?: RawEncodePurpose): BuckyResult<Uint8Array>{
        {
            const r = this.raw_measure(ctx, purpose);
            if(r.err){
                return r;
            }
        }

        //
        // ObjectDesc
        //
        if(this.m_dec_id.is_some()){
            const r = this.m_dec_id.unwrap().raw_encode(buf);
            if(r.err){
                base_error("NamedObjectDesc::raw_encode/dec_id error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_dec_id :`, buf.length);

        if(this.m_ref_objects.is_some()){
            const r = this.m_ref_objects.unwrap().raw_encode(buf);
            if(r.err){
                base_error("NamedObjectDesc::raw_encode/ref_objects error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_ref_objects :`, buf.length);

        if(this.m_prev.is_some()){
            const r = this.m_prev.unwrap().raw_encode(buf);
            if(r.err){
                base_error("NamedObjectDesc::raw_encode/m_prev error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_prev :`, buf.length);

        if(this.m_create_timestamp.is_some()){
            const r = this.m_create_timestamp.unwrap().raw_encode(buf);
            if(r.err){
                base_error("NamedObjectDesc::raw_encode/m_create_timestamp error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_create_timestamp :`, buf.length);

        if(this.m_create_time.is_some()){
            const r = new BuckyNumber("u64", this.m_create_time.unwrap()).raw_encode(buf);
            if(r.err){
                base_error("NamedObjectDesc::raw_encode/m_create_time error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            buf = r.unwrap();
        }
        base_trace("[desc] raw_encode, buffer len m_create_time :", buf.length);

        if(this.m_expired_time.is_some()){
            const r = new BuckyNumber("u64", this.m_expired_time.unwrap()).raw_encode(buf);
            if(r.err){
                base_error("NamedObjectDesc::raw_encode/m_expired_time error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_expired_time :`, buf.length);

        //
        // OwnderObjectDesc/AreaObjectDesc/AuthorObjectDesc/PublicKeyObjectDesc
        //
        if(this.m_owner&&this.m_owner!.is_some()){
            const r = this.m_owner!.unwrap().raw_encode(buf);
            if(r.err){
                base_error("NamedObjectDesc::raw_encode/m_owner error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_owner :`, buf.length);

        if(this.m_area&&this.m_area!.is_some()){
            const r = this.m_area!.unwrap().raw_encode(buf);
            if(r.err){
                base_error("NamedObjectDesc::raw_encode/m_area error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_area :`, buf.length);

        if(this.m_author&&this.m_author!.is_some()){
            const r = this.m_author!.unwrap().raw_encode(buf);
            if(r.err){
                base_error("NamedObjectDesc::raw_encode/m_author error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_author :`, buf.length);

        if(this.m_public_key){

            let key_type:number;
            if(this.m_public_key!.threshold<0){
                key_type = OBJECT_PUBLIC_KEY_SINGLE;
            }else{
                key_type = OBJECT_PUBLIC_KEY_MN;
            }
            buf[0] = key_type;
            buf = buf.offset(1);

            const r = this.m_public_key!.raw_encode(buf);
            if(r.err){
                base_error("NamedObjectDesc::raw_encode/m_public_key error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_public_key :`, buf.length);

        //
        // desc content
        //
        if(this.m_desc_content.type_info().desc_content_format()===DescContentFormat.Typed){
            // calc desc_content_size
            let desc_content_size = 0;
            {
                const r = this.m_desc_content.raw_measure(undefined, purpose);
                if(r.err){
                    base_error("NamedObjectDesc::raw_encode/m_desc_content raw_measure error:{}, obj_type:{}, obj_type_code:{:?}",
                        r.err, this.obj_type(), this.obj_type_code());
                    return r;
                }
                desc_content_size += r.unwrap();
                if(desc_content_size>65535){
                    return Err(new BuckyError(BuckyErrorCode.InvalidData, "NamedObjectDesc::raw_encode/desc_content_size, length over flow"));
                }
            }

            // encode desc_content_size
            {
                const r = new BuckyNumber("u16", desc_content_size).raw_encode(buf);
                if(r.err){
                    base_error("NamedObjectDesc::raw_encode/m_expired_time error:{}, obj_type:{}, obj_type_code:{:?}",
                        r.err, this.obj_type(), this.obj_type_code());
                    return r;
                }
                buf = r.unwrap();
            }
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_desc_content length :`, buf.length);

        // desc_content
        {
            const r = this.m_desc_content.raw_encode(buf, undefined, purpose);
            if(r.err){
                base_error("NamedObjectDesc::raw_encode/m_desc_content error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.obj_type(), this.obj_type_code());
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_encode, buffer len m_desc_content :`, buf.length);

        return Ok(buf);
    }
}

export class NamedObjectDescDecoder<T extends DescContent> implements RawDecode<NamedObjectDesc<T>>{
    private readonly m_desc_content_decoder: DescContentDecoder<T>;
    private m_trace: number;
    constructor(desc_content_decoder: DescContentDecoder<T>){
        this.m_desc_content_decoder = desc_content_decoder;
        this.m_trace = Math.floor(Math.random() * Math.floor(65535));
    }

    trace_id():number{
        return this.m_trace;
    }

    raw_decode(buf: Uint8Array, _ctx?:NamedObjectContext): BuckyResult<[NamedObjectDesc<T>, Uint8Array]>{

        // decode with/without ctx
        let ctx: NamedObjectContext;
        if(_ctx){
            ctx = _ctx;
        }else{
            const r = new NamedObjectContextDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [ctx, buf] = r.unwrap();
        }

        //
        // ObjectDesc
        //
        let dec_id:Option<ObjectId>;
        if(ctx.has_dec_id())
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                base_error!("NamedObjectDesc::raw_decode_with_context/dec_id error:{}", r.err);
                return r;
            }
            const [_value, _buf] = r.unwrap();
            [dec_id, buf] = [Some(_value),_buf];
        }else{
            dec_id = None;
        }
        base_trace(`[desc(${this.trace_id()})]  raw_decode, buffer len dec_id :`, buf.length);

        let ref_objects;
        if(ctx.has_ref_objects())
        {
            const d = new OptionDecoder<Vec<ObjectLink>>(new VecDecoder( new ObjectLinkDecoder()));
            const r = d.raw_decode(buf);
            if(r.err){
                base_error!("NamedObjectDesc::raw_decode_with_context/ref_objects error:{}", r.err);
                return r;
            }
            [ref_objects, buf] = r.unwrap();
        }else{
            ref_objects = new OptionWrapper(None);
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer ref_objects :`, buf.length);

        let prev:Option<ObjectId>;
        if(ctx.has_prev())
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                base_error!("NamedObjectDesc::raw_decode_with_context/prev error:{}", r.err);
                return r;
            }
            const [_value, _buf] = r.unwrap();
            [prev, buf] = [Some(_value),_buf];
        }else{
            prev = None;
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer prev :`, buf.length);

        let create_timestamp:Option<HashValue>;
        if(ctx.has_create_time_stamp())
        {
            const r = new HashValueDecoder().raw_decode(buf);
            if(r.err){
                base_error!("NamedObjectDesc::raw_decode_with_context/create_timestamp error:{}", r.err);
                return r;
            }
            const [_value, _buf] = r.unwrap();
            [create_timestamp, buf] = [Some(_value),_buf];
        }else{
            create_timestamp = None;
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer create_timestamp :`, buf.length);

        let create_time:Option<bigint>;
        if(ctx.has_create_time())
        {
            const r = new BuckyNumberDecoder("u64").raw_decode(buf);
            if(r.err){
                base_error!("NamedObjectDesc::raw_decode_with_context/create_time error:{}", r.err);
                return r;
            }
            const [_value, _buf] = r.unwrap();
            [create_time, buf] = [Some(_value.toBigInt()),_buf];
        }else{
            create_time = None;
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer create_time :`, buf.length);

        let expired_time:Option<bigint>;
        if(ctx.has_expired_time())
        {
            const r = new BuckyNumberDecoder("u64").raw_decode(buf);
            if(r.err){
                base_error!("NamedObjectDesc::raw_decode_with_context/expired_time error:{}", r.err);
                return r;
            }
            const [_value, _buf] = r.unwrap();
            [expired_time, buf] = [Some(_value.toBigInt()),_buf];
        }else{
            expired_time = None;
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer expired_time :`, buf.length);

        //
        // OwnderObjectDesc/AreaObjectDesc/AuthorObjectDesc/PublicKeyObjectDesc
        //
        let owner: Option<ObjectId>|undefined;
        if(ctx.has_owner()){
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                base_error!("NamedObjectDesc::raw_decode_with_context/owner error:{}", r.err);
                return r;
            }
            let _owner;
            [_owner, buf] = r.unwrap();
            owner = Some(_owner);
        }else{
            owner = undefined;
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer owner :`, buf.length);

        let area: Option<Area>|undefined;
        if(ctx.has_area()){
            const r = new AreaDecoder().raw_decode(buf);
            if(r.err){
                base_error!("NamedObjectDesc::raw_decode_with_context/area error:{}", r.err);
                return r;
            }
            let _area;
            [_area, buf] = r.unwrap();
            area = Some(_area);
        }else{
            area = undefined;
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer area :`, buf.length);

        let author: Option<ObjectId>|undefined;
        if(ctx.has_author()){
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                base_error!("NamedObjectDesc::raw_decode_with_context/author error:{}", r.err);
                return r;
            }
            let _author;
            [_author, buf] = r.unwrap();
            author = Some(_author);
        }else{
            author = undefined;
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer author :`, buf.length);

        let public_key:PublicKey|MNPublicKey|undefined;
        if(ctx.has_public_key()){
            const key_type = buf[0];
            buf = buf.offset(1);

            switch(key_type){
                case OBJECT_PUBLIC_KEY_SINGLE:{
                    const r = new PublicKeyDecoder().raw_decode(buf);
                    if(r.err){
                        base_error!("NamedObjectDesc::raw_decode_with_context/single_key error:{}", r.err);
                        return r;
                    }
                    [public_key, buf] = r.unwrap();
                    break;
                }
                case OBJECT_PUBLIC_KEY_MN:{
                    const r = new MNPublicKeyDecoder().raw_decode(buf);
                    if(r.err){
                        base_error!("NamedObjectDesc::raw_decode_with_context/mn_key error:{}", r.err);
                        return r;
                    }
                    [public_key, buf] = r.unwrap();
                    break;
                }
                default:{
                    return Err(new BuckyError(BuckyErrorCode.InvalidData,"invalid public key type"));
                }
            }
        }else{
            public_key = undefined;
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer public_key :`, buf.length);

        // desc_content
        if(this.m_desc_content_decoder.type_info().desc_content_format()===DescContentFormat.Typed){
            const r = new BuckyNumberDecoder('u16').raw_decode(buf);
            if(r.err){
                base_error!("NamedObjectDesc::raw_decode_with_context/desc_content_len error:{}, obj_type:{}",
                    r.err,
                    this.m_desc_content_decoder.type_info().obj_type());
                return r;
            }
            let _;
            [_, buf] = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer desc_content length :`, buf.length);

        let desc_content:T;
        {
            const r = this.m_desc_content_decoder.raw_decode(buf);
            if(r.err){
                base_error!("NamedObjectDesc::raw_decode_with_context/desc_content error:{}, obj_type:{}",
                    r.err,
                    this.m_desc_content_decoder.type_info().obj_type());
                return r;
            }
            [desc_content, buf] = r.unwrap();
        }
        base_trace(`[desc(${this.trace_id()})] raw_decode, buffer desc_content :`, buf.length);

        desc_content.type_info().set_sub_obj_type(ctx.obj_type);

        const desc = new NamedObjectDesc(
            dec_id,
            ref_objects.value(),
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

        const result:[NamedObjectDesc<T>, Uint8Array] = [desc, buf];

        return Ok(result);
    }
}

export class NamedObject<
    DC extends DescContent,
    BC extends BodyContent,
> implements RawEncode
{
    private m_desc: NamedObjectDesc<DC>;
    private m_body: Option<ObjectMutBody<DC, BC>>;
    private m_signs: ObjectSigns;
    private m_nonce: Option<bigint>; // u128
    private m_obj_flags: Option<number>;
    private m_ctx: Option<NamedObjectContext>;
    private m_obj_type: number;
    private m_obj_type_code: ObjectTypeCode;
    private m_object_id: ObjectId;
    private m_size?: number;

    constructor(
        desc: NamedObjectDesc<DC>,
        body: Option<ObjectMutBody< DC, BC>>,
        signs: ObjectSigns,
        nonce: Option<bigint>
    ){
        this.m_desc = desc;
        this.m_body = body;
        this.m_signs = signs;
        this.m_nonce = nonce;
        this.m_obj_flags = None;
        this.m_ctx = None;
        this.m_obj_type = desc.obj_type();
        this.m_obj_type_code = desc.obj_type_code();
        this.m_object_id = this.desc().calculate_id();

        if(this.m_body.is_some()){
            this.m_body.unwrap().set_trace_id(this.m_desc.trace_id());
        }
    }

    protected obj_flags():number{
        const [_, ctx] = this.raw_measure_ctx().unwrap();
        return ctx.obj_flags;
    }

    private raw_measure_ctx(): BuckyResult<[number, NamedObjectContext]>{
        const ctx = new NamedObjectContext(this.m_obj_type, 0);

        let size = 0;

        // obj_type: u16
        size +=2;

        // obj_flags: u16
        size +=2;

        // desc
        {
            const r = this.m_desc.raw_measure(ctx);
            if(r.err){
                base_error("NamedObject::raw_measure_ex/desc error:{}, obj_type:{}, obj_type_code:{:?}",
                r.err, this.m_obj_type, this.m_obj_type_code);
                return r;
            }
            size += r.unwrap();
        }

        // body
        if (this.m_body.is_some())
        {
            ctx.with_mut_body();
            const r = this.m_body.unwrap().raw_measure();
            if(r.err){
                base_error("NamedObject::raw_measure_ex/body error:{}, obj_type:{}, obj_type_code:{:?}",
                r.err, this.m_obj_type, this.m_obj_type_code);
                return r;
            }
            size += r.unwrap();
        }

        // signs
        {
            const r = this.m_signs.raw_measure(ctx);
            if(r.err){
                base_error("NamedObject::raw_measure_ex/signs error:{}, obj_type:{}, obj_type_code:{:?}",
                r.err, this.m_obj_type, this.m_obj_type_code);
                return r;
            }
            size += r.unwrap();
        }

        // nonce
        if(this.m_nonce.is_some())
        {
            ctx.with_nonce();

            // TODO: u128
            const r = new BuckyNumber("u128",this.m_nonce.unwrap()).raw_measure();
            if(r.err){
                base_error("NamedObject::raw_measure_ex/nonce error:{}, obj_type:{}, obj_type_code:{:?}",
                r.err,  this.m_obj_type, this.m_obj_type_code);
                return r;
            }
            size += r.unwrap();
        }

        this.m_obj_flags = Some(ctx.obj_flags);
        this.m_ctx = Some(ctx);

        const result:[number, NamedObjectContext] = [size, ctx];
        return Ok(result);
    }

    to_vec(): BuckyResult<Uint8Array>{
        const size = this.raw_measure().unwrap();
        const buf = new Uint8Array(size);

        base_trace('==============');
        const ret = this.raw_encode(buf);
        base_trace('==============');
        return Ok(buf);
    }

    to_hex(): BuckyResult<string>{
        const r = this.to_vec();
        if(r.err){
            return r;
        }

        const vec = r.unwrap();
        return Ok(vec.toHex());
    }

    toString(): string{
        return this.to_string();
    }

    to_string(): string{
        const r = this.to_hex();
        if(r.err){
            return `get hex string err:{${r.err}}`
        }else{
            return r.unwrap();
        }
    }

    toJSON(): string{
        return this.toString();
    }

    desc():NamedObjectDesc<DC>{
        return this.m_desc;
    }

    body():Option<ObjectMutBody<DC,BC>>{
        return this.m_body;
    }

    body_expect():ObjectMutBody<DC,BC>{
        return this.m_body.unwrap();
    }

    signs():ObjectSigns{
        return this.m_signs;
    }

    nonce():Option<bigint>{
        return this.m_nonce;
    }

    raw_measure(): BuckyResult<number>{
        const r = this.raw_measure_ctx();
        if(r.err){
            base_error!("NamedObject::raw_measure/raw_measure_ex error:{}, obj_type:{}, obj_type_code:{:?}",
                r.err,  this.m_obj_type, this.m_obj_type_code);
            return r;
        }

        const [size, ctx] = r.unwrap();

        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        let size;
        let ctx;
        {
            const r = this.raw_measure_ctx();
            if(r.err){
                base_error!("NamedObject::raw_encode/raw_measure_ex error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.m_obj_type, this.m_obj_type_code);
                return r;
            }

            [size, ctx] = r.unwrap();
        }

        // obj_type + obj_flags
        {
            const r = ctx.raw_encode(buf);
            if(r.err){
                base_error!("NamedObject::raw_encode/obj_type + obj_flags error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err,  this.m_obj_type, this.m_obj_type_code);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc.trace_id()})] raw_encode, ctx`);

        // desc
        {
            const r = this.m_desc.raw_encode(buf, ctx);
            if(r.err){
                base_error!("NamedObject::raw_encode/desc error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.m_obj_type, this.m_obj_type_code);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc.trace_id()})] raw_encode, desc`);

        // body
        if(this.m_body.is_some())
        {
            const r = this.m_body.unwrap().raw_encode(buf);
            if(r.err){
                base_error!("NamedObject::raw_encode/body error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err, this.m_obj_type, this.m_obj_type_code);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc.trace_id()})] raw_encode, body`);

        // signs
        {
            const r = this.m_signs.raw_encode(buf);
            if(r.err){
                base_error!("NamedObject::raw_encode/signs error:{}, obj_type:{}, obj_type_code:{:?}",
                    r.err,  this.m_obj_type, this.m_obj_type_code);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc.trace_id()})] raw_encode, signs`);

        // nonce
        if(this.m_nonce.is_some()){
             // TODO: u128
            const r = new BuckyNumber("u128",this.m_nonce.unwrap()).raw_encode(buf);
            if(r.err){
                base_error("NamedObject::raw_encode/nonce error:{}, obj_type:{}, obj_type_code:{:?}",
                r.err,  this.m_obj_type, this.m_obj_type_code);
                return r;
            }
            buf = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc.trace_id()})] raw_encode, nonce`);

        return Ok(buf);
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
}

export class NamedObjectDecoder<
    DC extends DescContent,
    BC extends BodyContent,
    O extends NamedObject<DC,BC>
> implements RawDecode<NamedObject<DC,BC>>
{
    private readonly m_desc_content_decoder: DescContentDecoder<DC>;
    private readonly m_body_content_decoder: RawDecode<BC>;
    private readonly m_desc_decoer: NamedObjectDescDecoder<DC>;
    private readonly m_body_decoder: ObjectMutBodyDecoder<DC,BC>;
    private readonly m_sign_decoder: ObjectSignsDecoder;
    private readonly m_object_builder: new(...constructorArgs: any[]) => O;

    constructor(desc_content_decoer: DescContentDecoder<DC>, body_content_decoder: BodyContentDecoder<BC>, obj_builder: new(...constructorArgs: any[]) => O){
        this.m_desc_content_decoder = desc_content_decoer;
        this.m_body_content_decoder = body_content_decoder;
        this.m_desc_decoer = new NamedObjectDescDecoder(this.m_desc_content_decoder);
        this.m_body_decoder = new ObjectMutBodyDecoder<DC,BC>(this.m_desc_content_decoder.type_info().obj_type(), body_content_decoder);
        this.m_sign_decoder = new ObjectSignsDecoder();
        this.m_object_builder = obj_builder;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[NamedObject<DC,BC>, Uint8Array]>{
        const t = this.m_desc_content_decoder.type_info();

        // obj_type+obj_flags
        let ctx:NamedObjectContext;
        {
            const r = new NamedObjectContextDecoder().raw_decode(buf);
            if(r.err){
                base_error("NamedObject::raw_decode/ctx error:{}, obj_type:{}", r.err, t.obj_type());
                return r;
            }
            [ctx, buf] = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc_decoer.trace_id()})] raw_decode, ctx`);

        // 只有 TypelessObjectType 类型才不接受检查
        if(t.obj_type()!==OBJECT_TYPE_ANY){
            if(t.obj_type()!==ctx.obj_type){
                base_trace("t.obj_type():", t.obj_type(), ", ctx.obj_type:", ctx.obj_type);
                return Err(new BuckyError(BuckyErrorCode.NotMatch, "named obj_type_code not match"));
            }
        }

        // desc
        let desc;
        {
            const r = this.m_desc_decoer.raw_decode(buf, ctx);
            if(r.err){
                base_error("NamedObject::raw_decode/desc error:{}, obj_type:{}", r.err, t.obj_type());
                return r;
            }
            [desc, buf] = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc_decoer.trace_id()})] raw_decode, desc`);

        // body
        let body;
        if(ctx.has_mut_body()){
            const r = this.m_body_decoder.raw_decode(buf);
            if(r.err){
                base_error("NamedObject::raw_decode/body error:{}, obj_type:{}", r.err, t.obj_type());
                return r;
            }
            let _body;
            [_body, buf] = r.unwrap();
            body = Some(_body);
        }else{
            body = None;
        }
        base_trace(`[named_object(${this.m_desc_decoer.trace_id()})] raw_decode, body`);

        // signs
        let signs;
        {
            const r = this.m_sign_decoder.raw_decode(buf, ctx);
            if(r.err){
                base_error("NamedObject::raw_decode/signs error:{}, obj_type:{}", r.err, t.obj_type());
                return r;
            }
            [signs, buf] = r.unwrap();
        }
        base_trace(`[named_object(${this.m_desc_decoer.trace_id()})] raw_decode, signs`);

        // nonce
        let nonce;
        if(ctx.has_nonce()){
            const r = new BuckyNumberDecoder("u128").raw_decode(buf);
            if(r.err){
                return r;
            }
            let _nonce;
            [_nonce, buf] = r.unwrap();
            nonce = Some(_nonce.toBigInt());
        }else{
            nonce = None;
        }
        base_trace(`[named_object(${this.m_desc_decoer.trace_id()})] raw_decode, nonce`);

        const obj = new this.m_object_builder(desc,body,signs,nonce);

        const desc_json = JSON.stringify(desc,(key, value) =>(typeof value === 'bigint'? value.toString(): value ), 2);
        // base_trace("desc:", desc_json);

        const ret: [NamedObject<DC,BC>, Uint8Array] = [obj, buf];

        return Ok(ret);
    }

    from_raw(buf: Uint8Array): BuckyResult<NamedObject<DC,BC>>{
        let ret = this.raw_decode(buf);
        if (ret.err) {
            return ret;
        }

        return Ok(ret.unwrap()[0]);
    }
}

export class NamedObjectBuilder<
    DC extends DescContent,
    BC extends BodyContent,
>{
    private m_desc_builder: NamedObjectDescBuilder<DC>;
    private m_body_builder: ObjectMutBodyBuilder<DC,BC>;
    private m_signs_builder : ObjectSignsBuilder;
    private m_nonce : Option<bigint>;
    private m_nobody: boolean;

    constructor(desc_content: DC, body_content:BC){
        this.m_desc_builder = new NamedObjectDescBuilder(desc_content.type_info().obj_type(),desc_content);
        this.m_body_builder = new ObjectMutBodyBuilder<DC,BC>(desc_content.type_info().obj_type(),body_content);
        this.m_signs_builder = new ObjectSignsBuilder();
        this.m_nonce = None;
        this.m_nobody = false;
    }

    // desc

    dec_id(dec_id: ObjectId): NamedObjectBuilder<DC,BC>{
        this.m_desc_builder.dec_id(dec_id);
        return this;
    }

    option_dec_id(dec_id: Option<ObjectId>): NamedObjectBuilder<DC,BC>{
        this.m_desc_builder.option_dec_id(dec_id);
        return this;
    }

    ref_objects(ref_objects: Vec<ObjectLink>): NamedObjectBuilder<DC,BC>{
        this.m_desc_builder.ref_objects(ref_objects);
        return this;
    }

    option_ref_objects(ref_objects: Option<Vec<ObjectLink>>): NamedObjectBuilder<DC,BC>{
        this.m_desc_builder.option_ref_objects(ref_objects);
        return this;
    }

    prev(prev: ObjectId): NamedObjectBuilder<DC,BC>{
        this.m_desc_builder.prev(prev);
        return this;
    }

    option_prev(prev: Option<ObjectId>): NamedObjectBuilder<DC,BC>{
        this.m_desc_builder.option_prev(prev);
        return this;
    }

    create_timestamp(create_timestamp: HashValue): NamedObjectBuilder<DC,BC>{
        this.m_desc_builder.create_timestamp(create_timestamp);
        return this;
    }

    option_create_timestamp(create_timestamp: Option<HashValue>): NamedObjectBuilder<DC,BC>{
        this.m_desc_builder.option_create_timestamp(create_timestamp);
        return this;
    }

    no_create_time(): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder.option_create_time(None);
        return this;
    }

    create_time(create_time: bigint): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder.create_time(create_time);
        return this;
    }

    // 传入None，表示自动取当前时间，传入Some(x)，表示设置为具体时间
    option_create_time(create_time: Option<bigint>): NamedObjectBuilder<DC,BC> {
        if(create_time.is_some()) {
            this.m_desc_builder.create_time(create_time.unwrap());
        }
        return this;
    }

    expired_time(expired_time: bigint): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder.expired_time(expired_time);
        return this;
    }

    option_expired_time(expired_time: Option<bigint>): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder.option_expired_time(expired_time);
        return this;
    }

    // sub desc

    owner(value: ObjectId): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder = this.m_desc_builder.owner(value);
        return this;
    }

    option_owner(value: Option<ObjectId>): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder = this.m_desc_builder.option_owner(value);
        return this;
    }

    area(value: Area): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder = this.m_desc_builder.area(value);
        return this;
    }

    option_area(value: Option<Area>): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder = this.m_desc_builder.option_area(value);
        return this;
    }

    author(value: ObjectId): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder = this.m_desc_builder.author(value);
        return this;
    }

    option_author(value: Option<ObjectId>): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder = this.m_desc_builder.option_author(value);
        return this;
    }

    single_key(value: PublicKey): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder = this.m_desc_builder.single_key(value);
        return this;
    }

    option_single_key(value: Option<PublicKey>): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder = this.m_desc_builder.option_single_key(value);
        return this;
    }

    mn_key(value: MNPublicKey): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder = this.m_desc_builder.mn_key(value);
        return this;
    }

    option_mn_key(value: Option<MNPublicKey>): NamedObjectBuilder<DC,BC> {
        this.m_desc_builder = this.m_desc_builder.option_mn_key(value);
        return this;
    }

    // body

    no_body(): NamedObjectBuilder<DC,BC>{
        this.m_nobody = true;
        return this;
    }

    update_time(update_time: bigint): NamedObjectBuilder<DC,BC>{
        this.m_body_builder = this.m_body_builder.update_time(update_time);
        return this;
    }

    prev_version(prev_version: HashValue): NamedObjectBuilder<DC,BC>{
        this.m_body_builder = this.m_body_builder.prev_version(prev_version);
        return this;
    }

    user_data(user_data: Uint8Array): NamedObjectBuilder<DC,BC>{
        this.m_body_builder = this.m_body_builder.user_data(user_data);
        return this;
    }

    // signs
    reset_desc_sign(sign: Signature): NamedObjectBuilder<DC,BC> {
        this.m_signs_builder = this.m_signs_builder.reset_desc_sign(sign);
        return this;
    }

    reset_body_sign(sign: Signature): NamedObjectBuilder<DC,BC> {
        this.m_signs_builder = this.m_signs_builder.reset_body_sign(sign);
        return this;
    }

    push_desc_sign(sign: Signature): NamedObjectBuilder<DC,BC> {
        this.m_signs_builder = this.m_signs_builder.push_desc_sign(sign);
        return this;
    }

    push_body_sign(sign: Signature): NamedObjectBuilder<DC,BC> {
        this.m_signs_builder = this.m_signs_builder.push_body_sign(sign);
        return this;
    }

    // nonce
    nonce(nonce: bigint): NamedObjectBuilder<DC,BC>{
        this.m_nonce = Some(nonce);
        return this;
    }

    // build
    build(): NamedObject<DC,BC> {
        const desc = this.m_desc_builder.build();
        const body = this.m_nobody? None: Some(this.m_body_builder.build());
        const signs = this.m_signs_builder.build();
        const nonce = this.m_nonce;
        return new NamedObject(desc, body, signs, nonce);
    }
}