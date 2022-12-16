import {
    SubDescType,
    DescTypeInfo,
    NamedObjectId, NamedObjectIdDecoder,
    NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "../../cyfs-base/objects/object"

import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { ObjectId } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { DecAppId, DecAppIdDecoder } from "./dec_app";
import { BuckyHashSet, EmptyProtobufBodyContent, EmptyProtobufBodyContentDecoder, ProtobufCodecHelper, ProtobufDescContent, ProtobufDescContentDecoder } from "../../cyfs-base";
import { protos } from '../codec';


// 一些内置的categroy
// 一些内置的categroy
export const APP_LOCAL_LIST_CATEGORY_APP = "app";
export const APP_LOCAL_LIST_PATH = "/app/manager/local_list";

export class AppLocalListDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.AppLocalList;
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

const APPLIST_DESC_TYPE_INFO = new AppLocalListDescTypeInfo();

class AppLocalListItem {
    constructor(public app_id: DecAppId) { }

    try_to_proto(): BuckyResult<protos.AppLocalListItem> {
        const r = ProtobufCodecHelper.encode_buf(this.app_id);
        if (r.err) {
            return r;
        }
        const ret = new protos.AppLocalListItem()
        ret.setAppId(r.unwrap())
        return Ok(ret);
    }

    static try_from_proto(value: protos.AppLocalListItem): BuckyResult<AppLocalListItem> {
        const r = ProtobufCodecHelper.decode_buf(value.getAppId_asU8(), new DecAppIdDecoder());
        if (r.err) {
            return r;
        }

        return Ok(new AppLocalListItem(r.unwrap()))
    }
}

export class AppLocalListDescContent extends ProtobufDescContent {
    constructor(public id: string, public app_list: BuckyHashSet<DecAppId>) {
        super();
    }

    type_info(): DescTypeInfo {
        return APPLIST_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.AppLocalListDesc> {
        const ret = new protos.AppLocalListDesc()
        ret.setId(this.id)
        for (const id of this.app_list.keys()) {
            const r = new AppLocalListItem(id).try_to_proto();
            if (r.err) {
                return r;
            }
            ret.addList(r.unwrap())
        }

        return Ok(ret);
    }
}

export class AppLocalListDescContentDecoder extends ProtobufDescContentDecoder<AppLocalListDescContent, protos.AppLocalListDesc>{
    constructor() {
        super(protos.AppLocalListDesc.deserializeBinary)
    }

    type_info(): DescTypeInfo {
        return APPLIST_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.AppLocalListDesc): BuckyResult<AppLocalListDescContent> {
        const list = new BuckyHashSet<DecAppId>();
        for (const item of value.getListList()) {
            const r = AppLocalListItem.try_from_proto(item);
            if (r.err) {
                return r
            }
            list.add(r.unwrap().app_id)
        }
        const result = new AppLocalListDescContent(value.getId(), list);

        return Ok(result);
    }
}

export class AppLocalListBuilder extends NamedObjectBuilder<AppLocalListDescContent, EmptyProtobufBodyContent>{
    // ignore
}

export class AppLocalListId extends NamedObjectId<AppLocalListDescContent, EmptyProtobufBodyContent>{
    constructor(id: ObjectId) {
        super(CoreObjectType.AppLocalList, id);
    }

    static default(): AppLocalListId {
        return named_id_gen_default(CoreObjectType.AppList);
    }

    static from_base_58(s: string): BuckyResult<AppLocalListId> {
        return named_id_from_base_58(CoreObjectType.AppList, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AppLocalListId> {
        return named_id_try_from_object_id(CoreObjectType.AppList, id);
    }
}

export class AppLocalListIdDecoder extends NamedObjectIdDecoder<AppLocalListDescContent, EmptyProtobufBodyContent>{
    constructor() {
        super(CoreObjectType.AppList);
    }
}


export class AppLocalList extends NamedObject<AppLocalListDescContent, EmptyProtobufBodyContent>{
    static create(owner: ObjectId, id: string): AppLocalList {
        const desc_content = new AppLocalListDescContent(id, new BuckyHashSet());
        const builder = new AppLocalListBuilder(desc_content, new EmptyProtobufBodyContent());

        return builder.owner(owner).no_create_time().build(AppLocalList);
    }

    insert(id: DecAppId): void {
        this.desc().content().app_list.add(id);
    }

    remove(id: DecAppId): void {
        this.desc().content().app_list.delete(id);
    }

    clear(): void {
        this.desc().content().app_list.clear();
    }

    app_list(): BuckyHashSet<DecAppId> {
        return this.desc().content().app_list;
    }

    id(): string {
        return this.desc().content().id
    }

    exists(id: DecAppId): boolean {
        return this.desc().content().app_list.has(id)
    }
}

export class AppLocalListDecoder extends NamedObjectDecoder<AppLocalListDescContent, EmptyProtobufBodyContent, AppLocalList>{
    constructor() {
        super(new AppLocalListDescContentDecoder(), new EmptyProtobufBodyContentDecoder(), AppLocalList);
    }

    static create(): AppLocalListDecoder {
        return new AppLocalListDecoder()
    }
}