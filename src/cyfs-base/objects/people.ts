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
import {UniqueId, UniqueIdDecoder} from "./unique_id";
import {
    Area,
    BuckyError, BuckyErrorCode,
    BuckyResult,
    None,
    Option,
    OptionDecoder,
    OptionEncoder,
    PublicKey,
    RawDecode,
    RawEncode,
    Some
} from "..";
import {Err, Ok} from "../base/results";
import {
    DeviceBodyContent,
    DeviceDescContent,
    DeviceId,
    DeviceIdDecoder
} from "./device";
import {Vec, VecDecoder} from "../base/vec";
import {Endpoint, EndPointDecoder} from "../base/endpoint";
import {BuckyString, BuckyStringDecoder} from "../base/bucky_string";
import {FileId, FileIdDecoder} from "./file";
import {ObjectId} from "./object_id";
import {BuckyNumber} from "../base/bucky_number";
import { base_error } from "../base/log";

// 1. 定义一个Desc类型信息
export class PeopleDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return ObjectTypeCode.People;
    }

    sub_desc_type(): SubDescType{
        return {
            owner_type: "option",   // 是否有主，"disable": 禁用，"option": 可选
            area_type: "option",    // 是否有区域信息，"disable": 禁用，"option": 可选
            author_type: "option",  // 是否有作者，"disable": 禁用，"option": 可选
            key_type: "single_key"  // 公钥类型，"disable": 禁用，"single_key": 单PublicKey，"mn_key": M-N 公钥对
        }
    }
}

// 2. 定义一个类型信息常量
const PEOPLE_DESC_TYPE_INFO = new PeopleDescTypeInfo();


// 3. 定义DescContent，继承自DescContent
export class PeopleDescContent extends DescContent {
    type_info(): DescTypeInfo{
        return PEOPLE_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return Ok(0);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return Ok(buf);
    }
}

// 4. 定义一个DescContent的解码器
export class PeopleDescContentDecoder extends DescContentDecoder<PeopleDescContent>{
    type_info(): DescTypeInfo{
        return PEOPLE_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[PeopleDescContent, Uint8Array]>{
        const self = new PeopleDescContent();
        const ret:[PeopleDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}



// 5. 定义一个BodyContent，继承自RawEncode
export class PeopleBodyContent extends BodyContent{
    public m_name: Option<BuckyString>

    constructor(public ood_list: Vec<DeviceId>, name: Option<string>, public icon: Option<FileId>){
        super();
        if(name.is_some()){
            this.m_name = Some(new BuckyString(name.unwrap()));
        }else{
            this.m_name = None;
        }
    }

    name(): string|undefined {
        if(this.m_name.is_some()){
            return this.m_name.unwrap().value();
        }else{
            return undefined;
        }
    }

    set_name(name: Option<string>) {
        if(name.is_some()){
            this.m_name = Some(new BuckyString(name.unwrap()));
        }else{
            this.m_name = None;
        }
    }

    set_icon(icon: FileId) {
        this.icon = Some(icon);
    }

    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += 1; // 这里是对多Option字段的一个优化，用最开始的一个字节表示每个Option的状态
        size += this.ood_list.raw_measure().unwrap();
        if (this.m_name.is_some()) {
            size += this.m_name.unwrap().raw_measure().unwrap();
        }
        if (this.icon.is_some()) {
            size += this.icon.unwrap().raw_measure().unwrap();
        }
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{


        let flag = 0;
        if(this.m_name.is_some()){
            flag|=0x01;
        }
        if(this.icon.is_some()){
            flag|=0x01<<1;
        }

        buf[0] = flag;
        buf = buf.offset(1);

        {
            const r = this.ood_list.raw_encode(buf);
            if(r.err){
                base_error("PeopleBodyContent::raw_encode/endpoints failed, err:{}", r.err);
                return r;
            }
            buf = r.unwrap();
        }

        if(this.m_name.is_some())
        {
            const r = this.m_name.unwrap().raw_encode(buf);
            if(r.err){
                base_error("PeopleBodyContent::raw_encode/sn_list failed, err:{}", r.err);
                return r;
            }
            buf = r.unwrap();
        }

        if(this.icon.is_some())
        {
            const r = this.icon.unwrap().raw_encode(buf);
            if(r.err){
                base_error("PeopleBodyContent::raw_encode/name failed, err:{}", r.err);
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }
}


// 6. 定义一个BodyContent的解码器
export class PeopleBodyContentDecoder extends BodyContentDecoder<PeopleBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[PeopleBodyContent, Uint8Array]>{
        let flag = buf[0];
        buf = buf.offset(1);

        let ood_list: Vec<DeviceId>;
        {
            const r = new VecDecoder( new DeviceIdDecoder()).raw_decode(buf);
            if(r.err){
                base_error("Device::raw_decode/endpoints failed, err:{}", r.err);
                return r;
            }
            [ood_list,buf] = r.unwrap();
        }

        let name: Option<BuckyString>;
        if((flag&0x01)==0x01)
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                base_error("Device::raw_decode/sn_list failed, err:{}", r.err);
                return r;
            }
            let _name;
            [_name, buf] = r.unwrap();
            name = Some(_name);
        }else {
            name = None;
        }

        let name_str;
        if(name.is_some()){
            name_str = Some(name.unwrap().value());
        }else{
            name_str = None;
        }

        let icon: Option<FileId>;
        if((flag&(0x01<<1))==(0x01<<1))
        {
            const r = new FileIdDecoder().raw_decode(buf);
            if(r.err){
                base_error("Device::raw_decode/endpoints failed, err:{}", r.err);
                return r;
            }
            let _icon;
            [_icon,buf] = r.unwrap();
            icon = Some(_icon);
        }else{
            icon = None;
        }

        const body_content = new PeopleBodyContent(ood_list, name_str, icon);
        const ret:[PeopleBodyContent, Uint8Array] = [body_content, buf];

        return Ok(ret);
    }
}

// 7. 定义组合类型
export class PeopleDesc extends NamedObjectDesc<PeopleDescContent>{
    //
}

export class PeopleDescDecoder extends NamedObjectDescDecoder<PeopleDescContent>{
    constructor(){
        super(new PeopleDescContentDecoder());
    }
}

export class PeopleBuilder extends NamedObjectBuilder<PeopleDescContent, PeopleBodyContent>{
    //
}

// 通过继承的方式具体化
export class PeopleId extends NamedObjectId<PeopleDescContent, PeopleBodyContent>{
    constructor(id: ObjectId){
        super(ObjectTypeCode.People, id);
    }

    static default(): PeopleId{
        return named_id_gen_default(ObjectTypeCode.People);
    }

    static from_base_58(s: string): BuckyResult<PeopleId> {
        return named_id_from_base_58(ObjectTypeCode.People, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<PeopleId>{
        return named_id_try_from_object_id(ObjectTypeCode.People, id);
    }
}

export class PeopleIdDecoder extends NamedObjectIdDecoder<DeviceDescContent, DeviceBodyContent>{
    constructor(){
        super(ObjectTypeCode.People);
    }
}

// 8. 定义People对象
// 继承自NamedObject<PeopleDescContent, PeopleBodyContent>
// 提供创建方法和其他自定义方法
export class People extends NamedObject<PeopleDescContent, PeopleBodyContent>{
    static create(owner: Option<ObjectId>, ood_list: Vec<DeviceId>, public_key: PublicKey, area: Option<Area>, name: Option<string>, icon: Option<FileId>, build?:(builder: PeopleBuilder)=>void):People{
        const desc_content = new PeopleDescContent();
        const body_content = new PeopleBodyContent(ood_list, name, icon);

        const builder = new NamedObjectBuilder<PeopleDescContent, PeopleBodyContent>(desc_content, body_content)
            .option_owner(owner)
            .option_area(area)
            .single_key(public_key);

        if(build){
            build(builder);
        }

        const self = builder.build();
        return new People(self.desc(), self.body(), self.signs(), self.nonce());
    }

    people_id():PeopleId{
        return PeopleId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }

    name(): string|undefined {
        return this.body_expect().content().name();
    }

    set_name(name: Option<string>) {
        return this.body_expect().content().set_name(name);
    }

    icon() {
        return this.body_expect().content().icon;
    }

    set_icon(icon: FileId) {
        return this.body_expect().content().set_icon(icon);
    }
}

// 9. 定义People解码器
export class PeopleDecoder extends NamedObjectDecoder<PeopleDescContent, PeopleBodyContent, People>{
    constructor(){
        super(new PeopleDescContentDecoder(), new PeopleBodyContentDecoder(), People);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[People, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new People(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [People, Uint8Array];
        });
    }
}