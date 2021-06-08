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


// 定义App对象的类型信息
import { DECAppObjectType } from "../dec_app_obj_type";
import { PeopleId } from "../../cyfs-base/objects/people";
export class MessageListDescTypeInfo extends DescTypeInfo{

    // 每个对象需要一个应用App唯一的编号
    obj_type() : number{
        return DECAppObjectType.MessageList;
    }

    // 配置该对象具有哪些能力
    sub_desc_type(): SubDescType{
        return {
            // 是否有主，
            // "disable": 禁用，
            // "option": 可选
            owner_type: "option",

            // 是否有区域信息，
            // "disable": 禁用，
            // "option": 可选
            area_type: "disable",

            // 是否有作者，
            // "disable": 禁用，
            // "option": 可选
            author_type: "disable",

            // 公钥类型，
            // "disable": 禁用，
            // "single_key": 单PublicKey，
            // "mn_key": M-N 公钥对
            key_type: "disable"
        }
    }
}

// 定义一个类型实例
const MESSAGELIST_DESC_TYPE_INFO = new MessageListDescTypeInfo();

// 每个对象包含Desc/Body/Signs/nonce四个部分，对象的格式参考文档
// 每个用户自定义对象，需要提供DescContent和BodyContent部分的自定义
export class MessageListDescContent extends DescContent {

    constructor(){
        super();
    }

    // 类型信息
    type_info(): DescTypeInfo{
        return MESSAGELIST_DESC_TYPE_INFO;
    }

    // 编码需要的字节
    raw_measure(): BuckyResult<number>{
        return Ok(0);
    }

    // 编码
    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return Ok(buf);
    }
}

// 同时需要提供DescContent和BodyContent对应的解码器
export class MessageListDescContentDecoder extends DescContentDecoder<MessageListDescContent>{
    // 类型信息
    type_info(): DescTypeInfo{
        return MESSAGELIST_DESC_TYPE_INFO;
    }

    // 解码
    raw_decode(buf: Uint8Array): BuckyResult<[MessageListDescContent, Uint8Array]>{
        const self = new MessageListDescContent();
        const ret:[MessageListDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

// 自定义BodyContent
export class MessageListBodyContent extends BodyContent{
    private readonly m_messages: Vec<BuckyString>;
    constructor(messages:  Vec<BuckyString>){
        super();
        this.m_messages = messages;
    }

    messages(): string[]{
        return this.m_messages.value().map(v=>v.value());
    }

    raw_measure(): BuckyResult<number>{
        return this.m_messages.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return  this.m_messages.raw_encode(buf);
    }
}

// 自定义BodyContent的解码器
export class MessageListBodyContentDecoder extends BodyContentDecoder<MessageListBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[MessageListBodyContent, Uint8Array]>{

        let messages:  Vec<BuckyString>;
        {
            const r = new VecDecoder(new BuckyStringDecoder()).raw_decode(buf);

            if(r.err){
                return r;
            }
            [messages, buf] = r.unwrap();
        }

        const self = new MessageListBodyContent(messages);

        const ret:[MessageListBodyContent, Uint8Array] = [self, buf];

        return Ok(ret);
    }
}

// 使用自定义的DescCotent对象，通过命名对象构造器来定义对象的Desc
export class MessageListDesc extends NamedObjectDesc<MessageListDescContent>{
    // ignore
}

// 定义Desc的解码器
export  class MessageListDescDecoder extends NamedObjectDescDecoder<MessageListDescContent>{
    // ignore
}

// 定义一个对象的Builder
export class MessageListBuilder extends NamedObjectBuilder<MessageListDescContent, MessageListBodyContent>{
    // ignore
}

// 定义对象的Id，对象的Id是从Desc提供的calc_id方法计算，Desc发生改变，则Id发生改变
export class MessageListId extends NamedObjectId<MessageListDescContent, MessageListBodyContent>{
    constructor(id: ObjectId){
        super(DECAppObjectType.MessageList, id);
    }

    static default(): DeviceId{
        return named_id_gen_default(DECAppObjectType.MessageList);
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        return named_id_from_base_58(DECAppObjectType.MessageList, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId>{
        return named_id_try_from_object_id(DECAppObjectType.MessageList, id);
    }
}

// 定义Id的解码器
export class MessageListIdDecoder extends NamedObjectIdDecoder<MessageListDescContent, MessageListBodyContent>{
    constructor(){
        super(DECAppObjectType.MessageList);
    }
}

// 现在，我们完成对象的定义
export class MessageList extends NamedObject<MessageListDescContent, MessageListBodyContent>{

    // 提供一个静态的创建方法
    static create(owner: PeopleId):MessageList{
        // 创建DescContent部分
        const desc_content = new MessageListDescContent();

        // 创建BodyContent部分
        const body_content = new MessageListBodyContent(new Vec<BuckyString>([]));

        // 创建一个Builder，并完成对象的构建
        // self的类型信息是： NamedObject<MessageListDescContent, MessageListBodyContent>
        const builder = new MessageListBuilder(desc_content, body_content);

        // 构造，这是一个有主对象
        const self:NamedObject<MessageListDescContent, MessageListBodyContent> =
            builder
            .owner(owner.object_id)
            .build();

        // 这是一个绕过typescript类型的trick，通过重新调用对象构造函数（继承自父对象）, 使得返回的对象类型是具体化后的MessageList
        return new MessageList(self.desc(), self.body(), self.signs(), self.nonce());
    }

    message_list_id(): MessageListId{
        return MessageListId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }

    messages():string[] {
        // 可以为MessageList提供遍历的访问内部层次结构属性的一级接口
        return this.body_expect().content().messages();
    }
}

// 同时，我们为对象提供对应的解码器
export class MessageListDecoder extends NamedObjectDecoder<MessageListDescContent, MessageListBodyContent, MessageList>{
    constructor(){
        super(new MessageListDescContentDecoder(), new MessageListBodyContentDecoder(), MessageList);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[MessageList, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new MessageList(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [MessageList, Uint8Array];
        });
    }
}