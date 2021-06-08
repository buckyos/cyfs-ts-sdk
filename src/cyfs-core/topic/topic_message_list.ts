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
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { ObjectId } from "../../cyfs-base/objects/object_id";
import { DeviceId } from "../../cyfs-base/objects/device";

import { CoreObjectType } from "../core_obj_type";
import { TopicId, TopicIdDecoder } from "./topic";
import { MsgInfo, MsgInfoDecoder } from "./topic_publish";

export const TOPIC_MSG_LIST_NODE_CAPACITY:number = 32*1024;
export const TOPIC_MSG_LIST_CACHE_LIMIT:number = 5;

export class TopicMessageListDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.TopicMessageList;
    }

    sub_desc_type(): SubDescType{
        return {
            owner_type: "disable",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }
    }
}

const TOPICMESSAGELIST_DESC_TYPE_INFO = new TopicMessageListDescTypeInfo();

export class TopicMessageListDescContent extends DescContent {

    private m_topic_id: TopicId;
    private m_slot: number;

    constructor(topic_id: TopicId, slot: number){
        super();
        this.m_topic_id = topic_id;
        this.m_slot = slot;
    }

    topic_id():TopicId{
        return this.m_topic_id;
    }

    slot(): number {
        return this.m_slot;
    }

    type_info(): DescTypeInfo{
        return TOPICMESSAGELIST_DESC_TYPE_INFO;
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
            const r = new BuckyNumber("i32", this.m_slot).raw_measure();
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
            const r = new BuckyNumber("i32", this.m_slot).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }
}

export class TopicMessageListDescContentDecoder extends DescContentDecoder<TopicMessageListDescContent>{
    type_info(): DescTypeInfo{
        return TOPICMESSAGELIST_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicMessageListDescContent, Uint8Array]>{
        let topic_id;
        {
            const r = new TopicIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [topic_id, buf] = r.unwrap();
        }

        let slot;
        {
            const r = new BuckyNumberDecoder("i32").raw_decode(buf);
            if(r.err){
                return r;
            }
            [slot, buf] = r.unwrap();
        }

        const self = new TopicMessageListDescContent(topic_id, slot.toNumber());
        const ret:[TopicMessageListDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class TopicMessageListBodyContent extends BodyContent{
    private readonly m_start: number;
    private readonly m_msg_list: Vec<MsgInfo>;

    constructor(start: number, msg_list: Vec<MsgInfo>){
        super();
        this.m_start = start;
        this.m_msg_list = msg_list;
    }

    start(): number {
        return this.m_start;
    }

    msg_list(): Vec<MsgInfo>{
        return this.m_msg_list;
    }

    type_info(): DescTypeInfo{
        return TOPICMESSAGELIST_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        let size = 0;
        {
            const r = new BuckyNumber("u32", this.m_start).raw_measure();
            if(r.err){
                return r;
            }
            size += r.unwrap();
        }

        {
            const r = this.m_msg_list.raw_measure();
            if(r.err){
                return r;
            }
            size += r.unwrap();
        }

        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        {
            const r = new BuckyNumber("u32", this.m_start).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        {
            const r = this.m_msg_list.raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }
}

export class TopicMessageListBodyContentDecoder extends BodyContentDecoder<TopicMessageListBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[TopicMessageListBodyContent, Uint8Array]>{

        let start;
        {
            const r = new BuckyNumberDecoder("u32").raw_decode(buf);
            if(r.err){
                return r;
            }
            [start, buf] = r.unwrap();
        }

        let msg_list;
        {
            const r = new VecDecoder(new MsgInfoDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [msg_list, buf] = r.unwrap();
        }

        const self = new TopicMessageListBodyContent(start.toNumber(), msg_list);
        const ret:[TopicMessageListBodyContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class TopicMessageListDesc extends NamedObjectDesc<TopicMessageListDescContent>{
    // ignore
}

export  class TopicMessageListDescDecoder extends NamedObjectDescDecoder<TopicMessageListDescContent>{
    // ignore
}

export class TopicMessageListBuilder extends NamedObjectBuilder<TopicMessageListDescContent, TopicMessageListBodyContent>{
    // ignore
}

export class TopicMessageListId extends NamedObjectId<TopicMessageListDescContent, TopicMessageListBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.TopicMessageList, id);
    }

    static default(): DeviceId{
        return named_id_gen_default(CoreObjectType.TopicMessageList);
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        return named_id_from_base_58(CoreObjectType.TopicMessageList, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId>{
        return named_id_try_from_object_id(CoreObjectType.TopicMessageList, id);
    }
}

export class TopicMessageListIdDecoder extends NamedObjectIdDecoder<TopicMessageListDescContent, TopicMessageListBodyContent>{
    constructor(){
        super(CoreObjectType.TopicMessageList);
    }
}


export class TopicMessageList extends NamedObject<TopicMessageListDescContent, TopicMessageListBodyContent>{
    static create(topic_id: TopicId, slot: number):TopicMessageList{
        const desc_content = new TopicMessageListDescContent(topic_id, slot);

        let start;
        if(slot>=0){
            start = slot * TOPIC_MSG_LIST_NODE_CAPACITY;
        }else{
            start = 0;
        }

        const body_content = new TopicMessageListBodyContent(start, new Vec<MsgInfo>([]));
        const self = new TopicMessageListBuilder(desc_content, body_content).no_create_time().build();
        return new TopicMessageList(self.desc(), self.body(), self.signs(), self.nonce())
    }

    topic_message_list_id():  TopicMessageListId{
        return new TopicMessageListId(this.desc().calculate_id());
    }

    topic_id(): TopicId {
        return this.desc().content().topic_id();
    }

    slot(): number {
        return this.desc().content().slot();
    }

    start(): number {
        return this.body().unwrap().content().start();
    }

    msg_list(): Vec<MsgInfo> {
        return this.body().unwrap().content().msg_list();
    }
}

export class TopicMessageListDecoder extends NamedObjectDecoder<TopicMessageListDescContent, TopicMessageListBodyContent, TopicMessageList>{
    constructor(){
        super(new TopicMessageListDescContentDecoder(), new TopicMessageListBodyContentDecoder(), TopicMessageList);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicMessageList, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new TopicMessageList(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [TopicMessageList, Uint8Array];
        });
    }
}