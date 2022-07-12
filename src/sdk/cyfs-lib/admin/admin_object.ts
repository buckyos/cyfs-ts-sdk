import { BuckyError, BuckyErrorCode, BuckyResult, DeviceId, DeviceIdDecoder, EmptyProtobufBodyContent, EmptyProtobufBodyContentDecoder, Err, ObjectId, Ok, ProtobufCodecHelper, ProtobufDescContent, ProtobufDescContentDecoder } from "../../cyfs-base";
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

import { CoreObjectType } from "../../cyfs-core";
import * as protos from "../../cyfs-core/codec/protos"
import { GlobalStateAccessMode, GlobalStateCategory } from "../root_state/def";

export class AdminDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.Admin;
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

export const Admin_DESC_TYPE_INFO = new AdminDescTypeInfo();

export enum AdminCommandCode {
    GlobalStateAccessMode = 0
}

export class AdminGlobalStateAccessModeData {
    constructor(public category: GlobalStateCategory, public access_mode: GlobalStateAccessMode) { }

    try_to_proto(): BuckyResult<protos.AdminGlobalStateAccessModeData> {
        const target = new protos.AdminGlobalStateAccessModeData();
        if (this.category === GlobalStateCategory.RootState) {
            target.setCategory(0)
        } else if (this.category === GlobalStateCategory.LocalCache) {
            target.setCategory(1)
        }

        if (this.access_mode === GlobalStateAccessMode.Read) {
            target.setAccessMode(0)
        } else if (this.access_mode === GlobalStateAccessMode.Write) {
            target.setAccessMode(1)
        }

        return Ok(target);
    }

    static try_from_proto(value: protos.AdminGlobalStateAccessModeData): BuckyResult<AdminGlobalStateAccessModeData> {
        let category;
        if (value.getCategory() === 0) {
            category = GlobalStateCategory.RootState
        } else if (value.getCategory() === 1) {
            category = GlobalStateCategory.LocalCache
        } else {
            return Err(new BuckyError(BuckyErrorCode.Unmatch, `unknown AdminGlobalStateAccessModeData category ${value.getCategory()}`))
        }

        let access;
        if (value.getAccessMode() === 0) {
            access = GlobalStateAccessMode.Read
        } else if (value.getAccessMode() === 1) {
            access = GlobalStateAccessMode.Write
        } else {
            return Err(new BuckyError(BuckyErrorCode.Unmatch, `unknown AdminGlobalStateAccessModeData access ${value.getAccessMode()}`))
        }

        const result = new AdminGlobalStateAccessModeData(category, access);

        return Ok(result);
    }
}

export class AdminCommand {
    constructor(public code: AdminCommandCode, public global_state_access_mode_data?: AdminGlobalStateAccessModeData) { }
}

export class AdminDescContent extends ProtobufDescContent {
    constructor(public target: DeviceId, public cmd: AdminCommand) {
        super();
    }

    type_info(): DescTypeInfo {
        return Admin_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.AdminDescContent> {
        const target = new protos.AdminDescContent()
        target.setTarget(ProtobufCodecHelper.encode_buf(this.target).unwrap())
        target.setCmd(this.cmd.code)
        switch (this.cmd.code) {
            case AdminCommandCode.GlobalStateAccessMode:
                target.setGlobalStateAccessMode(this.cmd.global_state_access_mode_data!.try_to_proto().unwrap())
                break;
            default:
                break;
        }
        return Ok(target);
    }
}

export class AdminDescContentDecoder extends ProtobufDescContentDecoder<AdminDescContent, protos.AdminDescContent>{
    constructor() {
        super(protos.AdminDescContent.deserializeBinary)
    }

    type_info(): DescTypeInfo {
        return Admin_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.AdminDescContent): BuckyResult<AdminDescContent> {
        const target_ret = ProtobufCodecHelper.decode_buf(value.getTarget_asU8(), new DeviceIdDecoder());
        if (target_ret.err) {
            return target_ret;
        }

        let cmd;
        if (value.hasGlobalStateAccessMode()) {
            cmd = new AdminCommand(value.getCmd(), AdminGlobalStateAccessModeData.try_from_proto(value.getGlobalStateAccessMode()!).unwrap())
        }

        const result = new AdminDescContent(target_ret.unwrap(), (cmd as AdminCommand));

        return Ok(result);
    }
}

export class AdminDesc extends NamedObjectDesc<AdminDescContent>{
    // ignore
}

export class AdminDescDecoder extends NamedObjectDescDecoder<AdminDescContent>{
    // ignore
}

export class AdminBuilder extends NamedObjectBuilder<AdminDescContent, EmptyProtobufBodyContent>{
    // ignore
}

export class AdminId extends NamedObjectId<AdminDescContent, EmptyProtobufBodyContent>{
    constructor(id: ObjectId) {
        super(CoreObjectType.Admin, id);
    }

    static default(): AdminId {
        return named_id_gen_default(CoreObjectType.Admin);
    }

    static from_base_58(s: string): BuckyResult<AdminId> {
        return named_id_from_base_58(CoreObjectType.Admin, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AdminId> {
        return named_id_try_from_object_id(CoreObjectType.Admin, id);
    }
}

export class AdminIdDecoder extends NamedObjectIdDecoder<AdminDescContent, EmptyProtobufBodyContent>{
    constructor() {
        super(CoreObjectType.Admin);
    }
}


export class Admin extends NamedObject<AdminDescContent, EmptyProtobufBodyContent>{
    static create(target: DeviceId, cmd: AdminCommand): Admin {
        const desc_content = new AdminDescContent(target, cmd);
        const body_content = new EmptyProtobufBodyContent();
        const builder = new AdminBuilder(desc_content, body_content);

        return builder.build(Admin);
    }
}

export class AdminDecoder extends NamedObjectDecoder<AdminDescContent, EmptyProtobufBodyContent, Admin>{
    constructor() {
        super(new AdminDescContentDecoder(), new EmptyProtobufBodyContentDecoder(), Admin);
    }

    static create(): AdminDecoder {
        return new AdminDecoder()
    }
}