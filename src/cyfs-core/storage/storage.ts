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
} from "../../cyfs-base/objects/object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../cyfs-base/base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { HashValue, HashValueDecoder } from "../../cyfs-base/crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";
import { DeviceId } from "../../cyfs-base/objects/device";
import { bucky_time_now } from "../../cyfs-base/base/time";

import { CoreObjectType } from "../core_obj_type";

export class StorageDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.Storage;
    }

    sub_desc_type(): SubDescType{
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }
    }
}

const STORAGE_DESC_TYPE_INFO = new StorageDescTypeInfo();

export class StorageDescContent extends DescContent {
    private readonly m_id: BuckyString;
    constructor(id: string){
        super();
        this.m_id = new BuckyString(id);
    }

    id(): string {
        return this.m_id.value();
    }

    type_info(): DescTypeInfo{
        return STORAGE_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return this.m_id.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return this.m_id.raw_encode(buf);
    }
}

export class StorageDescContentDecoder extends DescContentDecoder<StorageDescContent>{
    type_info(): DescTypeInfo{
        return STORAGE_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[StorageDescContent, Uint8Array]>{
        let id;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [id, buf] = r.unwrap();
        }
        const self = new StorageDescContent(id.value());
        const ret:[StorageDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class StorageBodyContent extends BodyContent{
    private readonly m_value: BuckyBuffer;

    constructor(value: Uint8Array){
        super();
        this.m_value = new BuckyBuffer(value);
    }

    value(): Uint8Array{
        return this.m_value.value();
    }

    raw_measure(): BuckyResult<number>{
        return this.m_value.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return this.m_value.raw_encode(buf);
    }
}

export class StorageBodyContentDecoder extends BodyContentDecoder<StorageBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[StorageBodyContent, Uint8Array]>{

        let value;
        {
            const r = new BuckyBufferDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [value, buf] = r.unwrap();
        }

        const body_content = new StorageBodyContent(value.value());

        const ret:[StorageBodyContent, Uint8Array] = [body_content, buf];

        return Ok(ret);
    }
}

export class StorageDesc extends NamedObjectDesc<StorageDescContent>{
    // ignore
}

export  class StorageDescDecoder extends NamedObjectDescDecoder<StorageDescContent>{
    // ignore
}

export class StorageBuilder extends NamedObjectBuilder<StorageDescContent, StorageBodyContent>{
    // ignore
}

export class StorageId extends NamedObjectId<StorageDescContent, StorageBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.Storage, id);
    }

    static default(): DeviceId{
        return named_id_gen_default(CoreObjectType.Storage);
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        return named_id_from_base_58(CoreObjectType.Storage, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId>{
        return named_id_try_from_object_id(CoreObjectType.Storage, id);
    }
}

export class StorageIdDecoder extends NamedObjectIdDecoder<StorageDescContent, StorageBodyContent>{
    constructor(){
        super(CoreObjectType.Storage);
    }
}


export class Storage extends NamedObject<StorageDescContent, StorageBodyContent>{
    static create(id: string, value:  Uint8Array): Storage{
        const desc_content = new StorageDescContent(id);
        const body_content = new StorageBodyContent(value);
        const self = new StorageBuilder(desc_content, body_content).build();
        return new Storage(self.desc(), self.body(), self.signs(), self.nonce());
    }

    id():string{
        return this.desc().content().id();
    }

    value():Uint8Array{
        return  this.body_expect().content().value();
    }

    storage_id(){
        return new StorageId(this.desc().calculate_id());
    }
}

export class StorageDecoder extends NamedObjectDecoder<StorageDescContent, StorageBodyContent, Storage>{
    constructor(){
        super(new StorageDescContentDecoder(), new StorageBodyContentDecoder(), Storage);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[Storage, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new Storage(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [Storage, Uint8Array];
        });
    }
}