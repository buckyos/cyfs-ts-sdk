

// 1. 定义一个Desc类型信息
import {
    DescContent,
    DescContentDecoder,
    DescTypeInfo, named_id_gen_default, named_id_from_base_58, named_id_try_from_object_id, NamedObject,
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
import {ObjectId, ObjectIdDecoder} from "./object_id";
import {BuckyNumber, BuckyNumberDecoder} from "../base/bucky_number";

export class UnionAccountDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return ObjectTypeCode.UnionAccount;
    }

    sub_desc_type(): SubDescType{
        return {
            owner_type: "disable",   // 是否有主，"disable": 禁用，"option": 可选
            area_type: "disable",    // 是否有区域信息，"disable": 禁用，"option": 可选
            author_type: "disable",  // 是否有作者，"disable": 禁用，"option": 可选
            key_type: "disable"  // 公钥类型，"disable": 禁用，"single_key": 单PublicKey，"mn_key": M-N 公钥对
        }
    }
}

// 2. 定义一个类型信息常量
const UNION_ACCOUNT_DESC_TYPE_INFO = new UnionAccountDescTypeInfo();

// 3. 定义DescContent，继承自DescContent
export class UnionAccountDescContent extends DescContent {

    constructor(public left: ObjectId, public right: ObjectId, public service_type: number){
        super();
    }

    type_info(): DescTypeInfo{
        return UNION_ACCOUNT_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        let size = 1;
        size += this.left.raw_measure().unwrap();
        size += this.right.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf = this.left.raw_encode(buf).unwrap();
        buf = this.right.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u8', this.service_type).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

// 4. 定义一个DescContent的解码器
export class UnionAccountDescContentDecoder extends DescContentDecoder<UnionAccountDescContent>{
    type_info(): DescTypeInfo{
        return UNION_ACCOUNT_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[UnionAccountDescContent, Uint8Array]>{
        let left: ObjectId;
        [left, buf] = new ObjectIdDecoder().raw_decode(buf).unwrap();
        let right: ObjectId;
        [right, buf] = new ObjectIdDecoder().raw_decode(buf).unwrap();
        let service_type: BuckyNumber;
        [service_type, buf] = new BuckyNumberDecoder('u8').raw_decode(buf).unwrap();
        const self = new UnionAccountDescContent(left, right, service_type.toNumber());
        const ret:[UnionAccountDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

// 5. 定义一个BodyContent，继承自RawEncode
export class UnionAccountBodyContent extends BodyContent{
    raw_measure(): BuckyResult<number>{
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{

        return Ok(buf);
    }
}

// 6. 定义一个BodyContent的解码器
export class UnionAccountBodyContentDecoder extends BodyContentDecoder<UnionAccountBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[UnionAccountBodyContent, Uint8Array]>{

        const body_content = new UnionAccountBodyContent();
        const ret:[UnionAccountBodyContent, Uint8Array] = [body_content, buf];

        return Ok(ret);
    }
}

// 7. 定义组合类型
export class UnionAccountDesc extends NamedObjectDesc<UnionAccountDescContent>{
    //
}

export class UnionAccountDescDecoder extends NamedObjectDescDecoder<UnionAccountDescContent>{
    constructor(){
        super(new UnionAccountDescContentDecoder());
    }
}

export class UnionAccountBuilder extends NamedObjectBuilder<UnionAccountDescContent, UnionAccountBodyContent>{
    //
}

// 通过继承的方式具体化
export class UnionAccountId extends NamedObjectId<UnionAccountDescContent, UnionAccountBodyContent>{
    constructor(id: ObjectId){
        super(ObjectTypeCode.UnionAccount, id);
    }

    static default(): UnionAccountId{
        return named_id_gen_default(ObjectTypeCode.UnionAccount);
    }

    static from_base_58(s: string): BuckyResult<UnionAccountId> {
        return named_id_from_base_58(ObjectTypeCode.UnionAccount, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<UnionAccountId>{
        return named_id_try_from_object_id(ObjectTypeCode.UnionAccount, id);
    }
}

export class UnionAccountIdDecoder extends NamedObjectIdDecoder<UnionAccountDescContent, UnionAccountBodyContent>{
    constructor(){
        super(ObjectTypeCode.UnionAccount);
    }
}


// 8. 定义UnionAccount对象
// 继承自NamedObject<UnionAccountDescContent, UnionAccountBodyContent>
// 提供创建方法和其他自定义方法
export class UnionAccount extends NamedObject<UnionAccountDescContent, UnionAccountBodyContent>{
    static create(account1: ObjectId, account2: ObjectId, service_type: number, build?:(builder: UnionAccountBuilder)=>void): UnionAccount{
        const desc_content = new UnionAccountDescContent(account1, account2, service_type);
        const body_content = new UnionAccountBodyContent();
        const builder = new NamedObjectBuilder<UnionAccountDescContent, UnionAccountBodyContent>(desc_content, body_content);
        if(build){
            build(builder);
        }
        const self = builder.build();
        return new UnionAccount(self.desc(), self.body(), self.signs(), self.nonce());
    }

    union_account_id():UnionAccountId{
        return UnionAccountId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }

    connect_info(): UnionAccountBodyContent {
        return this.body_expect().content();
    }
}

// 9. 定义UnionAccount解码器
export class UnionAccountDecoder extends NamedObjectDecoder<UnionAccountDescContent, UnionAccountBodyContent, UnionAccount>{
    constructor(){
        super(new UnionAccountDescContentDecoder(), new UnionAccountBodyContentDecoder(), UnionAccount);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[UnionAccount, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new UnionAccount(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [UnionAccount, Uint8Array];
        });
    }
}