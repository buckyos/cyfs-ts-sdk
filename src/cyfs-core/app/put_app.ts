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
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { ObjectId } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { AppStatus, AppStatusDecoder } from "./app_status";

export class PutAppDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.PutApp;
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

const PUTAPP_DESC_TYPE_INFO = new PutAppDescTypeInfo();

export class PutAppDescContent extends DescContent {
    private apps: Vec<AppStatus>;
    constructor(apps: AppStatus[]){
        super();
        this.apps = new Vec(apps)
    }

    type_info(): DescTypeInfo{
        return PUTAPP_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return this.apps.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return this.apps.raw_encode(buf);
    }
}

export class PutAppDescContentDecoder extends DescContentDecoder<PutAppDescContent>{
    type_info(): DescTypeInfo{
        return PUTAPP_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[PutAppDescContent, Uint8Array]>{
        let apps; 
        {
            let r = new VecDecoder(new AppStatusDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [apps, buf] = r.unwrap();
        }
        const self = new PutAppDescContent(apps.value());
        const ret:[PutAppDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class PutAppBodyContent extends BodyContent{
    constructor(){
        super();
    }

    raw_measure(): BuckyResult<number>{
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return Ok(buf);
    }
}

export class PutAppBodyContentDecoder extends BodyContentDecoder<PutAppBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[PutAppBodyContent, Uint8Array]>{

        const self = new PutAppBodyContent();

        const ret:[PutAppBodyContent, Uint8Array] = [self, buf];

        return Ok(ret);
    }
}

export class PutAppDesc extends NamedObjectDesc<PutAppDescContent>{
    // ignore
}

export  class PutAppDescDecoder extends NamedObjectDescDecoder<PutAppDescContent>{
    // ignore
}

export class PutAppBuilder extends NamedObjectBuilder<PutAppDescContent, PutAppBodyContent>{
    // ignore
}

export class PutAppId extends NamedObjectId<PutAppDescContent, PutAppBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.PutApp, id);
    }

    static default(): PutAppId{
        return named_id_gen_default(CoreObjectType.PutApp);
    }

    static from_base_58(s: string): BuckyResult<PutAppId> {
        return named_id_from_base_58(CoreObjectType.PutApp, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<PutAppId>{
        return named_id_try_from_object_id(CoreObjectType.PutApp, id);
    }
}

export class PutAppIdDecoder extends NamedObjectIdDecoder<PutAppDescContent, PutAppBodyContent>{
    constructor(){
        super(CoreObjectType.PutApp);
    }
}


export class PutApp extends NamedObject<PutAppDescContent, PutAppBodyContent>{
    static create(owner: ObjectId, apps: AppStatus[]):PutApp{
        const desc_content = new PutAppDescContent(apps);
        const body_content = new PutAppBodyContent();
        const builder = new PutAppBuilder(desc_content, body_content);
        const self = builder.owner(owner).build();
        return new PutApp(self.desc(), self.body(), self.signs(), self.nonce());
    }
}

export class PutAppDecoder extends NamedObjectDecoder<PutAppDescContent, PutAppBodyContent, PutApp>{
    constructor(){
        super(new PutAppDescContentDecoder(), new PutAppBodyContentDecoder(), PutApp);
    }

    static create(): PutAppDecoder {
        return new PutAppDecoder()
    }

    raw_decode(buf: Uint8Array): BuckyResult<[PutApp, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new PutApp(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [PutApp, Uint8Array];
        });
    }
}