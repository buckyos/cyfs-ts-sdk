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

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { Option, None, Some, } from "../../cyfs-base/base/option";
import { BuckyString } from "../../cyfs-base/base/bucky_string";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";
import { bucky_time_now } from "../../cyfs-base/base/time";

import { CoreObjectType } from "../core_obj_type";
import { BuckyHashMap } from "../../cyfs-base/base/bucky_hash_map";
import { protos } from '../codec';
import { ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufCodecHelper, ProtobufDescContent, ProtobufDescContentDecoder } from '../../cyfs-base';

export class DecAppDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.DecApp;
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

const DECAPP_DESC_TYPE_INFO = new DecAppDescTypeInfo();

export class DecAppDescContent extends ProtobufDescContent {
    id: string;
    constructor(id: string) {
        super();

        this.id = id;
    }

    type_info(): DescTypeInfo {
        return DECAPP_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.DecAppDescContent> {
        const target = new protos.DecAppDescContent()
        target.setId(this.id);

        return Ok(target);
    }
}

export class DecAppDescContentDecoder extends ProtobufDescContentDecoder<DecAppDescContent, protos.DecAppDescContent>{
    constructor() {
        super(protos.DecAppDescContent.deserializeBinary)
    }

    type_info(): DescTypeInfo {
        return DECAPP_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.DecAppDescContent): BuckyResult<DecAppDescContent> {
        const result = new DecAppDescContent(value.getId());

        return Ok(result);
    }
}

export class DecAppBodyContent extends ProtobufBodyContent {
    constructor(public source: BuckyHashMap<BuckyString, ObjectId>, public icon: string| undefined, public desc: string|undefined, public source_desc: BuckyHashMap<BuckyString, BuckyString>, public tags: BuckyHashMap<BuckyString, BuckyString>) {
        super();
    }

    try_to_proto(): BuckyResult<protos.DecAppContent> {
        const target = new protos.DecAppContent()
        for (const [k, v] of this.source.entries()) {
            const item = new protos.StringBytesMapItem()
            item.setKey(k.value())
            item.setValue(ProtobufCodecHelper.encode_buf(v).unwrap())
            target.addSource(item)
        }

        for (const [k, v] of this.source_desc.entries()) {
            const item = new protos.StringStringMapItem()
            item.setKey(k.value())
            item.setValue(v.value())
            target.addSourceDesc(item)
        }

        for (const [k, v] of this.tags.entries()) {
            const item = new protos.StringStringMapItem()
            item.setKey(k.value())
            item.setValue(v.value())
            target.addTags(item)
        }

        if (this.icon) {
            target.setIcon(this.icon)
        }

        if (this.desc) {
            target.setDesc(this.desc)
        }

        return Ok(target);
    }

}

export class DecAppBodyContentDecoder extends ProtobufBodyContentDecoder<DecAppBodyContent, protos.DecAppContent>{
    constructor() {
        super(protos.DecAppContent.deserializeBinary)
    }

    try_from_proto(value: protos.DecAppContent): BuckyResult<DecAppBodyContent> {
        const source: BuckyHashMap<BuckyString, ObjectId> = new BuckyHashMap();
        for (const item of value.getSourceList()) {
            source.set(new BuckyString(item.getKey()), ProtobufCodecHelper.decode_buf(item.getValue_asU8(), new ObjectIdDecoder()).unwrap());
        }

        const source_desc: BuckyHashMap<BuckyString, BuckyString> = new BuckyHashMap();
        for (const item of value.getSourceDescList()) {
            source_desc.set(new BuckyString(item.getKey()), new BuckyString(item.getValue()));
        }

        const tags: BuckyHashMap<BuckyString, BuckyString> = new BuckyHashMap();
        for (const item of value.getTagsList()) {
            source_desc.set(new BuckyString(item.getKey()), new BuckyString(item.getValue()));
        }

        let icon;
        if (value.hasIcon()) {
            icon = value.getIcon();
        }
        let desc;
        if (value.hasDesc()) {
            desc = value.getDesc();
        }

        const result = new DecAppBodyContent(source, icon, desc, source_desc, tags);
        return Ok(result);
    }
}

export class DecAppDesc extends NamedObjectDesc<DecAppDescContent>{
    // ignore
}

export class DecAppDescDecoder extends NamedObjectDescDecoder<DecAppDescContent>{
    // ignore
}

export class DecAppBuilder extends NamedObjectBuilder<DecAppDescContent, DecAppBodyContent>{
    // ignore
}

export class DecAppId extends NamedObjectId<DecAppDescContent, DecAppBodyContent>{
    constructor(id: ObjectId) {
        super(CoreObjectType.DecApp, id);
    }

    static default(): DecAppId {
        return named_id_gen_default(CoreObjectType.DecApp);
    }

    static from_base_58(s: string): BuckyResult<DecAppId> {
        return named_id_from_base_58(CoreObjectType.DecApp, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DecAppId> {
        return named_id_try_from_object_id(CoreObjectType.DecApp, id);
    }
}

export class DecAppIdDecoder extends NamedObjectIdDecoder<DecAppDescContent, DecAppBodyContent>{
    constructor() {
        super(CoreObjectType.DecApp);
    }
}


export class DecApp extends NamedObject<DecAppDescContent, DecAppBodyContent>{
    static create(owner: ObjectId, id: string): DecApp {
        const desc_content = new DecAppDescContent(id);
        const body_content = new DecAppBodyContent(new BuckyHashMap<BuckyString, ObjectId>(), undefined, undefined, new BuckyHashMap<BuckyString, BuckyString>(), new BuckyHashMap<BuckyString, BuckyString>());
        const builder = new DecAppBuilder(desc_content, body_content);

        return builder.owner(owner).no_create_time().build(DecApp);
    }

    name(): string {
        return this.desc().content().id;
    }

    set_icon(icon?: string): void {
        const body = this.body_expect();
        body.content().icon = icon;
        body.increase_update_time(bucky_time_now());
    }

    icon(): string | undefined {
        return this.body_expect().content().icon
    }

    set_app_desc(desc?: string): void {
        const body = this.body_expect();
        body.content().desc = desc
        body.increase_update_time(bucky_time_now());
    }

    app_desc(): string | undefined {
        return this.body_expect().content().desc
    }

    find_source_desc(version: string): BuckyResult<string> {
        const source = this.body_expect().content().source_desc.get(new BuckyString(version));
        if (source === undefined) {
            return Err(BuckyError.from(BuckyErrorCode.NotFound));
        } else {
            return Ok(source.value());
        }
    }

    find_source(version: string): BuckyResult<ObjectId> {
        const source = this.body_expect().content().source.get(new BuckyString(version));
        if (source === undefined) {
            return Err(BuckyError.from(BuckyErrorCode.NotFound));
        } else {
            return Ok(source);
        }
    }

    remove_source(version: string): void {
        this.body_expect().content().source.delete(new BuckyString(version));
        this.body_expect().content().source_desc.delete(new BuckyString(version));
        this.body_expect().increase_update_time(bucky_time_now());
    }

    set_source(version: string, source: ObjectId, desc?: string): void {
        this.body_expect().content().source.set(new BuckyString(version), source);
        if (desc) {
            this.body_expect().content().source_desc.set(new BuckyString(version), new BuckyString(desc));
        }
        this.body_expect().increase_update_time(bucky_time_now());
    }

    source(): BuckyHashMap<BuckyString, ObjectId> {
        return this.body_expect().content().source;
    }

    find_tag(tag: string): BuckyResult<string> {
        const version = this.body_expect().content().tags.get(new BuckyString(tag));
        if (version === undefined) {
            return Err(BuckyError.from(BuckyErrorCode.NotFound));
        } else {
            return Ok(version.value());
        }
    }

    remove_tag(tag: string) {
        this.body_expect().content().tags.delete(new BuckyString(tag));
        this.body_expect().increase_update_time(bucky_time_now());
    }

    set_tag(tag: string, version: string) {
        this.body_expect().content().tags.set(new BuckyString(tag), new BuckyString(version));
        this.body_expect().increase_update_time(bucky_time_now());
    }

    tags(): BuckyHashMap<BuckyString, BuckyString> {
        return this.body_expect().content().tags
    }

    static generate_id(owner: ObjectId, id: string): ObjectId {
        return this.create(owner, id).calculate_id();
    }
}

export class DecAppDecoder extends NamedObjectDecoder<DecAppDescContent, DecAppBodyContent, DecApp>{
    constructor() {
        super(new DecAppDescContentDecoder(), new DecAppBodyContentDecoder(), DecApp);
    }

    static create(): DecAppDecoder {
        return new DecAppDecoder()
    }
}