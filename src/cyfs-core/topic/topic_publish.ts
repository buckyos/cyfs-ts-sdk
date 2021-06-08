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

export class MsgInfo implements RawEncode {
    private readonly m_orderd: number;        // u8
    private readonly m_seq: bigint;           // u64
    private readonly m_msg_obj_id: ObjectId;
    private readonly m_member_id: ObjectId;

    constructor(orderd: number, seq: bigint, msg_obj_id: ObjectId, member_id: ObjectId){
        this.m_orderd = orderd;
        this.m_seq = seq;
        this.m_msg_obj_id = msg_obj_id;
        this.m_member_id = member_id;
    }

    orderd(): number{
        return this.m_orderd;
    }

    seq(): bigint {
        return this.m_seq;
    }

    seq_number(): number {
        return Number(this.m_seq);
    }


    msg_obj_id(): ObjectId{
        return this.m_msg_obj_id;
    }

    member_id(): ObjectId{
        return this.m_member_id;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let bytes = 0;
        {
            const r = new BuckyNumber('u8', this.m_orderd).raw_measure();
            if(r.err){
                return r;
            }
            bytes += r.unwrap();
        }

        {
            const r = new BuckyNumber('u64', this.m_seq).raw_measure();
            if(r.err){
                return r;
            }
            bytes += r.unwrap();
        }

        {
            const r = this.m_msg_obj_id.raw_measure();
            if(r.err){
                return r;
            }
            bytes += r.unwrap();
        }

        {
            const r = this.m_member_id.raw_measure();
            if(r.err){
                return r;
            }
            bytes += r.unwrap();
        }

        return Ok(bytes);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        {
            const r = new BuckyNumber('u8', this.m_orderd).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        {
            const r = new BuckyNumber('u64', this.m_seq).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        {
            const r = this.m_msg_obj_id.raw_encode(buf);
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

        return Ok(buf);
    }
}

export class MsgInfoDecoder implements RawDecode<MsgInfo>{
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[MsgInfo, Uint8Array]>{
        let orderd;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [orderd, buf] = r.unwrap();
        }

        let msg_seq;
        {
            const r = new BuckyNumberDecoder('u64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [msg_seq, buf] = r.unwrap();
        }

        let msg_obj_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [msg_obj_id, buf] = r.unwrap();
        }

        let member_id;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [member_id, buf] = r.unwrap();
        }

        const ret:[MsgInfo, Uint8Array] = [new MsgInfo(orderd.toNumber(), msg_seq.toBigInt(), msg_obj_id, member_id), buf];

        return Ok(ret);
    }
}

export class TopicPublishDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.TopicPublish;
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

const TOPICPUBLISH_DESC_TYPE_INFO = new TopicPublishDescTypeInfo();

export class TopicPublishDescContent extends DescContent {
    private readonly m_topic_id: TopicId;
    private readonly m_topic_owner_id: ObjectId;
    private readonly m_msg_info: MsgInfo;

    constructor(topic_id: TopicId, topic_owner_id: ObjectId, msg_info: MsgInfo){
        super();
        this.m_topic_id = topic_id;
        this.m_topic_owner_id = topic_owner_id;
        this.m_msg_info = msg_info;
    }

    topic_id(): TopicId {
        return this.m_topic_id;
    }

    topic_owner_id(): ObjectId{
        return this.m_topic_owner_id;
    }

    msg_info(): MsgInfo{
        return this.m_msg_info;
    }

    type_info(): DescTypeInfo{
        return TOPICPUBLISH_DESC_TYPE_INFO;
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
            const r = this.m_msg_info.raw_measure();
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
            const r = this.m_msg_info.raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }
}

export class TopicPublishDescContentDecoder extends DescContentDecoder<TopicPublishDescContent>{
    type_info(): DescTypeInfo{
        return TOPICPUBLISH_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicPublishDescContent, Uint8Array]>{
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

        let msg_info;
        {
            const r = new MsgInfoDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [msg_info, buf] = r.unwrap();
        }

        const self = new TopicPublishDescContent(topic_id, topic_owner_id, msg_info);
        const ret:[TopicPublishDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class TopicPublishBodyContent extends BodyContent{
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

export class TopicPublishBodyContentDecoder extends BodyContentDecoder<TopicPublishBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[TopicPublishBodyContent, Uint8Array]>{

        const zone_body_content = new TopicPublishBodyContent();

        const ret:[TopicPublishBodyContent, Uint8Array] = [zone_body_content, buf];

        return Ok(ret);
    }
}

export class TopicPublishDesc extends NamedObjectDesc<TopicPublishDescContent>{
    // ignore
}

export  class TopicPublishDescDecoder extends NamedObjectDescDecoder<TopicPublishDescContent>{
    // ignore
}

export class TopicPublishBuilder extends NamedObjectBuilder<TopicPublishDescContent, TopicPublishBodyContent>{
    // ignore
}

export class TopicPublishId extends NamedObjectId<TopicPublishDescContent, TopicPublishBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.TopicPublish, id);
    }

    static default(): DeviceId{
        return named_id_gen_default(CoreObjectType.TopicPublish);
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        return named_id_from_base_58(CoreObjectType.TopicPublish, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId>{
        return named_id_try_from_object_id(CoreObjectType.TopicPublish, id);
    }
}

export class TopicPublishIdDecoder extends NamedObjectIdDecoder<TopicPublishDescContent, TopicPublishBodyContent>{
    constructor(){
        super(CoreObjectType.TopicPublish);
    }
}


export class TopicPublish extends NamedObject<TopicPublishDescContent, TopicPublishBodyContent>{
    static create(owner_id: ObjectId, topic_id: TopicId, topic_owner_id: ObjectId, msg_info: MsgInfo):TopicPublish {
        const desc_content = new TopicPublishDescContent(topic_id, topic_owner_id, msg_info);
        const body_content = new TopicPublishBodyContent();
        const self = new TopicPublishBuilder(desc_content, body_content).owner(owner_id).build();
        return new TopicPublish(self.desc(), self.body(), self.signs(), self.nonce())
    }

    owner_id(): ObjectId{
        return this.desc().owner()!.unwrap();
    }

    topic_publish_id() :  TopicPublishId{
        return new TopicPublishId(this.desc().calculate_id());
    }

    topic_id(): TopicId {
        return this.desc().content().topic_id();
    }

    topic_owner_id(): ObjectId{
        return this.desc().content().topic_owner_id();
    }

    msg_info(): MsgInfo{
        return this.desc().content().msg_info();
    }
}

export class TopicPublishDecoder extends NamedObjectDecoder<TopicPublishDescContent, TopicPublishBodyContent, TopicPublish>{
    constructor(){
        super(new TopicPublishDescContentDecoder(), new TopicPublishBodyContentDecoder(), TopicPublish);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicPublish, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new TopicPublish(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [TopicPublish, Uint8Array];
        });
    }
}