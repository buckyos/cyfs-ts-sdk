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

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { Option, OptionEncoder, OptionDecoder, None, } from "../../cyfs-base/base/option";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";
import { bucky_time_now } from "../../cyfs-base/base/time";

import { CoreObjectType } from "../core_obj_type";
import { DecApp } from "./dec_app";

export class AppExtInfoDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.AppExtInfo;
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

const DECAPP_DESC_TYPE_INFO = new AppExtInfoDescTypeInfo();

export class AppExtInfoDescContent extends DescContent {
    id: string;
    constructor(id: string){
        super();
        this.id = id;
    }

    type_info(): DescTypeInfo{
        return DECAPP_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        let size = new BuckyString(this.id).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return new BuckyString(this.id).raw_encode(buf)
    }
}

export class AppExtInfoDescContentDecoder extends DescContentDecoder<AppExtInfoDescContent>{
    type_info(): DescTypeInfo{
        return DECAPP_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[AppExtInfoDescContent, Uint8Array]>{
        let id;
        {
            let r = new BuckyStringDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [id, buf] = r.unwrap();
        }

        const self = new AppExtInfoDescContent(id.value());

        const ret:[AppExtInfoDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class AppExtInfoBodyContent extends BodyContent{
    info: BuckyString
    constructor(info: BuckyString){
        super();
        this.info = info
    }

    raw_measure(): BuckyResult<number>{
        return this.info.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return this.info.raw_encode(buf);
    }
}

export class AppExtInfoBodyContentDecoder extends BodyContentDecoder<AppExtInfoBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[AppExtInfoBodyContent, Uint8Array]>{
        let info;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);

            if(r.err){
                return r;
            }
            [info, buf] = r.unwrap();
        }

        const self = new AppExtInfoBodyContent(info);

        const ret:[AppExtInfoBodyContent, Uint8Array] = [self, buf];

        return Ok(ret);
    }
}

export class AppExtInfoDesc extends NamedObjectDesc<AppExtInfoDescContent>{
    // ignore
}

export  class AppExtInfoDescDecoder extends NamedObjectDescDecoder<AppExtInfoDescContent>{
    // ignore
}

export class AppExtInfoBuilder extends NamedObjectBuilder<AppExtInfoDescContent, AppExtInfoBodyContent>{
    // ignore
}

export class AppExtInfoId extends NamedObjectId<AppExtInfoDescContent, AppExtInfoBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.AppExtInfo, id);
    }

    static default(): AppExtInfoId{
        return named_id_gen_default(CoreObjectType.AppExtInfo);
    }

    static from_base_58(s: string): BuckyResult<AppExtInfoId> {
        return named_id_from_base_58(CoreObjectType.AppExtInfo, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AppExtInfoId>{
        return named_id_try_from_object_id(CoreObjectType.AppExtInfo, id);
    }
}

export class AppExtInfoIdDecoder extends NamedObjectIdDecoder<AppExtInfoDescContent, AppExtInfoBodyContent>{
    constructor(){
        super(CoreObjectType.AppExtInfo);
    }
}


export class AppExtInfo extends NamedObject<AppExtInfoDescContent, AppExtInfoBodyContent>{
    static create(owner: ObjectId, id: string):AppExtInfo{
        const desc_content = new AppExtInfoDescContent(id);
        const body_content = new AppExtInfoBodyContent(new BuckyString(""));
        const builder = new AppExtInfoBuilder(desc_content, body_content);
        const self = builder.owner(owner).no_create_time().build();
        return new AppExtInfo(self.desc(), self.body(), self.signs(), self.nonce());
    }

    static getExtId(app: DecApp):ObjectId {
        return AppExtInfo.create(app.desc().owner()!.unwrap(), app.name()).desc().calculate_id();
    }

    info(): string {
        return this.body_expect().content().info.value()
    }

    set_info(info: string) {
        this.body_expect().content().info = new BuckyString(info);
        this.body_expect().set_update_time(bucky_time_now());
    }
}

export class AppExtInfoDecoder extends NamedObjectDecoder<AppExtInfoDescContent, AppExtInfoBodyContent, AppExtInfo>{
    constructor(){
        super(new AppExtInfoDescContentDecoder(), new AppExtInfoBodyContentDecoder(), AppExtInfo);
    }

    static create(): AppExtInfoDecoder {
        return new AppExtInfoDecoder()
    }

    raw_decode(buf: Uint8Array): BuckyResult<[AppExtInfo, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new AppExtInfo(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [AppExtInfo, Uint8Array];
        });
    }
}