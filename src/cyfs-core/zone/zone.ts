import { BuckyError, BuckyErrorCode, BuckyResult, DeviceId, DeviceIdDecoder, Err, ObjectId, Ok, Vec, VecDecoder } from "../../cyfs-base";
import { BodyContent, BodyContentDecoder, DescContent, DescContentDecoder, DescTypeInfo, NamedObject, NamedObjectBuilder, NamedObjectDecoder, NamedObjectDesc, NamedObjectDescDecoder, NamedObjectId, NamedObjectIdDecoder, named_id_from_base_58, named_id_gen_default, named_id_try_from_object_id, SubDescType } from "../../cyfs-base/objects/object";

import { CoreObjectType } from "../core_obj_type";

export class ZoneDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return CoreObjectType.Zone;
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

const ZONE_DESC_TYPE_INFO = new ZoneDescTypeInfo();

export class ZoneDescContent extends DescContent {
    private readonly m_ood: DeviceId;

    constructor(ood: DeviceId){
        super();
        this.m_ood = ood;
    }

    type_info(): DescTypeInfo{
        return ZONE_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return this.m_ood.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        const r = this.m_ood.raw_encode(buf);
        if(r.err){
            console.error("DeviceDescContent::raw_encode error:{}", r.err);
            return r;
        }
        buf = r.unwrap();

        return Ok(buf);
    }

    ood():DeviceId{
        return this.m_ood;
    }
}

export class ZoneDescContentDecoder extends DescContentDecoder<ZoneDescContent>{
    type_info(): DescTypeInfo{
        return ZONE_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[ZoneDescContent, Uint8Array]>{
        let ood;
        {
            const r = new DeviceIdDecoder().raw_decode(buf);
            if(r.err){
                console.error("DeviceDescContent::raw_decode error:{}", r.err);
                return r;
            }
            [ood, buf] = r.unwrap();
        }

        const self = new ZoneDescContent(ood);
        const ret:[ZoneDescContent, Uint8Array] = [self, buf];
        return Ok(ret);
    }
}

export class ZoneBodyContent extends BodyContent{
    private readonly m_known_device_list: Vec<DeviceId>;

    constructor(known_device_list: Vec<DeviceId>){
        super();
        this.m_known_device_list = known_device_list;
    }

    known_device_list(): DeviceId[]{
        return this.m_known_device_list.value();
    }

    raw_measure(): BuckyResult<number>{
        return this.m_known_device_list.raw_measure();
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        return this.m_known_device_list.raw_encode(buf);
    }
}

export class ZoneBodyContentDecoder extends BodyContentDecoder<ZoneBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[ZoneBodyContent, Uint8Array]>{
        let known_device_list: Vec<DeviceId>;
        {
            const r = new VecDecoder(new DeviceIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [known_device_list, buf] = r.unwrap();
        }

        const zone_body_content = new ZoneBodyContent(known_device_list);

        const ret:[ZoneBodyContent, Uint8Array] = [zone_body_content, buf];

        return Ok(ret);
    }
}

export class ZoneDesc extends NamedObjectDesc<ZoneDescContent>{
    // ignore
}

export  class ZoneDescDecoder extends NamedObjectDescDecoder<ZoneDescContent>{
    // ignore
}

export class ZoneBuilder extends NamedObjectBuilder<ZoneDescContent, ZoneBodyContent>{
    // ignore
}

export class ZoneId extends NamedObjectId<ZoneDescContent, ZoneBodyContent>{
    constructor(id: ObjectId){
        super(CoreObjectType.Zone, id);
    }

    static default(): DeviceId{
        return named_id_gen_default(CoreObjectType.Zone);
    }

    static from_base_58(s: string): BuckyResult<DeviceId> {
        return named_id_from_base_58(CoreObjectType.Zone, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DeviceId>{
        return named_id_try_from_object_id(CoreObjectType.Zone, id);
    }
}

export class ZoneIdDecoder extends NamedObjectIdDecoder<ZoneDescContent, ZoneBodyContent>{
    constructor(){
        super(CoreObjectType.Zone);
    }
}


export class Zone extends NamedObject<ZoneDescContent, ZoneBodyContent>{
    static create(ood: DeviceId, known_device_list: Vec<DeviceId>): Zone {
        const desc_content = new ZoneDescContent(ood);
        const body_content = new ZoneBodyContent(known_device_list);
        const self = new ZoneBuilder(desc_content, body_content).build();
        return new Zone(self.desc(), self.body(), self.signs(), self.nonce())
    }

    ood():DeviceId{
        return this.desc().content().ood();
    }

    known_device_list(): DeviceId[]{
        return this.body_expect().content().known_device_list();
    }

    device_index(device_id: DeviceId): BuckyResult<Number>{
        const index = this.known_device_list().indexOf(device_id);
        if(index>=0){
            return Ok(index);
        }else{
            return Err(
                new BuckyError(
                    BuckyErrorCode.NotFound, 
                    `can not found device index, device_id:${device_id.to_base_58()}`
                )
            );
        }
    }

    zone_id(): ZoneId{
        return new ZoneId(this.desc().calculate_id());
    }
}

export class ZoneDecoder extends NamedObjectDecoder<ZoneDescContent, ZoneBodyContent,Zone>{
    constructor(){
        super(new ZoneDescContentDecoder(), new ZoneBodyContentDecoder(),Zone);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[Zone, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new Zone(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [Zone, Uint8Array];
        });
    }
}