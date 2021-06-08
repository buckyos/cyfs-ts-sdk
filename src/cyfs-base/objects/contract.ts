

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
    BuckyResult, HashValue, HashValueDecoder,
    RawDecode,
    RawEncode,
} from "..";
import {Err, Ok} from "../base/results";
import {ObjectId} from "./object_id";
import * as Path from "path";

export class ContractDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return ObjectTypeCode.Contract;
    }

    sub_desc_type(): SubDescType{
        return {
            owner_type: "option",   // 是否有主，"disable": 禁用，"option": 可选
            area_type: "disable",    // 是否有区域信息，"disable": 禁用，"option": 可选
            author_type: "option",  // 是否有作者，"disable": 禁用，"option": 可选
            key_type: "disable"  // 公钥类型，"disable": 禁用，"single_key": 单PublicKey，"mn_key": M-N 公钥对
        }
    }
}

// 2. 定义一个类型信息常量
const CONTRACT_DESC_TYPE_INFO = new ContractDescTypeInfo();

// 3. 定义DescContent，继承自DescContent
export class ContractDescContent extends DescContent {

    constructor(public packageValue: HashValue){
        super();
    }

    type_info(): DescTypeInfo{
        return CONTRACT_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        const size = this.packageValue.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf = this.packageValue.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

// 4. 定义一个DescContent的解码器
export class ContractDescContentDecoder extends DescContentDecoder<ContractDescContent>{
    type_info(): DescTypeInfo{
        return CONTRACT_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[ContractDescContent, Uint8Array]>{
        let hashValue;
        [hashValue, buf] = new HashValueDecoder().raw_decode(buf).unwrap();

        const self = new ContractDescContent(hashValue);
        const ret:[ContractDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

// 5. 定义一个BodyContent，继承自RawEncode
export class ContractBodyContent extends BodyContent{
    raw_measure(): BuckyResult<number>{
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{

        return Ok(buf);
    }
}

// 6. 定义一个BodyContent的解码器
export class ContractBodyContentDecoder extends BodyContentDecoder<ContractBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[ContractBodyContent, Uint8Array]>{

        const body_content = new ContractBodyContent();
        const ret:[ContractBodyContent, Uint8Array] = [body_content, buf];

        return Ok(ret);
    }
}

// 7. 定义组合类型
export class ContractDesc extends NamedObjectDesc<ContractDescContent>{
    //
}

export class ContractDescDecoder extends NamedObjectDescDecoder<ContractDescContent>{
    constructor(){
        super(new ContractDescContentDecoder());
    }
}

export class ContractBuilder extends NamedObjectBuilder<ContractDescContent, ContractBodyContent>{
    //
}

// 通过继承的方式具体化
export class ContractId extends NamedObjectId<ContractDescContent, ContractBodyContent>{
    constructor(id: ObjectId){
        super(CONTRACT_DESC_TYPE_INFO.obj_type(), id);
    }

    static default(): ContractId{
        return named_id_gen_default(CONTRACT_DESC_TYPE_INFO.obj_type());
    }

    static from_base_58(s: string): BuckyResult<ContractId> {
        return named_id_from_base_58(CONTRACT_DESC_TYPE_INFO.obj_type(), s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<ContractId>{
        return named_id_try_from_object_id(CONTRACT_DESC_TYPE_INFO.obj_type(), id);
    }
}

export class ContractIdDecoder extends NamedObjectIdDecoder<ContractDescContent, ContractBodyContent>{
    constructor(){
        super(ObjectTypeCode.Contract);
    }
}


// 8. 定义Contract对象
// 继承自NamedObject<ContractDescContent, ContractBodyContent>
// 提供创建方法和其他自定义方法
export class Contract extends NamedObject<ContractDescContent, ContractBodyContent>{
    static create(packageValue: HashValue, build?:(builder: ContractBuilder)=>void): Contract{
        const desc_content = new ContractDescContent(packageValue);
        const body_content = new ContractBodyContent();
        const builder = new NamedObjectBuilder<ContractDescContent, ContractBodyContent>(desc_content, body_content);
        if(build){
            build(builder);
        }
        const self = builder.build();
        return new Contract(self.desc(), self.body(), self.signs(), self.nonce());
    }

    contract_id():ContractId{
        return ContractId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }

    connect_info(): ContractBodyContent {
        return this.body_expect().content();
    }
}

// 9. 定义Contract解码器
export class ContractDecoder extends NamedObjectDecoder<ContractDescContent, ContractBodyContent, Contract>{
    constructor(){
        super(new ContractDescContentDecoder(), new ContractBodyContentDecoder(), Contract);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[Contract, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new Contract(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [Contract, Uint8Array];
        });
    }
}
