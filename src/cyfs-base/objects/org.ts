

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

export class OrgDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return ObjectTypeCode.Org;
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
const ORG_DESC_TYPE_INFO = new OrgDescTypeInfo();

// 3. 定义DescContent，继承自DescContent
export class OrgDescContent extends DescContent {
    type_info(): DescTypeInfo{
        return ORG_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return Ok(buf);
    }
}

// 4. 定义一个DescContent的解码器
export class OrgDescContentDecoder extends DescContentDecoder<OrgDescContent>{
    type_info(): DescTypeInfo{
        return ORG_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[OrgDescContent, Uint8Array]>{
        const self = new OrgDescContent();
        const ret:[OrgDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

// 5. 定义一个BodyContent，继承自RawEncode
export class OrgBodyContent extends BodyContent{

    raw_measure(): BuckyResult<number>{
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{

        return Ok(buf);
    }
}

// 6. 定义一个BodyContent的解码器
export class OrgBodyContentDecoder extends BodyContentDecoder<OrgBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[OrgBodyContent, Uint8Array]>{

        const body_content = new OrgBodyContent();
        const ret:[OrgBodyContent, Uint8Array] = [body_content, buf];

        return Ok(ret);
    }
}

// 7. 定义组合类型
export class OrgDesc extends NamedObjectDesc<OrgDescContent>{
    //
}

export class OrgDescDecoder extends NamedObjectDescDecoder<OrgDescContent>{
    constructor(){
        super(new OrgDescContentDecoder());
    }
}

export class OrgBuilder extends NamedObjectBuilder<OrgDescContent, OrgBodyContent>{
    //
}

// 通过继承的方式具体化
export class OrgId extends NamedObjectId<OrgDescContent, OrgBodyContent>{
    constructor(id: ObjectId){
        super(ORG_DESC_TYPE_INFO.obj_type(), id);
    }

    static default(): OrgId{
        return named_id_gen_default(ORG_DESC_TYPE_INFO.obj_type());
    }

    static from_base_58(s: string): BuckyResult<OrgId> {
        return named_id_from_base_58(ORG_DESC_TYPE_INFO.obj_type(), s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<OrgId>{
        return named_id_try_from_object_id(ORG_DESC_TYPE_INFO.obj_type(), id);
    }
}

export class OrgIdDecoder extends NamedObjectIdDecoder<OrgDescContent, OrgBodyContent>{
    constructor(){
        super(ObjectTypeCode.Org);
    }
}


// 8. 定义Org对象
// 继承自NamedObject<OrgDescContent, OrgBodyContent>
// 提供创建方法和其他自定义方法
export class Org extends NamedObject<OrgDescContent, OrgBodyContent>{
    static create(build?:(builder: OrgBuilder)=>void):Org{
        const desc_content = new OrgDescContent();
        const body_content = new OrgBodyContent();
        const builder = new NamedObjectBuilder<OrgDescContent, OrgBodyContent>(desc_content, body_content);
        if(build){
            build(builder);
        }
        const self = builder.build();
        return new Org(self.desc(), self.body(), self.signs(), self.nonce());
    }

    org_id():OrgId{
        return OrgId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }

    connect_info(): OrgBodyContent {
        return this.body_expect().content();
    }
}

// 9. 定义Org解码器
export class OrgDecoder extends NamedObjectDecoder<OrgDescContent, OrgBodyContent, Org>{
    constructor(){
        super(new OrgDescContentDecoder(), new OrgBodyContentDecoder(), Org);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[Org, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new Org(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [Org, Uint8Array];
        });
    }
}