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

export class RemoveAppDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.RemoveApp;
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

const REMOVEAPP_DESC_TYPE_INFO = new RemoveAppDescTypeInfo();

export class RemoveAppDescContent extends DescContent {
    private apps: Vec<AppStatus>;
    constructor(apps: AppStatus[]){
        super();
        this.apps = new Vec(apps)
    }

    type_info(): DescTypeInfo{
        return REMOVEAPP_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return this.apps.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return this.apps.raw_encode(buf);
    }
}

export class RemoveAppDescContentDecoder extends DescContentDecoder<RemoveAppDescContent>{
    type_info(): DescTypeInfo{
        return REMOVEAPP_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[RemoveAppDescContent, Uint8Array]>{
        let apps; 
        {
            let r = new VecDecoder(new AppStatusDecoder()).raw_decode(buf);
            if (r.err) {
                return r;
            }
            [apps, buf] = r.unwrap();
        }
        const self = new RemoveAppDescContent(apps.value());
        const ret:[RemoveAppDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class RemoveAppBodyContent extends BodyContent{
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

export class RemoveAppBodyContentDecoder extends BodyContentDecoder<RemoveAppBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[RemoveAppBodyContent, Uint8Array]>{

        const self = new RemoveAppBodyContent();

        const ret:[RemoveAppBodyContent, Uint8Array] = [self, buf];

        return Ok(ret);
    }
}

export class RemoveAppDesc extends NamedObjectDesc<RemoveAppDescContent>{
    // ignore
}

export  class RemoveAppDescDecoder extends NamedObjectDescDecoder<RemoveAppDescContent>{
    // ignore
}

export class RemoveAppBuilder extends NamedObjectBuilder<RemoveAppDescContent, RemoveAppBodyContent>{
    // ignore
}

export class RemoveAppId extends NamedObjectId<RemoveAppDescContent, RemoveAppBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.RemoveApp, id);
    }

    static default(): RemoveAppId{
        return named_id_gen_default(CoreObjectType.RemoveApp);
    }

    static from_base_58(s: string): BuckyResult<RemoveAppId> {
        return named_id_from_base_58(CoreObjectType.RemoveApp, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<RemoveAppId>{
        return named_id_try_from_object_id(CoreObjectType.RemoveApp, id);
    }
}

export class RemoveAppIdDecoder extends NamedObjectIdDecoder<RemoveAppDescContent, RemoveAppBodyContent>{
    constructor(){
        super(CoreObjectType.RemoveApp);
    }
}


export class RemoveApp extends NamedObject<RemoveAppDescContent, RemoveAppBodyContent>{
    static create(owner: ObjectId, apps: AppStatus[]):RemoveApp{
        const desc_content = new RemoveAppDescContent(apps);
        const body_content = new RemoveAppBodyContent();
        const builder = new RemoveAppBuilder(desc_content, body_content);
        const self = builder.owner(owner).build();
        return new RemoveApp(self.desc(), self.body(), self.signs(), self.nonce());
    }
}

export class RemoveAppDecoder extends NamedObjectDecoder<RemoveAppDescContent, RemoveAppBodyContent, RemoveApp>{
    constructor(){
        super(new RemoveAppDescContentDecoder(), new RemoveAppBodyContentDecoder(), RemoveApp);
    }

    static create(): RemoveAppDecoder {
        return new RemoveAppDecoder()
    }

    raw_decode(buf: Uint8Array): BuckyResult<[RemoveApp, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new RemoveApp(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [RemoveApp, Uint8Array];
        });
    }
}