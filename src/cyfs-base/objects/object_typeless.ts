import { Ok, BuckyResult, } from "../base/results";
import { RawEncode, RawDecode, } from "../base/raw_encode";
import { Option, Some, None } from "../base/option";
import {} from "../base/buffer";
import { DescContentFormat, OBJECT_TYPE_ANY, SubDescType, DescTypeInfo, DescContent, DescContentDecoder, BodyContent,
    BodyContentDecoder, NamedObjectId, NamedObjectDesc, NamedObject, NamedObjectBuilder, NamedObjectDecoder, named_id_gen_default, named_id_from_base_58, named_id_try_from_object_id,  NamedObjectIdDecoder, NamedObjectDescBuilder, BodyContentFormat } from "./object";
import { BuckyNumber, BuckyNumberDecoder } from "../base/bucky_number";
import { base_error, base_trace } from "../base/log";


export class TypelessDescTypeInfo extends DescTypeInfo{
    private m_sub_obj_type?: number;

    obj_type() : number{
        return OBJECT_TYPE_ANY;
    }

    get_sub_obj_type(): number {
        if(this.m_sub_obj_type){
            return this.m_sub_obj_type;
        }
        return this.obj_type();
    }

    set_sub_obj_type(v: number) {
        this.m_sub_obj_type = v;
    }

    desc_content_format(): DescContentFormat{
        return DescContentFormat.Buffer;
    }

    sub_desc_type(): SubDescType{
        return {
            owner_type: "option",
            area_type: "option",
            author_type: "option",
            key_type: "any"
        }
    }
}

// const TYPELESS_DESC_TYPE_INFO = new TypelessDescTypeInfo();

export class TypelessDescContent extends DescContent{
    private readonly m_desc_content_len: number; // u16
    private readonly m_desc_content_buf: Uint8Array;
    private readonly m_type_info: TypelessDescTypeInfo;

    constructor(buf: Uint8Array){
        super();
        this.m_desc_content_len = buf.length;
        this.m_desc_content_buf = buf;
        this.m_type_info = new TypelessDescTypeInfo();
    }

    type_info(): DescTypeInfo{
        return this.m_type_info;
    }

    buffer():Uint8Array{
        return this.m_desc_content_buf;
    }

    raw_measure(): BuckyResult<number>{
        return Ok(2+this.m_desc_content_buf.length);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        // len
        {
            const r = new BuckyNumber("u16", this.m_desc_content_len).raw_encode(buf);
            if(r.err){
                base_error("DeviceDescContent::raw_encode error:{}", r.err);
                return r;
            }
            buf = r.unwrap();
        }

        base_trace("@@@@@@@@@@ this.m_desc_content_len: ", this.m_desc_content_len);

        // buffer
        {
            buf.set(this.m_desc_content_buf,0);
            buf = buf.offset(this.m_desc_content_len);
        }

        return Ok(buf);
    }
}

export class TypelessDescContentDecoder extends DescContentDecoder<TypelessDescContent>{
    private readonly m_type_info: TypelessDescTypeInfo;
    constructor(){
        super();
        this.m_type_info = new TypelessDescTypeInfo();
    }
    type_info(): DescTypeInfo{
        return this.m_type_info;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TypelessDescContent, Uint8Array]>{
        let len_box;
        {
            const r = new BuckyNumberDecoder("u16").raw_decode(buf);
            if(r.err){
                base_error("DeviceDescContent::raw_decode error:{}", r.err);
                return r;
            }
            [len_box, buf] = r.unwrap();
        }

        const len = len_box.toNumber();
        const buffer = buf.slice(0,len);
        buf = buf.offset(len);

        const self = new TypelessDescContent(buffer);
        const ret:[TypelessDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}


export class TypelessBodyContent extends BodyContent{
    private readonly m_body_content_len: number; // u32
    private readonly m_body_content_buf: Uint8Array;
    private readonly m_type_info: TypelessDescTypeInfo;
    constructor(buf: Uint8Array){
        super();
        this.m_body_content_len = buf.length;
        this.m_body_content_buf = buf;
        this.m_type_info = new TypelessDescTypeInfo();
    }

    body_content_type():BodyContentFormat{
        return BodyContentFormat.Buffer;
    }

    type_info(): DescTypeInfo{
        return this.m_type_info;
    }

    buffer():Uint8Array{
        return this.m_body_content_buf;
    }

    raw_measure(): BuckyResult<number>{
        return Ok(4+this.m_body_content_buf.length);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        // len
        {
            const r = new BuckyNumber("u32", this.m_body_content_len).raw_encode(buf);
            if(r.err){
                base_error("DeviceDescContent::raw_encode error:{}", r.err);
                return r;
            }
            buf = r.unwrap();
        }

        // buffer
        {
            buf.set(this.m_body_content_buf,0);
            buf = buf.offset(this.m_body_content_len);
        }

        return Ok(buf);
    }
}

export class TypelessBodyContentDecoder extends BodyContentDecoder<TypelessBodyContent>{
    private readonly m_type_info: TypelessDescTypeInfo;

    constructor(){
        super();
        this.m_type_info = new TypelessDescTypeInfo();
    }
    body_content_type():BodyContentFormat{
        return BodyContentFormat.Buffer;
    }

    type_info(): DescTypeInfo{
        return this.m_type_info;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TypelessBodyContent, Uint8Array]>{
        let len_box;
        {
            const r = new BuckyNumberDecoder("u32").raw_decode(buf);
            if(r.err){
                base_error("DeviceDescContent::raw_decode error:{}", r.err);
                return r;
            }
            [len_box, buf] = r.unwrap();
        }

        const len = len_box.toNumber();
        const buffer = buf.slice(0,len);
        buf = buf.offset(len);

        const self = new TypelessBodyContent(buffer);
        const ret:[TypelessBodyContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class TypelessAnyObject extends NamedObject<TypelessDescContent, TypelessBodyContent>{
    convert_to<
        DC extends DescContent,
        BC extends BodyContent,
    >(desc_content_decoer: DescContentDecoder<DC>, body_content_decoder: RawDecode<BC>)
        : BuckyResult<NamedObject<DC,BC>>
    {
        const desc_ret = this.desc().convert_to<DC>( desc_content=>{
            // desc
            let new_desc;
            {
                const r = desc_content_decoer.raw_decode(desc_content.buffer());
                if(r.err){
                    return r;
                }
                let buf;
                [new_desc, buf] = r.unwrap();
            }

            return Ok(new_desc);
        });
        if(desc_ret.err){
            return desc_ret;
        }
        const desc = desc_ret.unwrap();

        let body;
        if(this.body().is_some()){
            const body_ret = this.body().unwrap().convert_to<BC>( body_content=>{
                // body
                let new_body;
                {
                    const r = body_content_decoder.raw_decode(body_content.buffer());
                    if(r.err){
                        return r;
                    }
                    let buf;
                    [new_body, buf] = r.unwrap();
                }
                return Ok(new_body);
            });

            if(body_ret.err){
                return body_ret;
            }
            body = Some(body_ret.unwrap());
        }else{
            body = None;
        }

        return Ok(new NamedObject(desc, body, this.signs(), this.nonce()));
    }
}

export class TypelessAnyObjectDecoder<O extends TypelessAnyObject> extends NamedObjectDecoder<TypelessDescContent, TypelessBodyContent, O>{
    constructor(obj_builder: new(...constructorArgs: any[]) => O){
        super(new TypelessDescContentDecoder(), new TypelessBodyContentDecoder(), obj_builder);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TypelessAnyObject, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            return [obj as TypelessAnyObject, _buf] as [TypelessAnyObject, Uint8Array];
        });
    }
}

export class TypelessCoreObject extends TypelessAnyObject{

}

export class TypelessCoreObjectDecoder extends TypelessAnyObjectDecoder<TypelessCoreObject> {
    constructor(){
        super(TypelessCoreObject);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TypelessCoreObject, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            return [obj as TypelessCoreObject, _buf] as [TypelessCoreObject, Uint8Array];
        });
    }
}

export class TypelessDECAppObject extends TypelessAnyObject{

}

export class TypelessDECAppObjectDecoder extends TypelessAnyObjectDecoder<TypelessDECAppObject> {
    constructor(){
        super(TypelessDECAppObject);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[TypelessDECAppObject, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            return [obj as TypelessDECAppObject, _buf] as [TypelessDECAppObject, Uint8Array];
        });
    }
}