import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../base/results";
import { Option } from "../base/option";
import { } from "../base/buffer";
import { UniqueId, UniqueIdDecoder } from "./unique_id";
import { Endpoint, EndPointDecoder } from "../base/endpoint";
import { PublicKey } from "../crypto/public_key";
import { Area } from "./area";
import { ObjectTypeCode } from "./object_type_info";
import { ObjectId } from "./object_id";
import {
    SubDescType, DescTypeInfo, DescContent, DescContentDecoder, NamedObjectId, NamedObjectDesc, NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default, named_id_from_base_58, named_id_try_from_object_id,
    NamedObjectIdDecoder,
    NamedObjectDescDecoder
} from "./object";
import { base_trace } from "../base/log";
import { ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufCodecHelper, protos } from '../codec';


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
    VirtualOOD = 15,

    Unknown = 255,
}

export function number_2_devicecategory(x: number): DeviceCategory {
    if (typeof DeviceCategory[x] === 'undefined') {
        console.error(`Invalid DeviceCategory number: ${DeviceCategory[x]}`);
        return DeviceCategory.Unknown;
    }
    return x as DeviceCategory;
}

// 1. 定义一个Desc类型信息
export class DeviceDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return ObjectTypeCode.Device;
    }

    sub_desc_type(): SubDescType {
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

    constructor(unique_id: UniqueId) {
        super();
        this.m_unique_id = unique_id;
    }

    type_info(): DescTypeInfo {
        return DEVICE_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number> {
        return this.m_unique_id.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        const r = this.m_unique_id.raw_encode(buf);
        if (r.err) {
            console.error("DeviceDescContent::raw_encode error:", r.val);
            return r;
        }
        buf = r.unwrap();

        return Ok(buf);
    }

    unique_id(): UniqueId {
        return this.m_unique_id;
    }
}

// 4. 定义一个DescContent的解码器
export class DeviceDescContentDecoder extends DescContentDecoder<DeviceDescContent>{
    type_info(): DescTypeInfo {
        return DEVICE_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[DeviceDescContent, Uint8Array]> {
        let unique_id;
        {
            const r = new UniqueIdDecoder().raw_decode(buf);
            if (r.err) {
                console.error("DeviceDescContent::raw_decode error:", r.val);
                return r;
            }
            [unique_id, buf] = r.unwrap();
        }

        const self = new DeviceDescContent(unique_id);
        const ret: [DeviceDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}


// 5. 定义一个BodyContent，继承自RawEncode
export class DeviceBodyContent extends ProtobufBodyContent {
    private readonly m_endpoints: Endpoint[];
    private readonly m_sn_list: DeviceId[];
    private readonly m_passive_pn_list: DeviceId[];
    private m_name?: string;

    constructor(endpoints: Endpoint[], sn_list: DeviceId[], passive_pn_list: DeviceId[], name?: string) {
        super();
        this.m_endpoints = endpoints;
        this.m_sn_list = sn_list;
        this.m_passive_pn_list = passive_pn_list;

        this.m_name = name;
    }

    endpoints(): Endpoint[] {
        return this.m_endpoints;
    }

    sn_list(): DeviceId[] {
        return this.m_sn_list;
    }

    passive_pn_list(): DeviceId[] {
        return this.m_passive_pn_list;
    }

    name(): string | undefined {
        return this.m_name;
    }

    set_name(name?: string) {
        this.m_name = name;
    }

    try_to_proto(): BuckyResult<protos.DeviceBodyContent> {
        let endpoints;
        {
            const r = ProtobufCodecHelper.encode_buf_list(this.m_endpoints);
            if (r.err) {
                return r;
            }
            endpoints = r.unwrap();
        }
        let sn_list;
        {
            const r = ProtobufCodecHelper.encode_buf_list(this.m_sn_list);
            if (r.err) {
                return r;
            }
            sn_list = r.unwrap();
        }
        let passive_pn_list;
        {
            const r = ProtobufCodecHelper.encode_buf_list(this.m_passive_pn_list);
            if (r.err) {
                return r;
            }
            passive_pn_list = r.unwrap();
        }
        const target = new protos.DeviceBodyContent();
        target.setEndpointsList(endpoints);
        target.setSnListList(sn_list);
        target.setPassivePnListList(passive_pn_list);
        if (this.m_name != null) {
            target.setName(this.m_name);
        }

        return Ok(target);
    }
}

// 6. 定义一个BodyContent的解码器
export class DeviceBodyContentDecoder extends ProtobufBodyContentDecoder<DeviceBodyContent, protos.DeviceBodyContent>{
    constructor() {
        super(protos.DeviceBodyContent.deserializeBinary)
    }

    try_from_proto(value: protos.DeviceBodyContent): BuckyResult<DeviceBodyContent> {
        let endpoints;
        {
            const r = ProtobufCodecHelper.decode_buf_list(value.getEndpointsList_asU8(), new EndPointDecoder());
            if (r.err) {
                console.error("Device::raw_decode/endpoints failed, err:", r.val);
                return r;
            }
            endpoints = r.unwrap();
        }
        let sn_list;
        {
            const r = ProtobufCodecHelper.decode_buf_list(value.getSnListList_asU8(), new DeviceIdDecoder());
            if (r.err) {
                console.error("Device::raw_decode/sn_list failed, err:", r.val);
                return r;
            }
            sn_list = r.unwrap();
        }
        let passive_pn_list;
        {
            const r = ProtobufCodecHelper.decode_buf_list(value.getPassivePnListList_asU8(), new DeviceIdDecoder());
            if (r.err) {
                console.error("Device::raw_decode/passive_pn_list failed, err:", r.val);
                return r;
            }
            passive_pn_list = r.unwrap();
        }
        const name = value.hasName() ? value.getName() : undefined;

        const body_content = new DeviceBodyContent(endpoints, sn_list, passive_pn_list, name);
        return Ok(body_content);
    }
}

// 7. 定义组合类型
export class DeviceDesc extends NamedObjectDesc<DeviceDescContent>{
    //
}

export class DeviceDescDecoder extends NamedObjectDescDecoder<DeviceDescContent>{
    constructor() {
        super(new DeviceDescContentDecoder());
    }
}

export class DeviceBuilder extends NamedObjectBuilder<DeviceDescContent, DeviceBodyContent>{
    //
}

// 通过继承的方式具体化
export class DeviceId extends NamedObjectId<DeviceDescContent, DeviceBodyContent>{
    constructor(id: ObjectId) {
        super(DEVICE_DESC_TYPE_INFO.obj_type(), id);
    }

    static default(): DeviceId {
        return named_id_gen_default(DEVICE_DESC_TYPE_INFO.obj_type());
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        base_trace('DeviceId from_base_58', s);
        return named_id_from_base_58(DEVICE_DESC_TYPE_INFO.obj_type(), s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId> {
        return named_id_try_from_object_id(DEVICE_DESC_TYPE_INFO.obj_type(), id);
    }
}

export class DeviceIdDecoder extends NamedObjectIdDecoder<DeviceDescContent, DeviceBodyContent>{
    constructor() {
        super(ObjectTypeCode.Device);
    }
}


// 8. 定义Device对象
// 继承自NamedObject<DeviceDescContent, DeviceBodyContent>
// 提供创建方法和其他自定义方法
export class Device extends NamedObject<DeviceDescContent, DeviceBodyContent>{
    static create(owner: Option<ObjectId>, unique_id: UniqueId, endpoints: Endpoint[], sn_list: DeviceId[], passive_sn_list: DeviceId[], public_key: PublicKey, area: Area, category: DeviceCategory, build?: (builder: DeviceBuilder) => void): Device {
        const desc_content = new DeviceDescContent(unique_id);
        const body_content = new DeviceBodyContent(endpoints, sn_list, passive_sn_list);

        const real_area = new Area(
            area.country,
            area.carrier,
            area.city,
            category
        );

        const builder = new DeviceBuilder(desc_content, body_content)
            .option_owner(owner)
            .area(real_area)
            .single_key(public_key);

        if (build) {
            build(builder);
        }

        return builder.build(Device);
    }

    device_id(): DeviceId {
        return DeviceId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }

    connect_info(): DeviceBodyContent {
        return this.body_expect().content();
    }

    name(): string | undefined {
        return this.body_expect().content().name();
    }

    set_name(name?: string) {
        return this.body_expect().content().set_name(name);
    }

    category(): BuckyResult<DeviceCategory> {
        const inner = this.desc().area()?.unwrap().inner;
        if (inner !== undefined) {
            return Ok(number_2_devicecategory(inner));
        } else {
            return Err(new BuckyError(BuckyErrorCode.InvalidData, "can not convert area inner to category"));
        }
    }
}

// 9. 定义Device解码器
export class DeviceDecoder extends NamedObjectDecoder<DeviceDescContent, DeviceBodyContent, Device>{
    constructor() {
        super(new DeviceDescContentDecoder(), new DeviceBodyContentDecoder(), Device);
    }
}