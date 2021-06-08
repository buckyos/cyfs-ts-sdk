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

export class TopicUnsubscribeSuccessDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.TopicUnsubscribeSuccess;
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

const TOPICUNSUBSCRIBESUCCESS_DESC_TYPE_INFO = new TopicUnsubscribeSuccessDescTypeInfo();

export class TopicUnsubscribeSuccessDescContent extends DescContent {

    private readonly m_topic_id: TopicId;
    private readonly m_topic_owner_id: ObjectId;
    private readonly m_member_id: ObjectId;
    private readonly m_msg_obj_id: Option<ObjectId>;

    constructor(topic_id: TopicId, topic_owner_id: ObjectId, member_id: ObjectId, msg_obj_id: Option<ObjectId>){
        super();
        this.m_topic_id = topic_id;
        this.m_topic_owner_id = topic_owner_id;
        this.m_member_id = member_id;
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

    msg_obj_id(): Option<ObjectId>{
        return this.m_msg_obj_id;
    }

    type_info(): DescTypeInfo{
        return TOPICUNSUBSCRIBESUCCESS_DESC_TYPE_INFO;
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
            const r = new OptionEncoder(this.m_msg_obj_id).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }
}

export class TopicUnsubscribeSuccessDescContentDecoder extends DescContentDecoder<TopicUnsubscribeSuccessDescContent>{
    type_info(): DescTypeInfo{
        return TOPICUNSUBSCRIBESUCCESS_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicUnsubscribeSuccessDescContent, Uint8Array]>{
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

        let msg_obj_id;
        {
            const r =  new OptionDecoder(new ObjectIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [msg_obj_id, buf] = r.unwrap();
        }


        const self = new TopicUnsubscribeSuccessDescContent(topic_id, topic_owner_id, member_id, msg_obj_id.value());
        const ret:[TopicUnsubscribeSuccessDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class TopicUnsubscribeSuccessBodyContent extends BodyContent{
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

export class TopicUnsubscribeSuccessBodyContentDecoder extends BodyContentDecoder<TopicUnsubscribeSuccessBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[TopicUnsubscribeSuccessBodyContent, Uint8Array]>{

        const zone_body_content = new TopicUnsubscribeSuccessBodyContent();

        const ret:[TopicUnsubscribeSuccessBodyContent, Uint8Array] = [zone_body_content, buf];

        return Ok(ret);
    }
}

export class TopicUnsubscribeSuccessDesc extends NamedObjectDesc<TopicUnsubscribeSuccessDescContent>{
    // ignore
}

export  class TopicUnsubscribeSuccessDescDecoder extends NamedObjectDescDecoder<TopicUnsubscribeSuccessDescContent>{
    // ignore
}

export class TopicUnsubscribeSuccessBuilder extends NamedObjectBuilder<TopicUnsubscribeSuccessDescContent, TopicUnsubscribeSuccessBodyContent>{
    // ignore
}

export class TopicUnsubscribeSuccessId extends NamedObjectId<TopicUnsubscribeSuccessDescContent, TopicUnsubscribeSuccessBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.TopicUnsubscribeSuccess, id);
    }

    static default(): DeviceId{
        return named_id_gen_default(CoreObjectType.TopicUnsubscribeSuccess);
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        return named_id_from_base_58(CoreObjectType.TopicUnsubscribeSuccess, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId>{
        return named_id_try_from_object_id(CoreObjectType.TopicUnsubscribeSuccess, id);
    }
}

export class TopicUnsubscribeSuccessIdDecoder extends NamedObjectIdDecoder<TopicUnsubscribeSuccessDescContent, TopicUnsubscribeSuccessBodyContent>{
    constructor(){
        super(CoreObjectType.TopicUnsubscribeSuccess)
    }
}


export class TopicUnsubscribeSuccess extends NamedObject<TopicUnsubscribeSuccessDescContent, TopicUnsubscribeSuccessBodyContent>{
    static create(owner_id: ObjectId, topic_id: TopicId, topic_owner_id: ObjectId, member_id: ObjectId, msg_obj_id: Option<ObjectId>):TopicUnsubscribeSuccess {
        const desc_content = new TopicUnsubscribeSuccessDescContent(topic_id,  topic_owner_id, member_id, msg_obj_id);
        const body_content = new TopicUnsubscribeSuccessBodyContent();
        const self = new TopicUnsubscribeSuccessBuilder(desc_content, body_content).owner(owner_id).build();
        return new TopicUnsubscribeSuccess(self.desc(), self.body(), self.signs(), self.nonce());
    }

    owner_id(): ObjectId{
        return this.desc().owner()!.unwrap();
    }

    topic_unscribe_id() :  TopicUnsubscribeSuccessId{
        return new TopicUnsubscribeSuccessId(this.desc().calculate_id());
    }

    topic_id(): TopicId {
        return this.desc().content().topic_id()
    }

    topic_owner_id(): ObjectId {
        return this.desc().content().topic_owner_id()
    }

    msg_obj_id(): Option<ObjectId> {
        return this.desc().content().msg_obj_id()
    }

    member_id(): ObjectId {
        return this.desc().content().member_id()
    }
}

export class TopicUnsubscribeSuccessDecoder extends NamedObjectDecoder<TopicUnsubscribeSuccessDescContent, TopicUnsubscribeSuccessBodyContent, TopicUnsubscribeSuccess>{
    constructor(){
        super(new TopicUnsubscribeSuccessDescContentDecoder(), new TopicUnsubscribeSuccessBodyContentDecoder(), TopicUnsubscribeSuccess);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicUnsubscribeSuccess, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new TopicUnsubscribeSuccess(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [TopicUnsubscribeSuccess, Uint8Array];
        });
    }
}