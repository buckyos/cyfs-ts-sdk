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

export class RemoveFriendDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.RemoveFriend;
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

const RemoveFriend_DESC_TYPE_INFO = new RemoveFriendDescTypeInfo();

export class RemoveFriendDescContent extends ProtobufDescContent {
    try_to_proto(): BuckyResult<protos.RemoveFriendDescContent> {
        const target = new protos.RemoveFriendDescContent()
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
        return RemoveFriend_DESC_TYPE_INFO;
    }
}

export class RemoveFriendDescContentDecoder extends ProtobufDescContentDecoder<RemoveFriendDescContent, protos.RemoveFriendDescContent>{
    constructor() {
        super(protos.RemoveFriendDescContent.deserializeBinary)
    }

    try_from_proto(value: protos.RemoveFriendDescContent): BuckyResult<RemoveFriendDescContent> {
        let to;
        {
            const r = ProtobufCodecHelper.decode_buf(value.getTo_asU8(), new PeopleIdDecoder());
            if (r.err) {
                return r;
            }
            to = r.unwrap();
        }

        return Ok(new RemoveFriendDescContent(to));
    }

    type_info(): DescTypeInfo{
        return RemoveFriend_DESC_TYPE_INFO;
    }
}


export class RemoveFriendDesc extends NamedObjectDesc<RemoveFriendDescContent>{
    // ignore
}

export  class RemoveFriendDescDecoder extends NamedObjectDescDecoder<RemoveFriendDescContent>{
    // ignore
}

export class RemoveFriendBuilder extends NamedObjectBuilder<RemoveFriendDescContent, EmptyProtobufBodyContent>{
    // ignore
}

export class RemoveFriendId extends NamedObjectId<RemoveFriendDescContent, EmptyProtobufBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.RemoveFriend, id);
    }

    static default(): RemoveFriendId{
        return named_id_gen_default(CoreObjectType.RemoveFriend);
    }

    static from_base_58(s: string): BuckyResult<RemoveFriendId> {
        return named_id_from_base_58(CoreObjectType.RemoveFriend, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<RemoveFriendId>{
        return named_id_try_from_object_id(CoreObjectType.RemoveFriend, id);
    }
}

export class RemoveFriendIdDecoder extends NamedObjectIdDecoder<RemoveFriendDescContent, EmptyProtobufBodyContent>{
    constructor(){
        super(CoreObjectType.RemoveFriend);
    }
}


export class RemoveFriend extends NamedObject<RemoveFriendDescContent, EmptyProtobufBodyContent>{
    static create(owner: PeopleId, to: PeopleId):RemoveFriend{
        const desc_content = new RemoveFriendDescContent(to);
        const body_content = new EmptyProtobufBodyContent();
        const builder = new RemoveFriendBuilder(desc_content, body_content);

        return builder.owner(owner.object_id).author(owner.object_id).build(RemoveFriend);
    }

    to():PeopleId{
        return this.desc().content().to;
    }
}

export class RemoveFriendDecoder extends NamedObjectDecoder<RemoveFriendDescContent, EmptyProtobufBodyContent, RemoveFriend>{
    constructor(){
        super(new RemoveFriendDescContentDecoder(), new EmptyProtobufBodyContentDecoder(), RemoveFriend);
    }
}