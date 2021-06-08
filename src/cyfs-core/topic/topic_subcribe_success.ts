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

export class TopicSubscribeSuccessDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.TopicSubscribeSuccess;
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

const TOPICSUBSCRIBE_DESC_TYPE_INFO = new TopicSubscribeSuccessDescTypeInfo();

export class TopicSubscribeSuccessDescContent extends DescContent {

    private readonly m_topic_id: TopicId;
    private readonly m_topic_owner_id: ObjectId;
    private readonly m_member_id: ObjectId;
    private readonly m_msg_seq: bigint; // i64
    private readonly m_msg_obj_id: Option<ObjectId>;

    constructor(topic_id: TopicId, topic_owner_id: ObjectId, member_id: ObjectId, msg_seq: bigint, msg_obj_id: Option<ObjectId>){
        super();
        this.m_topic_id = topic_id;
        this.m_topic_owner_id = topic_owner_id;
        this.m_member_id = member_id;
        this.m_msg_seq = msg_seq;
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

    msg_seq(): bigint{
        return this.m_msg_seq;
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
            const r = new BuckyNumber("i64", this.m_msg_seq).raw_measure();
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
            const r = new BuckyNumber("i64", this.m_msg_seq).raw_encode(buf);
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

export class TopicSubscribeSuccessDescContentDecoder extends DescContentDecoder<TopicSubscribeSuccessDescContent>{
    type_info(): DescTypeInfo{
        return TOPICSUBSCRIBE_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicSubscribeSuccessDescContent, Uint8Array]>{
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

        let msg_seq;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [msg_seq, buf] = r.unwrap();
        }

        let msg_obj_id;
        {
            const r =  new OptionDecoder(new ObjectIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [msg_obj_id, buf] = r.unwrap();
        }

        const self = new TopicSubscribeSuccessDescContent(topic_id, topic_owner_id, member_id, msg_seq.toBigInt(), msg_obj_id.value());
        const ret:[TopicSubscribeSuccessDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class TopicSubscribeSuccessBodyContent extends BodyContent{
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

export class TopicSubscribeSuccessBodyContentDecoder extends BodyContentDecoder<TopicSubscribeSuccessBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[TopicSubscribeSuccessBodyContent, Uint8Array]>{

        const zone_body_content = new TopicSubscribeSuccessBodyContent();

        const ret:[TopicSubscribeSuccessBodyContent, Uint8Array] = [zone_body_content, buf];

        return Ok(ret);
    }
}

export class TopicSubscribeSuccessDesc extends NamedObjectDesc<TopicSubscribeSuccessDescContent>{
    // ignore
}

export  class TopicSubscribeSuccessDescDecoder extends NamedObjectDescDecoder<TopicSubscribeSuccessDescContent>{
    // ignore
}

export class TopicSubscribeSuccessBuilder extends NamedObjectBuilder<TopicSubscribeSuccessDescContent, TopicSubscribeSuccessBodyContent>{
    // ignore
}

export class TopicSubscribeSuccessId extends NamedObjectId<TopicSubscribeSuccessDescContent, TopicSubscribeSuccessBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.TopicSubscribeSuccess, id);
    }

    static default(): DeviceId{
        return named_id_gen_default(CoreObjectType.TopicSubscribeSuccess);
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        return named_id_from_base_58(CoreObjectType.TopicSubscribeSuccess, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId>{
        return named_id_try_from_object_id(CoreObjectType.TopicSubscribeSuccess, id);
    }
}

export class TopicSubscribeSuccessIdDecoder extends NamedObjectIdDecoder<TopicSubscribeSuccessDescContent, TopicSubscribeSuccessBodyContent>{
    constructor(){
        super(CoreObjectType.TopicSubscribeSuccess)
    }
}


export class TopicSubscribeSuccess extends NamedObject<TopicSubscribeSuccessDescContent, TopicSubscribeSuccessBodyContent>{
    static create(owner_id: ObjectId, topic_id: TopicId, topic_owner_id: ObjectId, member_id: ObjectId, msg_seq: bigint, msg_obj_id: Option<ObjectId>):TopicSubscribeSuccess {
        const desc_content = new TopicSubscribeSuccessDescContent(topic_id,  topic_owner_id, member_id, msg_seq, msg_obj_id);
        const body_content = new TopicSubscribeSuccessBodyContent();
        const self = new TopicSubscribeSuccessBuilder(desc_content, body_content).owner(owner_id).build();
        return new TopicSubscribeSuccess(self.desc(), self.body(), self.signs(), self.nonce())
    }

    owner_id(): ObjectId{
        return this.desc().owner()!.unwrap();
    }

    topic_unscribe_id() :  TopicSubscribeSuccessId{
        return new TopicSubscribeSuccessId(this.desc().calculate_id());
    }

    topic_id(): TopicId {
        return this.desc().content().topic_id()
    }

    topic_owner_id(): ObjectId {
        return this.desc().content().topic_owner_id()
    }

    msg_seq(): bigint {
        return this.desc().content().msg_seq()
    }

    msg_obj_id(): Option<ObjectId> {
        return this.desc().content().msg_obj_id()
    }

    member_id(): ObjectId {
        return this.desc().content().member_id()
    }
}

export class TopicSubscribeSuccessDecoder extends NamedObjectDecoder<TopicSubscribeSuccessDescContent, TopicSubscribeSuccessBodyContent, TopicSubscribeSuccess>{
    constructor(){
        super(new TopicSubscribeSuccessDescContentDecoder(), new TopicSubscribeSuccessBodyContentDecoder(), TopicSubscribeSuccess);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicSubscribeSuccess, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new TopicSubscribeSuccess(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [TopicSubscribeSuccess, Uint8Array];
        });
    }
}