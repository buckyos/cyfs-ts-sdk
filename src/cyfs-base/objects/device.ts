import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../base/results";
import { Option, OptionEncoder, OptionDecoder, Some, None} from "../base/option";
import { RawEncode, RawDecode, DecodeBuilder } from "../base/raw_encode";
import { raw_hash_encode } from "../base/raw_encode_util";
import {} from "../base/buffer";
import { Vec, VecDecoder } from "../base/vec";
import { UniqueId, UniqueIdDecoder } from "./unique_id";
import { Endpoint, EndPointDecoder } from "../base/endpoint";
import { PublicKey, PublicKeyDecoder } from "../crypto/public_key";
import { HashValue, HashValueDecoder } from "../crypto/hash";
import { Area, AreaDecoder } from "./area";
import { ObjectTypeCode  } from "./object_type_info";
import { ObjectId } from "./object_id";
import {
    SubDescType, DescTypeInfo, DescContent, DescContentDecoder, BodyContent,
    BodyContentDecoder,
    NamedObjectId, NamedObjectDesc, NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default, named_id_from_base_58, named_id_try_from_object_id,
    NamedObjectIdDecoder, 
    NamedObjectDescDecoder} from "./object";
import { BuckyString, BuckyStringDecoder } from "../base/bucky_string";
import { ContractBuilder } from "./contract";
import { base_error, base_trace } from "../base/log";

export enum DeviceCategory {
    OOD = 0,
    Server = 1,
    PC = 2,
    Router = 3,
    AndroidMobile = 4,
    AndroidPad = 5,
    AndroidWatch = 6,
    AndroidTV = 7,
    IOSMobile = 8,
    IOSPad = 9,
    IOSWatch = 10,
    SmartSpeakers = 11,
    Browser = 12,
    IoT = 13,
    SmartHome = 14,
    Unknown = 15
}

export function number_2_devicecategory(x:number): DeviceCategory{
    if (typeof DeviceCategory[x] === 'undefined') {
        base_error('Invalid DeviceCategory number');
        return DeviceCategory.Unknown;
    }
    return x as DeviceCategory;
}

// 1. 定义一个Desc类型信息
export class DeviceDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return ObjectTypeCode.Device;
    }

    sub_desc_type(): SubDescType{
        return {
            owner_type: "option",   // 是否有主，"disable": 禁用，"option": 可选
            area_type: "option",    // 是否有区域信息，"disable": 禁用，"option": 可选
            author_type: "option",  // 是否有作者，"disable": 禁用，"option": 可选
            key_type: "single_key"  // 公钥类型，"disable": 禁用，"single_key": 单PublicKey，"mn_key": M-N 公钥对
        }
    }
}

// 2. 定义一个类型信息常量
const DEVICE_DESC_TYPE_INFO = new DeviceDescTypeInfo();

// 3. 定义DescContent，继承自DescContent
export class DeviceDescContent extends DescContent {
    private readonly m_unique_id: UniqueId;

    constructor(unique_id: UniqueId){
        super();
        this.m_unique_id = unique_id;
    }

    type_info(): DescTypeInfo{
        return DEVICE_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return this.m_unique_id.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        const r = this.m_unique_id.raw_encode(buf);
        if(r.err){
            base_error("DeviceDescContent::raw_encode error:{}", r.err);
            return r;
        }
        buf = r.unwrap();

        return Ok(buf);
    }

    unique_id():UniqueId{
        return this.m_unique_id;
    }
}

// 4. 定义一个DescContent的解码器
export class DeviceDescContentDecoder extends DescContentDecoder<DeviceDescContent>{
    type_info(): DescTypeInfo{
        return DEVICE_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[DeviceDescContent, Uint8Array]>{
        let unique_id;
        {
            const r = new UniqueIdDecoder().raw_decode(buf);
            if(r.err){
                base_error("DeviceDescContent::raw_decode error:{}", r.err);
                return r;
            }
            [unique_id, buf] = r.unwrap();
        }

        const self = new DeviceDescContent(unique_id);
        const ret:[DeviceDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

// 5. 定义一个BodyContent，继承自RawEncode
export class DeviceBodyContent extends BodyContent{
    private readonly m_endpoints: Vec<Endpoint>;
    private readonly m_sn_list: Vec<DeviceId>;
    private m_name: Option<BuckyString>;

    constructor(endpoints: Vec<Endpoint>, sn_list: Vec<DeviceId>, name: Option<string>){
        super();
        this.m_endpoints = endpoints;
        this.m_sn_list = sn_list;
        if(name.is_some()){
            this.m_name = Some(new BuckyString(name.unwrap()));
        }else{
            this.m_name = None;
        }
    }

    endpoints(): Vec<Endpoint> {
        return this.m_endpoints;
    }

    sn_list(): Vec<DeviceId> {
        return this.m_sn_list;
    }

    name(): string|undefined {
        if(this.m_name.is_some()){
            return this.m_name.unwrap().value();
        }else{
            return undefined;
        }
    }

    set_name(name: Option<string>) {
        if(name.is_some()){
            this.m_name = Some(new BuckyString(name.unwrap()));
        }else{
            this.m_name = None;
        }
    }

    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += this.m_endpoints.raw_measure().unwrap();
        size += this.m_sn_list.raw_measure().unwrap();
        size += new OptionEncoder(this.m_name).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        // endpoints
        {
            const r = this.m_endpoints.raw_encode(buf);
            if(r.err){
                base_error("Device::raw_encode/endpoints failed, err:{}", r.err);
                return r;
            }
            buf = r.unwrap();
        }

        // sn_list
        {
            const r = this.m_sn_list.raw_encode(buf);
            if(r.err){
                base_error("Device::raw_encode/sn_list failed, err:{}", r.err);
                return r;
            }
            buf = r.unwrap();
        }

        // name
        {
            const r = new OptionEncoder(this.m_name).raw_encode(buf);
            if(r.err){
                base_error("Device::raw_encode/name failed, err:{}", r.err);
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }
}

// 6. 定义一个BodyContent的解码器
export class DeviceBodyContentDecoder extends BodyContentDecoder<DeviceBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[DeviceBodyContent, Uint8Array]>{
        // endpoints
        let endpoints;
        {
            const r = new VecDecoder(new EndPointDecoder()).raw_decode(buf);
            if(r.err){
                base_error("Device::raw_decode/endpoints failed, err:{}", r.err);
                return r;
            }
            [endpoints,buf] = r.unwrap();
        }

        // sn_list
        let sn_list;
        {
            const r = new VecDecoder(new DeviceIdDecoder()).raw_decode(buf);
            if(r.err){
                base_error("Device::raw_decode/sn_list failed, err:{}", r.err);
                return r;
            }
            [sn_list, buf] = r.unwrap();
        }

        // name
        let name;
        {
            const r = new OptionDecoder(new BuckyStringDecoder()).raw_decode(buf);
            if(r.err){
                base_error("Device::raw_decode/name failed, err:{}", r.err);
                return r;
            }
            [name, buf] = r.unwrap();
        }

        let name_str;
        if(name.value().is_some()){
            name_str = Some( name.value().unwrap().value() );
        }else{
            name_str = None;
        }

        const body_content = new DeviceBodyContent(endpoints, sn_list, name_str);
        const ret:[DeviceBodyContent, Uint8Array] = [body_content, buf];

        return Ok(ret);
    }
}

// 7. 定义组合类型
export class DeviceDesc extends NamedObjectDesc<DeviceDescContent>{
    //
}

export class DeviceDescDecoder extends NamedObjectDescDecoder<DeviceDescContent>{
    constructor(){
        super(new DeviceDescContentDecoder());
    }
}

export class DeviceBuilder extends NamedObjectBuilder<DeviceDescContent, DeviceBodyContent>{
    //
}

// 通过继承的方式具体化
export class DeviceId extends NamedObjectId<DeviceDescContent, DeviceBodyContent>{
    constructor(id: ObjectId){
        super(DEVICE_DESC_TYPE_INFO.obj_type(), id);
    }

    static default(): DeviceId{
        return named_id_gen_default(DEVICE_DESC_TYPE_INFO.obj_type());
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        base_trace('DeviceId from_base_58', s);
        return named_id_from_base_58(DEVICE_DESC_TYPE_INFO.obj_type(), s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId>{
        return named_id_try_from_object_id(DEVICE_DESC_TYPE_INFO.obj_type(), id);
    }
}

export class DeviceIdDecoder extends NamedObjectIdDecoder<DeviceDescContent, DeviceBodyContent>{
    constructor(){
        super(ObjectTypeCode.Device);
    }
}


// 8. 定义Device对象
// 继承自NamedObject<DeviceDescContent, DeviceBodyContent>
// 提供创建方法和其他自定义方法
export class Device extends NamedObject<DeviceDescContent, DeviceBodyContent>{
    static create(owner: Option<ObjectId>, unique_id: UniqueId, endpoints: Vec<Endpoint>, sn_list: Vec<DeviceId>, public_key: PublicKey, area: Area, category: DeviceCategory, build?:(builder: DeviceBuilder)=>void): Device{
        const desc_content = new DeviceDescContent(unique_id);
        const body_content = new DeviceBodyContent(endpoints, sn_list, None);

        const real_area  = new Area(
            area.country,
            area.carrier,
            area.city,
            category
        );

        const builder = new DeviceBuilder(desc_content, body_content)
                .option_owner(owner)
                .area(real_area)
                .single_key(public_key);

        if(build){
            build(builder);
        }

        const self = builder.build();
        return new Device(self.desc(), self.body(), self.signs(), self.nonce());
    }

    device_id():DeviceId{
        return DeviceId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }

    connect_info(): DeviceBodyContent {
        return this.body_expect().content();
    }

    name(): string|undefined {
        return this.body_expect().content().name();
    }

    set_name(name: Option<string>) {
        return this.body_expect().content().set_name(name);
    }

    category(): BuckyResult<DeviceCategory> {
        const inner = this.desc().area()?.unwrap().inner;
        if(inner){
            return Ok(number_2_devicecategory(inner));
        }else{
            return Err(new BuckyError(BuckyErrorCode.InvalidData, "can not convert area inner to category"));
        }
    }
}

// 9. 定义Device解码器
export class DeviceDecoder extends NamedObjectDecoder<DeviceDescContent, DeviceBodyContent, Device>{
    constructor(){
        super(new DeviceDescContentDecoder(), new DeviceBodyContentDecoder(), Device);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[Device, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new Device(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [Device, Uint8Array];
        });
    }
}

export function test_device(){
    //
}