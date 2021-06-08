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
import { BuckyString, BuckyStringDecoder, BuckyVarString, BuckyVarStringDecoder } from "../../cyfs-base/base/bucky_string";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";
import { bucky_time_now } from "../../cyfs-base/base/time";

import { CoreObjectType } from "../core_obj_type";

export class TextObjectDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.Text;
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

const DECAPP_DESC_TYPE_INFO = new TextObjectDescTypeInfo();

export class TextObjectDescContent extends DescContent {
    id: string;
    header: string;
    constructor(id: string, header: string){
        super();
        this.id = id;
        this.header = header;
    }

    type_info(): DescTypeInfo{
        return DECAPP_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += new BuckyString(this.id).raw_measure().unwrap();
        size += new BuckyString(this.header).raw_measure().unwrap();
        return Ok(size);
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
            let r = new BuckyString(this.header).raw_encode(buf);
            if (r.err) {
                return r;
            }
            buf = r.unwrap();
        }
        return Ok(buf)
    }
}

export class TextObjectDescContentDecoder extends DescContentDecoder<TextObjectDescContent>{
    type_info(): DescTypeInfo{
        return DECAPP_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TextObjectDescContent, Uint8Array]>{
        let id;
        {
            let r = new BuckyStringDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [id, buf] = r.unwrap();
        }

        let header;
        {
            let r = new BuckyStringDecoder().raw_decode(buf);
            if (r.err) {
                return r;
            }
            [header, buf] = r.unwrap();
        }

        const self = new TextObjectDescContent(id.value(), header.value());

        const ret:[TextObjectDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class TextObjectBodyContent extends BodyContent{
    value: string
    constructor(value: string){
        super();
        this.value = value
    }

    raw_measure(): BuckyResult<number>{
        return new BuckyVarString(this.value).raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return new BuckyVarString(this.value).raw_encode(buf);
    }
}

export class TextObjectBodyContentDecoder extends BodyContentDecoder<TextObjectBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[TextObjectBodyContent, Uint8Array]>{
        let value;
        {
            const r = new BuckyVarStringDecoder().raw_decode(buf);

            if(r.err){
                return r;
            }
            [value, buf] = r.unwrap();
        }

        const self = new TextObjectBodyContent(value.value());

        const ret:[TextObjectBodyContent, Uint8Array] = [self, buf];

        return Ok(ret);
    }
}

export class TextObjectDesc extends NamedObjectDesc<TextObjectDescContent>{
    // ignore
}

export  class TextObjectDescDecoder extends NamedObjectDescDecoder<TextObjectDescContent>{
    // ignore
}

export class TextObjectBuilder extends NamedObjectBuilder<TextObjectDescContent, TextObjectBodyContent>{
    // ignore
}

export class TextObjectId extends NamedObjectId<TextObjectDescContent, TextObjectBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.Text, id);
    }

    static default(): TextObjectId{
        return named_id_gen_default(CoreObjectType.Text);
    }

    static from_base_58(s: string): BuckyResult<TextObjectId> {
        return named_id_from_base_58(CoreObjectType.Text, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<TextObjectId>{
        return named_id_try_from_object_id(CoreObjectType.Text, id);
    }
}

export class TextObjectIdDecoder extends NamedObjectIdDecoder<TextObjectDescContent, TextObjectBodyContent>{
    constructor(){
        super(CoreObjectType.Text);
    }
}


export class TextObject extends NamedObject<TextObjectDescContent, TextObjectBodyContent>{
    static create(owner: Option<ObjectId>, id: string, header: string, value: string):TextObject{
        const desc_content = new TextObjectDescContent(id, header);
        const body_content = new TextObjectBodyContent(value);
        const builder = new TextObjectBuilder(desc_content, body_content);
        const self = builder.option_owner(owner).no_create_time().build();
        return new TextObject(self.desc(), self.body(), self.signs(), self.nonce());
    }

    get id(): string {
        return this.desc().content().id;
    }

    get header(): string {
        return this.desc().content().header;
    }

    get value(): string {
        return this.body_expect().content().value;
    }

    set value(value: string) {
        this.body_expect().content().value = value;
    }
}

export class TextObjectDecoder extends NamedObjectDecoder<TextObjectDescContent, TextObjectBodyContent, TextObject>{
    constructor(){
        super(new TextObjectDescContentDecoder(), new TextObjectBodyContentDecoder(), TextObject);
    }

    static create(): TextObjectDecoder {
        return new TextObjectDecoder()
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TextObject, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new TextObject(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [TextObject, Uint8Array];
        });
    }
}