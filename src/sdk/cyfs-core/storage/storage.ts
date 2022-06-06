import {
    SubDescType,
    DescTypeInfo, 
    NamedObjectId, NamedObjectIdDecoder,
    NamedObjectDesc, NamedObjectDescDecoder,
    NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "../../cyfs-base/objects/object"

import { Ok, BuckyResult} from "../../cyfs-base/base/results";
import { BuckyBuffer } from "../../cyfs-base/base/bucky_buffer";
import { ObjectId } from "../../cyfs-base/objects/object_id";
import { DeviceId } from "../../cyfs-base/objects/device";

import { CoreObjectType } from "../core_obj_type";
import { protos } from '../codec';
import { ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufCodecHelper, ProtobufDescContent, ProtobufDescContentDecoder } from '../../cyfs-base';

export class StorageDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.Storage;
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

const STORAGE_DESC_TYPE_INFO = new StorageDescTypeInfo();

export class StorageDescContent extends ProtobufDescContent {
    private readonly m_id: string;
    constructor(id: string) {
        super();
        this.m_id = id;
    }

    id(): string {
        return this.m_id;
    }

    type_info(): DescTypeInfo {
        return STORAGE_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.StorageDescContent> {
        const target = new protos.StorageDescContent()
        target.setId(this.m_id);

        return Ok(target);
    }
}

export class StorageDescContentDecoder extends ProtobufDescContentDecoder<StorageDescContent, protos.StorageDescContent>{
    constructor() {
        super(protos.StorageDescContent.deserializeBinary)
    }

    type_info(): DescTypeInfo {
        return STORAGE_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.StorageDescContent): BuckyResult<StorageDescContent> {
        const result = new StorageDescContent(ProtobufCodecHelper.ensure_not_null(value.getId()).unwrap());
        return Ok(result);
    }
}

export class StorageBodyContent extends ProtobufBodyContent {
    private readonly m_value: BuckyBuffer;

    constructor(value: Uint8Array) {
        super();

        this.m_value = new BuckyBuffer(value);
    }

    value(): Uint8Array {
        return this.m_value.value();
    }

    try_to_proto(): BuckyResult<protos.StorageBodyContent> {
        const target = new protos.StorageBodyContent()
        target.setValue(this.m_value.value())

        return Ok(target);
    }
}

export class StorageBodyContentDecoder extends ProtobufBodyContentDecoder<StorageBodyContent, protos.StorageBodyContent>{
    constructor() {
        super(protos.StorageBodyContent.deserializeBinary)
    }

    try_from_proto(value: protos.StorageBodyContent): BuckyResult<StorageBodyContent> {
        const result = new StorageBodyContent(ProtobufCodecHelper.ensure_not_null(value.getValue_asU8()).unwrap());
        return Ok(result);
    }
}

export class StorageDesc extends NamedObjectDesc<StorageDescContent>{
    // ignore
}

export class StorageDescDecoder extends NamedObjectDescDecoder<StorageDescContent>{
    // ignore
}

export class StorageBuilder extends NamedObjectBuilder<StorageDescContent, StorageBodyContent>{
    // ignore
}

export class StorageId extends NamedObjectId<StorageDescContent, StorageBodyContent>{
    constructor(id: ObjectId) {
        super(CoreObjectType.Storage, id);
    }

    static default(): DeviceId {
        return named_id_gen_default(CoreObjectType.Storage);
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        return named_id_from_base_58(CoreObjectType.Storage, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId> {
        return named_id_try_from_object_id(CoreObjectType.Storage, id);
    }
}

export class StorageIdDecoder extends NamedObjectIdDecoder<StorageDescContent, StorageBodyContent>{
    constructor() {
        super(CoreObjectType.Storage);
    }
}


export class Storage extends NamedObject<StorageDescContent, StorageBodyContent>{
    static create(id: string, value: Uint8Array): Storage {
        const desc_content = new StorageDescContent(id);
        const body_content = new StorageBodyContent(value);

        return new StorageBuilder(desc_content, body_content).build(Storage);
    }

    id(): string {
        return this.desc().content().id();
    }

    value(): Uint8Array {
        return this.body_expect().content().value();
    }

    storage_id() {
        return new StorageId(this.desc().calculate_id());
    }
}

export class StorageDecoder extends NamedObjectDecoder<StorageDescContent, StorageBodyContent, Storage>{
    constructor() {
        super(new StorageDescContentDecoder(), new StorageBodyContentDecoder(), Storage);
    }
}