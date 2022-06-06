import { BuckyResult, DeviceId, DeviceIdDecoder, ObjectId, ObjectIdDecoder, Ok, OODWorkMode, ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufCodecHelper, ProtobufDescContent, ProtobufDescContentDecoder } from "../../cyfs-base";
import { DescTypeInfo, NamedObject, NamedObjectBuilder, NamedObjectDecoder, NamedObjectDesc, NamedObjectDescDecoder, NamedObjectId, NamedObjectIdDecoder, named_id_from_base_58, named_id_gen_default, named_id_try_from_object_id, SubDescType } from "../../cyfs-base/objects/object";

import { CoreObjectType } from "../core_obj_type";
import { protos } from '../codec';

export class ZoneDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.Zone;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }
    }
}

const ZONE_DESC_TYPE_INFO = new ZoneDescTypeInfo();

export class ZoneDescContent extends ProtobufDescContent {
    private readonly m_owner: ObjectId;

    constructor(owner: ObjectId) {
        super();

        this.m_owner = owner;
    }

    type_info(): DescTypeInfo {
        return ZONE_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.ZoneDescContent> {
        const target = new protos.ZoneDescContent()
        target.setOwner(ProtobufCodecHelper.encode_buf(this.m_owner).unwrap())

        return Ok(target);
    }

    owner(): ObjectId {
        return this.m_owner;
    }
}

export class ZoneDescContentDecoder extends ProtobufDescContentDecoder<ZoneDescContent, protos.ZoneDescContent>{
    constructor() {
        super(protos.ZoneDescContent.deserializeBinary)
    }

    type_info(): DescTypeInfo {
        return ZONE_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.ZoneDescContent): BuckyResult<ZoneDescContent> {
        const owner: ObjectId = ProtobufCodecHelper.decode_buf(value.getOwner_asU8(), new ObjectIdDecoder()).unwrap();
        const result = new ZoneDescContent(owner);

        return Ok(result);
    }
}

export class ZoneBodyContent extends ProtobufBodyContent {
    private readonly m_ood_list: DeviceId[];
    private readonly m_known_device_list: DeviceId[];
    private readonly m_ood_work_mode: OODWorkMode;

    constructor(ood_work_mode: OODWorkMode, ood_list: DeviceId[], known_device_list: DeviceId[]) {
        super();

        this.m_ood_work_mode = ood_work_mode;
        this.m_ood_list = ood_list;
        this.m_known_device_list = known_device_list;
    }

    ood_work_mode(): OODWorkMode {
        return this.m_ood_work_mode;
    }

    ood_list(): DeviceId[] {
        return this.m_ood_list;
    }

    known_device_list(): DeviceId[] {
        return this.m_known_device_list;
    }

    try_to_proto(): BuckyResult<protos.ZoneBodyContent> {
        const target = new protos.ZoneBodyContent()
        target.setOodListList(ProtobufCodecHelper.encode_buf_list(this.m_ood_list).unwrap())
        target.setKnownDeviceListList(ProtobufCodecHelper.encode_buf_list(this.m_known_device_list).unwrap())
        target.setOodWorkMode(this.m_ood_work_mode)

        return Ok(target);
    }
}

export class ZoneBodyContentDecoder extends ProtobufBodyContentDecoder<ZoneBodyContent, protos.ZoneBodyContent>{
    constructor() {
        super(protos.ZoneBodyContent.deserializeBinary)
    }

    try_from_proto(value: protos.ZoneBodyContent): BuckyResult<ZoneBodyContent> {
        const ood_list = ProtobufCodecHelper.decode_buf_list(
            ProtobufCodecHelper.ensure_not_null(value.getOodListList_asU8()).unwrap(),
            new DeviceIdDecoder()).unwrap();

        const known_device_list = ProtobufCodecHelper.decode_buf_list(
            ProtobufCodecHelper.ensure_not_null(value.getKnownDeviceListList_asU8()).unwrap(),
            new DeviceIdDecoder()).unwrap();

        let ood_work_mode = OODWorkMode.Standalone;
        if (value.hasOodWorkMode()) {
            ood_work_mode = value.getOodWorkMode() as OODWorkMode;
        }

        const result = new ZoneBodyContent(ood_work_mode, ood_list, known_device_list);

        return Ok(result);
    }
}

export class ZoneDesc extends NamedObjectDesc<ZoneDescContent>{
    // ignore
}

export class ZoneDescDecoder extends NamedObjectDescDecoder<ZoneDescContent>{
    // ignore
}

export class ZoneBuilder extends NamedObjectBuilder<ZoneDescContent, ZoneBodyContent>{
    // ignore
}

export class ZoneId extends NamedObjectId<ZoneDescContent, ZoneBodyContent>{
    constructor(id: ObjectId) {
        super(CoreObjectType.Zone, id);
    }

    static default(): DeviceId {
        return named_id_gen_default(CoreObjectType.Zone);
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        return named_id_from_base_58(CoreObjectType.Zone, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId> {
        return named_id_try_from_object_id(CoreObjectType.Zone, id);
    }
}

export class ZoneIdDecoder extends NamedObjectIdDecoder<ZoneDescContent, ZoneBodyContent>{
    constructor() {
        super(CoreObjectType.Zone);
    }
}


export class Zone extends NamedObject<ZoneDescContent, ZoneBodyContent>{
    static create(owner: ObjectId, ood_work_mode: OODWorkMode, ood_list: DeviceId[], known_device_list: DeviceId[]): Zone {
        const desc_content = new ZoneDescContent(owner);
        const body_content = new ZoneBodyContent(ood_work_mode, ood_list, known_device_list);

        return new ZoneBuilder(desc_content, body_content).build(Zone);
    }

    ood_work_mode(): OODWorkMode {
        return this.body_expect().content().ood_work_mode();
    }

    owner(): ObjectId {
        return this.desc().content().owner();
    }

    ood_list(): DeviceId[] {
        return this.body_expect().content().ood_list();
    }

    known_device_list(): DeviceId[] {
        return this.body_expect().content().known_device_list();
    }

    zone_id(): ZoneId {
        return new ZoneId(this.desc().calculate_id());
    }
}

export class ZoneDecoder extends NamedObjectDecoder<ZoneDescContent, ZoneBodyContent, Zone>{
    constructor() {
        super(new ZoneDescContentDecoder(), new ZoneBodyContentDecoder(), Zone);
    }
}