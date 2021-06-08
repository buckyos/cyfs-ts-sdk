import { sign } from "crypto";
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
import { Option, OptionEncoder, OptionDecoder, Some, None, } from "../../cyfs-base/base/option";
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
import { TopicPublishStatusId, TopicPublishStatusIdDecoder } from "./topic_publish_status";
import { UniqueId, UniqueIdDecoder } from "../../cyfs-base/objects/unique_id";

export class TopicDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.Topic;
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

const TOPIC_DESC_TYPE_INFO = new TopicDescTypeInfo();

export class TopicDescContent extends DescContent {
    private readonly m_unique_id: UniqueId;
    private readonly m_user_data_id: Option<ObjectId>;

    constructor(unique_id: UniqueId, user_data_id: Option<ObjectId>){
        super();
        this.m_unique_id = unique_id;
        this.m_user_data_id = user_data_id;
    }

    unique_id(): UniqueId{
        return this.m_unique_id;
    }

    user_data_id(): Option<ObjectId>{
        return this.m_user_data_id;
    }

    type_info(): DescTypeInfo{
        return TOPIC_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        let size = 1;
        {
            const r = this.m_unique_id.raw_measure();
            if(r.err){
                return r;
            }
            size += r.unwrap();
        }

        if(this.m_user_data_id.is_some())
        {
            const r = this.m_user_data_id.unwrap().raw_measure();
            if(r.err){
                return r;
            }
            size += r.unwrap();
        }

        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        let flag = 0;
        if(this.m_user_data_id.is_some()){
            flag |= 0x01;
        }

        // flag
        {
            const r = new BuckyNumber('u8', flag).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        // unique_id
        {
            const r = this.m_unique_id.raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        // user_data
        if(this.m_user_data_id.is_some()){
            const r = this.m_user_data_id.unwrap().raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }
}

export class TopicDescContentDecoder extends DescContentDecoder<TopicDescContent>{
    type_info(): DescTypeInfo{
        return TOPIC_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicDescContent, Uint8Array]>{
        let flag;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [flag, buf] = r.unwrap();
        }

        let unique_id;
        {
            const r = new UniqueIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [unique_id, buf] = r.unwrap();
        }

        let user_data_id;
        if((flag.toNumber()&0x01)===0x01){
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            let _user_data_id;
            [_user_data_id, buf] = r.unwrap();
            user_data_id = Some(_user_data_id);
        }else{
            user_data_id = None;
        }


        const self = new TopicDescContent(unique_id, user_data_id);
        const ret:[TopicDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class TopicBodyContent extends BodyContent{
    private m_topic_publish_status_id: Option<TopicPublishStatusId>;
    constructor(topic_publish_status_id: Option<TopicPublishStatusId>){
        super();
        this.m_topic_publish_status_id = topic_publish_status_id;
    }

    topic_publish_status_id():Option<TopicPublishStatusId>{
        return this.m_topic_publish_status_id;
    }

    set_topic_publish_status_id(id: TopicPublishStatusId){
        this.m_topic_publish_status_id = Some(id);
    }

    raw_measure(): BuckyResult<number>{
        let size = 1;
        if(this.m_topic_publish_status_id.is_some()){
            const r = this.m_topic_publish_status_id.unwrap().raw_measure();
            if(r.err){
                return r;
            }
            size += r.unwrap();
        }
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        let flag = 0;
        if(this.m_topic_publish_status_id.is_some()){
            flag |= 0x01;
        }

        // flag
        {
            const r = new BuckyNumber('u8', flag).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        // status
        if(this.m_topic_publish_status_id.is_some()){
            const r = this.m_topic_publish_status_id.unwrap().raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }
}

export class TopicBodyContentDecoder extends BodyContentDecoder<TopicBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[TopicBodyContent, Uint8Array]>{

        let flag;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [flag, buf] = r.unwrap();
        }


        let topic_publish_status_id;
        if((flag.toNumber()&0x01)===0x01){
            const r = new TopicPublishStatusIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            let _topic_publish_status_id;
            [_topic_publish_status_id, buf] = r.unwrap();
            topic_publish_status_id = Some(_topic_publish_status_id);
        }else{
            topic_publish_status_id = None;
        }

        const zone_body_content = new TopicBodyContent(topic_publish_status_id);

        const ret:[TopicBodyContent, Uint8Array] = [zone_body_content, buf];

        return Ok(ret);
    }
}

export class TopicDesc extends NamedObjectDesc<TopicDescContent>{

}

export  class TopicDescDecoder extends NamedObjectDescDecoder<TopicDescContent>{
    // ignore
}

class TopicBuilder extends NamedObjectBuilder<TopicDescContent, TopicBodyContent>{

}

export class TopicId extends NamedObjectId<TopicDescContent, TopicBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.Topic, id);
    }

    static default(): DeviceId{
        return named_id_gen_default(CoreObjectType.Topic);
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        return named_id_from_base_58(CoreObjectType.Topic, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId>{
        return named_id_try_from_object_id(CoreObjectType.Topic, id);
    }
}

export class TopicIdDecoder extends NamedObjectIdDecoder<TopicDescContent, TopicBodyContent>{
    constructor(){
        super(CoreObjectType.Topic);
    }
}


export class Topic extends NamedObject<TopicDescContent, TopicBodyContent>{
    static create(owner_id: ObjectId, unique_id: UniqueId, user_data_id: Option<ObjectId>):Topic {
        const desc_content = new TopicDescContent(unique_id, user_data_id);
        const body_content = new TopicBodyContent(None);

        const self = new TopicBuilder(desc_content, body_content)
            .owner(owner_id)
            .no_create_time()
            .update_time(bucky_time_now())
            .build();

        return new Topic(self.desc(), self.body(), self.signs(), self.nonce())
    }

    topic_id(): TopicId{
        return new TopicId(this.desc().calculate_id());
    }

    owner_id(): ObjectId{
        return this.desc().owner()!.unwrap();
    }

    topic_publish_status_id(): TopicPublishStatusId{
        return this.body_expect().content().topic_publish_status_id().unwrap();
    }

    set_topic_publish_status_id(id: TopicPublishStatusId){
        return this.body_expect().content().set_topic_publish_status_id(id);
    }

    unique_id(): UniqueId{
        return this.desc().content().unique_id()
    }

    user_data_id(): Option<ObjectId>{
        return this.desc().content().user_data_id()
    }
}

export class TopicDecoder extends NamedObjectDecoder<TopicDescContent, TopicBodyContent, Topic>{
    constructor(){
        super(new TopicDescContentDecoder(), new TopicBodyContentDecoder(), Topic);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[Topic, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new Topic(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [Topic, Uint8Array];
        });
    }
}