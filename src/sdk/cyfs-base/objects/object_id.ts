import { Ok, BuckyResult } from "../base/results";
import { OptionDecoder, OptionEncoder } from "../base/option";
import { RawEncode, RawDecode, Compareable } from "../base/raw_encode";
import { } from "../base/buffer";
import { HashValue } from "../crypto/hash";
import { Area } from "./area";
import { ObjectTypeCode, obj_type_code_raw_check } from "./object_type_info";
import * as basex from "../base/basex";


export enum ObjectCategory {
    Standard = "standard",
    Core = "core",
    DecApp = "dec_app",
    Data = "data"
}

export const OBJECT_ID_LEN = 32;

export const OBJECT_ID_DATA = 0;
export const OBJECT_ID_STANDARD = 1;
export const OBJECT_ID_CORE = 2;
export const OBJECT_ID_DEC_APP = 3;

export const OBJECT_ID_FLAG_AREA = 1 << 3;
export const OBJECT_ID_FLAG_PK = 1 << 2;
export const OBJECT_ID_FLAG_MN_PK = 1 << 1;
export const OBJECT_ID_FLAG_OWNER = 1;

export interface ObjectIdInfoPartten<T> {
    StandardObjectIdInfo: (info: StandardObjectIdInfo) => T;
    CoreObjectIdInfo: (info: CoreObjectIdInfo) => T;
    DecAppObjectIdInfo: (info: DecAppObjectIdInfo) => T;
    DataObjectidInfo: (data: Uint8Array) => T;
}

export interface ObjectIdInfoMatcher {
    match<T>(p: ObjectIdInfoPartten<T>): T;
}

export class StandardObjectIdInfo implements ObjectIdInfoMatcher {
    obj_type_code: ObjectTypeCode;
    obj_type: number;
    area?: Area;

    constructor(obj_type_code: ObjectTypeCode, obj_type: number, area?: Area) {
        this.obj_type_code = obj_type_code;
        this.obj_type = obj_type;
        this.area = area;
    }

    match<T>(p: ObjectIdInfoPartten<T>): T {
        return p.StandardObjectIdInfo(this);
    }
}

export class CoreObjectIdInfo implements ObjectIdInfoMatcher {
    area?: Area;
    has_owner: boolean;
    has_single_key: boolean;
    has_mn_key: boolean;

    constructor(area: Area|undefined, has_owner: boolean, has_single_key: boolean, has_mn_key: boolean) {
        this.area = area;
        this.has_owner = has_owner;
        this.has_single_key = has_single_key;
        this.has_mn_key = has_mn_key;
    }

    match<T>(p: ObjectIdInfoPartten<T>): T {
        return p.CoreObjectIdInfo(this);
    }
}

export class DecAppObjectIdInfo implements ObjectIdInfoMatcher {
    area?: Area;
    has_owner: boolean;
    has_single_key: boolean;
    has_mn_key: boolean;

    constructor(area: Area|undefined, has_owner: boolean, has_single_key: boolean, has_mn_key: boolean) {
        this.area = area;
        this.has_owner = has_owner;
        this.has_single_key = has_single_key;
        this.has_mn_key = has_mn_key;
    }

    match<T>(p: ObjectIdInfoPartten<T>): T {
        return p.DecAppObjectIdInfo(this);
    }
}

export class DataObjectIdInfo implements ObjectIdInfoMatcher {
    constructor(private buf: Uint8Array) {}

    match<T>(p: ObjectIdInfoPartten<T>): T {
        return p.DataObjectidInfo(this.buf);
    }
}

export type ObjectIdInfo = (StandardObjectIdInfo | CoreObjectIdInfo | DecAppObjectIdInfo | DataObjectIdInfo) & ObjectIdInfoMatcher;

export class ObjectId implements RawEncode, Compareable<ObjectId> {
    m_buf: Uint8Array;
    m_base58?: string;

    constructor(buf: Uint8Array) {
        this.m_buf = buf;
    }

    get object_id() {
        throw new Error(`.object_id not support on ObjectId!`);
    }

    static default(): ObjectId {
        return new ObjectId(new Uint8Array(OBJECT_ID_LEN));
    }

    static copy_from_slice(buf: Uint8Array): ObjectId {
        return new ObjectId(buf.slice(0, OBJECT_ID_LEN));
    }

    static from_data(buf: Uint8Array): BuckyResult<ObjectId> {
        const len = buf.byteLength;
        if (len > OBJECT_ID_LEN-1) {
            const msg = `invalid object id data len! len=${len}, max=${OBJECT_ID_LEN-1}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.OutOfLimit, msg))
        }

        const inner_buf = new Uint8Array(OBJECT_ID_LEN);
        inner_buf[0] = len
        inner_buf.set(buf, 1);
        return Ok(new ObjectId(inner_buf))
    }

    static from_string_as_data(data: string): BuckyResult<ObjectId> {
        return ObjectId.from_data(new TextEncoder().encode(data))
    }

    obj_type_code(): ObjectTypeCode {
        return obj_type_code_raw_check(this.as_slice());
    }

    raw_measure(): BuckyResult<number> {
        return Ok(OBJECT_ID_LEN);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        buf.set(this.as_slice());
        return Ok(buf.offset(this.as_slice().length));
    }

    as_slice(): Uint8Array {
        return this.m_buf;
    }

    clone(): ObjectId {
        return ObjectId.copy_from_slice(this.m_buf);
    }

    length(): number {
        return OBJECT_ID_LEN;
    }

    toString(): string {
        return this.to_base_58();
    }

    toJSON(): string {
        return this.to_base_58();
    }

    to_string(): string {
        return this.to_base_58();
    }

    to_base_58(): string {
        return basex.to_base_58(this.as_slice());
    }

    to_base_36(): string {
        return basex.to_base_36(this.as_slice());
    }
    

    hashCode(): symbol {
        return Symbol.for(this.to_base_58());
    }

    equals(other: ObjectId): boolean {
        return this.to_base_58() === other.to_base_58();
    }

    eq(other: ObjectId): boolean {
        return this.to_base_58() === other.to_base_58();
    }

    static from_str(s: string): BuckyResult<ObjectId> {
        const r = basex.from_base_str(s);
        if (r.err) {
            return r;
        }

        return Ok(new ObjectId(r.unwrap()))
    }

    static from_base_58(s: string): BuckyResult<ObjectId> {
        const r = basex.from_base_58(s, OBJECT_ID_LEN);
        if (r.err) {
            return r;
        }

        return Ok(new ObjectId(r.unwrap()))
    }

    static from_base_36(s: string): BuckyResult<ObjectId> {
        const r = basex.from_base_36(s, OBJECT_ID_LEN);
        if (r.err) {
            return r;
        }

        return Ok(new ObjectId(r.unwrap()))
    }

    to_hash_value(): HashValue {
        return new HashValue(this.as_slice());
    }

    object_category(): ObjectCategory {
        if (this.is_standard_object()) {
            return ObjectCategory.Standard;
        } else if (this.is_core_object()) {
            return ObjectCategory.Core;
        } else if (this.is_dec_app_object()) {
            return ObjectCategory.DecApp;
        } else {
            return ObjectCategory.Data;
        }
    }

    is_standard_object(): boolean {
        const buf = this.as_slice();
        const flag = buf[0];
        return flag >> 6 === OBJECT_ID_STANDARD;
    }

    is_core_object(): boolean {
        const buf = this.as_slice();
        const flag = buf[0];
        return flag >> 6 === OBJECT_ID_CORE;
    }

    is_dec_app_object(): boolean {
        const buf = this.as_slice();
        const flag = buf[0];
        return flag >> 6 === OBJECT_ID_DEC_APP;
    }

    is_data(): boolean {
        const buf = this.as_slice();
        const flag = buf[0];
        return flag >> 6 === OBJECT_ID_DATA;
    }

    data_len(): number {
        return this.as_slice()[0] & 0b00111111;
    }

    data(): Uint8Array {
        const len = this.data_len();
        return this.as_slice().subarray(1, 1+len)
    }

    data_as_string(): string {
        return new TextDecoder().decode(this.data())
    }

    info(): ObjectIdInfo {
        const buf = this.as_slice();
        const flag = buf[0];
        if (flag >> 6 == 0) {
            const data_len = flag & 0b00111111;
            return new DataObjectIdInfo(this.as_slice().subarray(1, 1+data_len));
        }

        const decode_flag = (buffer: Uint8Array): [boolean, boolean, boolean, boolean] => {
            const type_code = buffer[0] << 2 >> 4;
            const has_area = (type_code & OBJECT_ID_FLAG_AREA) === OBJECT_ID_FLAG_AREA;
            const has_single_key = (type_code & OBJECT_ID_FLAG_PK) === OBJECT_ID_FLAG_PK;
            const has_mn_key = (type_code & OBJECT_ID_FLAG_MN_PK) === OBJECT_ID_FLAG_MN_PK;
            const has_owner = (type_code & OBJECT_ID_FLAG_OWNER) === OBJECT_ID_FLAG_OWNER;
            return [has_area, has_single_key, has_mn_key, has_owner];
        };

        const decode_area = (buffer: Uint8Array): Area => {
            // --------------------------------------------
            // (2bit)(4bit)(国家编码8bits)+(运营商编码4bits)+城市编码(14bits)+inner(8bits) = 34 bit
            // --------------------------------------------
            // 0 obj_bits[. .]type_code[. . . .] country[. .]
            // 1 country[. . . . . .]carrier[x x x x . .]
            // 2 carrier[. .]city[0][x x . . . . . . ]
            // 3 city[1][. . . . . . . . ]
            // 4 inner[. . . . . . . . ]

            const country = (buffer[0] << 6) | (buf[1] >> 2);
            const carrier = (buffer[1] << 6 >> 4) | (buf[2] >> 6);

            //   * buffer[2]
            //     mmxxxxxx
            //     xxxxxx
            //     00xxxxxx
            // + * buffer[3]
            //             yyyyyyyy
            // -----------------
            //     00xxxxxxyyyyyyyy
            //
            // mmxxxxxxyyyyyyyy => 00xxxxxxyyyyyyyy
            //
            const x = new Uint8Array([buffer[3], buffer[2]]);
            const y = new Uint16Array(x.buffer);
            const city = (y[0] & parseInt("11111111111111", 2));
            const inner = buffer[4];

            return new Area(
                country,
                carrier,
                city,
                inner
            );
        };

        const try_decode_area = (buffer: Uint8Array): Area|undefined => {
            if (buffer[1] === 0 &&
                buffer[2] === 0 &&
                buffer[3] === 0 &&
                buffer[4] === 0
            ) {
                return undefined;
            } else {
                return decode_area(buffer);
            }
        };

        const obj_bits = flag >> 6;

        switch (obj_bits) {
            case OBJECT_ID_STANDARD: {
                // 标准对象 (flag<<2>>4)
                const obj_type = ((flag & 63) >> 2) as number;
                const obj_type_code = obj_type;
                const area = try_decode_area(buf);

                return new StandardObjectIdInfo(
                    obj_type_code,
                    obj_type,
                    area
                );
            }
            case OBJECT_ID_CORE: {
                // 核心对象
                const [has_area, has_single_key, has_mn_key, has_owner] = decode_flag(buf);

                let area = undefined;
                if (has_area) {
                    area = decode_area(buf)
                }

                return new CoreObjectIdInfo(
                    area,
                    has_single_key,
                    has_mn_key,
                    has_owner,
                );
            }
            case OBJECT_ID_DEC_APP: {
                // Dec App 对象
                const [has_area, has_single_key, has_mn_key, has_owner] = decode_flag(buf);
                let area = undefined;
                if (has_area) {
                    area = decode_area(buf)
                }

                return new DecAppObjectIdInfo(
                    area,
                    has_single_key,
                    has_mn_key,
                    has_owner,
                );
            }
            default: {
                throw Error("should not come here");
            }
        }
    }
}

export class ObjectIdDecoder implements RawDecode<ObjectId>{
    raw_decode(buf: Uint8Array): BuckyResult<[ObjectId, Uint8Array]> {
        const id_buf = buf.slice(0, OBJECT_ID_LEN);
        buf = buf.offset(OBJECT_ID_LEN);
        const ret: [ObjectId, Uint8Array] = [new ObjectId(id_buf), buf];
        return Ok(ret);
    }
}

export class ObjectLink implements RawEncode {
    private m_obj_id: ObjectId;
    private m_obj_owner?: ObjectId;

    get obj_id(): ObjectId {
        return this.m_obj_id;
    }

    get obj_owner(): ObjectId|undefined {
        return this.m_obj_owner;
    }

    constructor(obj_id: ObjectId, obj_owner?: ObjectId) {
        this.m_obj_id = obj_id;
        this.m_obj_owner = obj_owner;
    }

    raw_measure(): BuckyResult<number> {
        let bytes = 0;

        bytes += this.m_obj_id!.raw_measure().unwrap();
        bytes += OptionEncoder.from(this.m_obj_owner).raw_measure().unwrap();

        return Ok(bytes);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        let ret = this.m_obj_id!.raw_encode(buf);
        if (ret.err) {
            return ret;
        }
        buf = ret.unwrap();

        ret = OptionEncoder.from(this.m_obj_owner).raw_encode(buf);
        if (ret.err) {
            return ret;
        }
        buf = ret.unwrap();

        return Ok(buf);
    }
}

export class ObjectLinkDecoder implements RawDecode<ObjectLink>{
    raw_decode(buf: Uint8Array): BuckyResult<[ObjectLink, Uint8Array]> {
        let obj_id: ObjectId;
        {
            const result = new ObjectIdDecoder().raw_decode(buf);
            if (result.err) {
                return result;
            }
            [obj_id, buf] = result.unwrap();
        }

        let obj_owner;
        {
            // 复合解码器
            const obj_owner_codec = new OptionDecoder<ObjectId>(new ObjectIdDecoder());
            const result = obj_owner_codec.raw_decode(buf);
            if (result.err) {
                return result;
            }
            [obj_owner, buf] = result.unwrap();
        }

        const link = new ObjectLink(obj_id, obj_owner.value());
        const ret: [ObjectLink, Uint8Array] = [link, buf];

        return Ok(ret);
    }
}

// 测试用例
function test() {
    const id = ObjectId.default();
    const info = id.info();
    info.match({
        StandardObjectIdInfo: (_info): void => {
            //
        },
        CoreObjectIdInfo: (_info): void => {
            //
        },
        DecAppObjectIdInfo: (_info): void => {
            //
        },
        DataObjectidInfo(data) {
            //
        },
    });
}