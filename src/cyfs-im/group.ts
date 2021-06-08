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
import { ObjectId } from "../cyfs-base/objects/object_id";

// 定义App对象的类型信息
import { IMObjectType } from "./im_object_type";
import { AnyNamedObjectDecoder, BuckyHashSetDecoder, BuckyNumber, BuckyNumberDecoder, BuckyStringDecoder, PeopleIdDecoder, UniqueIdDecoder, VecDecoder } from "../cyfs-base";
import { BuckyHashSet, BuckyString, PeopleId, TopicId, UniqueId, Vec } from "..";
import { TopicIdDecoder } from "../cyfs-core";
export class GroupDescTypeInfo extends DescTypeInfo{

    // 每个对象需要一个应用App唯一的编号
    obj_type() : number{
        return IMObjectType.Group;
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
const MSG_DESC_TYPE_INFO = new GroupDescTypeInfo();

// 每个对象包含Desc/Body/Signs/nonce四个部分，对象的格式参考文档
// 每个用户自定义对象，需要提供DescContent和BodyContent部分的自定义
export class GroupDescContent extends DescContent {
    topic: TopicId;
    unique: UniqueId;
    constructor(topic: TopicId, unique: UniqueId){
        super();
        this.topic = topic;
        this.unique = unique;
    }

    // 类型信息
    type_info(): DescTypeInfo{
        return MSG_DESC_TYPE_INFO;
    }

    // 编码需要的字节
    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += this.topic.raw_measure().unwrap();
        size += this.unique.raw_measure().unwrap();
        return Ok(size);
    }

    // 编码
    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf = this.topic.raw_encode(buf).unwrap();
        buf = this.unique.raw_encode(buf).unwrap();
        return Ok(buf);
    }

}

// 同时需要提供DescContent和BodyContent对应的解码器
export class GroupDescContentDecoder extends DescContentDecoder<GroupDescContent>{
    // 类型信息
    type_info(): DescTypeInfo{
        return MSG_DESC_TYPE_INFO;
    }

    // 解码
    raw_decode(buf: Uint8Array): BuckyResult<[GroupDescContent, Uint8Array]>{
        let topic;
        {
            const r = new TopicIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [topic, buf] = r.unwrap();
        }

        let unique;
        {
            const r = new UniqueIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [unique, buf] = r.unwrap();
        }

        const ret:[GroupDescContent, Uint8Array] = [new GroupDescContent(topic, unique), buf];
        return Ok(ret);
    }

}

// 自定义BodyContent
export class GroupBodyContent extends BodyContent{
    admins: Vec<PeopleId>;
    // 这里用HashSet是为了方便添加去重和移除
    members: BuckyHashSet<PeopleId>;
    name: BuckyString;
    icon: BuckyString;
    auto_confirm: number;
    constructor(admins: Vec<PeopleId>, members: BuckyHashSet<PeopleId>, name: BuckyString, icon: BuckyString, auto_confirm: number){
        super();
        this.admins = admins;
        this.members = members;
        this.name = name;
        this.icon = icon;
        this.auto_confirm = auto_confirm;
    }

    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += this.admins.raw_measure().unwrap();
        size += this.members.raw_measure().unwrap();
        size += this.name.raw_measure().unwrap();
        size += this.icon.raw_measure().unwrap();
        size += new BuckyNumber('u8', this.auto_confirm).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf = this.admins.raw_encode(buf).unwrap();
        buf = this.members.raw_encode(buf).unwrap();
        buf = this.name.raw_encode(buf).unwrap();
        buf = this.icon.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u8', this.auto_confirm).raw_encode(buf).unwrap();
        return Ok(buf);
    }

}

// 自定义BodyContent的解码器
export class GroupBodyContentDecoder extends BodyContentDecoder<GroupBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[GroupBodyContent, Uint8Array]>{
        let admins;
        {
            const r = new VecDecoder(new PeopleIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [admins, buf] = r.unwrap();
        }

        let members;
        {
            const r = new BuckyHashSetDecoder(new PeopleIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [members, buf] = r.unwrap();
        }

        let name;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [name, buf] = r.unwrap();
        }

        let icon;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [icon, buf] = r.unwrap();
        }

        let auto_confirm;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [auto_confirm, buf] = r.unwrap();
        }
        const ret:[GroupBodyContent, Uint8Array] = [new GroupBodyContent(admins, members, name, icon, auto_confirm.toNumber()), buf];
        return Ok(ret);
    }

}

// 使用自定义的DescCotent对象，通过命名对象构造器来定义对象的Desc
export class GroupDesc extends NamedObjectDesc<GroupDescContent>{
    // ignore
}

// 定义Desc的解码器
export  class GroupDescDecoder extends NamedObjectDescDecoder<GroupDescContent>{
    constructor(){
        super(new GroupDescContentDecoder());
    }

}

// 定义一个对象的Builder
export class GroupBuilder extends NamedObjectBuilder<GroupDescContent, GroupBodyContent>{
    // ignore
}

// 定义对象的Id，对象的Id是从Desc提供的calc_id方法计算，Desc发生改变，则Id发生改变
export class GroupId extends NamedObjectId<GroupDescContent, GroupBodyContent>{
    constructor(id: ObjectId){
        super(IMObjectType.Group, id);
    }

    static default(): GroupId{
        return named_id_gen_default(IMObjectType.Group);
    }

    static from_base_58(s: string): BuckyResult<GroupId> {
        return named_id_from_base_58(IMObjectType.Group, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<GroupId>{
        return named_id_try_from_object_id(IMObjectType.Group, id);
    }

}

// 定义Id的解码器
export class GroupIdDecoder extends NamedObjectIdDecoder<GroupDescContent, GroupBodyContent>{
    constructor(){
        super(IMObjectType.Group);
    }

}

// 现在，我们完成对象的定义
export class Group extends NamedObject<GroupDescContent, GroupBodyContent>{
    // 提供一个静态的创建方法
    static create(dec_id: ObjectId, owner: PeopleId, name: string, topic: TopicId, unique: UniqueId, admins: PeopleId[], members: PeopleId[], auto_confirm: boolean): Group{
        // 创建DescContent部分
        const desc_content = new GroupDescContent(topic, unique);

        // 创建BodyContent部分
        let members_set = new BuckyHashSet<PeopleId>();
        for (const member of members) {
            members_set.add(member);
        }
        const body_content = new GroupBodyContent(new Vec(admins), members_set, new BuckyString(name), new BuckyString(""), auto_confirm?1:0);

        // 创建一个Builder，并完成对象的构建
        const builder = new GroupBuilder(desc_content, body_content);

        // 构造，这是一个有主对象
        return builder
            .owner(owner.object_id)
            .author(owner.object_id)
            .dec_id(dec_id)
            .build();

        // 这是一个绕过typescript类型的trick，通过重新调用对象构造函数（继承自父对象）, 使得返回的对象类型是具体化后的Group
        // return new Group(self.desc(), self.body(), self.signs(), self.nonce());
    }
}

// 同时，我们为对象提供对应的解码器
export class GroupDecoder extends NamedObjectDecoder<GroupDescContent, GroupBodyContent, Group>{
    constructor(){
        super(new GroupDescContentDecoder(), new GroupBodyContentDecoder(), Group);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[Group, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new Group(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [Group, Uint8Array];
        });
    }
}
