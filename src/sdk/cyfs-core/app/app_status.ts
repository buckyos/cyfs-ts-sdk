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

import { Ok, BuckyResult} from "../../cyfs-base/base/results";
import { ObjectId } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { DecAppId, DecAppIdDecoder } from "./dec_app";
import { protos } from '../codec';
import { ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufCodecHelper, ProtobufDescContent, ProtobufDescContentDecoder } from '../../cyfs-base';


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

export class AppStatusDescContent extends ProtobufDescContent {
    id: DecAppId;

    constructor(id: DecAppId){
        super();

        this.id = id;
    }

    type_info(): DescTypeInfo{
        return APPSTATUS_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.AppStatusDescContent> {
        const target = new protos.AppStatusDescContent()
        target.setId(ProtobufCodecHelper.encode_buf(this.id).unwrap())

        return Ok(target);
    }
}

export class AppStatusDescContentDecoder extends ProtobufDescContentDecoder<AppStatusDescContent, protos.AppStatusDescContent>{
    constructor() {
        super(protos.AppStatusDescContent.deserializeBinary)
    }

    type_info(): DescTypeInfo{
        return APPSTATUS_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.AppStatusDescContent): BuckyResult<AppStatusDescContent> {
        const id: DecAppId = ProtobufCodecHelper.decode_buf(value.getId_asU8(), new DecAppIdDecoder()).unwrap();
        const result = new AppStatusDescContent(id);

        return Ok(result);
    }
}

export class AppStatusBodyContent extends ProtobufBodyContent{
    version: string;
    status: number;
    constructor(version: string, status: number){
        super();

        this.version = version;
        this.status = status;
    }

    try_to_proto(): BuckyResult<protos.AppStatusContent> {
        const target = new protos.AppStatusContent()
        target.setVersion(this.version)
        target.setStatus(this.status)

        return Ok(target);
    }
}

export class AppStatusBodyContentDecoder extends ProtobufBodyContentDecoder<AppStatusBodyContent, protos.AppStatusContent>{
    constructor() {
        super(protos.AppStatusContent.deserializeBinary)
    }

    try_from_proto(value: protos.AppStatusContent): BuckyResult<AppStatusBodyContent> {
        const result = new AppStatusBodyContent(
            ProtobufCodecHelper.ensure_not_null(value.getVersion()).unwrap(),
            ProtobufCodecHelper.ensure_not_null(value.getStatus()).unwrap(),
        );

        return Ok(result);
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

        return builder.owner(owner).no_create_time().build(AppStatus);
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
}