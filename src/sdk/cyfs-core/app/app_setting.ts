import {
    SubDescType,
    DescTypeInfo,
    NamedObjectId,
    NamedObjectIdDecoder,
    NamedObject,
    NamedObjectBuilder,
    NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "../../cyfs-base/objects/object";

import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { ObjectId } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { DecAppId, DecAppIdDecoder } from "./dec_app";
import { protos } from "../codec";
import {
    EmptyProtobufBodyContent,
    EmptyProtobufBodyContentDecoder,
    ProtobufCodecHelper,
    ProtobufDescContent,
    ProtobufDescContentDecoder,
} from "../../cyfs-base";

export class AppSettingDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.AppSetting;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable",
        };
    }
}

const AppSetting_DESC_TYPE_INFO = new AppSettingDescTypeInfo();

export class AppSettingDesc extends ProtobufDescContent {
    constructor(
        public id: DecAppId,
        public auto_update: boolean
    ) {
        super();
    }

    type_info(): DescTypeInfo {
        return AppSetting_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.AppSettingDesc> {
        const ret = new protos.AppSettingDesc()
        ret.setId(ProtobufCodecHelper.encode_buf(this.id).unwrap())
        ret.setAutoUpdate(this.auto_update)
        return Ok(ret);
    }
}

export class AppSettingDescDecoder extends ProtobufDescContentDecoder<AppSettingDesc, protos.AppSettingDesc> {
    constructor() {
        super(protos.AppSettingDesc.deserializeBinary);
    }

    type_info(): DescTypeInfo {
        return AppSetting_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.AppSettingDesc): BuckyResult<AppSettingDesc> {
        const id_r = ProtobufCodecHelper.decode_buf(value.getId_asU8(), new DecAppIdDecoder());
        if (id_r.err) {
            return id_r;
        }

        const result = new AppSettingDesc(id_r.unwrap(), value.getAutoUpdate());

        return Ok(result);
    }
}

export class AppSettingBuilder extends NamedObjectBuilder<AppSettingDesc, EmptyProtobufBodyContent> {
    // ignore
}

export class AppSettingId extends NamedObjectId<AppSettingDesc, EmptyProtobufBodyContent> {
    constructor(id: ObjectId) {
        super(CoreObjectType.AppSetting, id);
    }

    static default(): AppSettingId {
        return named_id_gen_default(CoreObjectType.AppSetting);
    }

    static from_base_58(s: string): BuckyResult<AppSettingId> {
        return named_id_from_base_58(CoreObjectType.AppSetting, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AppSettingId> {
        return named_id_try_from_object_id(CoreObjectType.AppSetting, id);
    }
}

export class AppSettingIdDecoder extends NamedObjectIdDecoder<AppSettingDesc, EmptyProtobufBodyContent> {
    constructor() {
        super(CoreObjectType.AppSetting);
    }
}

export class AppSetting extends NamedObject<AppSettingDesc, EmptyProtobufBodyContent> {
    static create(
        owner: ObjectId,
        id: DecAppId,
    ): AppSetting {
        const desc_content = new AppSettingDesc(id, false);
        const builder = new AppSettingBuilder(desc_content, new EmptyProtobufBodyContent());

        return builder.owner(owner).no_create_time().build(AppSetting);
    }

    app_id(): DecAppId {
        return this.desc().content().id;
    }

    auto_update(): boolean {
        return this.desc().content().auto_update
    }

    set_auto_update(auto_update: boolean): void {
        this.desc().content().auto_update = auto_update
    }
}

export class AppSettingDecoder extends NamedObjectDecoder<AppSettingDesc, EmptyProtobufBodyContent, AppSetting> {
    constructor() {
        super(
            new AppSettingDescDecoder(),
            new EmptyProtobufBodyContentDecoder(),
            AppSetting
        );
    }

    static create(): AppSettingDecoder {
        return new AppSettingDecoder();
    }
}
