

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
import { ObjectTypeCode } from "./object_type_info";

import {
    BuckyResult,
} from "..";
import { Err, Ok } from "../base/results";
import { ObjectId, ObjectIdDecoder } from "./object_id";
import JSBI from 'jsbi';
import { ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufCodecHelper, protos } from '../codec';


export class OrgDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return ObjectTypeCode.Org;
    }

    sub_desc_type(): SubDescType {
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
    type_info(): DescTypeInfo {
        return ORG_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        return Ok(buf);
    }
}

// 4. 定义一个DescContent的解码器
export class OrgDescContentDecoder extends DescContentDecoder<OrgDescContent>{
    type_info(): DescTypeInfo {
        return ORG_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[OrgDescContent, Uint8Array]> {
        const self = new OrgDescContent();
        const ret: [OrgDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class Director {
    constructor(public id: ObjectId, public right: number) { }
}

export class OrgMember {
    constructor(public id: ObjectId, public right: number, public shared: JSBI) { }
}

// 5. 定义一个BodyContent，继承自RawEncode
export class OrgBodyContent extends ProtobufBodyContent {
    constructor(public members: OrgMember[], public directors: Director[], public total_equity: JSBI) {
        super();
    }

    try_to_proto(): BuckyResult<protos.OrgBodyContent> {
        const target = new protos.OrgBodyContent();
        // TODO
        /*
        target.setTotalEquity(this.total_equity.toString());

        for (const item of this.directors) {
            const value = new protos.Director();
            value.setId(ProtobufCodecHelper.encode_buf(item.id).unwrap());
            value.setRight(item.right);

            target.addDirectors(value);
        }

        for (const item of this.members) {
            const value = new protos.OrgMember();
            value.setId(ProtobufCodecHelper.encode_buf(item.id).unwrap());
            value.setRight(item.right);
            value.setShares(item.shared.toString());

            target.addMembers(value);
        }
        */
        return Ok(target);
    }
}

// 6. 定义一个BodyContent的解码器
export class OrgBodyContentDecoder extends ProtobufBodyContentDecoder<OrgBodyContent, protos.OrgBodyContent>{
    constructor() {
        super(protos.OrgBodyContent.deserializeBinary)
    }

    try_from_proto(value: protos.OrgBodyContent): BuckyResult<OrgBodyContent> {
        /*
        const members: OrgMember[] = [];
        const directors: Director[] = [];
        const total_equity = ProtobufCodecHelper.decode_int64(value.getTotalEquity());


        for (const item of value.getMembersList()) {
            const id: ObjectId = ProtobufCodecHelper.decode_buf(item.getId_asU8()!, new ObjectIdDecoder()).unwrap();
            const right = item.getRight();
            const shares = ProtobufCodecHelper.decode_int64(item.getShares());

            members.push(new OrgMember(id, right, shares));
        }


        for (const item of value.getDirectorsList()) {
            const id: ObjectId = ProtobufCodecHelper.decode_buf(item.getId_asU8(), new ObjectIdDecoder()).unwrap();
            const right = item.getRight();

            directors.push(new Director(id, right));
        }
        */
        // TODO
        const result = new OrgBodyContent([], [], JSBI.BigInt(0));
        return Ok(result);
    }
}

// 7. 定义组合类型
export class OrgDesc extends NamedObjectDesc<OrgDescContent>{
    //
}

export class OrgDescDecoder extends NamedObjectDescDecoder<OrgDescContent>{
    constructor() {
        super(new OrgDescContentDecoder());
    }
}

export class OrgBuilder extends NamedObjectBuilder<OrgDescContent, OrgBodyContent>{
    //
}

// 通过继承的方式具体化
export class OrgId extends NamedObjectId<OrgDescContent, OrgBodyContent>{
    constructor(id: ObjectId) {
        super(ORG_DESC_TYPE_INFO.obj_type(), id);
    }

    static default(): OrgId {
        return named_id_gen_default(ORG_DESC_TYPE_INFO.obj_type());
    }

    static from_base_58(s: string): BuckyResult<OrgId> {
        return named_id_from_base_58(ORG_DESC_TYPE_INFO.obj_type(), s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<OrgId> {
        return named_id_try_from_object_id(ORG_DESC_TYPE_INFO.obj_type(), id);
    }
}

export class OrgIdDecoder extends NamedObjectIdDecoder<OrgDescContent, OrgBodyContent>{
    constructor() {
        super(ObjectTypeCode.Org);
    }
}


// 8. 定义Org对象
// 继承自NamedObject<OrgDescContent, OrgBodyContent>
// 提供创建方法和其他自定义方法
export class Org extends NamedObject<OrgDescContent, OrgBodyContent> {
    static create(members: OrgMember[], directors: Director[], total_equity: string | number, build?: (builder: OrgBuilder) => void): Org {
        const desc_content = new OrgDescContent();
        const body_content = new OrgBodyContent(members, directors, JSBI.BigInt(total_equity));
        const builder = new NamedObjectBuilder<OrgDescContent, OrgBodyContent>(desc_content, body_content);
        if (build) {
            build(builder);
        }

        return builder.build(Org);
    }

    org_id(): OrgId {
        return OrgId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }

    content_info(): OrgBodyContent {
        return this.body_expect().content();
    }
}

// 9. 定义Org解码器
export class OrgDecoder extends NamedObjectDecoder<OrgDescContent, OrgBodyContent, Org>{
    constructor() {
        super(new OrgDescContentDecoder(), new OrgBodyContentDecoder(), Org);
    }
}