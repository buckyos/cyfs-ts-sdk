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
import { BuckyHashMap, BuckyHashMapDecoder } from "../../cyfs-base/base/bucky_hash_map";

export class DecAppDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.DecApp;
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

const DECAPP_DESC_TYPE_INFO = new DecAppDescTypeInfo();

export class DecAppDescContent extends DescContent {
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

export class DecAppDescContentDecoder extends DescContentDecoder<DecAppDescContent>{
    type_info(): DescTypeInfo{
        return DECAPP_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[DecAppDescContent, Uint8Array]>{
        let id; 
        {
            let r = new BuckyStringDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [id, buf] = r.unwrap();
        }
        
        const self = new DecAppDescContent(id.value());
        
        const ret:[DecAppDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class DecAppBodyContent extends BodyContent{
    source: BuckyHashMap<BuckyString, ObjectId>
    icon: Option<BuckyString>
    desc: Option<BuckyString>
    source_desc: BuckyHashMap<BuckyString, BuckyString>
    constructor(source: BuckyHashMap<BuckyString, ObjectId>, icon: Option<BuckyString>, desc: Option<BuckyString>, source_desc: BuckyHashMap<BuckyString, BuckyString>){
        super();
        this.source = source;
        this.icon = icon;
        this.desc = desc;
        this.source_desc = source_desc;
    }

    raw_measure(): BuckyResult<number>{
        let ret = 0;
        {
            const r = this.source.raw_measure();
            if (r.err) {
                return r;
            }
            ret += r.unwrap();
        }
        {
            const r = new OptionEncoder(this.icon).raw_measure();
            if (r.err) {
                return r;
            }
            ret += r.unwrap();
        }
        {
            const r = new OptionEncoder(this.desc).raw_measure();
            if (r.err) {
                return r;
            }
            ret += r.unwrap();
        }
        {
            const r = this.source_desc.raw_measure();
            if (r.err) {
                return r;
            }
            ret += r.unwrap();
        }
        return Ok(ret);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        {
            const r = this.source.raw_encode(buf);
            if (r.err) {
                return r;
            }
            buf = r.unwrap();
        }
        {
            const r = new OptionEncoder(this.icon).raw_encode(buf);
            if (r.err) {
                return r;
            }
            buf = r.unwrap();
        }
        {
            const r = new OptionEncoder(this.desc).raw_encode(buf);
            if (r.err) {
                return r;
            }
            buf = r.unwrap();
        }
        {
            const r = this.source_desc.raw_encode(buf);
            if (r.err) {
                return r;
            }
            buf = r.unwrap();
        }
        return Ok(buf);
    }
}

export class DecAppBodyContentDecoder extends BodyContentDecoder<DecAppBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[DecAppBodyContent, Uint8Array]>{

        let sources;
        {
            const r = new BuckyHashMapDecoder(
                new BuckyStringDecoder(),
                new ObjectIdDecoder()
            ).raw_decode(buf);

            if(r.err){
                return r;
            }
            [sources, buf] = r.unwrap();
        }

        let icon;
        {
            const r = new OptionDecoder(
                new BuckyStringDecoder()
            ).raw_decode(buf);

            if(r.err){
                return r;
            }
            [icon, buf] = r.unwrap();
        }

        let desc;
        {
            const r = new OptionDecoder(
                new BuckyStringDecoder()
            ).raw_decode(buf);

            if(r.err){
                return r;
            }
            [desc, buf] = r.unwrap();
        }

        let source_desc;
        {
            const r = new BuckyHashMapDecoder(
                new BuckyStringDecoder(),
                new BuckyStringDecoder()
            ).raw_decode(buf);

            if(r.err){
                return r;
            }
            [source_desc, buf] = r.unwrap();
        }

        const self = new DecAppBodyContent(sources, icon.value(), desc.value(), source_desc);

        const ret:[DecAppBodyContent, Uint8Array] = [self, buf];

        return Ok(ret);
    }
}

export class DecAppDesc extends NamedObjectDesc<DecAppDescContent>{
    // ignore
}

export  class DecAppDescDecoder extends NamedObjectDescDecoder<DecAppDescContent>{
    // ignore
}

export class DecAppBuilder extends NamedObjectBuilder<DecAppDescContent, DecAppBodyContent>{
    // ignore
}

export class DecAppId extends NamedObjectId<DecAppDescContent, DecAppBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.DecApp, id);
    }

    static default(): DecAppId{
        return named_id_gen_default(CoreObjectType.DecApp);
    }

    static from_base_58(s: string): BuckyResult<DecAppId> {
        return named_id_from_base_58(CoreObjectType.DecApp, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DecAppId>{
        return named_id_try_from_object_id(CoreObjectType.DecApp, id);
    }
}

export class DecAppIdDecoder extends NamedObjectIdDecoder<DecAppDescContent, DecAppBodyContent>{
    constructor(){
        super(CoreObjectType.DecApp);
    }
}


export class DecApp extends NamedObject<DecAppDescContent, DecAppBodyContent>{
    static create(owner: ObjectId, id: string):DecApp{
        const desc_content = new DecAppDescContent(id);
        const body_content = new DecAppBodyContent(new BuckyHashMap<BuckyString, ObjectId>(), None, None, new BuckyHashMap<BuckyString, BuckyString>());
        const builder = new DecAppBuilder(desc_content, body_content);
        const self = builder.owner(owner).no_create_time().build();
        return new DecApp(self.desc(), self.body(), self.signs(), self.nonce());
    }

    name(): string {
        return this.desc().content().id;
    }

    icon(): string|undefined {
        if (this.body_expect().content().icon.is_some()) {
            return this.body_expect().content().icon.unwrap().value();
        } else {
            return undefined;
        }
    }

    app_desc(): string|undefined {
        if (this.body_expect().content().desc.is_some()) {
            return this.body_expect().content().icon.unwrap().value();
        } else {
            return undefined;
        }
    }

    find_source_desc(version: string): BuckyResult<string> {
        let source = this.body_expect().content().source_desc.get(new BuckyString(version));
        if (source === undefined) {
            return Err(BuckyError.from(BuckyErrorCode.NotFound));
        } else {
            return Ok(source.value());
        }
    }

    find_source(version: string): BuckyResult<ObjectId> {
        let source = this.body_expect().content().source.get(new BuckyString(version));
        if (source === undefined) {
            return Err(BuckyError.from(BuckyErrorCode.NotFound));
        } else {
            return Ok(source);
        }
    }

    remove_source(version: string) {
        this.body_expect().content().source.delete(new BuckyString(version));
        this.body_expect().content().source_desc.delete(new BuckyString(version));
        this.body_expect().set_update_time(bucky_time_now());
    }

    set_source(version: string, source: ObjectId, desc: Option<string>) {
        this.body_expect().content().source.set(new BuckyString(version), source);
        if (desc.is_some()) {
            this.body_expect().content().source_desc.set(new BuckyString(version), new BuckyString(desc.unwrap()));
        }
        this.body_expect().set_update_time(bucky_time_now());
    }

    source(): BuckyHashMap<BuckyString, ObjectId> {
        return this.body_expect().content().source;
    }
}

export class DecAppDecoder extends NamedObjectDecoder<DecAppDescContent, DecAppBodyContent, DecApp>{
    constructor(){
        super(new DecAppDescContentDecoder(), new DecAppBodyContentDecoder(), DecApp);
    }

    static create(): DecAppDecoder {
        return new DecAppDecoder()
    }

    raw_decode(buf: Uint8Array): BuckyResult<[DecApp, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new DecApp(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [DecApp, Uint8Array];
        });
    }
}