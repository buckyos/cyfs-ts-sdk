import { Ok, BuckyResult, } from "../base/results";
import { RawEncode, RawDecode, ContentRawDecodeContext, } from "../base/raw_encode";
import { Option, Some, None } from "../base/option";
import { } from "../base/buffer";
import {
    OBJECT_TYPE_ANY, SubDescType, DescTypeInfo, DescContent, DescContentDecoder, BodyContent,
    BodyContentDecoder, NamedObject, NamedObjectBuilder, NamedObjectDecoder, named_id_gen_default, named_id_from_base_58, named_id_try_from_object_id, NamedObjectIdDecoder, NamedObjectDescBuilder, ContentCodecInfo
} from "./object";
import { base_trace } from "../base/log";


export class TypelessDescTypeInfo extends DescTypeInfo {
    private m_sub_obj_type?: number;

    obj_type(): number {
        return OBJECT_TYPE_ANY;
    }

    get_sub_obj_type(): number {
        if (this.m_sub_obj_type) {
            return this.m_sub_obj_type;
        }
        return this.obj_type();
    }

    set_sub_obj_type(v: number) {
        this.m_sub_obj_type = v;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "option",
            area_type: "option",
            author_type: "option",
            key_type: "any"
        }
    }
}

// const TYPELESS_DESC_TYPE_INFO = new TypelessDescTypeInfo();

export class TypelessDescContent extends DescContent {
    private readonly m_desc_content_buf: Uint8Array;
    private readonly m_type_info: TypelessDescTypeInfo;
    private readonly m_codec_info: ContentCodecInfo;

    constructor(buf: Uint8Array, version: number, format: number) {
        super();

        this.m_desc_content_buf = buf;
        this.m_type_info = new TypelessDescTypeInfo();
        this.m_codec_info = new ContentCodecInfo(version, format);
    }

    type_info(): DescTypeInfo {
        return this.m_type_info;
    }

    // 需要复原原来的version+format信息
    codec_info(): ContentCodecInfo {
        return this.m_codec_info;
    }

    buffer(): Uint8Array {
        return this.m_desc_content_buf;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(this.m_desc_content_buf.length);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        console.assert(buf.length >= this.m_desc_content_buf.length);

        base_trace("@@@@@@@@@@ this.m_desc_content_len: ", this.m_desc_content_buf.length);

        // buffer
        buf.set(this.m_desc_content_buf, 0);
        buf = buf.offset(this.m_desc_content_buf.length);

        return Ok(buf);
    }
}

export class TypelessDescContentDecoder extends DescContentDecoder<TypelessDescContent>{
    private readonly m_type_info: TypelessDescTypeInfo;
    constructor() {
        super();
        this.m_type_info = new TypelessDescTypeInfo();
    }

    type_info(): DescTypeInfo {
        return this.m_type_info;
    }

    raw_decode(buf: Uint8Array, ctx: ContentRawDecodeContext): BuckyResult<[TypelessDescContent, Uint8Array]> {
        // 传进来的buf就是精确长度的buf
        const desc_content_size = buf.length;

        const buffer = buf.slice(0, desc_content_size);
        buf = buf.offset(desc_content_size);

        const self = new TypelessDescContent(buffer, ctx.version, ctx.format);
        const ret: [TypelessDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}


export class TypelessBodyContent extends BodyContent {
    private readonly m_body_content_buf: Uint8Array;
    private readonly m_type_info: TypelessDescTypeInfo;
    private readonly m_codec_info: ContentCodecInfo;

    constructor(buf: Uint8Array, version: number, format: number) {
        super();

        this.m_body_content_buf = buf;
        this.m_type_info = new TypelessDescTypeInfo();
        this.m_codec_info = new ContentCodecInfo(version, format);
    }

    type_info(): DescTypeInfo {
        return this.m_type_info;
    }

    codec_info(): ContentCodecInfo {
        return this.m_codec_info;
    }

    buffer(): Uint8Array {
        return this.m_body_content_buf;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(this.m_body_content_buf.length);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        console.assert(buf.length >= this.m_body_content_buf.length);

        // buffer
        buf.set(this.m_body_content_buf, 0);
        buf = buf.offset(this.m_body_content_buf.length);

        return Ok(buf);
    }
}

export class TypelessBodyContentDecoder extends BodyContentDecoder<TypelessBodyContent>{
    private readonly m_type_info: TypelessDescTypeInfo;

    constructor() {
        super();
        this.m_type_info = new TypelessDescTypeInfo();
    }

    type_info(): DescTypeInfo {
        return this.m_type_info;
    }

    raw_decode(buf: Uint8Array, ctx: ContentRawDecodeContext): BuckyResult<[TypelessBodyContent, Uint8Array]> {
         // 传进来的buf就是精确长度的buf
        const body_content_size = buf.length;

        const buffer = buf.slice(0, body_content_size);
        buf = buf.offset(body_content_size);

        const self = new TypelessBodyContent(buffer, ctx.version, ctx.format);
        const ret: [TypelessBodyContent, Uint8Array] = [self, buf];

        return Ok(ret);
    }
}

export class TypelessAnyObject extends NamedObject<TypelessDescContent, TypelessBodyContent>{
    convert_to<
        DC extends DescContent,
        BC extends BodyContent,
        >(desc_content_decoder: DescContentDecoder<DC>, body_content_decoder: BodyContentDecoder<BC>)
        : BuckyResult<NamedObject<DC, BC>> {
        const desc_ret = this.desc().convert_to<DC>(desc_content => {
            // desc
            let new_desc;
            {
                const ctx = new ContentRawDecodeContext(desc_content.codec_info().version, desc_content.codec_info().format);
                const r = desc_content_decoder.raw_decode(desc_content.buffer(), ctx);
                if (r.err) {
                    return r;
                }
                let buf;
                [new_desc, buf] = r.unwrap();
            }

            return Ok(new_desc);
        });
        if (desc_ret.err) {
            return desc_ret;
        }
        const desc = desc_ret.unwrap();

        let body;
        if (this.body().is_some()) {
            const body_ret = this.body().unwrap().convert_to<BC>(body_content => {
                // body
                let new_body;
                {
                    const ctx = new ContentRawDecodeContext(body_content.codec_info().version, body_content.codec_info().format);
                    const r = body_content_decoder.raw_decode(body_content.buffer(), ctx);
                    if (r.err) {
                        return r;
                    }
                    let buf;
                    [new_body, buf] = r.unwrap();
                }
                return Ok(new_body);
            });

            if (body_ret.err) {
                return body_ret;
            }
            body = Some(body_ret.unwrap());
        } else {
            body = None;
        }

        return Ok(new NamedObject(desc, body, this.signs(), this.nonce()));
    }
}

export class TypelessAnyObjectDecoder<O extends TypelessAnyObject> extends NamedObjectDecoder<TypelessDescContent, TypelessBodyContent, O>{
    constructor(obj_builder: new (...constructorArgs: any[]) => O) {
        super(new TypelessDescContentDecoder(), new TypelessBodyContentDecoder(), obj_builder);
    }
}

export class TypelessStandardObject extends TypelessAnyObject {

}

export class TypelessStandardObjectDecoder extends TypelessAnyObjectDecoder<TypelessStandardObject> {
    constructor() {
        super(TypelessStandardObject);
    }
}


export class TypelessCoreObject extends TypelessAnyObject {

}

export class TypelessCoreObjectDecoder extends TypelessAnyObjectDecoder<TypelessCoreObject> {
    constructor() {
        super(TypelessCoreObject);
    }
}

export class TypelessDECAppObject extends TypelessAnyObject {

}

export class TypelessDECAppObjectDecoder extends TypelessAnyObjectDecoder<TypelessDECAppObject> {
    constructor() {
        super(TypelessDECAppObject);
    }
}