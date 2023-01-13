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
import { protos as base_protos } from '../../cyfs-base';

export class FriendPropertyDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.FriendProperty;
    }

    sub_desc_type(): SubDescType{
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "option",
            key_type: "disable"
        }
    }
}

const FriendProperty_DESC_TYPE_INFO = new FriendPropertyDescTypeInfo();

export class FriendPropertyDescContent extends ProtobufDescContent {
    try_to_proto(): BuckyResult<base_protos.EmptyContent> {
        return Ok(new base_protos.EmptyContent());
    }
    constructor(){
        super();
    }

    type_info(): DescTypeInfo{
        return FriendProperty_DESC_TYPE_INFO;
    }
}

export class FriendPropertyDescContentDecoder extends ProtobufDescContentDecoder<FriendPropertyDescContent, protos.FriendPropetyContent>{
    constructor() {
        super(protos.FriendPropetyContent.deserializeBinary)
    }

    try_from_proto(value: protos.FriendPropetyContent): BuckyResult<FriendPropertyDescContent> {
        return Ok(new FriendPropertyDescContent());
    }

    type_info(): DescTypeInfo{
        return FriendProperty_DESC_TYPE_INFO;
    }
}

export class FriendPropertyDesc extends NamedObjectDesc<FriendPropertyDescContent>{
    // ignore
}

export  class FriendPropertyDescDecoder extends NamedObjectDescDecoder<FriendPropertyDescContent>{
    // ignore
}

export class FriendPropertyBuilder extends NamedObjectBuilder<FriendPropertyDescContent, EmptyProtobufBodyContent>{
    // ignore
}

export class FriendPropertyId extends NamedObjectId<FriendPropertyDescContent, EmptyProtobufBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.FriendProperty, id);
    }

    static default(): FriendPropertyId{
        return named_id_gen_default(CoreObjectType.FriendProperty);
    }

    static from_base_58(s: string): BuckyResult<FriendPropertyId> {
        return named_id_from_base_58(CoreObjectType.FriendProperty, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<FriendPropertyId>{
        return named_id_try_from_object_id(CoreObjectType.FriendProperty, id);
    }
}

export class FriendPropertyIdDecoder extends NamedObjectIdDecoder<FriendPropertyDescContent, EmptyProtobufBodyContent>{
    constructor(){
        super(CoreObjectType.FriendProperty);
    }
}


export class FriendProperty extends NamedObject<FriendPropertyDescContent, EmptyProtobufBodyContent>{
    static create(owner: PeopleId):FriendProperty{
        const desc_content = new FriendPropertyDescContent();
        const body_content = new EmptyProtobufBodyContent();
        const builder = new FriendPropertyBuilder(desc_content, body_content);

        return builder.owner(owner.object_id).no_create_time().build(FriendProperty);
    }
}

export class FriendPropertyDecoder extends NamedObjectDecoder<FriendPropertyDescContent, EmptyProtobufBodyContent, FriendProperty>{
    constructor(){
        super(new FriendPropertyDescContentDecoder(), new EmptyProtobufBodyContentDecoder(), FriendProperty);
    }
}