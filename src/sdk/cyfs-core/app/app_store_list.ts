import {
    SubDescType,
    DescTypeInfo, DescContent, DescContentDecoder,
    NamedObjectId, NamedObjectIdDecoder,
    NamedObjectDesc, NamedObjectDescDecoder,
    NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "../../cyfs-base"

import { Ok, BuckyResult } from "../../cyfs-base";
import { ObjectId } from "../../cyfs-base";

import { CoreObjectType } from "../core_obj_type";
import { DecAppId, DecAppIdDecoder } from "./dec_app";
import { BuckyHashSet, bucky_time_now, ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufCodecHelper } from "../../cyfs-base";
import { protos } from '../codec';

export class AppStoreListDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.AppStoreList;
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

const APPSTORELIST_DESC_TYPE_INFO = new AppStoreListDescTypeInfo();

export class AppStoreListDescContent extends DescContent {
    constructor() {
        super();
    }

    type_info(): DescTypeInfo {
        return APPSTORELIST_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return Ok(buf);
    }
}

export class AppStoreListDescContentDecoder extends DescContentDecoder<AppStoreListDescContent>{
    type_info(): DescTypeInfo {
        return APPSTORELIST_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[AppStoreListDescContent, Uint8Array]> {
        const self = new AppStoreListDescContent();
        const ret: [AppStoreListDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class AppStoreListBodyContent extends ProtobufBodyContent {
    app_store_list: BuckyHashSet<DecAppId>
    constructor(list: BuckyHashSet<DecAppId>) {
        super();

        this.app_store_list = list;
    }

    try_to_proto(): BuckyResult<protos.AppStoreListBodyContent> {
        const target = new protos.AppStoreListBodyContent()
        for (const [k] of this.app_store_list.entries()) {
            target.addAppStoreList(ProtobufCodecHelper.encode_buf(k).unwrap())
        }

        return Ok(target);
    }
}

export class AppStoreListBodyContentDecoder extends ProtobufBodyContentDecoder<AppStoreListBodyContent, protos.AppStoreListBodyContent>{
    constructor() {
        super(protos.AppStoreListBodyContent.deserializeBinary)
    }

    try_from_proto(value: protos.AppStoreListBodyContent): BuckyResult<AppStoreListBodyContent> {
        const list: BuckyHashSet<DecAppId> = new BuckyHashSet();

        for (const item of value.getAppStoreListList_asU8()) {
            list.add(ProtobufCodecHelper.decode_buf(item, new DecAppIdDecoder()).unwrap());
        }

        const result = new AppStoreListBodyContent(list);
        return Ok(result);
    }
}

export class AppStoreListDesc extends NamedObjectDesc<AppStoreListDescContent>{
    // ignore
}

export class AppStoreListDescDecoder extends NamedObjectDescDecoder<AppStoreListDescContent>{
    // ignore
}

export class AppStoreListBuilder extends NamedObjectBuilder<AppStoreListDescContent, AppStoreListBodyContent>{
    // ignore
}

export class AppStoreListId extends NamedObjectId<AppStoreListDescContent, AppStoreListBodyContent>{
    constructor(id: ObjectId) {
        super(CoreObjectType.AppStoreList, id);
    }

    static default(): AppStoreListId {
        return named_id_gen_default(CoreObjectType.AppStoreList);
    }

    static from_base_58(s: string): BuckyResult<AppStoreListId> {
        return named_id_from_base_58(CoreObjectType.AppStoreList, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AppStoreListId> {
        return named_id_try_from_object_id(CoreObjectType.AppStoreList, id);
    }
}

export class AppStoreListIdDecoder extends NamedObjectIdDecoder<AppStoreListDescContent, AppStoreListBodyContent>{
    constructor() {
        super(CoreObjectType.AppStoreList);
    }
}


export class AppStoreList extends NamedObject<AppStoreListDescContent, AppStoreListBodyContent>{
    static create(owner: ObjectId): AppStoreList {
        const desc_content = new AppStoreListDescContent();
        const body_content = new AppStoreListBodyContent(new BuckyHashSet());
        const builder = new AppStoreListBuilder(desc_content, body_content);

        return builder.owner(owner).no_create_time().build(AppStoreList);
    }

    put(id: DecAppId) {
        this.body_expect().content().app_store_list.add(id);
        this.body_expect().set_update_time(bucky_time_now());
    }

    remove(id: DecAppId) {
        this.body_expect().content().app_store_list.delete(id);
        this.body_expect().set_update_time(bucky_time_now());
    }

    clear() {
        this.body_expect().content().app_store_list.clear();
        this.body_expect().set_update_time(bucky_time_now());
    }

    app_list(): DecAppId[] {
        return this.body_expect().content().app_store_list.array();
    }
}

export class AppStoreListDecoder extends NamedObjectDecoder<AppStoreListDescContent, AppStoreListBodyContent, AppStoreList>{
    constructor() {
        super(new AppStoreListDescContentDecoder(), new AppStoreListBodyContentDecoder(), AppStoreList);
    }

    static create(): AppStoreListDecoder {
        return new AppStoreListDecoder()
    }
}