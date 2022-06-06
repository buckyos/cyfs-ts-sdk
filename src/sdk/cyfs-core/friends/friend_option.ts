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
import { PeopleId, ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufDescContent, ProtobufDescContentDecoder } from "../../cyfs-base";

import { protos } from '../codec';
import { protos as base_protos } from '../../cyfs-base';

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
    try_to_proto(): BuckyResult<base_protos.EmptyContent> {
        return Ok(new base_protos.EmptyContent());
    }
    constructor(){
        super();
    }

    type_info(): DescTypeInfo{
        return FriendOption_DESC_TYPE_INFO;
    }
}

export class FriendOptionDescContentDecoder extends ProtobufDescContentDecoder<FriendOptionDescContent, base_protos.EmptyContent>{
    constructor() {
        super(base_protos.EmptyContent.deserializeBinary)
    }

    try_from_proto(value: base_protos.EmptyContent): BuckyResult<FriendOptionDescContent> {
        return Ok(new FriendOptionDescContent());
    }

    type_info(): DescTypeInfo{
        return FriendOption_DESC_TYPE_INFO;
    }
}

export class FriendOptionBodyContent extends ProtobufBodyContent {
    constructor(public auto_confirm?: boolean, public msg?: string) {
        super()
    }
    try_to_proto(): BuckyResult<protos.FriendOptionContent> {
        const target = new protos.FriendOptionContent()
        target.setAutoConfirm(this.auto_confirm?1:0)
        if (this.msg) {
            target.setMsg(this.msg)
        }
        
        return Ok(target)
    }
}

export class FriendOptionBodyContentDecoder extends ProtobufBodyContentDecoder<FriendOptionBodyContent, protos.FriendOptionContent> {
    constructor(){
        super(protos.FriendOptionContent.deserializeBinary)
    }
    try_from_proto(value: protos.FriendOptionContent): BuckyResult<FriendOptionBodyContent> {
        return Ok(new FriendOptionBodyContent(value.getAutoConfirm()?true:false, value.getMsg()));
    }
}

export class FriendOptionDesc extends NamedObjectDesc<FriendOptionDescContent>{
    // ignore
}

export  class FriendOptionDescDecoder extends NamedObjectDescDecoder<FriendOptionDescContent>{
    // ignore
}

export class FriendOptionBuilder extends NamedObjectBuilder<FriendOptionDescContent, FriendOptionBodyContent>{
    // ignore
}

export class FriendOptionId extends NamedObjectId<FriendOptionDescContent, FriendOptionBodyContent>{
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

export class FriendOptionIdDecoder extends NamedObjectIdDecoder<FriendOptionDescContent, FriendOptionBodyContent>{
    constructor(){
        super(CoreObjectType.FriendOption);
    }
}


export class FriendOption extends NamedObject<FriendOptionDescContent, FriendOptionBodyContent>{
    static create(owner: PeopleId, auto_confirm?: boolean, msg?: string):FriendOption{
        const desc_content = new FriendOptionDescContent();
        const body_content = new FriendOptionBodyContent(auto_confirm, msg);
        const builder = new FriendOptionBuilder(desc_content, body_content);

        return builder.owner(owner.object_id).no_create_time().build(FriendOption);
    }
}

export class FriendOptionDecoder extends NamedObjectDecoder<FriendOptionDescContent, FriendOptionBodyContent, FriendOption>{
    constructor(){
        super(new FriendOptionDescContentDecoder(), new FriendOptionBodyContentDecoder(), FriendOption);
    }
}