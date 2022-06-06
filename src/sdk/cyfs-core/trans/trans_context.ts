import {
    BuckyResult,
    DescTypeInfo,
    DeviceId, DeviceIdDecoder, NamedObject, NamedObjectDecoder, None,
    ObjectId,
    ObjectIdDecoder,
    Ok,
    Option,
    ProtobufBodyContent,
    ProtobufBodyContentDecoder,
    ProtobufCodecHelper,
    ProtobufDescContent,
    ProtobufDescContentDecoder, Some,
    SubDescType
} from "../../cyfs-base";
import {CoreObjectType} from "../core_obj_type";
import {protos} from "../codec";

export class TransContextTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.TransContext;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "disable",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }
    }

}

export class TransContextDescContent extends ProtobufDescContent {
    private readonly dec_id: ObjectId;
    private readonly context_name: string;

    constructor(dec_id: ObjectId, context_name: string) {
        super();
        this.dec_id = dec_id;
        this.context_name = context_name;
    }

    try_to_proto(): BuckyResult<any> {
        const target = new protos.TransContextDescContent()
        target.setDecId(ProtobufCodecHelper.encode_buf(this.dec_id).unwrap())
        target.setContextName(this.context_name)

        return Ok(target);
    }

    type_info(): DescTypeInfo {
        return new TransContextTypeInfo();
    }

}

export class TransContextDescContentDecoder extends ProtobufDescContentDecoder<TransContextDescContent, protos.TransContextDescContent> {
    constructor() {
        super(protos.TransContextDescContent.deserializeBinary);
    }
    try_from_proto(value: protos.TransContextDescContent): BuckyResult<TransContextDescContent> {
        const dec_id: ObjectId = ProtobufCodecHelper.decode_buf(value.getDecId_asU8(), new ObjectIdDecoder()).unwrap();
        const context_name = value.getContextName();
        return Ok(new TransContextDescContent(dec_id, context_name));
    }

    type_info(): DescTypeInfo {
        return new TransContextTypeInfo();
    }
}

export class TransContextBodyContent extends ProtobufBodyContent {
    private readonly ref_id: Option<ObjectId>;
    private readonly device_list: DeviceId[];

    constructor(ref_id: Option<ObjectId>, device_list: DeviceId[]) {
        super();
        this.ref_id = ref_id;
        this.device_list = device_list;
    }

    try_to_proto(): BuckyResult<protos.TransContextBodyContent> {
        const target = new protos.TransContextBodyContent()
        if(this.ref_id.is_some()) {
            target.setRefId(ProtobufCodecHelper.encode_buf(this.ref_id.unwrap()).unwrap())
        }

        
        const device_list = ProtobufCodecHelper.encode_buf_list(this.device_list).unwrap();
        target.setDeviceListList(device_list)
        return Ok(target);
    }

}

export class TransContextBodyContentDecoder extends ProtobufBodyContentDecoder<TransContextBodyContent, protos.TransContextBodyContent> {
    constructor() {
        super(protos.TransContextBodyContent.deserializeBinary);
    }

    try_from_proto(value: protos.TransContextBodyContent): BuckyResult<TransContextBodyContent> {
        let ref_id: Option<ObjectId> = None;
        if (value.hasRefId()) {
            ref_id = Some(ProtobufCodecHelper.decode_buf(value.getRefId_asU8(), new ObjectIdDecoder()).unwrap());
        }
        const device_list = ProtobufCodecHelper.decode_buf_list(ProtobufCodecHelper.ensure_not_null(value.getDeviceListList_asU8()).unwrap(), new DeviceIdDecoder()).unwrap();
        return Ok(new TransContextBodyContent(ref_id, device_list));
    }

}

export class TransContext extends NamedObject<TransContextDescContent, TransContextBodyContent> {

}

export class TransContextDecoder extends NamedObjectDecoder<TransContextDescContent, TransContextBodyContent, TransContext> {
    constructor() {
        super(new TransContextDescContentDecoder(), new TransContextBodyContentDecoder(), TransContext);
    }
}
