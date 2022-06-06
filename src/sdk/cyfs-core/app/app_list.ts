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

import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { ObjectId } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { AppStatus, AppStatusDecoder } from "./app_status";
import { DecAppId, DecAppIdDecoder } from "./dec_app";
import { bucky_time_now, ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufCodecHelper, ProtobufDescContent, ProtobufDescContentDecoder } from "../../cyfs-base";
import { BuckyHashMap } from "../../cyfs-base/base/bucky_hash_map";
import { protos } from '../codec';


// 一些内置的categroy
export const APPLIST_APP_CATEGORY = "app";
export const APPLIST_SERVICE_CATEGORY = "service";

export class AppListDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.AppList;
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

const APPLIST_DESC_TYPE_INFO = new AppListDescTypeInfo();

export class AppListDescContent extends ProtobufDescContent {
    constructor(public id: string, public category: string) {
        super();
    }

    type_info(): DescTypeInfo {
        return APPLIST_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.AppListDescContent> {
        const target = new protos.AppListDescContent()
        target.setId(this.id)
        target.setCategory(this.category)

        return Ok(target);
    }
}

export class AppListDescContentDecoder extends ProtobufDescContentDecoder<AppListDescContent, protos.AppListDescContent>{
    constructor() {
        super(protos.AppListDescContent.deserializeBinary)
    }

    type_info(): DescTypeInfo {
        return APPLIST_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.AppListDescContent): BuckyResult<AppListDescContent> {
        const result = new AppListDescContent(value.getId(), value.getCategory());

        return Ok(result);
    }
}

export class AppListBodyContent extends ProtobufBodyContent {
    app_list: BuckyHashMap<DecAppId, AppStatus>
    constructor(apps: BuckyHashMap<DecAppId, AppStatus>) {
        super();

        this.app_list = apps;
    }

    try_to_proto(): BuckyResult<protos.AppListContent> {
        const value = new protos.AppListContent()

        for (const [k, v] of this.app_list.entries()) {
            const app_id = ProtobufCodecHelper.encode_buf(k).unwrap();
            const app_status = ProtobufCodecHelper.encode_buf(v).unwrap();

            const item = new protos.AppListSourceItem()
            item.setAppId(app_id)
            item.setAppStatus(app_status)
            value.addSource(item)
        }

        return Ok(value);
    }
}

export class AppListBodyContentDecoder extends ProtobufBodyContentDecoder<AppListBodyContent, protos.AppListContent>{
    constructor() {
        super(protos.AppListContent.deserializeBinary)
    }

    try_from_proto(value: protos.AppListContent): BuckyResult<AppListBodyContent> {
        const app_list: BuckyHashMap<DecAppId, AppStatus> = new BuckyHashMap();

        const list = ProtobufCodecHelper.ensure_not_null(value.getSourceList()).unwrap();
        for (const item of list) {
            const app_id = ProtobufCodecHelper.decode_buf(item.getAppId_asU8(), new DecAppIdDecoder()).unwrap();
            const app_status = ProtobufCodecHelper.decode_buf(item.getAppStatus_asU8(), new AppStatusDecoder()).unwrap();

            app_list.set(app_id, app_status);
        }

        const result = new AppListBodyContent(app_list);
        return Ok(result);
    }
}

export class AppListDesc extends NamedObjectDesc<AppListDescContent>{
    // ignore
}

export class AppListDescDecoder extends NamedObjectDescDecoder<AppListDescContent>{
    // ignore
}

export class AppListBuilder extends NamedObjectBuilder<AppListDescContent, AppListBodyContent>{
    // ignore
}

export class AppListId extends NamedObjectId<AppListDescContent, AppListBodyContent>{
    constructor(id: ObjectId) {
        super(CoreObjectType.AppList, id);
    }

    static default(): AppListId {
        return named_id_gen_default(CoreObjectType.AppList);
    }

    static from_base_58(s: string): BuckyResult<AppListId> {
        return named_id_from_base_58(CoreObjectType.AppList, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AppListId> {
        return named_id_try_from_object_id(CoreObjectType.AppList, id);
    }
}

export class AppListIdDecoder extends NamedObjectIdDecoder<AppListDescContent, AppListBodyContent>{
    constructor() {
        super(CoreObjectType.AppList);
    }
}


export class AppList extends NamedObject<AppListDescContent, AppListBodyContent>{
    static create(owner: ObjectId, id: string, category: string): AppList {
        const desc_content = new AppListDescContent(id, category);
        const body_content = new AppListBodyContent(new BuckyHashMap());
        const builder = new AppListBuilder(desc_content, body_content);

        return builder.owner(owner).no_create_time().build(AppList);
    }

    put(app: AppStatus) {
        this.body_expect().content().app_list.set(app.app_id(), app);
        this.body_expect().set_update_time(bucky_time_now());
    }

    remove(id: DecAppId) {
        this.body_expect().content().app_list.delete(id);
        this.body_expect().set_update_time(bucky_time_now());
    }

    clear() {
        this.body_expect().content().app_list.clear();
        this.body_expect().set_update_time(bucky_time_now());
    }

    app_list(): Map<DecAppId, AppStatus> {
        return this.body_expect().content().app_list.to(k => k, v => v);
    }

    exists(id: DecAppId): boolean {
        return this.body_expect().content().app_list.has(id)
    }
}

export class AppListDecoder extends NamedObjectDecoder<AppListDescContent, AppListBodyContent, AppList>{
    constructor() {
        super(new AppListDescContentDecoder(), new AppListBodyContentDecoder(), AppList);
    }

    static create(): AppListDecoder {
        return new AppListDecoder()
    }
}