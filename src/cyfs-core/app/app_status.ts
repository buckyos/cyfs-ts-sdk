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
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { ObjectId } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { DecAppId, DecAppIdDecoder } from "./dec_app";

export class AppStatusDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.AppStatus;
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

const APPSTATUS_DESC_TYPE_INFO = new AppStatusDescTypeInfo();

export class AppStatusDescContent extends DescContent {
    id: DecAppId;

    constructor(id: DecAppId){
        super();
        this.id = id;
    }

    type_info(): DescTypeInfo{
        return APPSTATUS_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return this.id.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return this.id.raw_encode(buf);
    }
}

export class AppStatusDescContentDecoder extends DescContentDecoder<AppStatusDescContent>{
    type_info(): DescTypeInfo{
        return APPSTATUS_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[AppStatusDescContent, Uint8Array]>{
        let id;
        {
            let r = new DecAppIdDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [id, buf] = r.unwrap()
        }
        const self = new AppStatusDescContent(id);
        const ret:[AppStatusDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class AppStatusBodyContent extends BodyContent{
    version: string;
    status: number;
    constructor(version: string, status: number){
        super();
        this.version = version;
        this.status = status;
    }

    raw_measure(): BuckyResult<number>{
        let size = 0;
        {
            let r = new BuckyString(this.version).raw_measure();
            if (r.err) {
                return r;
            }

            size += r.unwrap();
        }
        {
            let r = new BuckyNumber("u8", this.status).raw_measure();
            if (r.err) {
                return r;
            }

            size += r.unwrap();
        }
        return Ok(size)
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        {
            let r = new BuckyString(this.version).raw_encode(buf);
            if (r.err) {
                return r;
            }
            buf = r.unwrap();
        }
        {
            let r = new BuckyNumber("u8", this.status).raw_encode(buf);
            if (r.err) {
                return r;
            }
            buf = r.unwrap();
        }
        return Ok(buf);
    }
}

export class AppStatusBodyContentDecoder extends BodyContentDecoder<AppStatusBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[AppStatusBodyContent, Uint8Array]>{

        let version;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);

            if(r.err){
                return r;
            }
            [version, buf] = r.unwrap();
        }

        let status;
        {
            const r = new BuckyNumberDecoder("u8").raw_decode(buf);

            if(r.err){
                return r;
            }
            [status, buf] = r.unwrap();
        } 

        const self = new AppStatusBodyContent(version.value(), status.toNumber());

        const ret:[AppStatusBodyContent, Uint8Array] = [self, buf];

        return Ok(ret);
    }
}

export class AppStatusDesc extends NamedObjectDesc<AppStatusDescContent>{
    // ignore
}

export  class AppStatusDescDecoder extends NamedObjectDescDecoder<AppStatusDescContent>{
    // ignore
}

export class AppStatusBuilder extends NamedObjectBuilder<AppStatusDescContent, AppStatusBodyContent>{
    // ignore
}

export class AppStatusId extends NamedObjectId<AppStatusDescContent, AppStatusBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.AppStatus, id);
    }

    static default(): AppStatusId{
        return named_id_gen_default(CoreObjectType.AppStatus);
    }

    static from_base_58(s: string): BuckyResult<AppStatusId> {
        return named_id_from_base_58(CoreObjectType.AppStatus, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AppStatusId>{
        return named_id_try_from_object_id(CoreObjectType.AppStatus, id);
    }
}

export class AppStatusIdDecoder extends NamedObjectIdDecoder<AppStatusDescContent, AppStatusBodyContent>{
    constructor(){
        super(CoreObjectType.AppStatus);
    }
}

export class AppStatus extends NamedObject<AppStatusDescContent, AppStatusBodyContent>{
    static create(owner: ObjectId, id: DecAppId, version: string, status: boolean):AppStatus{
        const desc_content = new AppStatusDescContent(id);
        const body_content = new AppStatusBodyContent(version, status?1:0);
        const builder = new AppStatusBuilder(desc_content, body_content);
        const self = builder.owner(owner).no_create_time().build();
        return new AppStatus(self.desc(), self.body(), self.signs(), self.nonce());
    }

    app_id(): DecAppId {
        return this.desc().content().id;
    }

    version(): string {
        return this.body_expect().content().version;
    }

    status(): boolean {
        return this.body_expect().content().status === 1;
    }
}

export class AppStatusDecoder extends NamedObjectDecoder<AppStatusDescContent, AppStatusBodyContent, AppStatus>{
    constructor(){
        super(new AppStatusDescContentDecoder(), new AppStatusBodyContentDecoder(), AppStatus);
    }

    static create(): AppStatusDecoder {
        return new AppStatusDecoder()
    }

    raw_decode(buf: Uint8Array): BuckyResult<[AppStatus, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new AppStatus(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [AppStatus, Uint8Array];
        });
    }
}