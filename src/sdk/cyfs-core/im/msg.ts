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

import { Ok, BuckyResult, Err, BuckyError, BuckyErrorCode} from "../../cyfs-base/base/results";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { EmptyProtobufBodyContent, EmptyProtobufBodyContentDecoder, PeopleId, ProtobufCodecHelper, ProtobufDescContent, ProtobufDescContentDecoder } from "../../cyfs-base";

import { protos } from '../codec';

export class MsgDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.Msg;
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

export class MsgObjectContent{
    constructor(
        public id: ObjectId,
        public name: string,
    ){}
}

export class MsgContent {
    private constructor(
        private text?: string,
        private object?: MsgObjectContent,
    ){}

    static Text(text: string): MsgContent {
        return new MsgContent(text);
    }

    static Object(object: MsgObjectContent): MsgContent {
        return new MsgContent(undefined, object);
    }

    match<T>(visitor: {
        Text?: (text: string)=>T,
        Object?: (object: MsgObjectContent)=>T,
    }):T|undefined{
        if (this.text != null) {
            console.assert(this.object == null);

            return visitor.Text?.(this.text!);
        } else {
            console.assert(this.object);

            return visitor.Object?.(this.object!);
        }
    }
}

const Msg_DESC_TYPE_INFO = new MsgDescTypeInfo();

export class MsgDescContent extends ProtobufDescContent {
    constructor(public to: ObjectId, public content: MsgContent){
        super();
    }

    try_to_proto(): BuckyResult<protos.MsgDescContent> {
        const target = new protos.MsgDescContent()
        {
            const r = ProtobufCodecHelper.encode_buf(this.to);
            if (r.err) {
                return r;
            }
            target.setTo(r.unwrap())
        }

        const content = new protos.MsgContent()
        const r = this.content.match({
            Text: (text) => {
                content.setType(protos.MsgContent.Type.TEXT)
                content.setText(text)
                return Ok(undefined);
            },
            Object: (object) => {
                content.setType(protos.MsgContent.Type.OBJECT)
                const id_ret = ProtobufCodecHelper.encode_buf(object.id);
                if (id_ret.err) {
                    return id_ret;
                }
                const con = new protos.MsgObjectContent()
                con.setId(id_ret.unwrap())
                con.setName(object.name)
                content.setContent(con)
                return Ok(undefined)
            }
        });
        if (r!.err) {
            return (r! as Err<BuckyError>);
        }

        return Ok(target);
    }

    type_info(): DescTypeInfo{
        return Msg_DESC_TYPE_INFO;
    }
}

export class MsgDescContentDecoder extends ProtobufDescContentDecoder<MsgDescContent, protos.MsgDescContent>{
    constructor() {
        super(protos.MsgDescContent.deserializeBinary)
    }

    try_from_proto(value: protos.MsgDescContent): BuckyResult<MsgDescContent> {
        let to;
        {
            const r = ProtobufCodecHelper.decode_buf(value.getTo_asU8(), new ObjectIdDecoder());
            if (r.err) {
                return r;
            }
            to = r.unwrap();
        }

        let content;
        {
            switch (value.getContent()?.getType()) {
                case protos.MsgContent.Type.TEXT: {
                    content = MsgContent.Text(value.getContent()!.getText()!)
                    break;
                }
                case protos.MsgContent.Type.OBJECT:
                    const r = ProtobufCodecHelper.decode_buf(value.getContent()!.getContent()!.getId_asU8(), new ObjectIdDecoder());
                    if (r.err) {
                        return r;
                    }
                    content = MsgContent.Object(new MsgObjectContent(r.unwrap(), value.getContent()!.getContent()!.getName()));
                    break;
                default:
                    return Err(new BuckyError(BuckyErrorCode.InvalidFormat, "invalid protos MsgContent Type"));
            }
        }

        return Ok(new MsgDescContent(to, content));
    }

    type_info(): DescTypeInfo{
        return Msg_DESC_TYPE_INFO;
    }
}

export class MsgDesc extends NamedObjectDesc<MsgDescContent>{
    // ignore
}

export  class MsgDescDecoder extends NamedObjectDescDecoder<MsgDescContent>{
    // ignore
}

export class MsgBuilder extends NamedObjectBuilder<MsgDescContent, EmptyProtobufBodyContent>{
    // ignore
}

export class MsgId extends NamedObjectId<MsgDescContent, EmptyProtobufBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.Msg, id);
    }

    static default(): MsgId{
        return named_id_gen_default(CoreObjectType.Msg);
    }

    static from_base_58(s: string): BuckyResult<MsgId> {
        return named_id_from_base_58(CoreObjectType.Msg, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<MsgId>{
        return named_id_try_from_object_id(CoreObjectType.Msg, id);
    }
}

export class MsgIdDecoder extends NamedObjectIdDecoder<MsgDescContent, EmptyProtobufBodyContent>{
    constructor(){
        super(CoreObjectType.Msg);
    }
}


export class Msg extends NamedObject<MsgDescContent, EmptyProtobufBodyContent>{
    static create(owner: PeopleId, to: ObjectId, content: MsgContent):Msg{
        const desc_content = new MsgDescContent(to, content);
        const body_content = new EmptyProtobufBodyContent();
        const builder = new MsgBuilder(desc_content, body_content);

        return builder.owner(owner.object_id).build(Msg);
    }

    to():ObjectId{
        return this.desc().content().to;
    }

    content(): MsgContent {
        return this.desc().content().content;
    }

    belongs(id: ObjectId):boolean {
        const owner = this.desc().owner();
        if (owner && owner.is_some() && owner.unwrap().equals(id)) {
            return true;
        }

        return this.to().equals(id);
    }
}

export class MsgDecoder extends NamedObjectDecoder<MsgDescContent, EmptyProtobufBodyContent, Msg>{
    constructor(){
        super(new MsgDescContentDecoder(), new EmptyProtobufBodyContentDecoder(), Msg);
    }
}