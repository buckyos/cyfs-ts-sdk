

// 1. 定义一个Desc类型信息
import {
    DescContent,
    DescContentDecoder,
    DescTypeInfo, named_id_gen_default, named_id_from_base_58, named_id_try_from_object_id,  NamedObject,
    NamedObjectBuilder, NamedObjectDecoder,
    NamedObjectDesc, NamedObjectId, NamedObjectIdDecoder,
    BodyContent,
    BodyContentDecoder,
    SubDescType,
    NamedObjectDescDecoder
} from "./object";
import {ObjectTypeCode} from "./object_type_info";

import {
    Area,
    BuckyResult, MNPublicKey, PublicKey,
    RawDecode,
    RawEncode,
} from "..";
import {Err, Ok} from "../base/results";
import {ObjectId, ObjectIdDecoder} from "./object_id";
import {Vec, VecDecoder} from "../base/vec";
import {DeviceId, DeviceIdDecoder} from "./device";

export class SimpleGroupDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return ObjectTypeCode.SimpleGroup;
    }

    sub_desc_type(): SubDescType{
        return {
            owner_type: "disable",   // 是否有主，"disable": 禁用，"option": 可选
            area_type: "option",    // 是否有区域信息，"disable": 禁用，"option": 可选
            author_type: "disable",  // 是否有作者，"disable": 禁用，"option": 可选
            key_type: "mn_key"  // 公钥类型，"disable": 禁用，"single_key": 单PublicKey，"mn_key": M-N 公钥对
        }
    }
}

// 2. 定义一个类型信息常量
const SIMPLE_GROUP_DESC_TYPE_INFO = new SimpleGroupDescTypeInfo();

// 3. 定义DescContent，继承自DescContent
export class SimpleGroupDescContent extends DescContent {

    type_info(): DescTypeInfo{
        return SIMPLE_GROUP_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{

        return Ok(buf);
    }
}

// 4. 定义一个DescContent的解码器
export class SimpleGroupDescContentDecoder extends DescContentDecoder<SimpleGroupDescContent>{
    type_info(): DescTypeInfo{
        return SIMPLE_GROUP_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[SimpleGroupDescContent, Uint8Array]>{
        const self = new SimpleGroupDescContent();
        const ret:[SimpleGroupDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

// 5. 定义一个BodyContent，继承自RawEncode
export class SimpleGroupBodyContent extends BodyContent{

    constructor(public members: Vec<ObjectId>, public ood_list: Vec<DeviceId>){
        super();
    }

    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += this.members.raw_measure().unwrap();
        size += this.ood_list.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf = this.members.raw_encode(buf).unwrap();
        buf = this.ood_list.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

// 6. 定义一个BodyContent的解码器
export class SimpleGroupBodyContentDecoder extends BodyContentDecoder<SimpleGroupBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[SimpleGroupBodyContent, Uint8Array]>{
        let members: Vec<ObjectId>;
        [members, buf] = new VecDecoder( new ObjectIdDecoder()).raw_decode(buf).unwrap();
        let ood_list: Vec<DeviceId>;
        [ood_list, buf] = new VecDecoder( new DeviceIdDecoder()).raw_decode(buf).unwrap();

        const body_content = new SimpleGroupBodyContent(members, ood_list);
        const ret:[SimpleGroupBodyContent, Uint8Array] = [body_content, buf];

        return Ok(ret);
    }
}

// 7. 定义组合类型
export class SimpleGroupDesc extends NamedObjectDesc<SimpleGroupDescContent>{
    //
}

export class SimpleGroupDescDecoder extends NamedObjectDescDecoder<SimpleGroupDescContent>{
    constructor(){
        super(new SimpleGroupDescContentDecoder());
    }
}

export class SimpleGroupBuilder extends NamedObjectBuilder<SimpleGroupDescContent, SimpleGroupBodyContent>{
    //
}

// 通过继承的方式具体化
export class SimpleGroupId extends NamedObjectId<SimpleGroupDescContent, SimpleGroupBodyContent>{
    constructor(id: ObjectId){
        super(ObjectTypeCode.SimpleGroup, id);
    }

    static default(): SimpleGroupId{
        return named_id_gen_default(ObjectTypeCode.SimpleGroup);
    }

    static from_base_58(s: string): BuckyResult<SimpleGroupId> {
        return named_id_from_base_58(ObjectTypeCode.SimpleGroup, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<SimpleGroupId>{
        return named_id_try_from_object_id(ObjectTypeCode.SimpleGroup, id);
    }
}

export class SimpleGroupIdDecoder extends NamedObjectIdDecoder<SimpleGroupDescContent, SimpleGroupBodyContent>{
    constructor(){
        super(ObjectTypeCode.SimpleGroup);
    }
}


// 8. 定义SimpleGroup对象
// 继承自NamedObject<SimpleGroupDescContent, SimpleGroupBodyContent>
// 提供创建方法和其他自定义方法
export class SimpleGroup extends NamedObject<SimpleGroupDescContent, SimpleGroupBodyContent>{
    static create(threshold: number, owners: Vec<PublicKey>, members: Vec<ObjectId>, ood_list: Vec<DeviceId>, area: Area, build?:(builder: SimpleGroupBuilder)=>void):SimpleGroup {
        const desc_content = new SimpleGroupDescContent();
        const body_content = new SimpleGroupBodyContent(members, ood_list);
        const builder = new NamedObjectBuilder<SimpleGroupDescContent, SimpleGroupBodyContent>(desc_content, body_content)
            .area(area)
            .mn_key(new MNPublicKey(threshold, owners));

        if(build){
            build(builder);
        }

        const self = builder.build();
        return new SimpleGroup(self.desc(), self.body(), self.signs(), self.nonce());
    }

    simple_group_id():SimpleGroupId{
        return SimpleGroupId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }

    connect_info(): SimpleGroupBodyContent {
        return this.body_expect().content();
    }
}

// 9. 定义SimpleGroup解码器
export class SimpleGroupDecoder extends NamedObjectDecoder<SimpleGroupDescContent, SimpleGroupBodyContent, SimpleGroup>{
    constructor(){
        super(new SimpleGroupDescContentDecoder(), new SimpleGroupBodyContentDecoder(), SimpleGroup);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[SimpleGroup, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new SimpleGroup(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [SimpleGroup, Uint8Array];
        });
    }
}