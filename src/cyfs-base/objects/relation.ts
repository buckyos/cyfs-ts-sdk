

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
    BuckyResult,
    RawDecode,
    RawEncode,
} from "..";
import {Err, Ok} from "../base/results";
import {ObjectId} from "./object_id";

export class RelationDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return ObjectTypeCode.Relation;
    }

    sub_desc_type(): SubDescType{
        return {
            owner_type: "option",   // 是否有主，"disable": 禁用，"option": 可选
            area_type: "disable",    // 是否有区域信息，"disable": 禁用，"option": 可选
            author_type: "disable",  // 是否有作者，"disable": 禁用，"option": 可选
            key_type: "disable"  // 公钥类型，"disable": 禁用，"single_key": 单PublicKey，"mn_key": M-N 公钥对
        }
    }
}

// 2. 定义一个类型信息常量
const RELATION_DESC_TYPE_INFO = new RelationDescTypeInfo();

// 3. 定义DescContent，继承自DescContent
export class RelationDescContent extends DescContent {

    type_info(): DescTypeInfo{
        return RELATION_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return Ok(buf);
    }
}

// 4. 定义一个DescContent的解码器
export class RelationDescContentDecoder extends DescContentDecoder<RelationDescContent>{
    type_info(): DescTypeInfo{
        return RELATION_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[RelationDescContent, Uint8Array]>{
        const self = new RelationDescContent();
        const ret:[RelationDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

// 5. 定义一个BodyContent，继承自RawEncode
export class RelationBodyContent extends BodyContent{
    raw_measure(): BuckyResult<number>{
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{

        return Ok(buf);
    }
}

// 6. 定义一个BodyContent的解码器
export class RelationBodyContentDecoder extends BodyContentDecoder<RelationBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[RelationBodyContent, Uint8Array]>{

        const body_content = new RelationBodyContent();
        const ret:[RelationBodyContent, Uint8Array] = [body_content, buf];

        return Ok(ret);
    }
}

// 7. 定义组合类型
export class RelationDesc extends NamedObjectDesc<RelationDescContent>{

}

export class RelationDescDecoder extends NamedObjectDescDecoder<RelationDescContent>{
    constructor(){
        super(new RelationDescContentDecoder());
    }
}

export class RelationBuilder extends NamedObjectBuilder<RelationDescContent, RelationBodyContent>{

}

// 通过继承的方式具体化
export class RelationId extends NamedObjectId<RelationDescContent, RelationBodyContent>{
    constructor(id: ObjectId){
        super(ObjectTypeCode.Relation, id);
    }

    static default(): RelationId{
        return named_id_gen_default(ObjectTypeCode.Relation);
    }

    static from_base_58(s: string): BuckyResult<RelationId> {
        return named_id_from_base_58(ObjectTypeCode.Relation, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<RelationId>{
        return named_id_try_from_object_id(ObjectTypeCode.Relation, id);
    }
}

export class RelationIdDecoder extends NamedObjectIdDecoder<RelationDescContent, RelationBodyContent>{
    constructor(){
        super(ObjectTypeCode.Relation);
    }
}


// 8. 定义Relation对象
// 继承自NamedObject<RelationDescContent, RelationBodyContent>
// 提供创建方法和其他自定义方法
export class Relation extends NamedObject<RelationDescContent, RelationBodyContent>{
    static create(build?:(builder: RelationBuilder)=>void): Relation{
        const desc_content = new RelationDescContent();
        const body_content = new RelationBodyContent();
        const builder = new NamedObjectBuilder<RelationDescContent, RelationBodyContent>(desc_content, body_content);

        if(build){
            build(builder);
        }

        const self = builder.build();
        return new Relation(self.desc(), self.body(), self.signs(), self.nonce());
    }

    relation_id():RelationId{
        return RelationId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }

    connect_info(): RelationBodyContent {
        return this.body_expect().content();
    }
}

// 9. 定义Relation解码器
export class RelationDecoder extends NamedObjectDecoder<RelationDescContent, RelationBodyContent, Relation>{
    constructor(){
        super(new RelationDescContentDecoder(), new RelationBodyContentDecoder(), Relation);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[Relation, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new Relation(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [Relation, Uint8Array];
        });
    }
}