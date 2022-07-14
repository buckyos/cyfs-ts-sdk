import {
    OpEnvSetResponse,
    ObjectMapOpEnvType,
    RootStateRootType,
    ObjectMapContentMode,
    OpEnvCommitOpType,
} from "./def";
import {
    ObjectId,
    BuckyResult,
    Ok,
    Err,
    BuckyError,
    BuckyErrorCode,
    ObjectMapSimpleContentType,
} from "../../cyfs-base";
import { JsonCodec, JsonCodecHelper } from "../base/codec";
import { NONGetObjectOutputResponse } from "../non/output_request";

import JSBI from "jsbi";

export interface RootStateOutputRequestCommon {
    // 来源DEC
    dec_id?: ObjectId;

    target?: ObjectId,

    flags: number;
}

export class RootStateOutputRequestCommonJsonCodec extends JsonCodec<RootStateOutputRequestCommon> {
    constructor() {
        super();
    }

    encode_object(param: RootStateOutputRequestCommon): any {
        return {
            dec_id: param.dec_id ? param.dec_id.to_base_58() : undefined,
            target: param.target ? param.target.to_base_58() : undefined,
            flags: param.flags,
        };
    }

    decode_object(o: any): BuckyResult<RootStateOutputRequestCommon> {
        let dec_id;
        let target;
        {
            if (o.dec_id) {
                const r = ObjectId.from_base_58(o.dec_id);
                if (r.err) {
                    return r;
                }
                dec_id = r.unwrap();
            }
            if (o.target) {
                const r = ObjectId.from_base_58(o.target);
                if (r.err) {
                    return r;
                }
                target = r.unwrap();
            }
        }

        return Ok({
            dec_id,
            target,
            flags: o.flags,
        });
    }
}

// get_current_root
export interface RootStateGetCurrentRootOutputRequest {
    common: RootStateOutputRequestCommon;
    root_type: RootStateRootType;
}

export class RootStateGetCurrentRootOutputRequestJsonCodec extends JsonCodec<RootStateGetCurrentRootOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: RootStateGetCurrentRootOutputRequest): any {
        return {
            common: new RootStateOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            root_type: param.root_type,
        };
    }

    decode_object(o: any): BuckyResult<RootStateGetCurrentRootOutputRequest> {
        const common = new RootStateOutputRequestCommonJsonCodec()
            .decode_object(o.common)
            .unwrap();
        return Ok({ common, root_type: o.root_type });
    }
}

export interface RootStateGetCurrentRootOutputResponse {
    root: ObjectId;
    revision: JSBI;
    dec_root?: ObjectId;
}

export class RootStateGetCurrentRootOutputResponseJsonCodec extends JsonCodec<RootStateGetCurrentRootOutputResponse> {
    constructor() {
        super();
    }
    encode_object(param: RootStateGetCurrentRootOutputResponse): any {
        return {
            root: param.root.to_base_58(),
            revision: param.revision,
            dec_root: param.dec_root ? param.dec_root.to_base_58() : undefined,
        };
    }

    decode_object(o: any): BuckyResult<RootStateGetCurrentRootOutputResponse> {
        const root = ObjectId.from_base_58(o.root);
        if (root.err) {
            return root;
        }
        let dec_root;
        if (o.dec_root) {
            const result = ObjectId.from_base_58(o.dec_root);
            if (result.err) {
                return result;
            }
            dec_root = result.unwrap();
        }
        return Ok({
            root: root.unwrap(),
            dec_root,
            revision: JSBI.BigInt(o.revision),
        });
    }
}

// create_op_env
export interface RootStateCreateOpEnvOutputRequest {
    common: RootStateOutputRequestCommon;

    op_env_type: ObjectMapOpEnvType;
}

export class RootStateCreateOpEnvOutputRequestJsonCodec extends JsonCodec<RootStateCreateOpEnvOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: RootStateCreateOpEnvOutputRequest): any {
        return {
            common: new RootStateOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            op_env_type: param.op_env_type,
        };
    }

    decode_object(o: any): BuckyResult<RootStateCreateOpEnvOutputRequest> {
        const common = new RootStateOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }
        return Ok({ common: common.unwrap(), op_env_type: o.op_env_type });
    }
}

export interface RootStateCreateOpEnvOutputResponse {
    sid: JSBI;
}

export class RootStateCreateOpEnvOutputResponseJsonCodec extends JsonCodec<RootStateCreateOpEnvOutputResponse> {
    constructor() {
        super();
    }
    encode_object(param: RootStateCreateOpEnvOutputResponse): any {
        return { sid: param.sid };
    }

    decode_object(o: any): BuckyResult<RootStateCreateOpEnvOutputResponse> {
        return Ok({ sid: JSBI.BigInt(o.sid) });
    }
}

export interface OpEnvOutputRequestCommon {
    // 来源DEC
    dec_id?: ObjectId;

    flags: number;

    target?: ObjectId,

    // 所属session id
    sid: JSBI;
}

export class OpEnvOutputRequestCommonJsonCodec extends JsonCodec<OpEnvOutputRequestCommon> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvOutputRequestCommon): any {
        return {
            dec_id: param.dec_id ? param.dec_id.to_base_58() : undefined,
            target: param.target ? param.target.to_base_58() : undefined,
            flags: param.flags,
            sid: param.sid,
        };
    }

    decode_object(o: any): BuckyResult<OpEnvOutputRequestCommon> {
        let dec_id;
        let target;
        if (o.dec_id) {
            const result = ObjectId.from_base_58(o.dec_id);
            if (result.err) {
                return result;
            }
            dec_id = result.unwrap();
        }
        if (o.target) {
            const result = ObjectId.from_base_58(o.target);
            if (result.err) {
                return result;
            }
            target = result.unwrap();
        }

        return Ok({ dec_id, target, flags: o.flags, sid: JSBI.BigInt(o.sid) });
    }
}

export interface OpEnvNoParamOutputRequest {
    common: OpEnvOutputRequestCommon;
}

export class OpEnvNoParamOutputRequestJsonCodec extends JsonCodec<OpEnvNoParamOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvNoParamOutputRequest): any {
        return {
            common: new OpEnvOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
        };
    }

    decode_object(o: any): BuckyResult<OpEnvNoParamOutputRequest> {
        const common = new OpEnvOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        return Ok({ common: common.unwrap() });
    }
}

// load
export interface OpEnvLoadOutputRequest {
    common: OpEnvOutputRequestCommon;

    target: ObjectId;
}

export class OpEnvLoadOutputRequestJsonCodec extends JsonCodec<OpEnvLoadOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvLoadOutputRequest): any {
        return {
            common: new OpEnvOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            target: param.target.to_base_58(),
        };
    }

    decode_object(o: any): BuckyResult<OpEnvLoadOutputRequest> {
        const common = new OpEnvOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        const dec_id = ObjectId.from_base_58(o.dec_id);
        if (dec_id.err) {
            return dec_id;
        }

        return Ok({ common: common.unwrap(), target: dec_id.unwrap() });
    }
}

// load_by_path
export interface OpEnvLoadByPathOutputRequest {
    common: OpEnvOutputRequestCommon;

    path: string;
}

export class OpEnvLoadByPathOutputRequestJsonCodec extends JsonCodec<OpEnvLoadByPathOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvLoadByPathOutputRequest): any {
        return {
            common: new OpEnvOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            path: param.path,
        };
    }

    decode_object(o: any): BuckyResult<OpEnvLoadByPathOutputRequest> {
        const common = new OpEnvOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        return Ok({ common: common.unwrap(), path: o.path });
    }
}

// create_new
export interface OpEnvCreateNewOutputRequest {
    common: OpEnvOutputRequestCommon;

    path?: string;
    key?: string;
    content_type: ObjectMapSimpleContentType;
}

export class OpEnvCreateNewOutputRequestJsonCodec extends JsonCodec<OpEnvCreateNewOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvCreateNewOutputRequest): any {
        return {
            common: new OpEnvOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            content_type: param.content_type,
            path: param.path,
            key: param.key,
        };
    }

    decode_object(o: any): BuckyResult<OpEnvCreateNewOutputRequest> {
        const common = new OpEnvOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        return Ok({
            common: common.unwrap(),
            content_type: o.content_type,
            path: o.path,
            key: o.key,
        });
    }
}

// lock
export interface OpEnvLockOutputRequest {
    common: OpEnvOutputRequestCommon;

    path_list: string[];
    duration_in_millsecs: JSBI;
    try_lock: boolean,
}

export class OpEnvLockOutputRequestJsonCodec extends JsonCodec<OpEnvLockOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvLockOutputRequest): any {
        return {
            common: new OpEnvOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            duration_in_millsecs: param.duration_in_millsecs,
            path_list: param.path_list,
            try_lock: param.try_lock,
        };
    }

    decode_object(o: any): BuckyResult<OpEnvLockOutputRequest> {
        const common = new OpEnvOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        return Ok({
            common: common.unwrap(),
            duration_in_millsecs: JSBI.BigInt(o.duration_in_millsecs),
            path_list: o.path_list,
            try_lock: o.try_lock as boolean,
        });
    }
}

// commit
export interface OpEnvCommitOutputRequest {
    common: OpEnvOutputRequestCommon;
    op_type?: OpEnvCommitOpType,
}

export class OpEnvCommitOutputRequestJsonCodec extends JsonCodec<OpEnvCommitOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvCommitOutputRequest): any {
        return {
            common: new OpEnvOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            op_type: param.op_type,
        };
    }

    decode_object(o: any): BuckyResult<OpEnvCommitOutputRequest> {
        const common = new OpEnvOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        return Ok({ common: common.unwrap(), op_type: o.op_type? o.op_type as OpEnvCommitOpType : undefined });
    }
}

export interface OpEnvCommitOutputResponse {
    root: ObjectId;
    revision: JSBI;
    dec_root: ObjectId;
}

export class OpEnvCommitOutputResponseJsonCodec extends JsonCodec<OpEnvCommitOutputResponse> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvCommitOutputResponse): any {
        return {
            dec_root: param.dec_root.to_base_58(),
            revision: param.revision,
            root: param.root.to_base_58(),
        };
    }

    decode_object(o: any): BuckyResult<OpEnvCommitOutputResponse> {
        const dec_root = ObjectId.from_base_58(o.dec_root);
        if (dec_root.err) {
            return dec_root;
        }
        const root = ObjectId.from_base_58(o.dec_root);
        if (root.err) {
            return root;
        }
        return Ok({
            dec_root: dec_root.unwrap(),
            revision: JSBI.BigInt(o.revision),
            root: root.unwrap(),
        });
    }
}


// abort

export interface OpEnvAbortOutputRequest extends OpEnvNoParamOutputRequest {}
export class OpEnvAbortOutputRequestJsonCodec extends OpEnvNoParamOutputRequestJsonCodec {}


// get_current_root
export interface OpEnvGetCurrentRootOutputRequest extends OpEnvNoParamOutputRequest {}
export class OpEnvGetCurrentRootOutputRequestJsonCodec extends OpEnvNoParamOutputRequestJsonCodec {}

export interface OpEnvGetCurrentRootOutputResponse extends OpEnvCommitOutputResponse {}
export class OpEnvGetCurrentRootOutputResponseJsonCodec extends OpEnvCommitOutputResponseJsonCodec {}

// metadata
export interface OpEnvMetadataOutputRequest {
    common: OpEnvOutputRequestCommon;
    path?: string;
}

export class OpEnvMetadataOutputRequestJsonCodec extends JsonCodec<OpEnvMetadataOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvMetadataOutputRequest): any {
        return {
            common: new OpEnvOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            path: param.path,
        };
    }

    decode_object(o: any): BuckyResult<OpEnvMetadataOutputRequest> {
        const common = new OpEnvOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        return Ok({ common: common.unwrap(), path: o.path });
    }
}

export interface OpEnvMetadataOutputResponse {
    content_mode: ObjectMapContentMode;
    content_type: ObjectMapSimpleContentType;
    count: JSBI;
    size: JSBI;
    depth: number;
}

export class OpEnvMetadataOutputResponseJsonCodec extends JsonCodec<OpEnvMetadataOutputResponse> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvMetadataOutputResponse): any {
        return {
            content_mode: param.content_mode,
            content_type: param.content_type,
            count: param.count,
            size: param.size,
            depth: param.depth,
        };
    }

    decode_object(o: any): BuckyResult<OpEnvMetadataOutputResponse> {
        return Ok({
            content_mode: o.content_mode,
            content_type: o.content_type,
            count: JSBI.BigInt(o.count),
            size: JSBI.BigInt(o.size),
            depth: o.depth,
        });
    }
}

// get_by_key
export interface OpEnvGetByKeyOutputRequest {
    common: OpEnvOutputRequestCommon;

    path?: string;
    key: string;
}

export class OpEnvGetByKeyOutputRequestJsonCodec extends JsonCodec<OpEnvGetByKeyOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvGetByKeyOutputRequest): any {
        return {
            common: new OpEnvOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            path: param.path,
            key: param.key,
        };
    }

    decode_object(o: any): BuckyResult<OpEnvGetByKeyOutputRequest> {
        const common = new OpEnvOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        return Ok({ common: common.unwrap(), path: o.path, key: o.key });
    }
}

export interface OpEnvGetByKeyOutputResponse {
    value?: ObjectId;
}

export class OpEnvGetByKeyOutputResponseJsonCodec extends JsonCodec<OpEnvGetByKeyOutputResponse> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvGetByKeyOutputResponse): any {
        const value = param.value ? param.value.to_base_58() : undefined;
        return { value };
    }

    decode_object(o: any): BuckyResult<OpEnvGetByKeyOutputResponse> {
        let value;
        if (o.value) {
            const result = ObjectId.from_base_58(o.value);
            if (result.err) {
                console.log(`from_base_58 failed: ${result}`);
            }
            value = result.unwrap();
        }
        return Ok({ value });
    }
}

// insert_with_key
export interface OpEnvInsertWithKeyOutputRequest {
    common: OpEnvOutputRequestCommon;

    path?: string;
    key: string;
    value: ObjectId;
}

export class OpEnvInsertWithKeyOutputRequestJsonCodec extends JsonCodec<OpEnvInsertWithKeyOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvInsertWithKeyOutputRequest): any {
        return {
            common: new OpEnvOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            path: param.path,
            key: param.key,
            value: param.value.to_base_58(),
        };
    }

    decode_object(o: any): BuckyResult<OpEnvInsertWithKeyOutputRequest> {
        const common = new OpEnvOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        const value = ObjectId.from_base_58(o.value);
        if (value.err) {
            return value;
        }

        return Ok({
            common: common.unwrap(),
            path: o.path,
            key: o.key,
            value: value.unwrap(),
        });
    }
}

// set_with_key
export interface OpEnvSetWithKeyOutputRequest {
    common: OpEnvOutputRequestCommon;

    path?: string;
    key: string;
    value: ObjectId;
    prev_value?: ObjectId;
    auto_insert: boolean;
}

export class OpEnvSetWithKeyOutputRequestJsonCodec extends JsonCodec<OpEnvSetWithKeyOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvSetWithKeyOutputRequest): any {
        return {
            common: new OpEnvOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            path: param.path,
            key: param.key,
            prev_value: param.prev_value ? param.prev_value!.to_base_58() : undefined,
            value: param.value.to_base_58(),
            auto_insert: param.auto_insert,
        };
    }

    decode_object(o: any): BuckyResult<OpEnvSetWithKeyOutputRequest> {
        const common = new OpEnvOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        const value = ObjectId.from_base_58(o.value);
        if (value.err) {
            return value;
        }

        const prev_value = o.prev_value
            ? ObjectId.from_base_58(o.prev_value).unwrap()
            : undefined;

        return Ok({
            common: common.unwrap(),
            path: o.path,
            key: o.key,
            value: value.unwrap(),
            prev_value,
            auto_insert: o.auto_insert,
        });
    }
}

export interface OpEnvSetWithKeyOutputResponse {
    prev_value?: ObjectId;
}

export class OpEnvSetWithKeyOutputResponseJsonCodec extends JsonCodec<OpEnvSetWithKeyOutputResponse> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvSetWithKeyOutputResponse): any {
        const value = param.prev_value ? param.prev_value.to_base_58() : undefined;
        return { value };
    }

    decode_object(o: any): BuckyResult<OpEnvSetWithKeyOutputResponse> {
        let prev_value;
        if (o.prev_value) {
            const result = ObjectId.from_base_58(o.prev_value);
            if (result.err) {
                return result;
            }
            prev_value = result.unwrap();
        }
        return Ok({ prev_value });
    }
}

// remove_with_key
export interface OpEnvRemoveWithKeyOutputRequest {
    common: OpEnvOutputRequestCommon;

    path?: string;
    key: string;
    prev_value?: ObjectId;
}

export class OpEnvRemoveWithKeyOutputRequestJsonCodec extends JsonCodec<OpEnvRemoveWithKeyOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvRemoveWithKeyOutputRequest): any {
        const prev_value = param.prev_value
            ? param.prev_value.to_base_58()
            : undefined;
        return {
            common: new OpEnvOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            path: param.path,
            key: param.key,
            prev_value,
        };
    }

    decode_object(o: any): BuckyResult<OpEnvRemoveWithKeyOutputRequest> {
        const common = new OpEnvOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        let prev_value;
        if (o.prev_value) {
            const result = ObjectId.from_base_58(o.prev_value);
            if (result.err) {
                return result;
            }
            prev_value = result.unwrap();
        }
        return Ok({
            common: common.unwrap(),
            path: o.path,
            key: o.key,
            prev_value,
        });
    }
}

export interface OpEnvRemoveWithKeyOutputResponse {
    value?: ObjectId;
}

export class OpEnvRemoveWithKeyOutputResponseJsonCodec extends JsonCodec<OpEnvRemoveWithKeyOutputResponse> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvRemoveWithKeyOutputResponse): any {
        const o: any = {};
        if (param.value) {
            o.value = param.value.to_base_58();
        }
        return o;
    }

    decode_object(o: any): BuckyResult<OpEnvRemoveWithKeyOutputResponse> {
        let value;
        if (o.value) {
            const result = ObjectId.from_base_58(o.value);
            if (result.err) {
                return result;
            }
            value = result.unwrap();
        }

        return Ok({ value });
    }
}

// set
export interface OpEnvSetOutputRequest {
    common: OpEnvOutputRequestCommon;

    path?: string;
    value: ObjectId;
}

export class OpEnvSetOutputRequestJsonCodec extends JsonCodec<OpEnvSetOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvSetOutputRequest): any {
        return {
            common: new OpEnvOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            path: param.path,
            value: param.value.to_base_58(),
        };
    }

    decode_object(o: any): BuckyResult<OpEnvSetOutputRequest> {
        const common = new OpEnvOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        const value = ObjectId.from_base_58(o.value);
        if (value.err) {
            return value;
        }

        return Ok({ common: common.unwrap(), path: o.path, value: value.unwrap() });
    }
}

export class OpEnvSetResponseJsonCodec extends JsonCodec<OpEnvSetResponse> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvSetResponse): any {
        return {
            result: param.result,
        };
    }
    decode_object(o: any): BuckyResult<OpEnvSetResponse> {
        return Ok({ result: o.result });
    }
}

export type OpEnvContainsOutputRequest = OpEnvSetOutputRequest;
export type OpEnvContainsOutputResponse = OpEnvSetResponse;

// insert
export type OpEnvInsertOutputRequest = OpEnvSetOutputRequest;
export type OpEnvInsertOutputResponse = OpEnvSetResponse;

// remove
export type OpEnvRemoveOutputRequest = OpEnvSetOutputRequest;
export type OpEnvRemoveOutputResponse = OpEnvSetResponse;

// next
export interface OpEnvNextOutputRequest {
    common: OpEnvOutputRequestCommon;

    // 步进的元素个数
    step: number;
}

export class OpEnvNextOutputRequestJsonCodec extends JsonCodec<OpEnvNextOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvNextOutputRequest): any {
        return {
            common: new OpEnvOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            step: param.step,
        };
    }
    decode_object(o: any): BuckyResult<OpEnvNextOutputRequest> {
        const common = new OpEnvOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        return Ok({ common: common.unwrap(), step: o.step });
    }
}

export interface ObjectMapMapItem {
    key: string;
    value: ObjectId;
}

export class ObjectMapMapItemJsonCodec extends JsonCodec<ObjectMapMapItem> {
    constructor() {
        super();
    }
    encode_object(param: ObjectMapMapItem): any {
        return {
            key: param.key,
            value: param.value,
        };
    }
    decode_object(o: any): BuckyResult<ObjectMapMapItem> {
        const result = ObjectId.from_base_58(o.value);
        if (result.err) {
            return result;
        }
        const value = result.unwrap();
        return Ok({ key: o.key, value, });
    }
}

export interface ObjectMapSetItem {
    value: ObjectId;
}

export class ObjectMapSetItemJsonCodec extends JsonCodec<ObjectMapSetItem> {
    constructor() {
        super();
    }
    encode_object(param: ObjectMapSetItem): any {
        return {
            value: param.value,
        };
    }
    decode_object(o: any): BuckyResult<ObjectMapSetItem> {
        const result = ObjectId.from_base_58(o.value);
        if (result.err) {
            return result;
        }
        const value = result.unwrap();
        return Ok({ value, });
    }
}

export interface ObjectMapDiffMapItem {
    key: string;
    prev?: ObjectId;
    altered?: ObjectId;
    diff?: ObjectId;
}

export class ObjectMapDiffMapItemJsonCodec extends JsonCodec<ObjectMapDiffMapItem> {
    constructor() {
        super();
    }
    encode_object(param: ObjectMapDiffMapItem): any {
        return {
            key: param.key,
            prev: param.prev,
            altered: param.altered,
            diff: param.diff,
        };
    }
    decode_object(o: any): BuckyResult<ObjectMapDiffMapItem> {
        let prev;
        if (o.prev) {
            const result = ObjectId.from_base_58(o.prev);
            if (result.err) {
                return result;
            }
            prev = result.unwrap();
        }

        let altered;
        if (o.altered) {
            const result = ObjectId.from_base_58(o.altered);
            if (result.err) {
                return result;
            }
            altered = result.unwrap();
        }

        let diff;
        if (o.diff) {
            const result = ObjectId.from_base_58(o.diff);
            if (result.err) {
                return result;
            }
            diff = result.unwrap();
        }

        return Ok({ key: o.key, prev, altered, diff });
    }
}
export interface ObjectMapDiffSetItem {
    prev?: ObjectId;
    altered?: ObjectId;
}

export class ObjectMapDiffSetItemJsonCodec extends JsonCodec<ObjectMapDiffSetItem> {
    constructor() {
        super();
    }
    encode_object(param: ObjectMapDiffSetItem): any {
        return {
            prev: param.prev,
            altered: param.altered,
        };
    }
    decode_object(o: any): BuckyResult<ObjectMapDiffSetItem> {
        let prev;
        if (o.prev) {
            const result = ObjectId.from_base_58(o.prev);
            if (result.err) {
                return result;
            }
            prev = result.unwrap();
        }

        let altered;
        if (o.altered) {
            const result = ObjectId.from_base_58(o.altered);
            if (result.err) {
                return result;
            }
            altered = result.unwrap();
        }
        return Ok({ key: o.key, prev, altered });
    }
}

export interface ObjectMapContentItem {
    content_type: ObjectMapSimpleContentType;
    map?: ObjectMapMapItem;
    set?: ObjectMapSetItem;
    diff_set?: ObjectMapDiffSetItem;
    diff_map?: ObjectMapDiffMapItem;
}

export class ObjectMapContentItemJsonCodec extends JsonCodec<ObjectMapContentItem> {
    constructor() {
        super();
    }
    // encode_object(param: ObjectMapContentItem): any {
    //   let value;
    //   if (param.value) {
    //     value = param.value.to_base_58();
    //   }
    //   return {
    //     key: param.key,
    //     value,
    //   };
    // }
    decode_object(o: any): BuckyResult<ObjectMapContentItem> {
        switch (o.content_type) {
            case ObjectMapSimpleContentType.Map: {
                const r = new ObjectMapMapItemJsonCodec().decode_object(o);
                if (r.err) {
                    return r;
                }
                return Ok({
                    content_type: o.content_type,
                    map: r.unwrap(),
                });
            }
            case ObjectMapSimpleContentType.Set: {
                const r = new ObjectMapSetItemJsonCodec().decode_object(o);
                if (r.err) {
                    return r;
                }
                return Ok({
                    content_type: o.content_type as ObjectMapSimpleContentType,
                    set: r.unwrap(),
                });
            }
            case ObjectMapSimpleContentType.DiffMap: {
                const r = new ObjectMapDiffMapItemJsonCodec().decode_object(o);
                if (r.err) {
                    return r;
                }
                return Ok({
                    content_type: o.content_type,
                    diff_map: r.unwrap(),
                });
            }
            case ObjectMapSimpleContentType.DiffSet: {
                const r = new ObjectMapDiffSetItemJsonCodec().decode_object(o);
                if (r.err) {
                    return r;
                }
                return Ok({
                    content_type: o.content_type,
                    diff_set: r.unwrap(),
                });
            }
            default:
                console.log(`unknown type`);
                return Err(new BuckyError(BuckyErrorCode.Failed, "UNKNOWN TYPE"));
        }
    }
}

export interface OpEnvNextOutputResponse {
    list: ObjectMapContentItem[];
}

export class OpEnvNextOutputResponseJsonCodec extends JsonCodec<OpEnvNextOutputResponse> {
    constructor() {
        super();
    }
    encode_object(param: OpEnvNextOutputResponse): any {
        const list: ObjectMapContentItem[] = [];
        for (const item of param.list) {
            const r = new ObjectMapContentItemJsonCodec().encode_object(item);
            if (r.err) {
                return r;
            }
            list.push(r.unwrap());
        }
        return { list };
    }
    decode_object(o: any): BuckyResult<OpEnvNextOutputResponse> {
        const list: ObjectMapContentItem[] = [];
        const result = "result";
        const object = o[result];
        for (const key of Object.keys(object)) {
            const item = object[key];
            console.assert(typeof item === "object");

            const r = new ObjectMapContentItemJsonCodec().decode_object(item);
            if (r.err) {
                return r;
            }
            list.push(r.unwrap());
        }
        return Ok({ list });
    }
}

// list
export interface OpEnvListOutputRequest {
    common: OpEnvOutputRequestCommon,

    // for path-env
    path?: string,
}

export type OpEnvListOutputResponse = OpEnvNextOutputResponse;
export class OpEnvListOutputResponseJsonCodec extends OpEnvNextOutputResponseJsonCodec {}

// reset
export interface OpEnvResetOutputRequest extends OpEnvNoParamOutputRequest {}
export class OpEnvResetOutputRequestJsonCodec extends OpEnvNoParamOutputRequestJsonCodec {}

export interface RootStateAccessGetObjectByPathOutputRequest {
    common: RootStateOutputRequestCommon;
    inner_path: string;
}

export class RootStateAccessGetObjectByPathOutputRequestJsonCodec extends JsonCodec<RootStateAccessGetObjectByPathOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: RootStateAccessGetObjectByPathOutputRequest): any {
        return {
            common: new RootStateOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            inner_path: param.inner_path,
        };
    }
    decode_object(
        o: any
    ): BuckyResult<RootStateAccessGetObjectByPathOutputRequest> {
        const common = new RootStateOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        return Ok({ common: common.unwrap(), inner_path: o.inner_path });
    }
}

export interface RootStateAccessGetObjectByPathOutputResponse {
    object: NONGetObjectOutputResponse;
    root: ObjectId;
    revision: JSBI;
}

export interface RootStateAccessListOutputRequest {
    common: RootStateOutputRequestCommon;
    inner_path: string;
    page_index?: number;
    page_size?: number;
}

export class RootStateAccessListOutputRequestJsonCodec extends JsonCodec<RootStateAccessListOutputRequest> {
    constructor() {
        super();
    }
    encode_object(param: RootStateAccessListOutputRequest): any {
        return {
            common: new RootStateOutputRequestCommonJsonCodec().encode_object(
                param.common
            ),
            inner_path: param.inner_path,
            page_index: param.page_index,
            page_size: param.page_size,
        };
    }
    decode_object(o: any): BuckyResult<RootStateAccessListOutputRequest> {
        const common = new RootStateOutputRequestCommonJsonCodec().decode_object(
            o.common
        );
        if (common.err) {
            return common;
        }

        return Ok({
            common: common.unwrap(),
            inner_path: o.inner_path,
            page_index: o.page_index,
            page_size: o.page_size,
        });
    }
}

export interface RootStateAccessListOutputSlimResponse {
    list: ObjectMapContentItem[];
}

export interface RootStateAccessListOutputResponse {
    list: ObjectMapContentItem[];
    root: ObjectId;
    revision: JSBI;
}

export class RootStateAccessListOutputSlimResponseJsonCodec extends JsonCodec<RootStateAccessListOutputSlimResponse> {
    constructor() {
        super();
    }

    encode_object(param: RootStateAccessListOutputSlimResponse): any {
        throw new Error('not support');
    }

    decode_object(o: any): BuckyResult<RootStateAccessListOutputSlimResponse> {
        const ret: RootStateAccessListOutputSlimResponse = {
            list: [],
        };

        let list;
        if (Array.isArray(o)) {
            list = o;
        } else {
            list  = o.result;
        }


        for (const item of list) {
            console.assert(typeof item === "object");

            const r = new ObjectMapContentItemJsonCodec().decode_object(item);
            if (r.err) {
                return r;
            }
            ret.list.push(r.unwrap());
        }

        return Ok(ret);
    }
}