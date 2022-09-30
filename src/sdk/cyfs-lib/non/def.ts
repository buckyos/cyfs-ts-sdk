import JSBI from "jsbi";
import { AnyNamedObject, AnyNamedObjectDecoder, BuckyError, BuckyErrorCode, BuckyResult, Err, ObjectId, Ok, Option } from "../../cyfs-base";
import { JsonCodec, JsonCodecHelper } from "../base/codec";

export enum NONDataType {
    // 请求一个object
    Object = 0,

    // 请求对应的数据
    Data = 1,
}

export enum NONAction {
    // non
    PutObject = "put-object",
    GetObject = "get-object",
    PostObject = "post-object",
    DeleteObject = "delete-object",
}

export enum NONAPILevel {
    NOC = "noc",
    NON = "non",
    Router = "router",
}

export enum NONPutObjectResult {
    Accept = "Accept",
    AcceptWithSign = "AcceptWithSign",
    AlreadyExists = "AlreadyExists",
    Updated = "Updated",
    Merged = "Merged",
}

export class NONObjectInfo {
    // object可选，用以内部直接使用
    constructor(public object_id: ObjectId, public object_raw: Uint8Array, public object?: AnyNamedObject) {}

    static new_from_object_raw(object_raw: Uint8Array): BuckyResult<NONObjectInfo> {
        const r = new AnyNamedObjectDecoder().raw_decode(object_raw);
        if (r.err) {
            return r;
        }
        const obj = r.unwrap()[0];
        return Ok(new NONObjectInfo(obj.desc().calculate_id(), object_raw, obj));
    }

    decode(): BuckyResult<null> {
        const r = new AnyNamedObjectDecoder().raw_decode(this.object_raw);
        if (r.err) {
            console.error(`decode object from object_raw error: obj=${this.object_id.to_base_58()} ${r.val}`);
            return r;
        }

        this.object = r.unwrap()[0];
        return Ok(null)
    }

    try_decode(): BuckyResult<null> {
        if (this.object === undefined) {
            return this.decode();
        } else {
            return Ok(null);
        }
    }

    get_update_time(): BuckyResult<JSBI> {
        const r = this.try_decode();
        if (r.err) {
            return r;
        }

        const body = this.object!.body();
        const t = body.is_some()?body.unwrap().update_time():JSBI.BigInt(0);
        if (JSBI.greaterThan(t, JSBI.BigInt(0))) {
            console.debug(`object update time: ${this.object_id.to_base_58()}, ${t.toString}`);
        }

        return Ok(t);
    }

    get_expired_time(): BuckyResult<Option<JSBI>> {
        const r = this.try_decode();
        if (r.err) {
            return r;
        }

        const t = this.object!.desc().expired_time();
        if (t.is_some()) {
            console.debug(`object expired time: ${this.object_id.to_base_58()}, ${t.unwrap().toString()}`)
        }

        return Ok(t);
    }

    verify(): BuckyResult<null> {
        const r = this.try_decode();
        if (r.err) {
            return r;
        }
        const calc_id = this.object!.desc().calculate_id();
        
        // 校验id
        if (!calc_id.equals(this.object_id)) {
            
            const msg = `unmatch object id: ${this.object_id.to_base_58()}, calc=${calc_id.to_base_58()}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.Unmatch, msg));
        }

        return Ok(null);
    }

    decode_and_verify(): BuckyResult<null> {
        const r = this.decode();
        if (r.err) {
            return r;
        }
        return this.verify()
    }

    is_empty(): boolean {
        return this.object_raw.length === 0
    }
}

export class NONObjectInfoJsonCodec extends JsonCodec<NONObjectInfo> {
    constructor(){super();}

    encode_object(param: NONObjectInfo): any {
        return {
            object_raw: param.object_raw.toHex(),
            object_id: param.object_id.to_base_58()
        }
    }

    decode_object(o: any): BuckyResult<NONObjectInfo> {
        const raw = JsonCodecHelper.decode_hex_to_buffer(o.object_raw);
        if (raw.err) {
            return raw;
        }

        const id = ObjectId.from_base_58(o.object_id);
        if (id.err) {
            return id;
        }

        const info = new NONObjectInfo(id.unwrap(), raw.unwrap());
        const r = info.decode_and_verify();
        if (r.err) {
            return r;
        }

        return Ok(info);
    }
}

export class NONSlimObjectInfo {
    // object可选，用以内部直接使用
    constructor(public object_id: ObjectId, public object_raw?: Uint8Array, public object?: AnyNamedObject) {}

    decode(): BuckyResult<null> {
        if (this.object_raw) {
            const r = new AnyNamedObjectDecoder().raw_decode(this.object_raw);
            if (r.err) {
                console.error(`decode object from object_raw error: obj=${this.object_id.to_base_58()} ${r.val}`);
                return r;
            }

            this.object = r.unwrap()[0];
        }
        
        return Ok(null)
    }

    verify(): BuckyResult<null> {
        let calc_id;
        if (this.object) {
            calc_id = this.object.calculate_id();
        } else if (this.object_raw) {
            const r = new AnyNamedObjectDecoder().from_raw(this.object_raw);
            if (r.err) {
                return r;
            }
            calc_id = r.unwrap().calculate_id();
        } else {
            return Ok(null);
        }
        
        // 校验id
        if (!calc_id.equals(this.object_id)) {
            
            const msg = `unmatch object id: ${this.object_id.to_base_58()}, calc=${calc_id.to_base_58()}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.Unmatch, msg));
        }

        return Ok(null);
    }

    decode_and_verify(): BuckyResult<null> {
        if (this.object_raw && !this.object) {
            const r = this.decode();
            if (r.err) {
                return r;
            }
        }

        return this.verify()
    }
}

export class NONSlimObjectInfoJsonCodec extends JsonCodec<NONSlimObjectInfo> {
    constructor(){super();}

    encode_object(param: NONSlimObjectInfo): any {
        const ret: any = {object_id: param.object_id.to_base_58()};
        if (param.object_raw) {
            ret.object_raw = param.object_raw.toHex();
        } else if (param.object) {
            ret.object_raw = param.object.encode_to_buf().unwrap().toHex()
        }
        return ret;
    }

    decode_object(o: any): BuckyResult<NONSlimObjectInfo> {
        let raw;
        if (o.object_raw) {
            const r = JsonCodecHelper.decode_hex_to_buffer(o.object_raw);
            if (r.err) {
                return r;
            }
            raw = r.unwrap();
        }
        

        const id = ObjectId.from_base_58(o.object_id);
        if (id.err) {
            return id;
        }

        const info = new NONSlimObjectInfo(id.unwrap(), raw);
        const r = info.decode_and_verify();
        if (r.err) {
            return r;
        }

        return Ok(info);
    }
}