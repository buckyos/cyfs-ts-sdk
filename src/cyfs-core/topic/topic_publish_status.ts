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
import { Option, Some, None, } from "../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { Vec } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";
import { DeviceId } from "../../cyfs-base/objects/device";
import { bucky_time_now } from "../../cyfs-base/base/time";

import { CoreObjectType } from "../core_obj_type";
import { TopicId, TopicIdDecoder } from "./topic";
import { TopicMessageList, TopicMessageListDecoder, TOPIC_MSG_LIST_NODE_CAPACITY } from "./topic_message_list";
import { MsgInfo } from "./topic_publish";
import { BuckyHashMap, BuckyHashMapDecoder } from "../../cyfs-base/base/bucky_hash_map";
import { BuckyHashSet, BuckyHashSetDecoder } from "../../cyfs-base/base/bucky_hash_set";
import { base_trace, error, log, warn } from "../../cyfs-base/base/log";


function binarySearch(ar:bigint[], el:bigint) {
    let m = 0;
    let n = ar.length - 1;
    while (m <= n) {
        const k = (n + m) >> 1;
        if( (el > ar[k]) ){
            m = k + 1;
        } else if(el < ar[k]) {
            n = k - 1;
        } else {
            return k;
        }
    }
    return -m - 1;
}

export class SeqInfo implements RawEncode {
    private readonly m_offset: bigint;           // bigint;
    private readonly m_start_seq: bigint;        // bigint;
    private m_received_seqs: bigint[];  // bigint
    constructor(offset: bigint, start_seq: bigint, seqs?: bigint[]){
        this.m_offset = offset;
        this.m_start_seq = start_seq;
        if(seqs!=null){
            this.m_received_seqs = seqs;
        }else{
            this.m_received_seqs = [];
        }
    }

    info(): string{
        return `[topic_status], offset:${this.m_offset}, start_seq:${this.m_start_seq}, last:${this.next()}, received_seqs:${this.m_received_seqs}`;
    }

    next(): bigint {
        if(this.m_received_seqs.length===0){
            return this.m_start_seq;
        }else{
            return this.m_received_seqs[0] + BigInt(1);
        }
    }

    exist(seq: bigint):boolean {
        for(const v of this.m_received_seqs){
            if(v===seq){
                return true;
            }
        }
        return false;
    }

    insert_received_seq(new_seq: bigint): BuckyResult<number>{
        if(this.m_received_seqs.length===0){
            this.m_received_seqs.push(new_seq);
            return Ok(0);
        }

        const index = binarySearch(this.m_received_seqs, new_seq);
        if(index>=0){
            return Err(new BuckyError(BuckyErrorCode.AlreadyExists,
                    `msg with seq:${new_seq} already exist`));
        }else{
            // bypass
        }

        this.m_received_seqs.push(new_seq);
        this.m_received_seqs.sort();

        if(this.m_received_seqs.length===1){
            return Ok(0);
        }

        const current = this.m_received_seqs[0];
        let continue_count = 0;
        let last_index = 0;
        for(let i=1;i<this.m_received_seqs.length;i++){
            const seq = this.m_received_seqs[i];
            if(seq===current+BigInt(1) || seq===current) {
                continue_count += 1;
                last_index = i;
            }else{
                break;
            }
        }

        if(continue_count>0){
            this.m_received_seqs = [...this.m_received_seqs.slice(last_index)];
        }

        return Ok(0);
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 8;
        size += 8;
        size += 8+this.m_received_seqs.length*8;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        {
            const r = new BuckyNumber('i64',this.m_offset).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        {
            const r = new BuckyNumber("u64", this.m_start_seq).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf = r.unwrap();
        }

        {
            const r = new BuckyNumber("u64", this.m_received_seqs.length).raw_encode(buf);
            if(r.err){
                return r;
            }
            buf= r.unwrap();
        }

        const view = buf.offsetView(0);
        let byteOffset = 0;
        for(const seq of this.m_received_seqs){
            view.setBigUint64(byteOffset,seq);
            byteOffset += 8;
        }
        buf = buf.offset(byteOffset);

        return Ok(buf);
    }
}

type MsgDict = Map<ObjectId, MsgInfo[]>;


export class SeqInfoDecoder implements RawDecode<SeqInfo> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[SeqInfo, Uint8Array]>{
        let offset;
        {
            const r = new BuckyNumberDecoder('i64').raw_decode(buf);
            if(r.err){
                return r;
            }
            [offset, buf] = r.unwrap();
        }

        let start_seq;
        {
            const r = new BuckyNumberDecoder("u64").raw_decode(buf);
            if(r.err){
                return r;
            }
            [start_seq, buf] = r.unwrap();
        }

        let length;
        {
            const r = new BuckyNumberDecoder("u64").raw_decode(buf);
            if(r.err){
                return r;
            }
            [length, buf] = r.unwrap();
        }

        const view = buf.offsetView(0);
        let byteOffset = 0;
        const seqs = [];
        for(let i=0;i<length.toBigInt();i++){
            const seq = view.getBigUint64(byteOffset);
            byteOffset += 8;
            seqs.push(seq);
        }
        buf = buf.offset(byteOffset);

        const ret:[SeqInfo, Uint8Array] = [new SeqInfo(offset.toBigInt(), start_seq.toBigInt(), seqs), buf];

        return Ok(ret);
    }
}

interface StatusEvent{
    // 从 NDN 获取 MessageList
    fetch: (msg_obj_id: ObjectId)=>Promise<BuckyResult<TopicMessageList>>;

    // 将MessageList 写入 NDN
    store: (msg_obj_id: ObjectId, msg_list: Uint8Array)=>Promise<BuckyResult<number>>;
}

export class TopicPublishStatusDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.TopicPublishStatus;
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

const TOPICPUBLISHSTATUS_DESC_TYPE_INFO = new TopicPublishStatusDescTypeInfo();

export class TopicPublishStatusDescContent extends DescContent {
    constructor(){
        super();
    }

    type_info(): DescTypeInfo{
        return TOPICPUBLISHSTATUS_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        base_trace("[desc][content], raw_encode, TopicPublishStatusDescContent");
        return Ok(buf);
    }
}

export class TopicPublishStatusDescContentDecoder extends DescContentDecoder<TopicPublishStatusDescContent>{
    type_info(): DescTypeInfo{
        return TOPICPUBLISHSTATUS_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicPublishStatusDescContent, Uint8Array]>{
        const obj =  new TopicPublishStatusDescContent();
        const ret:[TopicPublishStatusDescContent, Uint8Array] = [obj, buf];
        return Ok(ret);
    }
}

export interface MemberMsg{
    msg_seq: number;
    msg_dict: MsgDict;
}

export class TopicPublishStatusBodyContent extends BodyContent{
    private readonly m_topic_id: TopicId;

    // 设备队列
    private readonly m_device_list: BuckyHashSet<ObjectId>;

    // 消息队列
    private readonly m_msg_list: TopicMessageList;
    private m_msg_length: number; // number

    // 对象收到的序列
    private readonly m_seq_map: BuckyHashMap<ObjectId, SeqInfo>;

    // 队列缓存，不进入编解码
    private readonly m_msg_list_cache: BuckyHashMap<ObjectId, TopicMessageList>;

    constructor(
        topic_id: TopicId,
        device_list: ObjectId[],
        msg_length ?:number,
        msg_list?: TopicMessageList,
        seq_map?: BuckyHashMap<ObjectId, SeqInfo>
    ){
        super();
        this.m_topic_id = topic_id;

        if(msg_length){
            this.m_msg_length = msg_length;
        }else{
            this.m_msg_length = 0;
        }

        if(msg_list){
            this.m_msg_list = msg_list;
        }else{
            this.m_msg_list =  TopicMessageList.create(topic_id, -1);
        }

        if(seq_map){
            this.m_seq_map = seq_map;
        }else{
            this.m_seq_map = new BuckyHashMap();
        }

        this.m_device_list = new BuckyHashSet();
        for(const device_id of device_list) {
            this.insert_device(device_id, 0);
        }

        this.m_msg_list_cache = new BuckyHashMap();
    }

    topic_id(): TopicId{
        return this.m_topic_id;
    }

    //
    // message queue
    //
    async insert_msg(msg_obj_id: ObjectId, member_id: ObjectId, event: StatusEvent): Promise<BuckyResult<number>>{
        const seq = this.m_msg_length;
        const r = await this.push(event, new MsgInfo(1, BigInt(seq), msg_obj_id, member_id));
        if(r.err){
            return r;
        }
        this.m_msg_length += 1;

        warn(`\n\n$$$[topic_status], insert_msg, topic_id:${this.m_topic_id.toString()}, msg_list len:${this.m_msg_length}, last seq:{}\n\n`);

        return Ok(seq)
    }

    //
    // device list
    //
    insert_device(device_id: ObjectId, offset: number){
        const device_list = this.m_device_list;
        if(!device_list.has(device_id)) {
            device_list.add(device_id);
            warn(`[insert_device], device_list:`, device_id.toString());
            this.set_msg_offset(device_id, BigInt(offset));
        }
        warn(`[insert_device], device_list:${this.m_device_list}`);
    }

    remove_device(device_id: ObjectId){
        const device_list = this.m_device_list;
        device_list.delete(device_id);

        const seq_map = this.m_seq_map;
        seq_map.delete(device_id);
    }

    device_list(): ObjectId[] {
        const device_list = this.m_device_list;
        return Array.from(device_list.values());
    }

    device_list_exclude(device_id: ObjectId): ObjectId[]{
        return this.device_list().filter(d=>!d.eq(device_id));
    }

    //
    // device message seq
    //
    set_msg_offset( device_id: ObjectId, offset: bigint){
        log("[topic_status], set_msg_offset, topic_id:{}, device_id:{}", this.m_topic_id, device_id);
        let start_seq ;
        if( offset>0 ){
            start_seq = this.m_msg_length + Number(offset);
        } else if( offset === BigInt(0) ){
            start_seq = this.m_msg_length;
        } else {
            start_seq = this.m_msg_length - (Math.abs(Number((offset))));
        }

        const seq_map = this.m_seq_map;
        if(!seq_map.has(device_id)){
            const seq_info = new SeqInfo(offset, BigInt(start_seq));
            log("[topic_status], set_msg_offset, topic_id:{}, device_id:{} seq_info:{:?}",
                this.m_topic_id.to_string(),
                device_id.to_string(),
                seq_info
            );
            seq_map.set(device_id,seq_info);
        }else{
            // assert(false);
        }
    }

    insert_msg_received_seq( device_id: ObjectId, seq: number):  BuckyResult<number>{
        log("[topic_status], insert_msg_received_seq, topic_id:{}, device_id:{}, seq:{}",
            this.m_topic_id.to_string(),
            device_id.to_string(),
            seq
        );

        const seq_map = this.m_seq_map;
        if(!seq_map.has(device_id)) {
            return Err(BuckyError.from(BuckyErrorCode.NotFound));
        }else{
            const seq_info = seq_map.get(device_id)!;
            const r = seq_info.insert_received_seq(BigInt(seq));
            if(r.err){
                return r;
            }

            const next =  seq_info.next();
            log("[topic_status], insert_msg_received_seq, topic_id:{}, device_id:{}, next:{}, seq_info:{:?}",
                this.m_topic_id.to_string(),
                device_id.to_string(),
                next,
                seq_info
            );
        }

        return Ok(0);
    }

    async fetch_member_msg_list( _device_id: ObjectId, seq: number, count: number, event: StatusEvent): Promise<BuckyResult<MsgInfo[]>>{
        const len = this.m_msg_length;
        if( seq < 0 ){
            const start = Math.max(0, len-count);
            const values = await this.range(event, start, len);
            return Ok(values);
        }else{
            const start = seq;
            const end = Math.min(len, start+count);
            const values = await this.range(event, start, end);
            return Ok(values);
        }
    }

    exist_msg_seq( device_id: ObjectId, seq: number): boolean {
        const seq_map = this.m_seq_map;

        log("[topic_status], insert_msg_received_seq, topic_id:{}, device_id:{}, seq:{}", this.m_topic_id.to_string(), device_id.to_string(), seq);

        if(!seq_map.has(device_id)) {
            log("[topic_status], insert_msg_received_seq, topic_id:{}, device_id:{}, seq:{}, seq_info not found", this.m_topic_id.to_string(), device_id.to_string(), seq);
            return false;
        }

        const seq_info = seq_map.get(device_id)!;
        return seq_info.exist(BigInt(seq));
    }

    // 读取某个设备还未反馈收到的剩余消息
    async get_msg_rest( trace:string, device_id: ObjectId, event: StatusEvent): Promise<MsgInfo[]>{
        warn("[{}][topic_status][get_msg_rest], topic_id:{}, device_id:{}, calculate range", trace, this.m_topic_id.to_string(), device_id.to_string());

        const msg_list_size = this.m_msg_length;

        warn("[{}][topic_status][get_msg_rest], topic_id:{}, device_id:{}, msg_list_size:{}", trace, this.m_topic_id.to_string(), device_id.to_string(), msg_list_size);

        let range:Option<{start:number, end:number}>;

        const seq_map = this.m_seq_map;
        const seq_info = seq_map.get(device_id)!;

        // 计算偏移
        const next = seq_info.next();

        if( next < msg_list_size ){
            range = Some({start: Number(next), end:msg_list_size});
        } else{
            range = None;
        };

        // 日志
        warn("[{}][topic_status][get_msg_rest], topic_id:{}, device_id:{}, next:{}, msg_list_size:{}, range:{:?}, seq_info:{:?}",
            trace,
            this.m_topic_id.to_string(),
            device_id.to_string(),
            next,
            msg_list_size,
            range,
            seq_info
        );

        if(range.is_some()){
            const r = range.unwrap();
            const items = await this.range(event, r.start, r.end);
            return items;
        }else{
            return [];
        }
    }

    async append_member( trace:string, member_id:ObjectId, offset: bigint, event: StatusEvent): Promise<MsgInfo[]>{
        this.insert_device(member_id, Number(offset));
        const ret = await this.get_msg_rest(trace, member_id, event);
        return ret;
    }

    async append_member_msg(
        trace:string,
        topic_owner_id: ObjectId,
        member_id:ObjectId,
        msg_obj_id: ObjectId,
        event: StatusEvent
    ): Promise<BuckyResult<[bigint, BuckyHashMap<ObjectId, Vec<MsgInfo>>]>>{

        // 插入新消息
        warn("[append_member_msg] member_device_id:{}, msg_obj_id:{}, insert_msg", member_id, msg_obj_id);
        const msg_seq_ret = await this.insert_msg(msg_obj_id, member_id, event);
        if(msg_seq_ret.err){
            return msg_seq_ret;
        }
        const msg_seq = msg_seq_ret.unwrap();

        const result = new BuckyHashMap<ObjectId, Vec<MsgInfo>>();

        // 主OOD更新已消费消息Seq
        warn("[append_member_msg] member_device_id:{}, msg_obj_id:{}, insert_msg_received_seq", member_id, msg_obj_id);
        const insert_ret = this.insert_msg_received_seq(topic_owner_id, msg_seq);
        if(insert_ret.err){
            return insert_ret;
        }

        // 获取从OOD的未发送列表，排除主OOD自己的消息列表
        warn("[append_member_msg] member_device_id:{}, msg_obj_id:{}, device_list_exclude", member_id, msg_obj_id);
        const member_devices = this.device_list_exclude(topic_owner_id);
        warn("[append_member_msg] member_devices:{:?}", member_devices);

        for(const member_device_id of member_devices) {
            warn("[append_member_msg] get_msg_rest, member_device_id:{}", member_device_id);
            const msg_list = await this.get_msg_rest(trace, member_device_id, event);
            if( msg_list.length > 0 ){
                warn("[append_member_msg]rest msg list for member_device_id:{} len:{}", member_device_id, msg_list.length);
                result.set(member_device_id, new Vec(msg_list));
            }else{
                warn("[append_member_msg]rest msg list for member_device_id:{} is", member_device_id);
            }
        }

        // 返回
        warn("[append_member_msg] member_device_id:{}, msg_obj_id:{}, ret", member_id, msg_obj_id);

        const ret: [bigint, BuckyHashMap<ObjectId, Vec<MsgInfo>>] = [BigInt(msg_seq), result];
        return Ok(ret);
    }

    //
    // util
    //

    dump( _trace:string){
        //
    }

    calculate_node(index: number): [number, ObjectId, TopicMessageList] {
        const topic_id = this.m_topic_id;
        const slot = Math.floor(Number(index) / TOPIC_MSG_LIST_NODE_CAPACITY);
        const node_protyo = TopicMessageList.create(topic_id, Number(slot));
        const node_id = node_protyo.desc().calculate_id();
        const ret:[number, ObjectId, TopicMessageList] = [slot, node_id, node_protyo];
        return ret;
    }

    async get( event: StatusEvent, index: number): Promise<Option<MsgInfo>>{
        // const topic_id = this.m_topic_id;
        // const slot = Math.floor(Number(index) / TOPIC_MSG_LIST_NODE_CAPACITY);
        // const node_protyo = TopicMessageList.create(topic_id, Number(slot));
        // const node_id = node_protyo.desc().calculate_id();

        const [slot, node_id, node_protyo] = this.calculate_node(index);
        warn(`[get][calculate_node] index:${index}, slot:${slot}, node_id:${node_id.toString()}`);

        // 如果缓存中不存在就尝试查找
        let exist = false;
        {
            if( this.m_msg_list_cache.has(node_id) ){
                exist = true;
            }
        }

        if( !exist ){
            const r = await event.fetch(node_id);
            if(r.err){
                return None;
            }
            this.m_msg_list_cache.set(node_id, r.unwrap());
        }

        // 尝试冲缓存中提取，如果存在就返回m_
        const msg_list_cache = this.m_msg_list_cache;
        const list_ret = msg_list_cache.get(node_id);
        if(!list_ret){
            return None;
        }

        // get local msg_list
        const list = list_ret!;
        const old_body_content = list.body().unwrap().content();
        const msg_list = old_body_content.msg_list().value();

        // get local index
        const local_start = Number(old_body_content.start);
        const local_index = index - local_start;

        // get msg at local index from msg_list
        const msg = msg_list[local_index];
        return Some(msg);
    }

    async range( event: StatusEvent, start: number, end: number): Promise<MsgInfo[]>{
        warn("[range] start:{}, end:{},", start, end);

        let results:MsgInfo[] = [];
        const topic_id = this.m_topic_id;

        let count = end - start;
        let index = start;
        let last_slot = 0;
        let first = true;

        while(count>0) {
            const [slot, node_id, node_protyo] = this.calculate_node(index);
            warn(`[range][calculate_node] index:${index}, slot:${slot}, node_id:${node_id.toString()}`);

            // const slot = Math.floor(Number(index) / TOPIC_MSG_LIST_NODE_CAPACITY);
            if( !first && last_slot === slot ){
                warn("slot is not move, last_slot:{},", last_slot);
                break;
            }

            first = false;
            last_slot = slot;

            // const node_protyo = TopicMessageList.create(topic_id, Number(slot));
            // const node_id = node_protyo.desc().calculate_id();
            const msg_list_cache = this.m_msg_list_cache;

            // 如果缓存中不存在就尝试查找
            warn("[range] check msg_list:{} exist in msg_list_cache", node_id);
            if( !msg_list_cache.has(node_id) ){
                warn("[range] fetch msg_list:{}", node_id);
                const r = await event.fetch(node_id);
                if(r.err){
                    break;
                }else{
                    msg_list_cache.set(node_id, r.unwrap());
                }
            }

            // 尝试冲缓存中提取，如果存在就返回
            warn("[range] use msg_list:{} ", node_id);

            const list = msg_list_cache.get(node_id)!;
            const content = list.body().unwrap().content();
            const node_start = content.start();
            const msg_list = content.msg_list().value();

            if( index < node_start ){
                error("[range] msg_list:{}, index less then start, index:{}, start:{}",
                    node_id,
                    index,
                    node_start,
                );
                break;
            }


            const local_index = index - node_start;

            if( local_index>msg_list.length ){
                error("[range] msg_list:{}, index less then start, local_index:{}, msg_list.len():{}",
                    node_id,
                    local_index,
                    msg_list.length,
                );
                break;
            }

            const rest = msg_list.length - local_index;

            let range:{start:number, end:number} ;
            if( rest >= count ){
                range = {
                    start: local_index,
                    end: local_index+count
                };
            }else{
                range = {
                    start: local_index,
                    end: msg_list.length
                };
            };

            warn("[range]msg_list:{} msg_list.len:{}, count:{}, local_index:{}, index:{}, start:{}, range:{:?}",
                node_id,
                msg_list.length,
                count,
                local_index,
                index,
                node_start,
                range
            );

            const values = msg_list.slice(range.start,range.end);
            results = [...results, ...values];

            const cut_count = range.end - range.start;
            count -= cut_count;
            index += cut_count;
        }

        warn("[range] return msg_list range:{:?}", results);

        return results;
    }

    async push( event: StatusEvent, msg: MsgInfo): Promise<BuckyResult<number>>{
        // const topic_id = this.m_topic_id;
        const len = this.m_msg_length;
        // const slot = Math.floor(Number(len) / TOPIC_MSG_LIST_NODE_CAPACITY);

        // const new_node = TopicMessageList.create(topic_id, Number(slot));
        // const node_id = new_node.desc().calculate_id();

        const [slot, node_id, new_node] = this.calculate_node(len);
        warn(`[push][calculate_node] index:${len}, slot:${slot}, node_id:${node_id.toString()}`);

        const msg_list_cache = this.m_msg_list_cache;

        warn("[push]node_id:{:?}, start", node_id);

        // 如果缓存中不存在就尝试从NON获取
        if( !msg_list_cache.has(node_id) ){
            warn("[push]node_id:{:?}, fetch msg_list", node_id);
            const ret = await event.fetch(node_id);
            if(!ret.err){
                msg_list_cache.set(node_id, ret.unwrap());
            }
        }

         // 尝试冲缓存中提取，如果存在就返回
        let buf: Uint8Array;
        const node_ret = msg_list_cache.get(node_id);
        if(node_ret){
            const exist_node = node_ret!;
            const body = exist_node.body().unwrap();
            const msg_list = body.content().msg_list().value();
            msg_list.push(msg);

            body.set_update_time(bucky_time_now());
            const size = exist_node.raw_measure().unwrap();
            const encode_buf = new Uint8Array(size);
            exist_node.raw_encode(encode_buf);

            log("[push]node_id:{:?}, insert msg into exist msg list", node_id);

            buf = encode_buf;
        }else{
            const body = new_node.body().unwrap();
            const msg_list = body.content().msg_list().value();
            msg_list.push(msg);

            const size = new_node.raw_measure().unwrap();
            const encode_buf = new Uint8Array(size);
            new_node.raw_encode(encode_buf);

            if( !msg_list_cache.has(node_id) ){
                msg_list_cache.set(node_id, new_node);
            }

            log("[push]node_id:{:?}, insert msg into new msg list", node_id);

            buf = encode_buf;
        }

        const r = await event.store(node_id, buf);
        if(r.err){
            return r;
        }
        log("\n\n====>[push]node_id:{:?}, finish\n\n", node_id);

        return Ok(0);
    }

    //
    // 编解码
    //

    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += this.m_topic_id.raw_measure().unwrap();
        base_trace(`[body][content] raw_measure, topic_id, size:${size}`);

        size += this.m_device_list.raw_measure().unwrap();
        base_trace(`[body][content] raw_measure, m_device_list, size:${size}`);

        size += this.m_msg_list.raw_measure().unwrap();
        base_trace(`[body][content] raw_measure, m_msg_list, size:${size}`);

        size += new BuckyNumber('u32', this.m_msg_length).raw_measure().unwrap();
        base_trace(`[body][content] raw_measure, m_msg_length, size:${size}`);

        size += this.m_seq_map.raw_measure().unwrap();
        base_trace(`[body][content] raw_measure, m_seq_map, size:${size}`);

        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf = this.m_topic_id.raw_encode(buf).unwrap();
        buf = this.m_device_list.raw_encode(buf).unwrap();
        buf = this.m_msg_list.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.m_msg_length).raw_encode(buf).unwrap();
        buf = this.m_seq_map.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class TopicPublishStatusBodyContentDecoder extends BodyContentDecoder<TopicPublishStatusBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[TopicPublishStatusBodyContent, Uint8Array]>{

        let topic_id;
        {
            const r = new TopicIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [topic_id, buf] = r.unwrap();
        }

        let device_list;
        {
            const r = new BuckyHashSetDecoder(new ObjectIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [device_list, buf] = r.unwrap();
        }

        let msg_list;
        {
            const r = new TopicMessageListDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [msg_list, buf] = r.unwrap();
        }

        let msg_length;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [msg_length, buf] = r.unwrap();
        }

        let seq_map;
        {
            const r = new BuckyHashMapDecoder(new ObjectIdDecoder(), new SeqInfoDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [seq_map, buf] = r.unwrap();
        }

        const zone_body_content = new TopicPublishStatusBodyContent(
            topic_id,
            device_list.array(),
            msg_length.toNumber(),
            msg_list,
            seq_map
        );

        const ret:[TopicPublishStatusBodyContent, Uint8Array] = [zone_body_content, buf];

        return Ok(ret);
    }
}

export class TopicPublishStatusDesc extends NamedObjectDesc<TopicPublishStatusDescContent>{
    // ignore
}

export  class TopicPublishStatusDescDecoder extends NamedObjectDescDecoder<TopicPublishStatusDescContent>{
    // ignore
}

export class TopicPublishStatusBuilder extends NamedObjectBuilder<TopicPublishStatusDescContent, TopicPublishStatusBodyContent>{
    // ignore
}

export class TopicPublishStatusId extends NamedObjectId<TopicPublishStatusDescContent, TopicPublishStatusBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.TopicPublishStatus, id);
    }

    static default(): DeviceId{
        return named_id_gen_default(CoreObjectType.TopicPublishStatus);
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        return named_id_from_base_58(CoreObjectType.TopicPublishStatus, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId>{
        return named_id_try_from_object_id(CoreObjectType.TopicPublishStatus, id);
    }
}

export class TopicPublishStatusIdDecoder extends NamedObjectIdDecoder<TopicPublishStatusDescContent, TopicPublishStatusBodyContent>{
    constructor(){
        super(CoreObjectType.TopicPublishStatus);
    }
}


export enum StatusAction{
    AppendMember,
    RemoveMember,
    AppendMemberMsg,
    InsertMemberReceiveSeq,
    FetchMemberMsgList
}

export class StatusResult{
    msg_list?:  MsgInfo[];
    member_msg_dict?: BuckyResult<[bigint, BuckyHashMap<ObjectId, Vec<MsgInfo>>]>;
    result?: BuckyResult<number>;
    member_msg_list?: BuckyResult<MsgInfo[]>;

    static AppendMember(value: MsgInfo[]):StatusResult{
        const obj =  new StatusResult();
        obj.msg_list = value;
        return obj;
    }

    static RemoveMember(value: BuckyResult<number>):StatusResult{
        const obj =  new StatusResult();
        obj.result = value;
        return obj;
    }

    static AppendMemberMsg(value:BuckyResult<[bigint, BuckyHashMap<ObjectId, Vec<MsgInfo>>]>):StatusResult{
        const obj =  new StatusResult();
        obj.member_msg_dict = value;
        return obj;
    }

    static InsertMemberReceiveSeq(value: BuckyResult<number>):StatusResult{
        const obj =  new StatusResult();
        obj.result = value;
        return obj;
    }

    static FetchMemberMsgList(value: BuckyResult<MsgInfo[]>):StatusResult {
        const obj =  new StatusResult();
        obj.member_msg_list = value;
        return obj;
    }
}

export class StatusRequest{
    action: StatusAction;
    topic_owner_id: ObjectId;
    member_id: Option<ObjectId>;
    msg_obj_id: Option<ObjectId>;
    offset: Option<number>;
    msg_seq: Option<number>;
    msg_start: Option<number>;
    msg_count: Option<number>;
    trace: string;

    private constructor(args:{
        action: StatusAction,
        topic_owner_id: ObjectId,
        member_id: Option<ObjectId>,
        msg_obj_id: Option<ObjectId>,
        offset: Option<number>,
        msg_seq: Option<number>,
        msg_start: Option<number>,
        msg_count: Option<number>,
        trace: string
    }){
        this.action = args.action;
        this.topic_owner_id = args.topic_owner_id;
        this.member_id = args.member_id;
        this.msg_obj_id = args.msg_obj_id;
        this.offset = args.offset;
        this.msg_seq = args.msg_seq;
        this.msg_start = args.msg_start;
        this.msg_count = args.msg_count;
        this.trace = args.trace;
    }

    static append_member(trace: string, topic_owner_id: ObjectId, member_id:ObjectId, offset: number): StatusRequest{
        return new StatusRequest({
            action: StatusAction.AppendMember,
            topic_owner_id,
            member_id: Some(member_id),
            msg_obj_id: None,
            offset: Some(offset),
            msg_seq: None,
            msg_start: None,
            msg_count: None,
            trace
        })
    }

    static append_member_msg(trace:string, topic_owner_id: ObjectId, member_id:ObjectId, msg_obj_id: ObjectId): StatusRequest{
        return new StatusRequest({
            action: StatusAction.AppendMemberMsg,
            topic_owner_id,
            member_id: Some(member_id),
            msg_obj_id: Some(msg_obj_id),
            offset: None,
            msg_seq: None,
            msg_start: None,
            msg_count: None,
            trace
        });
    }

    static remove_member(trace: string, topic_owner_id: ObjectId, member_id:ObjectId): StatusRequest{
        return new StatusRequest({
            action: StatusAction.RemoveMember,
            topic_owner_id,
            member_id: Some(member_id),
            msg_obj_id: None,
            offset: None,
            msg_seq: None,
            msg_start: None,
            msg_count: None,
            trace
        });
    }

    static insert_member_receive_seq(trace: string, topic_owner_id: ObjectId, member_id:ObjectId, msg_seq: number): StatusRequest{
        return new StatusRequest({
            action: StatusAction.InsertMemberReceiveSeq,
            topic_owner_id,
            member_id: Some(member_id),
            msg_obj_id: None,
            offset: None,
            msg_seq: Some(msg_seq),
            msg_start: None,
            msg_count: None,
            trace
        })
    }

    static fetch_member_msg_list(trace: string, topic_owner_id:  ObjectId, member_id: ObjectId, start: number, count: number): StatusRequest{
        return new StatusRequest({
            action: StatusAction.FetchMemberMsgList,
            topic_owner_id: topic_owner_id.clone(),
            member_id: Some(member_id.clone()),
            msg_obj_id: None,
            offset: None,
            msg_seq: None,
            msg_start: Some(start),
            msg_count: Some(count),
            trace,
        })
    }
}

export class TopicPublishStatus extends NamedObject<TopicPublishStatusDescContent, TopicPublishStatusBodyContent>{
    static create(owner: ObjectId, topic_id: TopicId, init_device_list: ObjectId[]): TopicPublishStatus{
        const desc_content = new TopicPublishStatusDescContent();
        const body_content = new TopicPublishStatusBodyContent(topic_id, init_device_list);

        const obj =  new TopicPublishStatusBuilder(desc_content, body_content)
            .owner(owner)
            .no_create_time()
            .update_time(bucky_time_now())
            .build();

        return new TopicPublishStatus(obj.desc(), obj.body(), obj.signs(), obj.nonce());
    }

    owner_id(): ObjectId{
        return this.desc().owner()!.unwrap();
    }

    topic_publish_status_id(): TopicPublishStatusId{
        return new TopicPublishStatusId(this.desc().calculate_id());
    }

    device_list(): ObjectId[]{
        return this.body_expect().content().device_list()
    }

    device_list_exclude(device_id: ObjectId): ObjectId[]{
        return this.body_expect().content().device_list_exclude(device_id);
    }

    exist_msg_seq(device_id: ObjectId, seq: number): boolean{
        return this.body_expect().content().exist_msg_seq(device_id, seq);
    }

    async reduce(req: StatusRequest, event: StatusEvent): Promise<StatusResult> {
        const body = this.body_expect().content();
        switch(req.action){
            case StatusAction.AppendMember:{
                const member_id = req.member_id.unwrap();
                const offset = req.offset.unwrap();
                const ret = await body.append_member(req.trace, member_id, BigInt(offset), event);
                return StatusResult.AppendMember(ret);
            }
            case StatusAction.RemoveMember:{
                const member_id = req.member_id.unwrap();
                body.remove_device(member_id);
                return StatusResult.RemoveMember(Ok(0));
            }
            case StatusAction.AppendMemberMsg:{
                const member_id = req.member_id.unwrap();
                const msg_obj_id = req.msg_obj_id.unwrap();
                const ret = await body.append_member_msg(
                    req.trace,
                    req.topic_owner_id,
                    member_id,
                    msg_obj_id,
                    event
                );
                return StatusResult.AppendMemberMsg(ret);
            }
            case StatusAction.InsertMemberReceiveSeq:{
                const member_id = req.member_id.unwrap();
                const seq = req.msg_seq.unwrap();
                const ret = body.insert_msg_received_seq(member_id, seq);
                return StatusResult.InsertMemberReceiveSeq(ret);
            }
            case StatusAction.FetchMemberMsgList: {
                const member_id = req.member_id.unwrap();
                const start = req.msg_start.unwrap();
                const count = req.msg_count.unwrap();
                const ret = await body.fetch_member_msg_list(member_id, start, count, event);
                return StatusResult.FetchMemberMsgList(ret);
            }
        }
    }
}

export class TopicPublishStatusDecoder extends NamedObjectDecoder<TopicPublishStatusDescContent, TopicPublishStatusBodyContent, TopicPublishStatus>{
    constructor(){
        super(new TopicPublishStatusDescContentDecoder(), new TopicPublishStatusBodyContentDecoder(), TopicPublishStatus);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TopicPublishStatus, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new TopicPublishStatus(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [TopicPublishStatus, Uint8Array];
        });
    }
}