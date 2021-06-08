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

import { Ok, BuckyResult} from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";
import { DeviceId } from "../../cyfs-base/objects/device";

import { CoreObjectType } from "../core_obj_type";
import { TopicId, TopicIdDecoder } from "./topic";

export class TopicPublishRespDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.TopicPublishResp;
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

const TOPICPUBLISHRESP_DESC_TYPE_INFO = new TopicPublishRespDescTypeInfo();

export class TopicPublishRespDescContent extends DescContent {
    private readonly m_topic_id: TopicId;
    private readonly m_topic_owner_id: ObjectId;
    private readonly m_member_id: ObjectId;
    private readonly m_seq: bigint;   // u64

    constructor(topic_id: TopicId, topic_owner_id: ObjectId, member_id: ObjectId, seq: bigint){
        super();
        this.m_topic_id = topic_id;
        this.m_topic_owner_id = topic_owner_id;
        this.m_member_id = member_id;
        this.m_seq = seq;
    }

    topic_id(): TopicId {
        return this.m_topic_id;
    }

    topic_owner_id(): ObjectId{
        return this.m_topic_owner_id;
    }

    member_id(): ObjectId{
        return this.m_member_id;
    }

    seq(): bigint{
        return this.m_seq;
    }

    type_info(): DescTypeInfo{
        return TOPICPUBLISHRESP_DESC_TYPE_INFO;
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
            const r =new BuckyNumber('u64',this.m_seq).raw_measure();
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
            const r =new BuckyNumber('u64',this.m_seq).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }
}

export class TopicPublishRespDescContentDecoder extends DescContentDecoder<TopicPublishRespDescContent>{
    type_info(): DescTypeInfo{
        return TOPICPUBLISHRESP_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicPublishRespDescContent, Uint8Array]>{
        let topic_id;
        {
            const r = new TopicIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [topic_id, buf] = r.unwrap();
        }

        let topic_owner_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [topic_owner_id, buf] = r.unwrap();
        }

        let member_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [member_id, buf] = r.unwrap();
        }

        let seq;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [seq, buf] = r.unwrap();
        }

        const self = new TopicPublishRespDescContent(topic_id, topic_owner_id, member_id, seq.toBigInt());
        const ret:[TopicPublishRespDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class TopicPublishRespBodyContent extends BodyContent{
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

export class TopicPublishRespBodyContentDecoder extends BodyContentDecoder<TopicPublishRespBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[TopicPublishRespBodyContent, Uint8Array]>{

        const zone_body_content = new TopicPublishRespBodyContent();

        const ret:[TopicPublishRespBodyContent, Uint8Array] = [zone_body_content, buf];

        return Ok(ret);
    }
}

export class TopicPublishRespDesc extends NamedObjectDesc<TopicPublishRespDescContent>{
    // ignore
}

export  class TopicPublishRespDescDecoder extends NamedObjectDescDecoder<TopicPublishRespDescContent>{
    // ignore
}

export class TopicPublishRespBuilder extends NamedObjectBuilder<TopicPublishRespDescContent, TopicPublishRespBodyContent>{
    // ignore
}

export class TopicPublishRespId extends NamedObjectId<TopicPublishRespDescContent, TopicPublishRespBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.TopicPublishResp, id);
    }

    static default(): DeviceId{
        return named_id_gen_default(CoreObjectType.TopicPublishResp);
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        return named_id_from_base_58(CoreObjectType.TopicPublishResp, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId>{
        return named_id_try_from_object_id(CoreObjectType.TopicPublishResp, id);
    }
}

export class TopicPublishRespIdDecoder extends NamedObjectIdDecoder<TopicPublishRespDescContent, TopicPublishRespBodyContent>{
    constructor(){
        super(CoreObjectType.TopicPublishResp);
    }
}


export class TopicPublishResp extends NamedObject<TopicPublishRespDescContent, TopicPublishRespBodyContent>{
    static create(owner_id: ObjectId, topic_id: TopicId, topic_owner_id: ObjectId, member_id: ObjectId, seq: bigint): TopicPublishResp{
        const desc_content = new TopicPublishRespDescContent(topic_id, topic_owner_id, member_id, seq);
        const body_content = new TopicPublishRespBodyContent();
        const self = new TopicPublishRespBuilder(desc_content, body_content).owner(owner_id).build();
        return new TopicPublishResp(self.desc(), self.body(), self.signs(), self.nonce())
    }

    owner_id(): ObjectId{
        return this.desc().owner()!.unwrap();
    }

    topic_publish_id() :  TopicPublishRespId{
        return new TopicPublishRespId(this.desc().calculate_id());
    }

    topic_id(): TopicId {
        return this.desc().content().topic_id();
    }

    topic_owner_id(): ObjectId{
        return this.desc().content().topic_owner_id();
    }

    member_id(): ObjectId{
        return this.desc().content().member_id();
    }

    seq(): bigint{
        return this.desc().content().seq();
    }
}

export class TopicPublishRespDecoder extends NamedObjectDecoder<TopicPublishRespDescContent, TopicPublishRespBodyContent, TopicPublishResp>{
    constructor(){
        super(new TopicPublishRespDescContentDecoder(), new TopicPublishRespBodyContentDecoder(), TopicPublishResp);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicPublishResp, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new TopicPublishResp(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [TopicPublishResp, Uint8Array];
        });
    }
}