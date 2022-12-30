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
import { ObjectId } from "../../cyfs-base/objects/object_id";
import { bucky_time_now } from "../../cyfs-base/base/time";

import { CoreObjectType } from "../core_obj_type";
import { DecApp } from "./dec_app";
import { protos } from '../codec';
import { ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufDescContent, ProtobufDescContentDecoder } from '../../cyfs-base';


export class AppExtInfoDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.AppExtInfo;
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

const DECAPP_DESC_TYPE_INFO = new AppExtInfoDescTypeInfo();

export class AppExtInfoDescContent extends ProtobufDescContent {
    constructor(public id: string) {
        super();
    }

    type_info(): DescTypeInfo {
        return DECAPP_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.AppExtInfoDescContent> {
        const target = new protos.AppExtInfoDescContent()
        target.setId(this.id)

        return Ok(target);
    }
}

export class AppExtInfoDescContentDecoder extends ProtobufDescContentDecoder<AppExtInfoDescContent, protos.AppExtInfoDescContent>{
    constructor() {
        super(protos.AppExtInfoDescContent.deserializeBinary);
    }

    type_info(): DescTypeInfo {
        return DECAPP_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.AppExtInfoDescContent): BuckyResult<AppExtInfoDescContent> {
        const result = new AppExtInfoDescContent(value.getId());

        return Ok(result);
    }
}

export class AppExtInfoBodyContent extends ProtobufBodyContent {
    info: string
    constructor(info: string) {
        super();
        this.info = info
    }

    try_to_proto(): BuckyResult<protos.AppExtInfoBodyContent> {
        const target = new protos.AppExtInfoBodyContent()
        target.setInfo(this.info)

        return Ok(target);
    }
}

export class AppExtInfoBodyContentDecoder extends ProtobufBodyContentDecoder<AppExtInfoBodyContent, protos.AppExtInfoBodyContent>{
    constructor() {
        super(protos.AppExtInfoBodyContent.deserializeBinary)
    }

    try_from_proto(value: protos.AppExtInfoBodyContent): BuckyResult<AppExtInfoBodyContent> {
        const result = new AppExtInfoBodyContent(value.getInfo());
        return Ok(result);
    }
}

export class AppExtInfoDesc extends NamedObjectDesc<AppExtInfoDescContent>{
    // ignore
}

export class AppExtInfoDescDecoder extends NamedObjectDescDecoder<AppExtInfoDescContent>{
    // ignore
}

export class AppExtInfoBuilder extends NamedObjectBuilder<AppExtInfoDescContent, AppExtInfoBodyContent>{
    // ignore
}

export class AppExtInfoId extends NamedObjectId<AppExtInfoDescContent, AppExtInfoBodyContent>{
    constructor(id: ObjectId) {
        super(CoreObjectType.AppExtInfo, id);
    }

    static default(): AppExtInfoId {
        return named_id_gen_default(CoreObjectType.AppExtInfo);
    }

    static from_base_58(s: string): BuckyResult<AppExtInfoId> {
        return named_id_from_base_58(CoreObjectType.AppExtInfo, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AppExtInfoId> {
        return named_id_try_from_object_id(CoreObjectType.AppExtInfo, id);
    }
}

export class AppExtInfoIdDecoder extends NamedObjectIdDecoder<AppExtInfoDescContent, AppExtInfoBodyContent>{
    constructor() {
        super(CoreObjectType.AppExtInfo);
    }
}


export class AppExtInfo extends NamedObject<AppExtInfoDescContent, AppExtInfoBodyContent>{
    static create(owner: ObjectId, id: string): AppExtInfo {
        const desc_content = new AppExtInfoDescContent(id);
        const body_content = new AppExtInfoBodyContent('');
        const builder = new AppExtInfoBuilder(desc_content, body_content);

        return builder.owner(owner).no_create_time().build(AppExtInfo);
    }

    static getExtId(app: DecApp): ObjectId {
        return AppExtInfo.create(app.desc().owner()!, app.name()).desc().calculate_id();
    }

    info(): string {
        return this.body_expect().content().info
    }

    set_info(info: string) {
        this.body_expect().content().info = info;
        this.body_expect().increase_update_time(bucky_time_now());
    }
}

export class AppExtInfoDecoder extends NamedObjectDecoder<AppExtInfoDescContent, AppExtInfoBodyContent, AppExtInfo>{
    constructor() {
        super(new AppExtInfoDescContentDecoder(), new AppExtInfoBodyContentDecoder(), AppExtInfo);
    }

    static create(): AppExtInfoDecoder {
        return new AppExtInfoDecoder()
    }
}