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
import { ObjectId } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { AppStatus, AppStatusDecoder } from "./app_status";
import { DecAppId, DecAppIdDecoder } from "./dec_app";
import { BuckyString, BuckyStringDecoder, bucky_time_now } from "../../cyfs-base";
import { BuckyHashMap, BuckyHashMapDecoder } from "../../cyfs-base/base/bucky_hash_map";

// 一些内置的categroy
export const APPLIST_APP_CATEGORY: string = "app";
export const APPLIST_SERVICE_CATEGORY: string = "service";

export class AppListDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.AppList;
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

const APPLIST_DESC_TYPE_INFO = new AppListDescTypeInfo();

export class AppListDescContent extends DescContent {
    id: string;
    category: string
    constructor(id:string, category: string){
        super();
        this.id = id;
        this.category = category;
    }

    type_info(): DescTypeInfo{
        return APPLIST_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        let ret = 0;
        {
            let r = new BuckyString(this.id).raw_measure();
            if (r.err) {
                return r;
            }
            ret += r.unwrap();
        }

        {
            let r = new BuckyString(this.category).raw_measure();
            if (r.err) {
                return r;
            }
            ret += r.unwrap();
        }
        return Ok(ret);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        {
            let r = new BuckyString(this.id).raw_encode(buf);
            if (r.err) {
                return r;
            }
            buf = r.unwrap();
        }

        {
            let r = new BuckyString(this.category).raw_encode(buf);
            if (r.err) {
                return r;
            }
            buf = r.unwrap();
        }
        return Ok(buf);
    }
}

export class AppListDescContentDecoder extends DescContentDecoder<AppListDescContent>{
    type_info(): DescTypeInfo{
        return APPLIST_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[AppListDescContent, Uint8Array]>{
        let id;
        {
            let r = new BuckyStringDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [id, buf] = r.unwrap();
        }

        let category;
        {
            let r = new BuckyStringDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [category, buf] = r.unwrap();
        }
        const self = new AppListDescContent(id.value(), category.value());
        const ret:[AppListDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class AppListBodyContent extends BodyContent{
    app_list: BuckyHashMap<DecAppId, AppStatus>
    constructor(apps: BuckyHashMap<DecAppId, AppStatus>){
        super();
        this.app_list = apps;
    }

    raw_measure(): BuckyResult<number>{
        return this.app_list.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return this.app_list.raw_encode(buf);
    }
}

export class AppListBodyContentDecoder extends BodyContentDecoder<AppListBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[AppListBodyContent, Uint8Array]>{
        let apps;
        {
            let r = new BuckyHashMapDecoder(new DecAppIdDecoder(), new AppStatusDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }

            [apps, buf] = r.unwrap();
        }
        const self = new AppListBodyContent(apps);

        const ret:[AppListBodyContent, Uint8Array] = [self, buf];

        return Ok(ret);
    }
}

export class AppListDesc extends NamedObjectDesc<AppListDescContent>{
    // ignore
}

export  class AppListDescDecoder extends NamedObjectDescDecoder<AppListDescContent>{
    // ignore
}

export class AppListBuilder extends NamedObjectBuilder<AppListDescContent, AppListBodyContent>{
    // ignore
}

export class AppListId extends NamedObjectId<AppListDescContent, AppListBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.AppList, id);
    }

    static default(): AppListId{
        return named_id_gen_default(CoreObjectType.AppList);
    }

    static from_base_58(s: string): BuckyResult<AppListId> {
        return named_id_from_base_58(CoreObjectType.AppList, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AppListId>{
        return named_id_try_from_object_id(CoreObjectType.AppList, id);
    }
}

export class AppListIdDecoder extends NamedObjectIdDecoder<AppListDescContent, AppListBodyContent>{
    constructor(){
        super(CoreObjectType.AppList);
    }
}


export class AppList extends NamedObject<AppListDescContent, AppListBodyContent>{
    static create(owner: ObjectId, id:string, category: string):AppList{
        const desc_content = new AppListDescContent(id, category);
        const body_content = new AppListBodyContent(new BuckyHashMap());
        const builder = new AppListBuilder(desc_content, body_content);
        const self = builder.owner(owner).no_create_time().build();
        return new AppList(self.desc(), self.body(), self.signs(), self.nonce());
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
        return this.body_expect().content().app_list.to(k=>k,v=>v);
    }
}

export class AppListDecoder extends NamedObjectDecoder<AppListDescContent, AppListBodyContent, AppList>{
    constructor(){
        super(new AppListDescContentDecoder(), new AppListBodyContentDecoder(), AppList);
    }

    static create(): AppListDecoder {
        return new AppListDecoder()
    }

    raw_decode(buf: Uint8Array): BuckyResult<[AppList, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new AppList(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [AppList, Uint8Array];
        });
    }
}