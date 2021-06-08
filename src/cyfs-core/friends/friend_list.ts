import {
    SubDescType,
    DescTypeInfo, DescContent, DescContentDecoder,
    BodyContent, BodyContentDecoder,
    NamedObjectId, NamedObjectIdDecoder,
    NamedObjectDesc, NamedObjectDescDecoder,
    NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "../../cyfs-base/objects/object"

import { Ok, BuckyResult} from "../../cyfs-base/base/results";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { PeopleId } from "../../cyfs-base";
import { BuckyHashMap, BuckyHashMapDecoder } from "../../cyfs-base/base/bucky_hash_map";

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

export class FriendListDescContent extends DescContent {

    constructor(){
        super();
    }

    type_info(): DescTypeInfo{
        return FRIENDLIST_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return Ok(buf);
    }
}

export class FriendListDescContentDecoder extends DescContentDecoder<FriendListDescContent>{
    type_info(): DescTypeInfo{
        return FRIENDLIST_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[FriendListDescContent, Uint8Array]>{
        const self = new FriendListDescContent();
        const ret:[FriendListDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class FriendContent implements RawEncode{
    raw_measure(ctx?:any): BuckyResult<number>{
        return Ok(0);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        return Ok(buf);
    }
}

export class FriendContentDecoder implements RawDecode<FriendContent>{
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[FriendContent, Uint8Array]>{
        const ret:[FriendContent, Uint8Array] = [new FriendContent(), buf];
        return Ok(ret);
    }
}

export class FriendListBodyContent extends BodyContent{
    private readonly m_friends: BuckyHashMap<ObjectId, FriendContent>;
    constructor(friends: BuckyHashMap<ObjectId, FriendContent>){
        super();
        this.m_friends = friends;
    }

    friend_list():BuckyHashMap<ObjectId,FriendContent>{
        return this.m_friends;
    }

    raw_measure(): BuckyResult<number>{
        return this.m_friends.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return  this.m_friends.raw_encode(buf);
    }
}

export class FriendListBodyContentDecoder extends BodyContentDecoder<FriendListBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[FriendListBodyContent, Uint8Array]>{

        let friends;
        {
            const r = new BuckyHashMapDecoder(
                new ObjectIdDecoder(),
                new FriendContentDecoder()
            ).raw_decode(buf);

            if(r.err){
                return r;
            }
            [friends, buf] = r.unwrap();
        }

        const self = new FriendListBodyContent(friends);

        const ret:[FriendListBodyContent, Uint8Array] = [self, buf];

        return Ok(ret);
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
    static create(owner: PeopleId):FriendList{
        const desc_content = new FriendListDescContent();
        const body_content = new FriendListBodyContent(new BuckyHashMap<ObjectId, FriendContent>());
        const builder = new FriendListBuilder(desc_content, body_content);
        const self = builder.owner(owner.object_id).build();
        return new FriendList(self.desc(), self.body(), self.signs(), self.nonce());
    }

    friend_list():BuckyHashMap<ObjectId,FriendContent>{
        return this.body_expect().content().friend_list();
    }
}

export class FriendListDecoder extends NamedObjectDecoder<FriendListDescContent, FriendListBodyContent, FriendList>{
    constructor(){
        super(new FriendListDescContentDecoder(), new FriendListBodyContentDecoder(), FriendList);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[FriendList, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new FriendList(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [FriendList, Uint8Array];
        });
    }
}