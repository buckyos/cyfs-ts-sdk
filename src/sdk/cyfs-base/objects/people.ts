import {
    DescContent,
    DescContentDecoder,
    DescTypeInfo, named_id_gen_default, named_id_from_base_58, named_id_try_from_object_id, NamedObject,
    NamedObjectBuilder, NamedObjectDecoder,
    NamedObjectDesc, NamedObjectId, NamedObjectIdDecoder,
    BodyContent,
    BodyContentDecoder,
    SubDescType,
    NamedObjectDescDecoder
} from "./object";
import { ObjectTypeCode } from "./object_type_info";
import { UniqueId, UniqueIdDecoder } from "./unique_id";
import {
    Area,
    BuckyError, BuckyErrorCode,
    BuckyResult,
    None,
    Option,
    OptionDecoder,
    OptionEncoder,
    PublicKey,
    RawDecode,
    RawEncode,
    Some
} from "..";
import { Err, Ok } from "../base/results";
import {
    DeviceBodyContent,
    DeviceDescContent,
    DeviceId,
    DeviceIdDecoder
} from "./device";
import { FileId, FileIdDecoder } from "./file";
import { ObjectId } from "./object_id";
import { ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufCodecHelper, protos } from '../codec';

// 1. 定义一个Desc类型信息
export class PeopleDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return ObjectTypeCode.People;
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
const PEOPLE_DESC_TYPE_INFO = new PeopleDescTypeInfo();


// 3. 定义DescContent，继承自DescContent
export class PeopleDescContent extends DescContent {
    type_info(): DescTypeInfo {
        return PEOPLE_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return Ok(buf);
    }
}

// 4. 定义一个DescContent的解码器
export class PeopleDescContentDecoder extends DescContentDecoder<PeopleDescContent>{
    type_info(): DescTypeInfo {
        return PEOPLE_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[PeopleDescContent, Uint8Array]> {
        const self = new PeopleDescContent();
        const ret: [PeopleDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export enum OODWorkMode {
    Standalone = 'standalone',
    ActiveStandby = 'active-standby',
}

// 5. 定义一个BodyContent，继承自RawEncode
export class PeopleBodyContent extends ProtobufBodyContent {
    private m_ood_work_mode: OODWorkMode | undefined;

    constructor(public ood_list: DeviceId[], public name?: string, public icon?: FileId, ood_work_mode?: OODWorkMode,) {
        super();

        this.m_ood_work_mode = ood_work_mode;
    }

    set_name(name?: string) {
        this.name = name;
    }

    set_icon(icon?: FileId) {
        this.icon = icon;
    }

    ood_work_mode(): OODWorkMode {
        if (this.m_ood_work_mode) {
            return this.m_ood_work_mode;
        } else {
            return OODWorkMode.Standalone;
        }
    }

    set_ood_work_mode(ood_mode: OODWorkMode) {
        this.m_ood_work_mode = ood_mode;
    }

    try_to_proto(): BuckyResult<protos.PeopleBodyContent> {
        const target = new protos.PeopleBodyContent();

        if (this.name != null) {
            target.setName(this.name);
        }

        if (this.m_ood_work_mode != null) {
            target.setOodWorkMode(this.m_ood_work_mode);
        }

        if (this.icon != null) {
            target.setIcon(ProtobufCodecHelper.encode_buf(this.icon!).unwrap());
        }

        target.setOodListList(ProtobufCodecHelper.encode_buf_list(this.ood_list).unwrap());

        return Ok(target);
    }
}


// 6. 定义一个BodyContent的解码器
export class PeopleBodyContentDecoder extends ProtobufBodyContentDecoder<PeopleBodyContent, protos.PeopleBodyContent> {
    constructor() {
        super(protos.PeopleBodyContent.deserializeBinary)
    }

    try_from_proto(value: protos.PeopleBodyContent): BuckyResult<PeopleBodyContent> {
        let icon: FileId | undefined;
        let name: string | undefined;

        const ood_list = ProtobufCodecHelper.decode_buf_list(value.getOodListList_asU8(), new DeviceIdDecoder()).unwrap();
        if (value.hasName()) {
            name = value.getName();
        }

        if (value.hasIcon()) {
            icon = ProtobufCodecHelper.decode_buf(value.getIcon_asU8(), new FileIdDecoder()).unwrap();
        }

        let mode;
        if (value.hasOodWorkMode()) {
            mode = value.getOodWorkMode() as OODWorkMode;
        }

        const result = new PeopleBodyContent(ood_list, name, icon, mode);
        return Ok(result);
    }
}

// 7. 定义组合类型
export class PeopleDesc extends NamedObjectDesc<PeopleDescContent>{
    //
}

export class PeopleDescDecoder extends NamedObjectDescDecoder<PeopleDescContent>{
    constructor() {
        super(new PeopleDescContentDecoder());
    }
}

export class PeopleBuilder extends NamedObjectBuilder<PeopleDescContent, PeopleBodyContent>{
    //
}

// 通过继承的方式具体化
export class PeopleId extends NamedObjectId<PeopleDescContent, PeopleBodyContent>{
    constructor(id: ObjectId) {
        super(ObjectTypeCode.People, id);
    }

    static default(): PeopleId {
        return named_id_gen_default(ObjectTypeCode.People);
    }

    static from_base_58(s: string): BuckyResult<PeopleId> {
        return named_id_from_base_58(ObjectTypeCode.People, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<PeopleId> {
        return named_id_try_from_object_id(ObjectTypeCode.People, id);
    }
}

export class PeopleIdDecoder extends NamedObjectIdDecoder<DeviceDescContent, DeviceBodyContent>{
    constructor() {
        super(ObjectTypeCode.People);
    }
}

// 8. 定义People对象
// 继承自NamedObject<PeopleDescContent, PeopleBodyContent>
// 提供创建方法和其他自定义方法
export class People extends NamedObject<PeopleDescContent, PeopleBodyContent>{
    static create(owner: Option<ObjectId>, ood_list: DeviceId[], public_key: PublicKey, area: Option<Area>, name?: string, icon?: FileId, build?: (builder: PeopleBuilder) => void): People {
        const desc_content = new PeopleDescContent();
        const body_content = new PeopleBodyContent(ood_list, name, icon);

        const builder = new NamedObjectBuilder<PeopleDescContent, PeopleBodyContent>(desc_content, body_content)
            .option_owner(owner)
            .option_area(area)
            .single_key(public_key);

        if (build) {
            build(builder);
        }

        return builder.build(People);
    }

    people_id(): PeopleId {
        return PeopleId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }

    name(): string | undefined {
        return this.body_expect().content().name;
    }

    set_name(name?: string) {
        return this.body_expect().content().set_name(name);
    }

    ood_work_mode(): OODWorkMode {
        return this.body_expect().content().ood_work_mode();
    }

    set_ood_work_mode(mode: OODWorkMode) {
        return this.body_expect().content().set_ood_work_mode(mode);
    }

    icon() {
        return this.body_expect().content().icon;
    }

    set_icon(icon?: FileId) {
        return this.body_expect().content().set_icon(icon);
    }
}

// 9. 定义People解码器
export class PeopleDecoder extends NamedObjectDecoder<PeopleDescContent, PeopleBodyContent, People>{
    constructor() {
        super(new PeopleDescContentDecoder(), new PeopleBodyContentDecoder(), People);
    }
}