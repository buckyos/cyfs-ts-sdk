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
import { RawEncode, RawEncodePurpose } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { bucky_time_now, PeopleId, ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufCodecHelper, ProtobufDescContent, ProtobufDescContentDecoder } from "../../cyfs-base";
import { BuckyHashMap } from "../../cyfs-base/base/bucky_hash_map";
import { protos } from "../codec";
import { protos as base_proto } from '../../cyfs-base';

export class FriendListDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.FriendList;
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

const FRIENDLIST_DESC_TYPE_INFO = new FriendListDescTypeInfo();

export class FriendListDescContent extends ProtobufDescContent {
    try_to_proto(): BuckyResult<base_proto.EmptyContent> {
        return Ok(new base_proto.EmptyContent());
    }

    constructor(){
        super();
    }

    type_info(): DescTypeInfo{
        return FRIENDLIST_DESC_TYPE_INFO;
    }
}

export class FriendListDescContentDecoder extends ProtobufDescContentDecoder<FriendListDescContent, base_proto.EmptyContent>{
    try_from_proto(value: base_proto.EmptyContent): BuckyResult<FriendListDescContent> {
        return Ok(new FriendListDescContent())
    }
    type_info(): DescTypeInfo{
        return FRIENDLIST_DESC_TYPE_INFO;
    }
    constructor(){
        super(base_proto.EmptyContent.deserializeBinary);
    }
}

export class FriendContent implements RawEncode{
    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number> {
        return Ok(0)
    }
    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array> {
        return Ok(buf)
    }
}

export class FriendListBodyContent extends ProtobufBodyContent {
    try_to_proto(): BuckyResult<protos.FriendListContent> {
        const target = new protos.FriendListContent()
        target.setAutoConfirm(this.auto_confirm?1:0)
        target.setAutoMsg(this.auto_msg)
        for (const [k, v] of this.friends.entries()) {
            const item = new protos.FriendItem()
            {
                const r = ProtobufCodecHelper.encode_buf(k);
                if (r.err) {
                    return r;
                }
                item.setId(r.unwrap())
            }
            target.addFriends(item)
        }
        return Ok(target)
    }
    constructor(public friends: BuckyHashMap<ObjectId, FriendContent>, public auto_confirm: boolean, public auto_msg: string){
        super();
    }
}

export class FriendListBodyContentDecoder extends ProtobufBodyContentDecoder<FriendListBodyContent, protos.FriendListContent>{
    try_from_proto(value: protos.FriendListContent): BuckyResult<FriendListBodyContent> {
        const list = new BuckyHashMap<ObjectId, FriendContent>();
        {
            for (const item of value.getFriendsList()) {
                const r = ProtobufCodecHelper.decode_buf(item.getId_asU8(), new ObjectIdDecoder());
                if (r.err) {
                    return r;
                }

                list.set(r.unwrap(), new FriendContent());
            }
        }

        const auto_confirm = value.getAutoConfirm()?true:false;
        const auto_msg = value.getAutoMsg();

        return Ok(new FriendListBodyContent(list, auto_confirm, auto_msg));
    }

    constructor() {
        super(protos.FriendListContent.deserializeBinary)
    }
    
}

export class FriendListDesc extends NamedObjectDesc<FriendListDescContent>{
    // ignore
}

export  class FriendListDescDecoder extends NamedObjectDescDecoder<FriendListDescContent>{
    // ignore
}

export class FriendListBuilder extends NamedObjectBuilder<FriendListDescContent, FriendListBodyContent>{
    // ignore
}

export class FriendListId extends NamedObjectId<FriendListDescContent, FriendListBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.FriendList, id);
    }

    static default(): FriendListId{
        return named_id_gen_default(CoreObjectType.FriendList);
    }

    static from_base_58(s: string): BuckyResult<FriendListId> {
        return named_id_from_base_58(CoreObjectType.FriendList, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<FriendListId>{
        return named_id_try_from_object_id(CoreObjectType.FriendList, id);
    }
}

export class FriendListIdDecoder extends NamedObjectIdDecoder<FriendListDescContent, FriendListBodyContent>{
    constructor(){
        super(CoreObjectType.FriendList);
    }
}


export class FriendList extends NamedObject<FriendListDescContent, FriendListBodyContent>{
    static create(owner: PeopleId, auto_confirm: boolean):FriendList{
        const desc_content = new FriendListDescContent();
        const body_content = new FriendListBodyContent(new BuckyHashMap<ObjectId, FriendContent>(), auto_confirm, '');
        const builder = new FriendListBuilder(desc_content, body_content);

        return builder.owner(owner.object_id).no_create_time().build(FriendList);
    }

    // 取到friendlist，修改后要记得increase_update_time
    friend_list():BuckyHashMap<ObjectId,FriendContent>{
        return this.body_expect().content().friends;
    }

    auto_confirm():boolean {
        return this.body_expect().content().auto_confirm;
    }

    auto_msg():string {
        return this.body_expect().content().auto_msg;
    }

    set_auto_confirm(auto_confirm: boolean) {
        this.body_expect().content().auto_confirm = auto_confirm;
        this.body_expect().increase_update_time(bucky_time_now());
    }

    set_auto_msg(auto_msg: string) {
        this.body_expect().content().auto_msg = auto_msg;
        this.body_expect().increase_update_time(bucky_time_now());
    }
}

export class FriendListDecoder extends NamedObjectDecoder<FriendListDescContent, FriendListBodyContent, FriendList>{
    constructor(){
        super(new FriendListDescContentDecoder(), new FriendListBodyContentDecoder(), FriendList);
    }
}