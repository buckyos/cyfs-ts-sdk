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
import { ObjectId } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { DecAppId, DecAppIdDecoder } from "./dec_app";
import { BuckyHashSet, BuckyHashSetDecoder, BuckySet, BuckySetDecoder, bucky_time_now } from "../../cyfs-base";

export class AppStoreListDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.AppStoreList;
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

const APPSTORELIST_DESC_TYPE_INFO = new AppStoreListDescTypeInfo();

export class AppStoreListDescContent extends DescContent {
    constructor(){
        super();
    }

    type_info(): DescTypeInfo{
        return APPSTORELIST_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return Ok(buf);
    }
}

export class AppStoreListDescContentDecoder extends DescContentDecoder<AppStoreListDescContent>{
    type_info(): DescTypeInfo{
        return APPSTORELIST_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[AppStoreListDescContent, Uint8Array]>{
        const self = new AppStoreListDescContent();
        const ret:[AppStoreListDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class AppStoreListBodyContent extends BodyContent{
    app_store_list: BuckyHashSet<DecAppId>
    constructor(list: BuckyHashSet<DecAppId>){
        super();
        this.app_store_list = list;
    }

    raw_measure(): BuckyResult<number>{
        return this.app_store_list.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return this.app_store_list.raw_encode(buf);
    }
}

export class AppStoreListBodyContentDecoder extends BodyContentDecoder<AppStoreListBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[AppStoreListBodyContent, Uint8Array]>{
        let apps;
        {
            let r = new BuckyHashSetDecoder(new DecAppIdDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }

            [apps, buf] = r.unwrap();
        }
        const self = new AppStoreListBodyContent(apps);

        const ret:[AppStoreListBodyContent, Uint8Array] = [self, buf];

        return Ok(ret);
    }
}

export class AppStoreListDesc extends NamedObjectDesc<AppStoreListDescContent>{
    // ignore
}

export  class AppStoreListDescDecoder extends NamedObjectDescDecoder<AppStoreListDescContent>{
    // ignore
}

export class AppStoreListBuilder extends NamedObjectBuilder<AppStoreListDescContent, AppStoreListBodyContent>{
    // ignore
}

export class AppStoreListId extends NamedObjectId<AppStoreListDescContent, AppStoreListBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.AppStoreList, id);
    }

    static default(): AppStoreListId{
        return named_id_gen_default(CoreObjectType.AppStoreList);
    }

    static from_base_58(s: string): BuckyResult<AppStoreListId> {
        return named_id_from_base_58(CoreObjectType.AppStoreList, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AppStoreListId>{
        return named_id_try_from_object_id(CoreObjectType.AppStoreList, id);
    }
}

export class AppStoreListIdDecoder extends NamedObjectIdDecoder<AppStoreListDescContent, AppStoreListBodyContent>{
    constructor(){
        super(CoreObjectType.AppStoreList);
    }
}


export class AppStoreList extends NamedObject<AppStoreListDescContent, AppStoreListBodyContent>{
    static create(owner: ObjectId):AppStoreList{
        const desc_content = new AppStoreListDescContent();
        const body_content = new AppStoreListBodyContent(new BuckyHashSet());
        const builder = new AppStoreListBuilder(desc_content, body_content);
        const self = builder.owner(owner).no_create_time().build();
        return new AppStoreList(self.desc(), self.body(), self.signs(), self.nonce());
    }

    put(id: DecAppId) {
        this.body_expect().content().app_store_list.add(id);
        this.body_expect().inc_update_time(bucky_time_now());
    }

    remove(id: DecAppId) {
        this.body_expect().content().app_store_list.delete(id);
        this.body_expect().inc_update_time(bucky_time_now());
    }

    clear() {
        this.body_expect().content().app_store_list.clear();
        this.body_expect().inc_update_time(bucky_time_now());
    }

    app_list(): DecAppId[] {
        return this.body_expect().content().app_store_list.array();
    }
}

export class AppStoreListDecoder extends NamedObjectDecoder<AppStoreListDescContent, AppStoreListBodyContent, AppStoreList>{
    constructor(){
        super(new AppStoreListDescContentDecoder(), new AppStoreListBodyContentDecoder(), AppStoreList);
    }

    static create(): AppStoreListDecoder {
        return new AppStoreListDecoder()
    }

    raw_decode(buf: Uint8Array): BuckyResult<[AppStoreList, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new AppStoreList(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [AppStoreList, Uint8Array];
        });
    }
}