import * as core from "../cyfs-core";

import {
    Option, None, Some,
    BuckyResult,
    ObjectId,
    DeviceId,
    Ok,
    PeopleId,
    UniqueId,
    Vec,
    NamedObject,
    DescContent,
    BodyContent,
    bucky_time_now,
    AnyNamedObject,
    match_any_obj,
    CoreObject,
    Err,
    BuckyError,
    BuckyErrorCode,
    AnyNamedObjectDecoder,
    NamedObjectContextDecoder,
    BuckyNumber,
    EventListenerAsyncRoutine
} from "../cyfs-base";

import {
    CoreObjectType,
    MsgInfo,
    TopicId, Topic,
    TopicSubscribe,
    TopicSubscribeSuccess,
    TopicUnsubscribe,
    TopicUnsubscribeSuccess,
    TopicPublish,
    TopicPublishResp,
    TopicPublishStatus,
    TopicPublishStatusId,
    StatusRequest,
    StatusResult,
    TopicIdDecoder,
    TopicDecoder,
    TopicPublishStatusDecoder,
    TopicSubscribeDecoder,
    TopicSubscribeSuccessDecoder,
    TopicUnsubscribeDecoder,
    TopicUnsubscribeSuccessDecoder,
    TopicPublishDecoder,
    TopicPublishReqDecoder,
    TopicPublishRespDecoder,
    TopicPublishReq,
} from "../cyfs-core";

import {
    SharedObjectStack,
    RouterEventFilter,
    RouterAction,
    RouterRuleCategory,
} from "../non-lib";
import { TopicMessageList, TopicMessageListDecoder } from "../cyfs-core/topic/topic_message_list";

import {
    log,
    warn,
    error
} from "../cyfs-base/base/log";
import { BuckyHashMap } from "../cyfs-base/base/bucky_hash_map";

const assert = console.assert;

export enum SubscriberAction {
    Accept,
    Rejcet,
    Ignore
}

export type Subscriber = (topic_id: TopicId, device_id: DeviceId, msg_obj_id: Option<ObjectId>) => Promise<BuckyResult<number>>;
export type SubscriberReqest = (topic_id: TopicId, device_id: DeviceId, msg_obj_id: Option<ObjectId>) => Promise<BuckyResult<number>>;
export type Unsubscriber = (topic_id: TopicId, device_id: DeviceId, msg_obj_id: Option<ObjectId>) => Promise<BuckyResult<number>>;
export type Publish = (topic_id: TopicId, device_id: DeviceId, msg_obj_id: ObjectId) => Promise<BuckyResult<number>>;

class TopicEventInner {
    private readonly subscriber: Option<Subscriber>;
    private readonly subscriber_req: Option<SubscriberReqest>;
    private readonly unsubscriber: Option<Unsubscriber>;
    private readonly publisher: Option<Publish>;

    constructor(
        subscriber: Option<Subscriber>,
        subscriber_req: Option<SubscriberReqest>,
        unsubscriber: Option<Unsubscriber>,
        publisher: Option<Publish>
    ) {
        this.subscriber = subscriber;
        this.subscriber_req = subscriber_req;
        this.unsubscriber = unsubscriber;
        this.publisher = publisher;
    }

    async emit_subscribe(topic_id: TopicId, device_id: ObjectId, msg_obj_id: Option<ObjectId>): Promise<BuckyResult<number>> {
        if (this.subscriber.is_some()) {
            const fn = this.subscriber.unwrap();
            const ret = await fn(topic_id, DeviceId.try_from_object_id(device_id).unwrap(), msg_obj_id);
            return ret;
        } else {
            return Ok(0);
        }
    }

    async emit_subscribe_request(topic_id: TopicId, device_id: ObjectId, msg_obj_id: Option<ObjectId>): Promise<BuckyResult<number>> {
        if (this.subscriber_req.is_some()) {
            const fn = this.subscriber_req.unwrap();
            const ret = await fn(topic_id, DeviceId.try_from_object_id(device_id).unwrap(), msg_obj_id);
            return ret;
        } else {
            return Ok(0);
        }
    }

    async emit_unsubscribe(topic_id: TopicId, device_id: ObjectId, msg_obj_id: Option<ObjectId>): Promise<BuckyResult<number>> {
        if (this.unsubscriber.is_some()) {
            const fn = this.unsubscriber.unwrap();
            const ret = await fn(topic_id, DeviceId.try_from_object_id(device_id).unwrap(), msg_obj_id);
            return ret;
        } else {
            return Ok(0);
        }
    }

    async emit_publish(topic_id: TopicId, device_id: ObjectId, msg_obj_id: ObjectId): Promise<BuckyResult<number>> {
        if (this.publisher.is_some()) {
            const fn = this.publisher.unwrap();
            const ret = await fn(topic_id, DeviceId.try_from_object_id(device_id).unwrap(), msg_obj_id);
            return ret;
        } else {
            return Ok(0);
        }
    }
}

class OnPostPutToNOC implements EventListenerAsyncRoutine<RouterAction> {
    constructor(
        public owner: TopicManager,
        public event_inner: TopicEventInner,
    ) {
        // ignore
    }

    async call(param: any): Promise<BuckyResult<RouterAction>> {
        const owned_param = param;

        log("==>topic_manager, OnPostPutToNOC", owned_param.base.object_id.toString(), owned_param.base.device_id.toString(), owned_param.base.direction);

        if (param == null || param.base == null || param.base.object == null) {
            error("OnPostPutToNOC, param is null:", param);
            return Ok(RouterAction.Pass);
        }

        const buf_ret = Uint8Array.prototype.fromHex(param.base.object);
        if (buf_ret.err) {
            error("OnPostPutToNOC, from hex failed:", param.base.object);
            return Ok(RouterAction.Pass);
        }
        const object_raw = buf_ret.unwrap();

        const r = new NamedObjectContextDecoder().raw_decode(object_raw);
        if (r.err) {
            error("OnPostPutToNOC, decode ctx failed:", object_raw);
            return Ok(RouterAction.Pass);
        }
        const [ctx, _rest_buf] = r.unwrap();
        if (!ctx.is_core_object()) {
            return Ok(RouterAction.Pass);
        }

        let save = false;
        switch (ctx.obj_type) {
            case CoreObjectType.Topic: {
                log("OnPostPutToNOC, recv Topic");
                setTimeout(() => {
                    const [obj, _] = new TopicDecoder().raw_decode(object_raw).unwrap();
                    this.owner.on_get_topic(obj, this.event_inner);
                }, 1);
                save = true;
                break;
            }
            case CoreObjectType.TopicSubscribe: {
                log("OnPostPutToNOC, recv TopicSubscribe");
                setTimeout(() => {
                    const [obj, _] = new TopicSubscribeDecoder().raw_decode(object_raw).unwrap();
                    this.owner.on_get_topic_subscribe(obj, this.event_inner);
                }, 1);
                break;
            }
            case CoreObjectType.TopicSubscribeSuccess: {
                log("OnPostPutToNOC, recv TopicSubscribeSuccess");
                setTimeout(() => {
                    const [obj, _] = new TopicSubscribeSuccessDecoder().raw_decode(object_raw).unwrap();
                    this.owner.on_get_topic_subscribe_success(obj, this.event_inner);
                }, 1);
                break;
            }
            case CoreObjectType.TopicUnsubscribe: {
                log("OnPostPutToNOC, recv TopicUnsubscribe");
                setTimeout(() => {
                    const [obj, _] = new TopicUnsubscribeDecoder().raw_decode(object_raw).unwrap();
                    this.owner.on_get_topic_unsubscribe(obj, this.event_inner);
                }, 1);
                break;
            }
            case CoreObjectType.TopicUnsubscribeSuccess: {
                log("OnPostPutToNOC, recv TopicUnsubscribeSuccess");
                setTimeout(() => {
                    const [obj, _] = new TopicUnsubscribeSuccessDecoder().raw_decode(object_raw).unwrap();
                    this.owner.on_get_topic_unsubscribe_success(obj, this.event_inner);
                }, 1);
                break;
            }
            case CoreObjectType.TopicPublish: {
                log("OnPostPutToNOC, recv TopicPublish");
                setTimeout(() => {
                    const [obj, _] = new TopicPublishDecoder().raw_decode(object_raw).unwrap();
                    this.owner.on_get_topic_publish(obj, this.event_inner);
                }, 1);
                break;
            }
            case CoreObjectType.TopicPublishReq: {
                log("OnPostPutToNOC, recv TopicPublishReq");
                setTimeout(() => {
                    const [obj, _] = new TopicPublishReqDecoder().raw_decode(object_raw).unwrap();
                    this.owner.on_get_topic_publish_req(obj, this.event_inner);
                }, 1);
                break;
            }
            case CoreObjectType.TopicPublishResp: {
                log("OnPostPutToNOC, recv TopicPublishResp");
                setTimeout(() => {
                    const [obj, _] = new TopicPublishRespDecoder().raw_decode(object_raw).unwrap();
                    this.owner.on_get_topic_publish_resp(obj, this.event_inner);
                }, 1);
                break;
            }
            default: {
                log("is not my core obj, pass");
                return Ok(RouterAction.Pass);
            }
        }

        if (save) {
            return Ok(RouterAction.Accept);
        } else {
            if (owned_param.base.direction === "local_to_local") {
                log("is obj from this zone, pass");
                return Ok(RouterAction.Pass);
            } else {
                log("is obj from other zone and not save, drop");
                return Ok(RouterAction.Drop);
            }
        }
    }
}

enum MsgDirection {
    Main2Main,
    Follow2Main,
    Main2Follow,
    Follow2Follow
}

interface MsgDirectionInfo {
    dir: MsgDirection,
    info: string
}

export class TopicEvent {
    private subscriber: Option<Subscriber>;
    private subscriber_req: Option<SubscriberReqest>;
    private unsubscriber: Option<Unsubscriber>;
    private publisher: Option<Publish>;

    constructor() {
        this.subscriber = None;
        this.subscriber_req = None;
        this.unsubscriber = None;
        this.publisher = None;
    }

    on_subscribe(callback: Subscriber) {
        this.subscriber = Some(callback);
    }

    on_subscriber_req(callback: SubscriberReqest) {
        this.subscriber_req = Some(callback);
    }

    on_unsubscribe(callback: Unsubscriber) {
        this.unsubscriber = Some(callback);
    }

    on_publish(callback: Publish) {
        this.publisher = Some(callback);
    }

    build(): TopicEventInner {
        return new TopicEventInner(
            this.subscriber,
            this.subscriber_req,
            this.unsubscriber,
            this.publisher
        );
    }
}

class PutTask {
    constructor(public msg_obj_id: ObjectId) { }
}

class SubscribeTask {
    constructor(public topic_id: TopicId, public device_id: ObjectId, public msg_obj_id: Option<ObjectId>) { }
}

class UnsubscribeTask {
    constructor(public topic_id: TopicId, public device_id: ObjectId, public msg_obj_id: Option<ObjectId>) { }
}

class PublishTask {
    constructor(public topic_id: TopicId, public device_id: ObjectId, public msg_obj_id: ObjectId) { }
}

class FetchTask {
    constructor(public topic_id: TopicId, public device_id: ObjectId, public msg_list: MsgInfo[]) { }
}

export class TopicManager {
    private readonly owner_id: PeopleId;
    private readonly owner_object_id: ObjectId;
    public readonly ood_id: DeviceId;
    private readonly ood_object_id: ObjectId;
    private readonly stack: SharedObjectStack;
    private readonly status_map: BuckyHashMap<ObjectId, TopicPublishStatus>;
    private readonly put_tasks: PutTask[];
    private readonly subscribe_tasks: SubscribeTask[];
    private readonly unsubscribe_tasks: UnsubscribeTask[];
    private readonly publish_tasks: PublishTask[];
    private readonly fetch_tasks: FetchTask[];
    private last_select_time: bigint;

    constructor(
        stack: SharedObjectStack,
        owner_id: PeopleId,
        ood_id: DeviceId,
        last_select_time: bigint
    ) {
        this.owner_id = owner_id;
        this.owner_object_id = owner_id.object_id;
        this.ood_id = ood_id;
        this.ood_object_id = ood_id.object_id;
        this.stack = stack;
        this.status_map = new BuckyHashMap();
        this.put_tasks = [];
        this.subscribe_tasks = [];
        this.unsubscribe_tasks = [];
        this.publish_tasks = [];
        this.fetch_tasks = [];
        this.last_select_time = last_select_time;
    }

    async create_topic(unique_id: UniqueId, init_device_list: DeviceId[], user_data_id: Option<ObjectId>): Promise<BuckyResult<TopicId>> {
        // 初始化成员列表
        if (init_device_list.indexOf(this.ood_id) < 0) {
            init_device_list.push(this.ood_id);
        }

        // 创建 Topic
        const topic = Topic.create(
            this.ood_object_id,
            unique_id,
            user_data_id
        );

        const topic_id = topic.topic_id();

        // 查找下 Topic 是否已存在
        const ret = await this.get_topic(topic_id, this.ood_object_id);
        if (!ret.err) {
            // 已存在，直接返回
            return Ok(topic_id);
        }

        // 创建 TopicPublishStatus
        const topic_publish_status = TopicPublishStatus.create(
            this.ood_object_id,
            topic_id,
            init_device_list.map(d => d.object_id)
        );
        const topic_publish_status_id = topic_publish_status.topic_publish_status_id();

        // 绑定 Topic 和 TopicPublishStatus
        topic.set_topic_publish_status_id(topic_publish_status_id);

        // 写入 TopicPublishStatus 到内存缓存和 NOC
        this.status_map.set(topic_publish_status_id.object_id, topic_publish_status);

        // 写入 Topic 到 NOC
        await this.sign_and_put_object(topic_publish_status, this.ood_object_id);
        await this.sign_and_put_object(topic, this.ood_object_id);

        // 返回
        return Ok(topic_id)
    }

    async subscribe(topic_id: TopicId, msg_seq: number, member_device_id: Option<DeviceId>, topic_owner_id: Option<ObjectId>): Promise<BuckyResult<number>> {
        return this.subscribe_impl(topic_id, msg_seq, None, member_device_id, topic_owner_id);
    }

    async subscribe_with_msg<DC extends DescContent, BC extends BodyContent>(
        topic_id: TopicId,
        msg_seq: number,
        msg_obj: NamedObject<DC, BC>,
        member_device_id: Option<DeviceId>,
        topic_owner_id: Option<ObjectId>
    ): Promise<BuckyResult<number>> {
        return this.subscribe_impl(topic_id, msg_seq, Some(msg_obj), member_device_id, topic_owner_id);
    }

    async subscribe_impl<DC extends DescContent, BC extends BodyContent>(
        topic_id: TopicId,
        msg_offset: number,
        msg_obj: Option<NamedObject<DC, BC>>,
        member_device_id: Option<DeviceId>,
        topic_owner_id_: Option<ObjectId>
    ): Promise<BuckyResult<number>> {
        // member_id 默认值
        let member_id: ObjectId;
        if (member_device_id.is_some()) {
            member_id = member_device_id.unwrap().object_id.clone();
        } else {
            member_id = this.ood_object_id.clone();
        }

        // topic_owner 默认值
        let topic_owner_id: ObjectId;
        if (topic_owner_id_.is_some()) {
            // 指定，尝试获取
            topic_owner_id = topic_owner_id_.unwrap();
            const topic = await this.get_topic(topic_id, topic_owner_id);
        } else {
            // 没指定，尝试从本地获取Topic
            const r = await this.fetch_topic(topic_id);
            if (r.err) {
                return r;
            }
            const topic = r.unwrap();
            topic_owner_id = topic.owner_id();
        }

        // 往自己的NOC写入msg
        let msg_obj_id: Option<ObjectId>;
        if (msg_obj.is_some()) {
            const msg_obj_inner = msg_obj.unwrap();
            await this.put_object(msg_obj_inner, this.ood_object_id);
            msg_obj_id = Some(msg_obj_inner.desc().calculate_id())
        } else {
            msg_obj_id = None
        }

        // Topic就是本OOD所有的
        if (topic_owner_id.eq(this.ood_object_id)) {
            // 查找topic
            let topic: Topic;
            {
                const r = await this.get_topic(topic_id, topic_owner_id);
                if (r.err) {
                    return r;
                }
                topic = r.unwrap();
            }

            const topic_status_id = topic.topic_publish_status_id();

            // 添加成员
            let msg_list: MsgInfo[];
            {
                const req = StatusRequest.append_member("[subscribe]", topic_owner_id, member_id, msg_offset);
                const r = await this.reduce_status(topic_status_id, req);
                if (r.err) {
                    return r;
                }
                msg_list = r.unwrap().msg_list!;
            }

            // 推送消息
            if (member_id.eq(this.ood_object_id)) {
                // Topic所有者为自己订阅
                // 触发自己订阅成功事件
                this.subscribe_tasks.push(new SubscribeTask(topic_id, topic_owner_id, msg_obj_id));
                for (const msg_info of msg_list) {
                    // 刷新自己的消息列表
                    const req = StatusRequest.insert_member_receive_seq("[subscribe]", topic_owner_id, member_id, msg_info.seq_number());
                    {
                        const r = await this.reduce_status(topic_status_id, req);;
                        if (r.err) {
                            return r;
                        }
                    };

                    // 触发自己的publish事件
                    this.publish_tasks.push(new PublishTask(topic_id, msg_info.member_id(), msg_info.msg_obj_id()));
                }
            } else {
                // Topic所有者为成员订阅成功，通知下成员被动订阅成功
                const success = TopicSubscribeSuccess.create(this.ood_object_id, topic_id, topic_owner_id, member_id, BigInt(msg_offset), msg_obj_id);
                await this.sign_and_put_object(success, member_id);

                // Topic所有者为成员订阅成功，刷一下成员的消息列表
                for (const msg_info of msg_list) {
                    const publish = TopicPublish.create(this.ood_object_id, topic_id, topic_owner_id, msg_info);

                    // 不必等待，异步投递
                    this.sign_and_put_object(publish, member_id);
                }
            }
        } else {
            // 创建订阅
            const subscribe = TopicSubscribe.create(
                this.ood_object_id,
                topic_id,
                topic_owner_id,
                member_id,
                BigInt(msg_offset),
                msg_obj_id
            );

            // 投递订阅
            this.sign_and_put_object(subscribe, topic_owner_id);
        }

        return Ok(0);
    }

    async unsubscribe(topic_id: TopicId, member_device_id: Option<DeviceId>, topic_owner_id: Option<ObjectId>): Promise<BuckyResult<number>> {
        return this.unsubscribe_impl(topic_id, None, member_device_id, topic_owner_id);
    }

    async unsubscribe_with_msg<DC extends DescContent, BC extends BodyContent>(
        topic_id: TopicId,
        msg_obj: NamedObject<DC, BC>,
        member_device_id: Option<DeviceId>,
        topic_owner_id: Option<ObjectId>
    ): Promise<BuckyResult<number>> {
        return this.unsubscribe_impl(topic_id, Some(msg_obj), member_device_id, topic_owner_id);
    }

    async unsubscribe_impl<DC extends DescContent, BC extends BodyContent>(
        topic_id: TopicId,
        msg_obj: Option<NamedObject<DC, BC>>,
        member_device_id: Option<DeviceId>,
        topic_owner_id_: Option<ObjectId>
    ): Promise<BuckyResult<number>> {
        // member_id 默认值
        let member_id;
        if (member_device_id.is_some()) {
            member_id = member_device_id.unwrap().object_id;
        } else {
            member_id = this.ood_object_id;
        }

        // topic_owner 默认值
        let topic_owner_id;
        if (topic_owner_id_.is_some()) {
            // 指定，尝试获取
            topic_owner_id = topic_owner_id_.unwrap();
            const topic = await this.get_topic(topic_id, topic_owner_id);
        } else {
            // 没指定，尝试从本地获取Topic
            const topic = await this.fetch_topic(topic_id);
            topic_owner_id = topic.unwrap().owner_id()
        }

        // 往自己的NOC写入msg
        let msg_obj_id;
        if (msg_obj.is_some()) {
            await this.put_object(msg_obj.unwrap(), this.ood_object_id);
            msg_obj_id = Some(msg_obj.unwrap().desc().calculate_id());
        } else {
            msg_obj_id = None;
        }

        if (topic_owner_id.eq(this.ood_object_id)) {
            // 查找topic status
            let topic: Topic;
            {
                const r = await this.get_topic(topic_id, topic_owner_id);
                if (r.err) {
                    return r;
                }
                topic = r.unwrap();
            }

            const topic_status_id = topic.topic_publish_status_id();

            // 移除成员
            const req = StatusRequest.remove_member("[unsubscribe]", topic_owner_id, member_id);
            {
                const r = await this.reduce_status(topic_status_id, req);
                if (r.err) {
                    return r;
                }
            };

            // 触发事件
            if (member_id.eq(this.ood_object_id)) {
                // Topic所有者为自己取消订阅，触发事件
                this.unsubscribe_tasks.push(new UnsubscribeTask(topic_id, topic_owner_id, msg_obj_id));
            } else {
                // Topic所有者为成员取消订阅，通知成员
                const success = TopicUnsubscribeSuccess.create(
                    this.ood_object_id,
                    topic_id,
                    topic_owner_id,
                    member_id,
                    msg_obj_id
                );
                this.sign_and_put_object(success, member_id);
            }
        } else {
            // 创建取消订阅
            const topic_unsubscribe = TopicUnsubscribe.create(this.ood_object_id, topic_id, topic_owner_id, member_id, msg_obj_id);

            // 投递取消订阅
            this.sign_and_put_object(topic_unsubscribe, topic_owner_id);
        }

        return Ok(0);
    }

    async publish<DC extends DescContent, BC extends BodyContent>(
        topic_id: TopicId,
        msg_obj: NamedObject<DC, BC>,
        topic_owner_id_: Option<ObjectId>
    ): Promise<BuckyResult<number>> {

        // member_id
        const member_id = this.ood_object_id;

        // topic_owner 默认值
        let topic_owner_id;
        let topic: Topic;
        if (topic_owner_id_.is_some()) {
            // 指定，尝试获取
            topic_owner_id = topic_owner_id_.unwrap();
            topic = (await this.get_topic(topic_id, topic_owner_id)).unwrap();
        } else {
            // 没指定，尝试从本地获取Topic
            const r = await this.fetch_topic(topic_id);
            if (r.err) {
                return r;
            }
            topic = r.unwrap();
            topic_owner_id = topic.owner_id();
        }

        // 往自己的NOC写入msg
        const msg_obj_id = msg_obj.desc().calculate_id();
        await this.put_object(msg_obj, this.ood_object_id);

        // Topic就是本OOD所有的
        if (topic_owner_id.eq(this.ood_object_id)) {
            // 查找topic
            const topic_status_id = topic.topic_publish_status_id();

            // 追加消息
            // 主OOD会直接消耗掉新加消息的Seq
            let member_rest_msg_map;
            const req = StatusRequest.append_member_msg("[publish],", topic_owner_id, member_id, msg_obj_id);
            {
                const r = await this.reduce_status(topic_status_id, req);
                if (r.err) {
                    return r;
                }

                const dict = r.unwrap().member_msg_dict!;
                if (dict.err) {
                    return dict;
                }

                const [_msg_seq, _member_rest_msg_map] = dict.unwrap();

                member_rest_msg_map = _member_rest_msg_map;
            }

            // 从OOD需要被广播未消耗消息列表
            for (const [member_device_id, msg_list] of member_rest_msg_map.entries()) {
                if (msg_list) {
                    for (const inner_msg_info of msg_list.value()) {
                        const publish = TopicPublish.create(this.ood_object_id, topic_id, topic_owner_id, inner_msg_info);
                        this.sign_and_put_object(publish, member_device_id);
                    }
                }
            }

            // 触发主OOD自己的publish事件
            this.publish_tasks.push(new PublishTask(topic_id, topic_owner_id, msg_obj_id));
        } else {
            // 创建发布消息
            const msg_info = new MsgInfo(0, BigInt(0), msg_obj_id, this.ood_object_id);
            const publish = TopicPublish.create(this.ood_object_id, topic_id, topic_owner_id, msg_info);
            this.sign_and_put_object(publish, topic_owner_id);
        }

        return Ok(0);
    }

    async fetch(topic_id: TopicId, topic_owner_id_: Option<ObjectId>, start: number, count: number): Promise<BuckyResult<number>> {
        // member_id
        const member_id = this.ood_object_id;

        // topic_owner 默认值
        let topic_owner_id;
        let topic: Topic;
        if (topic_owner_id_.is_some()) {
            // 指定，尝试获取
            topic_owner_id = topic_owner_id_.unwrap();
            const ret = await this.get_topic(topic_id, topic_owner_id);
            if (ret.err) {
                return ret;
            }
            topic = ret.unwrap();
        } else {
            // 没指定，尝试从本地获取Topic
            const r = await this.fetch_topic(topic_id);
            if (r.err) {
                return r;
            }
            topic = r.unwrap();
            topic_owner_id = topic.owner_id();
        }

        if (topic_owner_id.eq(this.ood_object_id)) {
            // Topic就是本OOD所有的，直接取消息并异步推送
            const msg_seq_start = start;
            const msg_count = count;
            const topic_status_id = topic.topic_publish_status_id();
            const req = StatusRequest.fetch_member_msg_list("[fetch]", topic_owner_id, member_id, msg_seq_start, msg_count);

            const fetch_ret = await this.reduce_status(topic_status_id, req);
            if (fetch_ret.err) {
                return fetch_ret;
            }

            const msg_list_ret = fetch_ret.unwrap().member_msg_list;
            if (!msg_list_ret) {
                return Err(new BuckyError(BuckyErrorCode.Failed, "fetch result undefined"));
            }

            if (msg_list_ret.err) {
                return msg_list_ret;
            }

            const msg_list = msg_list_ret?.unwrap();

            this.fetch_tasks.push(new FetchTask(topic_id, topic_owner_id, msg_list));
        } else {
            // 不是主OOD，往主OOD发起publish请求
            const publish_req = TopicPublishReq.create(
                this.ood_object_id,
                topic_id,
                topic_owner_id,
                member_id,
                BigInt(start),
                count
            );

            this.sign_and_put_object(publish_req, topic_owner_id);
        }

        return Ok(0);
    }

    async run(event: TopicEvent) {
        const event_inner = event.build();
        // loop by timer + select + dispatch
        const listener = new OnPostPutToNOC(
            this,
            event_inner
        );
        const filter = RouterEventFilter.default();

        log();
        log("begin init cyfs_topic_manager_on_post_put_to_noc");
        await this.stack.router_rules().add_rule(
            "cyfs_topic_manager_on_post_put_to_noc",
            RouterRuleCategory.PrePutToNOC,
            filter,
            RouterAction.Default,
            Some(listener)
        );
        log("end init cyfs_topic_manager_on_post_put_to_noc");
        log();

        setInterval(async () => {
            await this.flush_status();
            await this.flush_topic_ood_event(event_inner);
        }, 100);
    }

    msg_direction(topic_owner_id: ObjectId, obj_come_from: ObjectId): MsgDirectionInfo {

        const info = `topic_owner_id:${topic_owner_id}, this_ood_id:${this.ood_object_id}, obj_come_from:${obj_come_from}`;

        let dir;

        if (this.ood_object_id.eq(topic_owner_id)) {
            if (obj_come_from.eq(this.ood_object_id)) {
                dir = MsgDirection.Main2Main;
            } else {
                dir = MsgDirection.Follow2Main;
            }
        } else {
            if (obj_come_from.eq(this.ood_object_id)) {
                dir = MsgDirection.Follow2Follow;
            } else {
                dir = MsgDirection.Main2Follow;
            }
        };

        return {
            dir,
            info
        };
    }

    async on_get_topic(obj: core.Topic, event_inner: TopicEventInner) {
        // ignore
    }

    async on_get_topic_subscribe_success(obj: core.TopicSubscribeSuccess, event_inner: TopicEventInner) {
        const success = obj;

        // fileds
        // const success_owner_id = success.owner_id();
        const topic_id = success.topic_id();
        // const topic_id_str = topic_id.object_id.to_base_58();
        const topic_owner_id = success.topic_owner_id();
        const member_id = success.member_id();
        const msg_obj_id = success.msg_obj_id();

        // fetch topic
        const r = await this.get_topic(topic_id, topic_owner_id);
        if (r.err) {
            return;
        }

        // direction
        // let msg_dir_info = this.msg_direction(topic_owner_id, success_owner_id);

        // emit event
        await event_inner.emit_subscribe(success.topic_id(), member_id, msg_obj_id);
    }

    async on_get_topic_subscribe(obj: core.TopicSubscribe, event_inner: TopicEventInner) {
        // fileds
        const subscribe = obj;
        const subcribe_owner_id = subscribe.owner_id();
        const member_id = subscribe.member_id();
        const msg_obj_id = subscribe.msg_obj_id();
        const msg_offset = subscribe.msg_offset();
        const topic_id = subscribe.topic_id();
        const topic_id_str = topic_id.object_id.to_base_58();
        const topic_owner_id = subscribe.topic_owner_id();

        // fetch topic
        {
            const r = await this.get_topic(topic_id, topic_owner_id);
            if (r.err) {
                error("get topic failed, r:", r);
                return;
            }
        }

        // direction
        const { dir, info } = this.msg_direction(topic_owner_id, subcribe_owner_id);
        if (dir !== MsgDirection.Follow2Main) {
            error("not Follow2Main, ", info);
            return;
        }

        log("[passive][on_get_topic_subscribe], topic_id:{}, direction_info:{}", topic_id_str, info);

        // fetch obj
        if (msg_obj_id.is_some()) {
            await this.fetch_msg_obj(msg_obj_id.unwrap(), member_id);
            warn("[on_get_topic_subscribe], topic_id:{}, fetch msg obj from member_id:{}", topic_id_str, member_id);
        }

        // 查找Topic
        let topic;
        {
            const r = await this.get_topic(topic_id, this.ood_object_id);
            if (r.err) {
                return;
            }
            topic = r.unwrap();
        }
        const topic_status_id = topic.topic_publish_status_id();
        log("[on_get_topic_subscribe], topic_id:{}, get topic and publish status：{}", topic_id_str, topic_status_id.object_id.to_base_58());

        // 是否接受订阅
        {
            const r = await event_inner.emit_subscribe_request(topic_id, member_id, msg_obj_id);
            if (r.err) {
                error("[on_get_topic_subscribe], topic_id:{}, emit_subscribe_request failed， err:{:?}", topic_id_str, r.err);
                return;
            }

            if (r.unwrap() !== SubscriberAction.Accept) {
                warn("[on_get_topic_subscribe], topic_id:{}, emit_subscribe_request ignore", topic_id_str);
                return;
            }
        }

        // 添加成员
        let msg_list;
        {
            const req = StatusRequest.append_member("[on_get_topic_subscribe],", topic_owner_id, member_id, Number(msg_offset));
            const r = await this.reduce_status(topic_status_id, req);
            if (r.err) {
                const msg = `[on_get_topic_subscribe], topic_id:${topic_id}, member_id:${member_id}，offset:${msg_offset}, append member to status failed`;
                error(`${msg}{err: r.err}`);
                return;
            }

            const s = r.unwrap();
            msg_list = s.msg_list!;
        }

        // 发送消息
        for (const msg_info of msg_list) {
            const seq = msg_info.seq();
            warn("[on_get_topic_subscribe][publish_msg_2_follow], topic_id:{}, publish msg to member_id:{}, seq:{}", topic_id_str, member_id, seq);
            const publish = TopicPublish.create(this.ood_object_id, topic_id, topic_owner_id, msg_info);
            this.sign_and_put_object(publish, member_id);
        }

        // 回发一个topic subscribe 给Follow，触发其subscribesuccess事件
        const success = TopicSubscribeSuccess.create(this.ood_object_id, topic_id, topic_owner_id, member_id, msg_offset, msg_obj_id);
        this.sign_and_put_object(success, member_id);
        warn("[on_get_topic_subscribe], topic_id:{}, return subscribe success to member_id:{}", topic_id_str, member_id);
    }

    async on_get_topic_unsubscribe_success(obj: core.TopicUnsubscribeSuccess, event_inner: TopicEventInner) {
        // fields
        const success = obj;
        const topic_id = success.topic_id();
        const topic_id_str = topic_id.object_id.to_base_58();
        const topic_owner_id = success.topic_owner_id();
        const subcribe_owner_id = success.owner_id();
        const member_id = success.member_id();
        const msg_obj_id = success.msg_obj_id();

        // fetch topic
        const r = await this.get_topic(topic_id, topic_owner_id);
        if (r.err) {
            return;
        }

        // direction
        const { info } = this.msg_direction(topic_owner_id, subcribe_owner_id);
        warn(`[passive][on_get_topic_unsubscribe_success], topic_id:${topic_id_str}, direction_info:${info}`);

        // event_inner
        warn(`[on_get_topic_unsubscribe_success], subcribe_owner_id:${subcribe_owner_id}, member_id:${member_id}, msg_obj_id:${msg_obj_id}`);
        await event_inner.emit_unsubscribe(success.topic_id(), member_id, msg_obj_id);
    }

    async on_get_topic_unsubscribe(obj: core.TopicUnsubscribe, event_inner: TopicEventInner) {
        // fields
        const unsubscribe = obj;
        const unsubscribe_owner_id = unsubscribe.owner_id();
        const member_id = unsubscribe.member_id();
        const msg_obj_id = unsubscribe.msg_obj_id();
        const topic_id = unsubscribe.topic_id();
        const topic_id_str = topic_id.object_id.toString();
        const topic_owner_id = unsubscribe.topic_owner_id();
        let ret;

        // fetch topic
        ret = await this.get_topic(topic_id, topic_owner_id);
        if (ret.err) {
            return;
        }

        // direction
        const dir_info = this.msg_direction(topic_owner_id, unsubscribe_owner_id);
        if (dir_info.dir !== MsgDirection.Follow2Main) {
            return;
        }

        warn("[passive][on_get_topic_unsubscribe], topic_id:{}, direction_info:{}", topic_id_str, dir_info);

        // fetch obj
        if (msg_obj_id.is_some()) {
            const r = await this.fetch_msg_obj(msg_obj_id.unwrap(), member_id);
            if (r.err) {
                return;
            }
            warn("[on_get_topic_unsubscribe], topic_id:{}, fetch msg obj from member_id:{}", topic_id_str, member_id);
        }

        // 查找Topic
        ret = await this.get_topic(topic_id, this.ood_object_id);
        if (ret.err) {
            return;
        }
        const topic = ret.unwrap();

        const topic_status_id = topic.topic_publish_status_id();

        // 移除成员
        const req = StatusRequest.remove_member("[on_get_topic_unsubscribe]", topic_owner_id, member_id);
        ret = await this.reduce_status(topic_status_id, req);
        if (ret.err) {
            error!("[on_get_topic_unsubscribe], topic_id:{}, member_id:{}，remove member to status failed", topic_id, member_id);
            return;
        }

        const status = ret.unwrap();
        if (status.result == null || status.result.err) {
            error("invalid reduce status:", status);
            return;
        }

        const success = TopicUnsubscribeSuccess.create(
            this.ood_object_id,
            topic_id,
            topic_owner_id,
            member_id,
            msg_obj_id
        );
        this.sign_and_put_object(success, member_id);
        warn("[on_get_topic_unsubscribe], topic_id:{}, return unsubscribe success to member_id:{}.", topic_id_str, member_id);

        return;
    }

    async on_get_topic_publish(obj: core.TopicPublish, event_inner: TopicEventInner) {
        // fields
        const topic_id = obj.topic_id();
        const topic_id_str = topic_id.to_string();
        const publish_owner_id = obj.owner_id();
        const topic_owner_id = obj.topic_owner_id();
        const msg_info = obj.msg_info();
        const member_id = msg_info.member_id();

        // fetch topic
        let r;
        r = await this.get_topic(topic_id, topic_owner_id);
        if (r.err) {
            return;
        }

        // direction
        const dir_info = this.msg_direction(topic_owner_id, publish_owner_id);
        if (dir_info.dir !== MsgDirection.Main2Follow && dir_info.dir !== MsgDirection.Follow2Main) {
            return;
        }
        warn("[passive][on_get_topic_publish], topic_id:{}, direction_info:{}", topic_id_str, dir_info);

        if (dir_info.dir === MsgDirection.Main2Follow) {
            assert(msg_info.orderd());

            // 回复收到的 seq
            const req_member_id = this.ood_object_id; // TopicPublishResp是谁回复的

            const publish_resp = TopicPublishResp.create(this.ood_object_id, topic_id, topic_owner_id, req_member_id, msg_info.seq());

            this.sign_and_put_object(publish_resp, topic_owner_id);
            warn("[on_get_topic_publish], topic_id:{}, return publish resp to topic_owner_id:{} for seq:{}", topic_id_str, topic_owner_id, msg_info.seq());

            // 触发从OOD收到消息事件
            warn("[on_get_topic_publish], topic_id: {:?}, emit publish event to follow", topic_id_str);
            event_inner.emit_publish(topic_id, msg_info.member_id(), msg_info.msg_obj_id());
            return;
        }

        if (msg_info.orderd()) {
            warn("[on_get_topic_publish], topic_id:{}, member_id:{}, seq:{} alreay exist, ignore it.", topic_id, member_id, msg_info.seq());
            return Ok(0);
        }

        // 获取Topic
        r = await this.get_topic(topic_id, this.ood_object_id);
        if (r.err) {
            return;
        }
        const topic = r.unwrap();

        const topic_status_id = topic.topic_publish_status_id();
        warn("[on_get_topic_publish], topic_id:{}, get topic and status with status_id:{}", topic_id_str, topic_status_id.to_string());


        // 追加消息
        // 主OOD直接消耗了新消息的Seq
        const req = StatusRequest.append_member_msg("[on_get_topic_publish]", topic_owner_id, msg_info.member_id(), msg_info.msg_obj_id());
        r = await this.reduce_status(topic_status_id, req);
        if (r.err) {
            return;
        }

        const status = r.unwrap();
        if (!status.member_msg_dict) {
            return;
        }
        const [, member_rest_msg_map] = status.member_msg_dict.unwrap();

        // 从OOD需要广播未消耗的消息列表
        warn("");
        warn("===================");
        warn("Topic收到从OOD的消息，广播成员未接收消息给成员");
        warn("===================");
        const ood_object_id = this.ood_object_id;
        for (const [member_device_id, msg_list] of member_rest_msg_map.entries()) {
            for (const inner_msg_info of msg_list.value()) {
                warn("[on_get_topic_publish][publish_msg_2_follow], topic_id:{}, publish msg to memeber_id: {}, seq:{}",
                    topic_id, member_device_id, inner_msg_info.seq()
                );
                const publish = TopicPublish.create(ood_object_id, topic_id, topic_owner_id, inner_msg_info);
                this.sign_and_put_object(publish, member_device_id);
            }
        }
        warn("===================");

        // 触发主OOD收到消息事件
        warn("[on_get_topic_publish], topic_id: {}, emit publish event to main", topic_id);
        event_inner.emit_publish(topic_id, member_id, msg_info.msg_obj_id());

        return;
    }

    async on_get_topic_publish_req(obj: core.TopicPublishReq, event_inner: TopicEventInner) {
        const publish_owner_id = obj.owner_id();
        const topic_id = obj.topic_id();
        const topic_id_str = topic_id.to_string();
        const topic_owner_id = obj.topic_owner_id();
        const member_id = obj.member_id();
        const msg_seq_start = obj.seq();
        const msg_count = obj.count();

        // fetch topic
        let r;
        r = await this.get_topic(topic_id, topic_owner_id);
        if (r.err) {
            return;
        }
        const topic = r.unwrap();

        const dir_info = this.msg_direction(topic_owner_id, publish_owner_id);
        if (dir_info.dir !== MsgDirection.Follow2Main) {
            return;
        }

        warn("[passive][on_get_topic_publish_req], topic_id:{}, direction_info:{}", topic_id_str, dir_info);

        // 获取主题
        const topic_status_id = topic.topic_publish_status_id();

        // 更新成员已接收消息
        const req = StatusRequest.fetch_member_msg_list("[on_get_topic_publish_req]", topic_owner_id, member_id, Number(msg_seq_start), msg_count);
        r = await this.reduce_status(topic_status_id, req);
        if (r.err) {
            return;
        }
        const status = r.unwrap();
        if (!status.msg_list) {
            return;
        }
        const msg_list = status.msg_list;
        for (const inner_msg_info of msg_list) {
            warn("[on_get_topic_publish_req], topic_id:{}, publish msg to memeber_id: {}, seq:{}", topic_id, member_id, inner_msg_info.seq());
            const publish = TopicPublish.create(this.ood_object_id, topic_id, topic_owner_id, inner_msg_info);
            this.sign_and_put_object(publish, member_id);
        }

        return;
    }

    async on_get_topic_publish_resp(obj: core.TopicPublishResp, event_inner: TopicEventInner) {
        // fields
        const publish_owner_id = obj.owner_id();
        const topic_id = obj.topic_id();
        const topic_id_str = topic_id.to_string();
        const topic_owner_id = obj.topic_owner_id();
        const member_id = obj.member_id();
        const msg_seq = obj.seq();

        // fetch topic
        let r;
        r = await this.get_topic(topic_id, topic_owner_id);
        if (r.err) {
            return;
        }
        const topic = r.unwrap();

        // direction
        const dir_info = this.msg_direction(topic_owner_id, publish_owner_id);
        if (dir_info.dir !== MsgDirection.Follow2Main) {
            return;
        }

        warn("[passive][on_get_topic_publish_resp], topic_id:{}, direction_info:{}", topic_id_str, dir_info);

        // 获取主题
        const topic_status_id = topic.topic_publish_status_id();

        // 更新成员已接收消息
        const req = StatusRequest.insert_member_receive_seq("[on_get_topic_publish_resp]", topic_owner_id, member_id, Number(msg_seq));
        r = await this.reduce_status(topic_status_id, req);
        if (r.err) {
            return;
        }
        const status = r.unwrap();
        if (!status.result) {
            return;
        }

        return;
    }

    async flush_topic_ood_event(event: TopicEventInner) {
        // 主OOD订阅成功事件
        while (this.subscribe_tasks.length > 0) {
            const task = this.subscribe_tasks.pop();
            if (task) {
                event.emit_subscribe(task!.topic_id, task!.device_id, task!.msg_obj_id);
            }
        }

        // 主OOD取消订阅成功事件
        while (this.unsubscribe_tasks.length > 0) {
            const task = this.unsubscribe_tasks.pop();
            if (task) {
                event.emit_unsubscribe(task!.topic_id, task!.device_id, task!.msg_obj_id);
            }
        }

        // 主OOD发布成功事件
        while (this.publish_tasks.length > 0) {
            const task = this.publish_tasks.pop();
            if (task) {
                event.emit_publish(task!.topic_id, task!.device_id, task!.msg_obj_id);
            }
        }

        // 主OOD获取消息队列成功事件
        while (this.fetch_tasks.length > 0) {
            const task = this.fetch_tasks.pop();
            if (task) {
                for (const msg_info of task!.msg_list) {
                    event.emit_publish(task!.topic_id, task!.device_id, msg_info.msg_obj_id());
                }
            }
        }
    }

    async sign_and_put_object<DC extends DescContent, BC extends BodyContent>(obj: NamedObject<DC, BC>, target: ObjectId) {
        obj.body().unwrap().set_update_time(bucky_time_now());

        const object_id = obj.desc().calculate_id();
        const buf = new Uint8Array(obj.raw_measure().unwrap());
        const _ = obj.raw_encode(buf).unwrap();
        const put_req = {
            object_id: object_id.clone(),
            object_raw: buf,
            target: target.clone(),
            flags: 0,
        };

        const ret = await this.stack.router().put_object(put_req);
        if (ret.err) {
            error(`"put_object [${object_id.to_base_58()}] to ood:${target} failed! ${ret.err}`);
            return;
        }

        error(`"put_object [${object_id.to_base_58()}] to ood:${target} success`);
    }

    async put_object<DC extends DescContent, BC extends BodyContent>(obj: NamedObject<DC, BC>, target: ObjectId) {
        const object_id = obj.desc().calculate_id();
        const buf = new Uint8Array(obj.raw_measure().unwrap());
        const _ = obj.raw_encode(buf).unwrap();
        const put_req = {
            object_id: object_id.clone(),
            object_raw: buf,
            target: target.clone(),
            flags: 0,
        };
        const ret = await this.stack.router().put_object(put_req);
        if (ret.err) {
            error(`"put_object [${object_id.to_base_58()}] to ood:${target} failed! ${ret.err}`);
            return;
        }

        error(`"put_object [${object_id.to_base_58()}] to ood:${target} success`);
    }

    async fetch_msg_obj(object_id: ObjectId, owner_id: ObjectId): Promise<BuckyResult<number>> {
        // try fetch from msg owner
        {
            const get_req = {
                object_id: object_id.clone(),
                target: owner_id.clone(),
                flags: 0,
            };
            const ret = await this.stack.router().get_object(get_req);
            if (ret.err) {
                error(`"get_object [${object_id.to_base_58()}] failed! ${ret.err}`);
                return ret;
            }
        }

        // try fetch from this device-s ood
        {
            const get_req = {
                object_id: object_id.clone(),
                target: this.ood_object_id.clone(),
                flags: 0,
            };

            const ret = await this.stack.router().get_object(get_req);
            if (ret.err) {
                error(`"get_object [${object_id.to_base_58()}] failed! ${ret.err}`);
                return ret;
            }
        }

        return Ok(0);
    }

    async get_topic(topic_id: TopicId, topic_owner_id: ObjectId): Promise<BuckyResult<Topic>> {
        const get_req = {
            object_id: topic_id.object_id.clone(),
            target: topic_owner_id.clone(),
            flags: 0,
        };

        const ret = await this.stack.router().get_object(get_req);
        if (ret.err) {
            return ret;
        }

        const resp = ret.unwrap();
        const [topic, _] = new TopicDecoder().raw_decode(resp.object_raw).unwrap();

        return Ok(topic);
    }

    async fetch_topic(topic_id: TopicId): Promise<BuckyResult<Topic>> {
        const get_req = {
            object_id: topic_id.object_id.clone(),
            flags: 0,
        };

        const ret = await this.stack.router().get_object(get_req);
        if (ret.err) {
            return ret;
        }

        const resp = ret.unwrap();
        const r = new TopicDecoder().raw_decode(resp.object_raw);
        if (r.err) {
            return r;
        }
        const [topic, _] = r.unwrap();

        return Ok(topic);
    }

    async fetch_msg_list(object_id: ObjectId, owner_id: ObjectId): Promise<BuckyResult<TopicMessageList>> {
        const get_req = {
            object_id: object_id.clone(),
            target: owner_id.clone(),
            flags: 1,
        };

        const r = await this.stack.router().get_object(get_req);
        if (r.err) {
            return r;
        }

        const [obj] = new TopicMessageListDecoder().raw_decode(r.unwrap().object_raw).unwrap();
        return Ok(obj);
    }

    async put_object_buf(object_id: ObjectId, object_buf: Uint8Array, target: ObjectId): Promise<BuckyResult<number>> {
        const put_req = {
            object_id: object_id,
            object_raw: object_buf,
            target: target.clone(),
            flags: 0,
        };
        const r = await this.stack.router().put_object(put_req);
        if (r.err) {
            return r;
        }
        return Ok(0);
    }

    async reduce_status(topic_status_id: TopicPublishStatusId, req: StatusRequest): Promise<BuckyResult<StatusResult>> {

        // 对TopicPublishStatus的修改都归一到这里
        const topic_owner_id = this.ood_object_id;
        const status_object_id = topic_status_id.object_id;

        // fetch
        const owner_id = this.ood_object_id;
        const fetch = async (id: ObjectId) => {
            warn("@@@@@@@@@@@@@[topic_status] reduce status, fetch_msg_list, owner_id:{:?}", owner_id);
            return this.fetch_msg_list(id, owner_id);
        };

        const store = async (id: ObjectId, msg_list: Uint8Array) => {
            warn("@@@@@@@@@@@@@[topic_status] reduce status, put_object_buf, owner_id:{:?}, id:{}", owner_id, id);
            return this.put_object_buf(id, msg_list, owner_id);
        };

        // event
        const event = {
            fetch,
            store
        };

        // get from cache
        if (this.status_map.has(status_object_id)) {
            const publishStatus = this.status_map.get(status_object_id)!;
            const status = await publishStatus.reduce(req, event);
            this.put_tasks.push(new PutTask(status_object_id));
            return Ok(status);
        }

        // get from NOC
        const get_req = {
            object_id: topic_status_id.object_id,
            target: topic_owner_id,
            flags: 0,
        };

        const ret = await this.stack.router().get_object(get_req);
        if (ret.err) {
            return ret;
        }
        const resp = ret.unwrap();
        const r = new TopicPublishStatusDecoder().raw_decode(resp.object_raw);
        if (r.err) {
            return r;
        }
        const [new_publish_status, _] = r.unwrap();

        // insert into cache if not exist
        if (!this.status_map.has(status_object_id)) {
            this.status_map.set(status_object_id, new_publish_status);
        }

        // get from cache
        {
            const publish_status = this.status_map.get(status_object_id)!;
            const status = await publish_status.reduce(req, event);
            this.put_tasks.push(new PutTask(status_object_id));

            return Ok(status);
        }
    }

    // 批量刷status到磁盘
    // 应该只在一个线程里处理
    async flush_status() {
        // 合并
        const flushed_map = new BuckyHashMap<ObjectId, BuckyNumber>();
        while (this.put_tasks.length > 0) {
            const task = this.put_tasks.pop()
            const status_object_id = task?.msg_obj_id;

            log('flush status, status_object_id: ', status_object_id);

            if (status_object_id) {
                if (!flushed_map.has(status_object_id)) {
                    flushed_map.set(status_object_id, new BuckyNumber('u8', 1));

                    log('flush status: ', status_object_id);
                    await this.put_status(status_object_id);
                }
            }
        }
    }

    // 刷单个status到磁盘
    async put_status(status_object_id: ObjectId) {
        const topic_owner_id = this.ood_object_id.clone();

        // get from cache
        let obj_;
        if (this.status_map.has(status_object_id)) {
            const status = this.status_map.get(status_object_id)!;
            status.body().unwrap().set_update_time(bucky_time_now());
            obj_ = Some(status);
        } else {
            obj_ = None;
        }

        if (obj_.is_none()) {
            error(`[put_status], status_object not found, status_object_id:${status_object_id}`);
            return;
        }
        const obj = obj_.unwrap();

        // 测试
        // console.log(obj);
        // console.log("");
        // console.log("------------------------");
        // cyfs_log_config.enable_base_trace = true;
        const buf = obj.to_vec().unwrap();
        // console.log("");
        // console.log("------------------------");
        // console.log("");
        // try{
        //     const [a,b] = new AnyNamedObjectDecoder().raw_decode(buf).unwrap();
        // }catch(e){
        //     console.log("------------------------");
        //     console.log("");
        //     console.log(e);
        //     console.log("error, quit");
        //     process.exit(0);
        // }
        // cyfs_log_config.enable_base_trace = false;
        // console.log("");

        const put_req = {
            object_id: status_object_id,
            object_raw: buf,
            target: topic_owner_id,
            flags: 0,
        };

        const ret = await this.stack.router().put_object(put_req);
        if (ret.err) {
            return;
        }
    }
}