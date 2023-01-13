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
import { EmptyProtobufBodyContent, EmptyProtobufBodyContentDecoder, PeopleId, PeopleIdDecoder, ProtobufCodecHelper, ProtobufDescContent, ProtobufDescContentDecoder } from "../../cyfs-base";

import { protos } from '../codec';

export class AddFriendDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.AddFriend;
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

const AddFriend_DESC_TYPE_INFO = new AddFriendDescTypeInfo();

export class AddFriendDescContent extends ProtobufDescContent {
    try_to_proto(): BuckyResult<protos.AddFriendDescContent> {
        const target = new protos.AddFriendDescContent()
        {
            const r = ProtobufCodecHelper.encode_buf(this.to);
            if (r.err) {
                return r;
            }
            target.setTo(r.unwrap())
        }

        return Ok(target);
    }
    constructor(public to: PeopleId){
        super();
    }

    type_info(): DescTypeInfo{
        return AddFriend_DESC_TYPE_INFO;
    }
}

export class AddFriendDescContentDecoder extends ProtobufDescContentDecoder<AddFriendDescContent, protos.AddFriendDescContent>{
    constructor() {
        super(protos.AddFriendDescContent.deserializeBinary)
    }

    try_from_proto(value: protos.AddFriendDescContent): BuckyResult<AddFriendDescContent> {
        let to;
        {
            const r = ProtobufCodecHelper.decode_buf(value.getTo_asU8(), new PeopleIdDecoder());
            if (r.err) {
                return r;
            }
            to = r.unwrap();
        }

        return Ok(new AddFriendDescContent(to));
    }

    type_info(): DescTypeInfo{
        return AddFriend_DESC_TYPE_INFO;
    }
}


export class AddFriendDesc extends NamedObjectDesc<AddFriendDescContent>{
    // ignore
}

export  class AddFriendDescDecoder extends NamedObjectDescDecoder<AddFriendDescContent>{
    // ignore
}

export class AddFriendBuilder extends NamedObjectBuilder<AddFriendDescContent, EmptyProtobufBodyContent>{
    // ignore
}

export class AddFriendId extends NamedObjectId<AddFriendDescContent, EmptyProtobufBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.AddFriend, id);
    }

    static default(): AddFriendId{
        return named_id_gen_default(CoreObjectType.AddFriend);
    }

    static from_base_58(s: string): BuckyResult<AddFriendId> {
        return named_id_from_base_58(CoreObjectType.AddFriend, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AddFriendId>{
        return named_id_try_from_object_id(CoreObjectType.AddFriend, id);
    }
}

export class AddFriendIdDecoder extends NamedObjectIdDecoder<AddFriendDescContent, EmptyProtobufBodyContent>{
    constructor(){
        super(CoreObjectType.AddFriend);
    }
}


export class AddFriend extends NamedObject<AddFriendDescContent, EmptyProtobufBodyContent>{
    static create(owner: PeopleId, to: PeopleId):AddFriend{
        const desc_content = new AddFriendDescContent(to);
        const body_content = new EmptyProtobufBodyContent();
        const builder = new AddFriendBuilder(desc_content, body_content);

        return builder.owner(owner.object_id).author(owner.object_id).build(AddFriend);
    }

    to():PeopleId{
        return this.desc().content().to;
    }
}

export class AddFriendDecoder extends NamedObjectDecoder<AddFriendDescContent, EmptyProtobufBodyContent, AddFriend>{
    constructor(){
        super(new AddFriendDescContentDecoder(), new EmptyProtobufBodyContentDecoder(), AddFriend);
    }
}