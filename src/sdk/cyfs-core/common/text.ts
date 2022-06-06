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

import { Ok, BuckyResult, } from "../../cyfs-base/base/results";
import { Option } from "../../cyfs-base/base/option";
import { ObjectId } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { protos } from '../codec';
import { ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufDescContent, ProtobufDescContentDecoder } from '../../cyfs-base';


export class TextObjectDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.Text;
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

const DECAPP_DESC_TYPE_INFO = new TextObjectDescTypeInfo();

export class TextObjectDescContent extends ProtobufDescContent {
    id: string;
    header: string;
    constructor(id: string, header: string) {
        super();

        this.id = id;
        this.header = header;
    }

    type_info(): DescTypeInfo {
        return DECAPP_DESC_TYPE_INFO;
    }

    set_id(id: string) {
        this.id = id;
    }

    set_header(header: string) {
        this.header = header;
    }

    try_to_proto(): BuckyResult<protos.TextDescContent> {
        const target = new protos.TextDescContent()
        target.setId(this.id)
        target.setHeader(this.header)

        return Ok(target);
    }
}

export class TextObjectDescContentDecoder extends ProtobufDescContentDecoder<TextObjectDescContent, protos.TextDescContent> {
    constructor() {
        super(protos.TextDescContent.deserializeBinary)
    }

    type_info(): DescTypeInfo {
        return DECAPP_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.TextDescContent): BuckyResult<TextObjectDescContent> {
        const result = new TextObjectDescContent(
            value.getId(),
            value.getHeader(),
        );

        return Ok(result);
    }
}

export class TextObjectBodyContent extends ProtobufBodyContent {
    value: string;

    constructor(value: string) {
        super()

        this.value = value
    }

    set_value(value: string) {
        this.value = value;
    }

    try_to_proto(): BuckyResult<protos.TextContent> {
        const target = new protos.TextContent()
        target.setValue(this.value)

        return Ok(target);
    }
}

export class TextObjectBodyContentDecoder extends ProtobufBodyContentDecoder<TextObjectBodyContent, protos.TextContent>{
    constructor() {
        super(protos.TextContent.deserializeBinary)
    }

    try_from_proto(value: protos.TextContent): BuckyResult<TextObjectBodyContent> {
        const result = new TextObjectBodyContent(value.getValue());

        return Ok(result);
    }
}

export class TextObjectDesc extends NamedObjectDesc<TextObjectDescContent>{
    // ignore
}

export class TextObjectDescDecoder extends NamedObjectDescDecoder<TextObjectDescContent>{
    // ignore
}

export class TextObjectBuilder extends NamedObjectBuilder<TextObjectDescContent, TextObjectBodyContent>{
    // ignore
}

export class TextObjectId extends NamedObjectId<TextObjectDescContent, TextObjectBodyContent>{
    constructor(id: ObjectId) {
        super(CoreObjectType.Text, id);
    }

    static default(): TextObjectId {
        return named_id_gen_default(CoreObjectType.Text);
    }

    static from_base_58(s: string): BuckyResult<TextObjectId> {
        return named_id_from_base_58(CoreObjectType.Text, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<TextObjectId> {
        return named_id_try_from_object_id(CoreObjectType.Text, id);
    }
}

export class TextObjectIdDecoder extends NamedObjectIdDecoder<TextObjectDescContent, TextObjectBodyContent>{
    constructor() {
        super(CoreObjectType.Text);
    }
}


export class TextObject extends NamedObject<TextObjectDescContent, TextObjectBodyContent>{
    static build(owner: Option<ObjectId>, id: string, header: string, value: string): TextObjectBuilder {
        const desc_content = new TextObjectDescContent(id, header);
        const body_content = new TextObjectBodyContent(value);
        return new TextObjectBuilder(desc_content, body_content);
    }

    static create(owner: Option<ObjectId>, id: string, header: string, value: string): TextObject {
        const builder = this.build(owner, id, header, value);

        return builder.option_owner(owner).no_create_time().build(TextObject);
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
    constructor() {
        super(new TextObjectDescContentDecoder(), new TextObjectBodyContentDecoder(), TextObject);
    }

    static create(): TextObjectDecoder {
        return new TextObjectDecoder()
    }
}