/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Fri Mar 12 2021 16:29:19 GMT+0800 (GMT+08:00)
 *****************************************************/

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
    NamedObjectContextDecoder,
} from "../cyfs-base/objects/object"

import { Ok, BuckyResult, Err, BuckyError, BuckyErrorCode} from "../cyfs-base/base/results";
import { Option} from "../cyfs-base/base/option";
import { ObjectId, ObjectIdDecoder } from "../cyfs-base/objects/object_id";

import { MsgContent } from './msg_content';
import { MsgContentDecoder } from './msg_content';

const DEC_ID:string = "5aSixgP8EPf6HkP54Qgybddhhsd1fgrkg7Atf2icJiiS";

// 定义App对象的类型信息
import { IMObjectType } from "./im_object_type";
import { AnyNamedObjectDecoder } from "../cyfs-base";
export class MsgDescTypeInfo extends DescTypeInfo{

    // 每个对象需要一个应用App唯一的编号
    obj_type() : number{
        return IMObjectType.Msg;
    }

    // 配置该对象具有哪些能力
    sub_desc_type(): SubDescType{
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }

    }

}

// 定义一个类型实例
const MSG_DESC_TYPE_INFO = new MsgDescTypeInfo();

// 每个对象包含Desc/Body/Signs/nonce四个部分，对象的格式参考文档
// 每个用户自定义对象，需要提供DescContent和BodyContent部分的自定义
export class MsgDescContent extends DescContent {

    constructor(
        public to: ObjectId,
        public content: MsgContent,
    ){
        super();
    }

    // 类型信息
    type_info(): DescTypeInfo{
        return MSG_DESC_TYPE_INFO;
    }

    // 编码需要的字节
    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += this.to.raw_measure().unwrap();
        size += this.content.raw_measure().unwrap();
        return Ok(size);
    }

    // 编码
    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf = this.to.raw_encode(buf).unwrap();
        buf = this.content.raw_encode(buf).unwrap();
        return Ok(buf);
    }

}

// 同时需要提供DescContent和BodyContent对应的解码器
export class MsgDescContentDecoder extends DescContentDecoder<MsgDescContent>{
    // 类型信息
    type_info(): DescTypeInfo{
        return MSG_DESC_TYPE_INFO;
    }

    // 解码
    raw_decode(buf: Uint8Array): BuckyResult<[MsgDescContent, Uint8Array]>{
        let to;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [to, buf] = r.unwrap();
        }

        let content;
        {
            const r = new MsgContentDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [content, buf] = r.unwrap();
        }

        const ret:[MsgDescContent, Uint8Array] = [new MsgDescContent(to, content), buf];
        return Ok(ret);
    }

}

// 自定义BodyContent
export class MsgBodyContent extends BodyContent{
    constructor(
    ){
        super();
    }

    raw_measure(): BuckyResult<number>{
        const size = 0;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return Ok(buf);
    }

}

// 自定义BodyContent的解码器
export class MsgBodyContentDecoder extends BodyContentDecoder<MsgBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[MsgBodyContent, Uint8Array]>{
        const ret:[MsgBodyContent, Uint8Array] = [new MsgBodyContent(), buf];
        return Ok(ret);
    }

}

// 使用自定义的DescCotent对象，通过命名对象构造器来定义对象的Desc
export class MsgDesc extends NamedObjectDesc<MsgDescContent>{
    // ignore
}

// 定义Desc的解码器
export  class MsgDescDecoder extends NamedObjectDescDecoder<MsgDescContent>{
    constructor(){
        super(new MsgDescContentDecoder());
    }

}

// 定义一个对象的Builder
export class MsgBuilder extends NamedObjectBuilder<MsgDescContent, MsgBodyContent>{
    // ignore
}

// 定义对象的Id，对象的Id是从Desc提供的calc_id方法计算，Desc发生改变，则Id发生改变
export class MsgId extends NamedObjectId<MsgDescContent, MsgBodyContent>{
    constructor(id: ObjectId){
        super(IMObjectType.Msg, id);
    }

    static default(): MsgId{
        return named_id_gen_default(IMObjectType.Msg);
    }

    static from_base_58(s: string): BuckyResult<MsgId> {
        return named_id_from_base_58(IMObjectType.Msg, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<MsgId>{
        return named_id_try_from_object_id(IMObjectType.Msg, id);
    }

}

// 定义Id的解码器
export class MsgIdDecoder extends NamedObjectIdDecoder<MsgDescContent, MsgBodyContent>{
    constructor(){
        super(IMObjectType.Msg);
    }

}

// 现在，我们完成对象的定义
export class Msg extends NamedObject<MsgDescContent, MsgBodyContent>{
    // 提供一个静态的创建方法
    static create(owner: Option<ObjectId>, to: ObjectId, content: MsgContent): Msg{
        // 创建DescContent部分
        const desc_content = new MsgDescContent(to, content);

        // 创建BodyContent部分
        const body_content = new MsgBodyContent();

        // 创建一个Builder，并完成对象的构建
        const builder = new MsgBuilder(desc_content, body_content);

        // 构造，这是一个有主对象
        const self:NamedObject<MsgDescContent, MsgBodyContent> =
            builder
            .option_owner(owner)
            .dec_id(ObjectId.from_base_58(DEC_ID).unwrap())
            .build();

        // 这是一个绕过typescript类型的trick，通过重新调用对象构造函数（继承自父对象）, 使得返回的对象类型是具体化后的Msg
        return new Msg(self.desc(), self.body(), self.signs(), self.nonce());
    }

    static try_decode(raw: Uint8Array): BuckyResult<Msg> {
        let any;
        {
            let r = new AnyNamedObjectDecoder().raw_decode(raw);
            if (r.err) {
                return r;
            }
            let [obj, buf] = r.unwrap();
            any = obj
        }

        let dec_id = any.desc().dec_id();
        if (dec_id.is_some() && dec_id.unwrap().to_base_58() === DEC_ID) {
            let [object, buf] = new NamedObjectContextDecoder().raw_decode(raw).unwrap();
            if (object.obj_type === MSG_DESC_TYPE_INFO.obj_type()) {
                return new MsgDecoder().from_raw(raw);
            }
        }

        return Err(BuckyError.from(BuckyErrorCode.NotMatch));
    }
}

// 同时，我们为对象提供对应的解码器
export class MsgDecoder extends NamedObjectDecoder<MsgDescContent, MsgBodyContent, Msg>{
    constructor(){
        super(new MsgDescContentDecoder(), new MsgBodyContentDecoder(), Msg);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[Msg, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new Msg(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [Msg, Uint8Array];
        });
    }
}
