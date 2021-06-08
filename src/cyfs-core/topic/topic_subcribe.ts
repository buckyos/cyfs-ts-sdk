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
import { Option, OptionEncoder, OptionDecoder, } from "../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../cyfs-base/base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { HashValue, HashValueDecoder } from "../../cyfs-base/crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";
import { DeviceId } from "../../cyfs-base/objects/device";
import { bucky_time_now } from "../../cyfs-base/base/time";

import { CoreObjectType } from "../core_obj_type";
import { TopicId, TopicIdDecoder } from "./topic";

export class TopicSubscribeDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.TopicSubscribe;
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

const TOPICSUBSCRIBE_DESC_TYPE_INFO = new TopicSubscribeDescTypeInfo();

export class TopicSubscribeDescContent extends DescContent {

    private readonly m_topic_id: TopicId;
    private readonly m_topic_owner_id: ObjectId;
    private readonly m_member_id: ObjectId;
    private readonly m_msg_offset: bigint; // i64
    private readonly m_msg_obj_id: Option<ObjectId>;

    constructor(topic_id: TopicId, topic_owner_id: ObjectId, member_id: ObjectId, msg_offset: bigint, msg_obj_id: Option<ObjectId>){
        super();
        this.m_topic_id = topic_id;
        this.m_topic_owner_id = topic_owner_id;
        this.m_member_id = member_id;
        this.m_msg_offset = msg_offset;
        this.m_msg_obj_id = msg_obj_id;
    }

    topic_id(): TopicId{
        return this.m_topic_id;
    }

    topic_owner_id(): ObjectId{
        return this.m_topic_owner_id;
    }

    member_id(): ObjectId{
        return  this.m_member_id;
    }

    msg_offset(): bigint{
        return this.m_msg_offset;
    }

    msg_obj_id(): Option<ObjectId>{
        return this.m_msg_obj_id;
    }

    type_info(): DescTypeInfo{
        return TOPICSUBSCRIBE_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        let size = 0;
        {
            const r = this.m_topic_id.raw_measure();
            if(r.err){
                return r;
            }
            size += r.unwrap();
        }

        {
            const r = this.m_topic_owner_id.raw_measure();
            if(r.err){
                return r;
            }
            size += r.unwrap();
        }

        {
            const r = this.m_member_id.raw_measure();
            if(r.err){
                return r;
            }
            size += r.unwrap();
        }

        {
            const r = new BuckyNumber("i64", this.m_msg_offset).raw_measure();
            if(r.err){
                return r;
            }
            size += r.unwrap();
        }

        {
            const r = new OptionEncoder(this.m_msg_obj_id).raw_measure();
            if(r.err){
                return r;
            }
            size += r.unwrap();
        }

        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        {
            const r = this.m_topic_id.raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        {
            const r = this.m_topic_owner_id.raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        {
            const r = this.m_member_id.raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        {
            const r = new BuckyNumber("i64", this.m_msg_offset).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        {
            const r = new OptionEncoder(this.m_msg_obj_id).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }
}

export class TopicSubscribeDescContentDecoder extends DescContentDecoder<TopicSubscribeDescContent>{
    type_info(): DescTypeInfo{
        return TOPICSUBSCRIBE_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicSubscribeDescContent, Uint8Array]>{
        let topic_id;
        {
            const r =  new TopicIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [topic_id, buf] = r.unwrap();
        }

        let topic_owner_id;
        {
            const r =  new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [topic_owner_id, buf] = r.unwrap();
        }

        let member_id;
        {
            const r =  new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [member_id, buf] = r.unwrap();
        }

        let msg_offset;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [msg_offset, buf] = r.unwrap();
        }

        let msg_obj_id;
        {
            const r =  new OptionDecoder(new ObjectIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [msg_obj_id, buf] = r.unwrap();
        }

        const self = new TopicSubscribeDescContent(topic_id, topic_owner_id, member_id, msg_offset.toBigInt(), msg_obj_id.value());
        const ret:[TopicSubscribeDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class TopicSubscribeBodyContent extends BodyContent{
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

export class TopicSubscribeBodyContentDecoder extends BodyContentDecoder<TopicSubscribeBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[TopicSubscribeBodyContent, Uint8Array]>{

        const zone_body_content = new TopicSubscribeBodyContent();

        const ret:[TopicSubscribeBodyContent, Uint8Array] = [zone_body_content, buf];

        return Ok(ret);
    }
}

export class TopicSubscribeDesc extends NamedObjectDesc<TopicSubscribeDescContent>{
    // ignore
}

export  class TopicSubscribeDescDecoder extends NamedObjectDescDecoder<TopicSubscribeDescContent>{
    // ignore
}

export class TopicSubscribeBuilder extends NamedObjectBuilder<TopicSubscribeDescContent, TopicSubscribeBodyContent>{
    // ignore
}

export class TopicSubscribeId extends NamedObjectId<TopicSubscribeDescContent, TopicSubscribeBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.TopicSubscribe, id);
    }

    static default(): DeviceId{
        return named_id_gen_default(CoreObjectType.TopicSubscribe);
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        return named_id_from_base_58(CoreObjectType.TopicSubscribe, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId>{
        return named_id_try_from_object_id(CoreObjectType.TopicSubscribe, id);
    }
}

export class TopicSubscribeIdDecoder extends NamedObjectIdDecoder<TopicSubscribeDescContent, TopicSubscribeBodyContent>{
    constructor(){
        super(CoreObjectType.TopicSubscribe)
    }
}


export class TopicSubscribe extends NamedObject<TopicSubscribeDescContent, TopicSubscribeBodyContent>{
    static create(owner_id: ObjectId, topic_id: TopicId, topic_owner_id: ObjectId, member_id: ObjectId, msg_offset: bigint, msg_obj_id: Option<ObjectId>):TopicSubscribe {
        const desc_content = new TopicSubscribeDescContent(topic_id,  topic_owner_id, member_id, msg_offset, msg_obj_id);
        const body_content = new TopicSubscribeBodyContent();
        const self = new TopicSubscribeBuilder(desc_content, body_content).owner(owner_id).build();
        return new TopicSubscribe(self.desc(), self.body(), self.signs(), self.nonce());
    }

    owner_id(): ObjectId{
        return this.desc().owner()!.unwrap();
    }

    topic_unscribe_id() :  TopicSubscribeId{
        return new TopicSubscribeId(this.desc().calculate_id());
    }

    topic_id(): TopicId {
        return this.desc().content().topic_id()
    }

    topic_owner_id(): ObjectId {
        return this.desc().content().topic_owner_id()
    }

    msg_offset(): bigint {
        return this.desc().content().msg_offset()
    }

    msg_obj_id(): Option<ObjectId> {
        return this.desc().content().msg_obj_id()
    }

    member_id(): ObjectId {
        return this.desc().content().member_id()
    }
}

export class TopicSubscribeDecoder extends NamedObjectDecoder<TopicSubscribeDescContent, TopicSubscribeBodyContent, TopicSubscribe>{
    constructor(){
        super(new TopicSubscribeDescContentDecoder(), new TopicSubscribeBodyContentDecoder(), TopicSubscribe);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicSubscribe, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new TopicSubscribe(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [TopicSubscribe, Uint8Array];
        });
    }
}