import { BuckyResult, Err, BuckyError, BuckyErrorCode, Ok, } from "../base/results";
import { RawDecode, RawHexDecode, } from "../base/raw_encode";
import {
    NamedObjectContextDecoder,
} from "./object";
import { Action, ActionDecoder } from "./action";
import { AppGroup, AppGroupDecoder } from "./app_group";
import { Contract, ContractDecoder } from "./contract";
import { Device, DeviceDecoder } from "./device";
import { File, FileDecoder } from "./file";
import { Org, OrgDecoder } from "./org";
import { People, PeopleDecoder } from "./people";
import { SimpleGroup, SimpleGroupDecoder } from "./simple_group";
import { UnionAccount, UnionAccountDecoder } from "./union_account";
import { ChunkId, ChunkIdDecoder } from "./chunk";
import { TypelessCoreObject, TypelessCoreObjectDecoder, TypelessDECAppObject, TypelessDECAppObjectDecoder, TypelessStandardObject, TypelessStandardObjectDecoder } from "./object_typeless";
import { ObjectTypeCode } from "./object_type_info";
import { Dir, DirDecoder } from "./dir";
import { base_trace } from "../base/log";
import { ObjectMap, ObjectMapDecoder } from './object_map';

export type StandardObject =
    Device |
    People |
    SimpleGroup |
    Org |
    AppGroup |
    UnionAccount |
    ChunkId |
    Dir |
    File |
    Action |
    ObjectMap |
    Contract |
    TypelessStandardObject;

export type CoreObject = TypelessCoreObject;
export type DECAppObject = TypelessDECAppObject;

export type AnyNamedObject =
    StandardObject |
    CoreObject |
    DECAppObject;

export interface AnyNamedObjectVisitor<T> {
    Standard?: (obj: StandardObject) => T;
    Core?: (obj: CoreObject) => T;
    DECApp?: (obj: DECAppObject) => T;
}

export interface StandardObjectVisitor<T> {
    Device?: (obj: Device) => T;
    People?: (obj: People) => T;
    SimpleGroup?: (obj: SimpleGroup) => T;
    Org?: (obj: Org) => T;
    AppGroup?: (obj: AppGroup) => T;
    UnionAccount?: (obj: UnionAccount) => T;
    ChunkId?: (obj: ChunkId) => T;
    File?: (obj: File) => T;
    Dir?: (obj: Dir) => T;
    Action?: (obj: Action) => T;
    ObjectMap?: (obj: ObjectMap) => T;
    Contract?: (obj: Contract) => T;
    Tx?: (obj: TypelessStandardObject) => T;
    Diff?: (obj: TypelessStandardObject) => T;
}

export function match_any_obj<T>(a: AnyNamedObject, visitor: AnyNamedObjectVisitor<T>): T | undefined {
    const desc = a.desc();
    if (desc.is_standard_object()) {
        return visitor.Standard?.(a as StandardObject);
    } else if (desc.is_core_object()) {
        return visitor.Core?.(a as CoreObject);
    } else if (desc.is_dec_app_object()) {
        return visitor.DECApp?.(a as DECAppObject);
    } else {
        // throw new Error("invaid any named object");
        return undefined;
    }
}

export function match_standard_obj<T>(s: StandardObject, visitor: StandardObjectVisitor<T>): T | undefined {
    switch (s.desc().obj_type()) {
        case ObjectTypeCode.Device: {
            return visitor.Device?.(s as Device);
        }
        case ObjectTypeCode.People: {
            return visitor.People?.(s as People);
        }
        case ObjectTypeCode.SimpleGroup: {
            return visitor.SimpleGroup?.(s as SimpleGroup);
        }
        case ObjectTypeCode.Org: {
            return visitor.Org?.(s as Org);
        }
        case ObjectTypeCode.AppGroup: {
            return visitor.AppGroup?.(s as AppGroup);
        }
        case ObjectTypeCode.UnionAccount: {
            return visitor.UnionAccount?.(s as UnionAccount);
        }
        case ObjectTypeCode.Chunk: {
            return visitor.ChunkId?.(s as ChunkId);
        }
        case ObjectTypeCode.File: {
            return visitor.File?.(s as File);
        }
        case ObjectTypeCode.Dir: {
            return visitor.Dir?.(s as Dir);
        }
        case ObjectTypeCode.Action: {
            return visitor.Action?.(s as Action);
        }
        case ObjectTypeCode.ObjectMap: {
            return visitor.ObjectMap?.(s as ObjectMap);
        }
        case ObjectTypeCode.Contract: {
            return visitor.Contract?.(s as Contract);
        }
        case ObjectTypeCode.Tx: {
            return visitor.Tx?.(s as TypelessStandardObject);
        }
        case ObjectTypeCode.Diff: {
            return visitor.Diff?.(s as TypelessStandardObject);
        }
        default: {
            throw new Error(`invalid standard object type ${s.desc().obj_type()}`);
        }
    }
}

export class StandardObjectDecoder implements RawDecode<StandardObject> {
    constructor() {
        //
    }

    raw_decode(buf: Uint8Array): BuckyResult<[StandardObject, Uint8Array]> {
        // Context
        let ctx;
        {
            const r = new NamedObjectContextDecoder().raw_decode(buf);
            if (r.err) {
                console.error("StandardObject::raw_decode/NamedObjectContext error:", r.val);
                return r;
            };
            let _buf;
            [ctx, _buf] = r.unwrap();
        }

        // decode concrete standard object
        switch (ctx.obj_type_code) {
            case ObjectTypeCode.Device: {
                const r = new DeviceDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/Device error:", r.val);
                    return r;
                };
                return r;
            }
            case ObjectTypeCode.People: {
                const r = new PeopleDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/People error:", r.val);
                    return r;
                };
                return r;
            }
            case ObjectTypeCode.SimpleGroup: {
                const r = new SimpleGroupDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/SimpleGroup error:", r.val);
                    return r;
                };
                return r;
            }
            case ObjectTypeCode.Org: {
                const r = new OrgDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/Org error:", r.val);
                    return r;
                };
                return r;
            }
            case ObjectTypeCode.AppGroup: {
                const r = new AppGroupDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/AppGroup error:", r.val);
                    return r;
                };
                return r;
            }
            case ObjectTypeCode.UnionAccount: {
                const r = new UnionAccountDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/UnionAccount error:", r.val);
                    return r;
                };
                return r;
            }
            case ObjectTypeCode.Chunk: {
                const r = new ChunkIdDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/Chunk error:", r.val);
                    return r;
                };
                return r;
            }
            case ObjectTypeCode.File: {
                const r = new FileDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/File error:", r.val);
                    return r;
                };
                return r;
            }

            case ObjectTypeCode.Dir: {
                const r = new DirDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/Dir error:", r.val);
                    return r;
                };
                return r;
            }

            // case ObjectTypeCode.Diff:{
            //     const r = new DiffDecoder().raw_decode(buf);
            //     if(r.err){
            //         console.error("StandardObject::raw_decode/Diff error:", r.val);
            //         return r;
            //     };
            //     return r;
            // }
            // case ObjectTypeCode.ProofOfService:{
            //     const r = new ProofOfServiceDecoder().raw_decode(buf);
            //     if(r.err){
            //         console.error("StandardObject::raw_decode/ProofOfService error:", r.val);
            //         return r;
            //     };
            //     return r;
            // }
            // case ObjectTypeCode.Tx:{
            //     const r = new TxDecoder().raw_decode(buf);
            //     if(r.err){
            //         console.error("StandardObject::raw_decode/Tx error:", r.val);
            //         return r;
            //     };
            //     return r;
            // }

            case ObjectTypeCode.Action: {
                const r = new ActionDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/Action error:", r.val);
                    return r;
                };
                return r;
            }
            case ObjectTypeCode.ObjectMap: {
                const r = new ObjectMapDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/ObjectMap error:", r.val);
                    return r;
                };
                return r;
            }
            case ObjectTypeCode.Contract: {
                const r = new ContractDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/Contract error:", r.val);
                    return r;
                };
                return r;
            }
            case ObjectTypeCode.Tx: {
                const r = new TypelessStandardObjectDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/Tx as typeless object error:", r.val);
                    return r;
                }
                return r;
            }
            case ObjectTypeCode.Diff: {
                const r = new TypelessStandardObjectDecoder().raw_decode(buf);
                if (r.err) {
                    console.error("StandardObject::raw_decode/Diff as typeless object error:", r.val);
                    return r;
                }
                return r;
            }

            default: {
                const err_msg = `unsupport standard object type ${ctx.obj_type_code}`;
                console.error(err_msg)
                return Err(new BuckyError(BuckyErrorCode.UnSupport, err_msg));
            }
        }
    }
}

export class AnyNamedObjectDecoder extends RawHexDecode<AnyNamedObject> {
    constructor() {
        super();
    }

    raw_decode(buf: Uint8Array): BuckyResult<[AnyNamedObject, Uint8Array]> {
        // Context
        let ctx;
        {
            const r = new NamedObjectContextDecoder().raw_decode(buf);
            if (r.err) {
                console.error("StandardObject::raw_decode/NamedObjectContext error:", r.val);
                return r;
            }
            const [_ctx, _buf] = r.unwrap();
            ctx = _ctx;
        }

        if (ctx.is_standard_object()) {
            return new StandardObjectDecoder().raw_decode(buf);
        } else if (ctx.is_core_object()) {
            return new TypelessCoreObjectDecoder().raw_decode(buf);
        } else if (ctx.is_dec_app_object()) {
            base_trace("TypelessDECAppObjectDecoder:", buf);
            return new TypelessDECAppObjectDecoder().raw_decode(buf);
        } else {
            return Err(new BuckyError(BuckyErrorCode.InvalidData, `invalid any nameobject obj type:${ctx.obj_type}`));
        }
    }

    from_raw(buf: Uint8Array): BuckyResult<AnyNamedObject> {
        const ret = this.raw_decode(buf);
        if (ret.err) {
            return ret;
        }

        return Ok(ret.unwrap()[0]);
    }
}