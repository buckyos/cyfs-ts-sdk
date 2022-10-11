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

import { CoreObjectType } from "../core_obj_type";
import { EmptyProtobufBodyContent, EmptyProtobufBodyContentDecoder, PeopleId, ProtobufDescContent, ProtobufDescContentDecoder } from "../../cyfs-base";

import { protos } from '../codec';

export class FriendOptionDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.FriendOption;
    }

    sub_desc_type(): SubDescType{
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }
    }
}

const FriendOption_DESC_TYPE_INFO = new FriendOptionDescTypeInfo();

export class FriendOptionDescContent extends ProtobufDescContent {
    try_to_proto(): BuckyResult<protos.FriendOptionContent> {
        const content = new protos.FriendOptionContent()
        if (this.auto_confirm !== undefined) {
            content.setAutoConfirm(this.auto_confirm?1:0)
        }
        if (this.msg) {
            content.setMsg(this.msg)
        }
        return Ok(content);
    }
    constructor(public auto_confirm?: boolean, public msg?: string){
        super();
    }

    type_info(): DescTypeInfo{
        return FriendOption_DESC_TYPE_INFO;
    }
}

export class FriendOptionDescContentDecoder extends ProtobufDescContentDecoder<FriendOptionDescContent, protos.FriendOptionContent>{
    constructor() {
        super(protos.FriendOptionContent.deserializeBinary)
    }

    try_from_proto(value: protos.FriendOptionContent): BuckyResult<FriendOptionDescContent> {
        let auto_confirm;
        if (value.hasAutoConfirm()) {
            auto_confirm = value.getAutoConfirm() === 1;
        }
        let msg;
        if (value.hasMsg()) {
            msg = value.getMsg();
        }
        return Ok(new FriendOptionDescContent(auto_confirm, msg));
    }

    type_info(): DescTypeInfo{
        return FriendOption_DESC_TYPE_INFO;
    }
}

export class FriendOptionDesc extends NamedObjectDesc<FriendOptionDescContent>{
    // ignore
}

export  class FriendOptionDescDecoder extends NamedObjectDescDecoder<FriendOptionDescContent>{
    // ignore
}

export class FriendOptionBuilder extends NamedObjectBuilder<FriendOptionDescContent, EmptyProtobufBodyContent>{
    // ignore
}

export class FriendOptionId extends NamedObjectId<FriendOptionDescContent, EmptyProtobufBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.FriendOption, id);
    }

    static default(): FriendOptionId{
        return named_id_gen_default(CoreObjectType.FriendOption);
    }

    static from_base_58(s: string): BuckyResult<FriendOptionId> {
        return named_id_from_base_58(CoreObjectType.FriendOption, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<FriendOptionId>{
        return named_id_try_from_object_id(CoreObjectType.FriendOption, id);
    }
}

export class FriendOptionIdDecoder extends NamedObjectIdDecoder<FriendOptionDescContent, EmptyProtobufBodyContent>{
    constructor(){
        super(CoreObjectType.FriendOption);
    }
}


export class FriendOption extends NamedObject<FriendOptionDescContent, EmptyProtobufBodyContent>{
    static create(owner: PeopleId, auto_confirm?: boolean, msg?: string):FriendOption{
        const desc_content = new FriendOptionDescContent(auto_confirm, msg);
        const body_content = new EmptyProtobufBodyContent();
        const builder = new FriendOptionBuilder(desc_content, body_content);

        return builder.owner(owner.object_id).no_create_time().build(FriendOption);
    }
}

export class FriendOptionDecoder extends NamedObjectDecoder<FriendOptionDescContent, EmptyProtobufBodyContent, FriendOption>{
    constructor(){
        super(new FriendOptionDescContentDecoder(), new EmptyProtobufBodyContentDecoder(), FriendOption);
    }
}