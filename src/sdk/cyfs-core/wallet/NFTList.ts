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

import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { BuckyHashMap, BuckyHashMapDecoder, BuckyString, BuckyStringDecoder, bucky_time_now } from "../../cyfs-base";

export class NFTListDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.NFTList;
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

const NFTList_DESC_TYPE_INFO = new NFTListDescTypeInfo();

export class NFTListDescContent extends DescContent {
    constructor() {
        super();
    }

    type_info(): DescTypeInfo {
        return NFTList_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return Ok(buf);
    }
}

export class NFTListDescContentDecoder extends DescContentDecoder<NFTListDescContent>{
    type_info(): DescTypeInfo {
        return NFTList_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[NFTListDescContent, Uint8Array]> {
        const self = new NFTListDescContent();
        const ret: [NFTListDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class NFTListBodyContent extends BodyContent {
    obj_list: BuckyHashMap<ObjectId, BuckyString>
    constructor(list: BuckyHashMap<ObjectId, BuckyString>) {
        super();
        this.obj_list = list;
    }

    raw_measure(): BuckyResult<number> {
        return this.obj_list.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return this.obj_list.raw_encode(buf);
    }
}

export class NFTListBodyContentDecoder extends BodyContentDecoder<NFTListBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[NFTListBodyContent, Uint8Array]> {
        let objs;
        {
            const r = new BuckyHashMapDecoder(new ObjectIdDecoder(), new BuckyStringDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }

            [objs, buf] = r.unwrap();
        }
        const self = new NFTListBodyContent(objs);

        const ret: [NFTListBodyContent, Uint8Array] = [self, buf];

        return Ok(ret);
    }
}

export class NFTListDesc extends NamedObjectDesc<NFTListDescContent>{
    // ignore
}

export class NFTListDescDecoder extends NamedObjectDescDecoder<NFTListDescContent>{
    // ignore
}

export class NFTListBuilder extends NamedObjectBuilder<NFTListDescContent, NFTListBodyContent>{
    // ignore
}

export class NFTListId extends NamedObjectId<NFTListDescContent, NFTListBodyContent>{
    constructor(id: ObjectId) {
        super(CoreObjectType.NFTList, id);
    }

    static default(): NFTListId {
        return named_id_gen_default(CoreObjectType.NFTList);
    }

    static from_base_58(s: string): BuckyResult<NFTListId> {
        return named_id_from_base_58(CoreObjectType.NFTList, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<NFTListId> {
        return named_id_try_from_object_id(CoreObjectType.NFTList, id);
    }
}

export class NFTListIdDecoder extends NamedObjectIdDecoder<NFTListDescContent, NFTListBodyContent>{
    constructor() {
        super(CoreObjectType.NFTList);
    }
}


export class NFTList extends NamedObject<NFTListDescContent, NFTListBodyContent>{
    static create(owner: ObjectId): NFTList {
        const desc_content = new NFTListDescContent();
        const body_content = new NFTListBodyContent(new BuckyHashMap());
        const builder = new NFTListBuilder(desc_content, body_content);

        return builder.owner(owner).no_create_time().build(NFTList);
    }

    put(id: ObjectId, comment: BuckyString) {
        this.body_expect().content().obj_list.set(id, comment);
        this.body_expect().set_update_time(bucky_time_now());
    }

    remove(id: ObjectId) {
        this.body_expect().content().obj_list.delete(id);
        this.body_expect().set_update_time(bucky_time_now());
    }

    clear() {
        this.body_expect().content().obj_list.clear();
        this.body_expect().set_update_time(bucky_time_now());
    }

    obj_list(): Map<ObjectId, BuckyString> {
        return this.body_expect().content().obj_list.to(k => k, v => v);
    }
}

export class NFTListDecoder extends NamedObjectDecoder<NFTListDescContent, NFTListBodyContent, NFTList>{
    constructor() {
        super(new NFTListDescContentDecoder(), new NFTListBodyContentDecoder(), NFTList);
    }

    static create(): NFTListDecoder {
        return new NFTListDecoder()
    }
}