import { GlobalStateRequestor, OpEnvRequestor, GlobalStateAccessorRequestor } from "./requestor";
import { BuckyResult, ObjectId, Ok, ObjectMapSimpleContentType, } from "../../cyfs-base";
import {
    RootStateGetCurrentRootOutputRequest,
    RootStateCreateOpEnvOutputRequest,
    OpEnvCreateNewOutputRequest,
    OpEnvLoadOutputRequest,
    OpEnvLoadByPathOutputRequest,
    OpEnvGetByKeyOutputRequest,
    OpEnvInsertWithKeyOutputRequest,
    OpEnvSetWithKeyOutputRequest,
    OpEnvRemoveWithKeyOutputRequest,
    OpEnvContainsOutputRequest,
    OpEnvInsertOutputRequest,
    OpEnvRemoveOutputRequest,
    OpEnvCommitOutputRequest,
    OpEnvAbortOutputRequest,
    OpEnvNextOutputRequest,
    ObjectMapContentItem,
    OpEnvLockOutputRequest,
    OpEnvMetadataOutputRequest,
    RootStateAccessGetObjectByPathOutputRequest,
    RootStateAccessListOutputRequest,
    OpEnvGetCurrentRootOutputRequest,
    OpEnvResetOutputRequest,
    OpEnvListOutputRequest,
    RootStateOpEnvAccess,
} from "./output_request";
import { NONGetObjectOutputResponse } from '../non/output_request';
import {
    RootStateRootType,
    ObjectMapOpEnvType,
    ObjectMapMetaData,
    OpEnvCommitOpType,
} from "./def";

import JSBI from "jsbi";

export interface RootInfo {
    root: ObjectId;
    revision: JSBI;
}

export interface DecRootInfo {
    root: ObjectId;
    revision: JSBI;
    dec_root: ObjectId;
}

export class GlobalStateStub {
    constructor(private requestor: GlobalStateRequestor, private target?: ObjectId, private target_dec_id?: ObjectId) {
    }

    // return (global_root, revision,)
    public async get_current_root(): Promise<BuckyResult<RootInfo>> {
        const req: RootStateGetCurrentRootOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
            },
            root_type: RootStateRootType.Global,
        };
        const r = await this.requestor.get_current_root(req);
        if (r.err) {
            return r;
        }

        const resp = r.unwrap();
        const root: RootInfo = {
            root: resp.root,
            revision: resp.revision,
        };
        return Ok(root);
    }

    // return (global_root, revision, dec_root)
    public async get_dec_root(): Promise<BuckyResult<DecRootInfo>> {
        const req: RootStateGetCurrentRootOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
            },
            root_type: RootStateRootType.Dec,
        };
        const r = await this.requestor.get_current_root(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        const decRootInfo: DecRootInfo = {
            root: resp.root,
            revision: resp.revision,
            dec_root: resp.dec_root!,
        };
        return Ok(decRootInfo);
    }

    public async create_path_op_env(): Promise<BuckyResult<PathOpEnvStub>> {
        return this.create_path_op_env_with_access()
    }

    public async create_isolate_path_op_env(): Promise<BuckyResult<IsolatePathOpEnvStub>> {
        return this.create_isolate_path_op_env_with_access()
    }

    public async create_isolate_path_op_env_with_access(access?: RootStateOpEnvAccess): Promise<BuckyResult<IsolatePathOpEnvStub>> {
        const req: RootStateCreateOpEnvOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
            },
            op_env_type: ObjectMapOpEnvType.IsolatePath,
            access
        };
        const r = await this.requestor.create_op_env(req);
        if (r.err) {
            return r;
        }
        const opEnvRequestor = r.unwrap();

        const stub = new IsolatePathOpEnvStub(opEnvRequestor, this.target, this.target_dec_id);
        return Ok(stub);
    }

    public async create_path_op_env_with_access(access?: RootStateOpEnvAccess): Promise<BuckyResult<PathOpEnvStub>> {
        const req: RootStateCreateOpEnvOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
            },
            op_env_type: ObjectMapOpEnvType.Path,
            access
        };
        const r = await this.requestor.create_op_env(req);
        if (r.err) {
            return r;
        }
        const opEnvRequestor = r.unwrap();

        const stub = new PathOpEnvStub(opEnvRequestor, this.target, this.target_dec_id);
        return Ok(stub);
    }

    public async create_single_op_env(): Promise<BuckyResult<SingleOpEnvStub>> {
        return this.create_single_op_env_with_access()
    }

    public async create_single_op_env_with_access(access?: RootStateOpEnvAccess): Promise<BuckyResult<SingleOpEnvStub>> {
        const req: RootStateCreateOpEnvOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
            },
            op_env_type: ObjectMapOpEnvType.Single,
            access
        };
        const r = await this.requestor.create_op_env(req);
        if (r.err) {
            return r;
        }
        const opEnvRequestor = r.unwrap();

        const stub = new SingleOpEnvStub(opEnvRequestor, this.target, this.target_dec_id);
        return Ok(stub);
    }
}

export class SingleOpEnvStub {
    private requestor: OpEnvRequestor;
    private sid_: JSBI;
    private target?: ObjectId;
    private target_dec_id?: ObjectId;

    public constructor(requestor: OpEnvRequestor, target?: ObjectId, target_dec_id?: ObjectId) {
        this.requestor = requestor;
        this.sid_ = requestor.get_sid();
        this.target = target;
        this.target_dec_id = target_dec_id;
    }

    // methods
    public async create_new(
        content_type: ObjectMapSimpleContentType
    ): Promise<BuckyResult<void>> {
        const req: OpEnvCreateNewOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            content_type,
        };
        const r = await this.requestor.create_new(req);
        if (r.err) {
            return r;
        }
        return Ok(undefined);
    }

    public async load(target: ObjectId, inner_path?: string): Promise<BuckyResult<void>> {
        const req: OpEnvLoadOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            target,
            inner_path
        };
        const r = await this.requestor.load(req);
        if (r.err) {
            return r;
        }
        return Ok(undefined);
    }

    public async load_by_path(path: string): Promise<BuckyResult<void>> {
        const req: OpEnvLoadByPathOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            path,
        };
        const r = await this.requestor.load_by_path(req);
        if (r.err) {
            return r;
        }
        return Ok(undefined);
    }

    // map methods
    public async get_by_key(key: string): Promise<BuckyResult<ObjectId | undefined>> {
        const req: OpEnvGetByKeyOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            key,
        };
        const r = await this.requestor.get_by_key(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        let value;
        if (resp.value) {
            value = resp.value;
        }
        return Ok(value);
    }

    public async insert_with_key(
        key: string,
        value: ObjectId
    ): Promise<BuckyResult<void>> {
        const req: OpEnvInsertWithKeyOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            key,
            value,
        };
        const r = await this.requestor.insert_with_key(req);
        if (r.err) {
            return r;
        }
        return Ok(undefined);
    }

    public async set_with_key(
        key: string,
        value: ObjectId,
        prev_value?: ObjectId,
        auto_insert?: boolean
    ): Promise<BuckyResult<ObjectId | undefined>> {
        const req: OpEnvSetWithKeyOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            key,
            value,
            prev_value,
            auto_insert: auto_insert ? auto_insert : false,
        };
        const r = await this.requestor.set_with_key(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        let prev_value_;
        if (resp.prev_value) {
            prev_value_ = resp.prev_value;
        }
        return Ok(prev_value_);
    }

    public async remove_with_key(
        key: string,
        prev_value?: ObjectId
    ): Promise<BuckyResult<ObjectId | undefined>> {
        const req: OpEnvRemoveWithKeyOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            key,
            prev_value,
        };
        const r = await this.requestor.remove_with_key(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        let value;
        if (resp.value) {
            value = resp.value;
        }
        return Ok(value);
    }

    // set methods
    public async contains(object_id: ObjectId): Promise<BuckyResult<boolean>> {
        const req: OpEnvContainsOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            value: object_id,
        };
        const r = await this.requestor.contains(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        return Ok(resp.result);
    }

    public async insert(object_id: ObjectId): Promise<BuckyResult<boolean>> {
        const req: OpEnvInsertOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            value: object_id,
        };
        const r = await this.requestor.insert(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        return Ok(resp.result);
    }

    public async remove(object_id: ObjectId): Promise<BuckyResult<boolean>> {
        const req: OpEnvRemoveOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            value: object_id,
        };
        const r = await this.requestor.remove(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        return Ok(resp.result);
    }

    // get_current_root
    public async get_current_root(): Promise<BuckyResult<ObjectId>> {
        const req: OpEnvGetCurrentRootOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
        };
        const r = await this.requestor.get_current_root(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        return Ok(resp.root);
    }

    // transcation
    public async update(): Promise<BuckyResult<ObjectId>> {
        const req: OpEnvCommitOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            op_type: OpEnvCommitOpType.Update,
        };
        const r = await this.requestor.commit(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        const info: DecRootInfo = {
            root: resp.root,
            revision: resp.revision,
            dec_root: resp.dec_root,
        };

        return Ok(info.dec_root);
    }

    public async commit(): Promise<BuckyResult<DecRootInfo>> {
        const req: OpEnvCommitOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
        };
        const r = await this.requestor.commit(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        const info: DecRootInfo = {
            root: resp.root,
            revision: resp.revision,
            dec_root: resp.dec_root,
        };

        return Ok(info);
    }

    public async abort(): Promise<BuckyResult<void>> {
        const req: OpEnvAbortOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
        };
        const r = await this.requestor.abort(req);
        if (r.err) {
            return r;
        }
        return Ok(undefined);
    }

    // iterator
    public async next(step: number): Promise<BuckyResult<ObjectMapContentItem[]>> {
        const req: OpEnvNextOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            step,
        };
        const r = await this.requestor.next(req);
        if (r.err) {
            return r;
        }

        return Ok(r.unwrap().list);
    }

    public async reset(): Promise<BuckyResult<void>> {
        const req: OpEnvResetOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
        };
        const r = await this.requestor.reset(req);
        if (r.err) {
            return r;
        }

        return Ok(r.unwrap());
    }

    // list
    public async list(): Promise<BuckyResult<ObjectMapContentItem[]>> {
        const req: OpEnvListOutputRequest = {
            common: {
                target_dec_id: this.target_dec_id,
                target: this.target,
                flags: 0,
                sid: JSBI.BigInt(0)
            }
        }

        const r = await this.requestor.list(req)
        if (r.err) {
            return r;
        }

        return Ok(r.unwrap().list)
    }

    // metadata
    public async metadata(): Promise<BuckyResult<ObjectMapMetaData>> {
        const req: OpEnvMetadataOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
        };
        const r = await this.requestor.metadata(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        const metadata: ObjectMapMetaData = {
            content_mode: resp.content_mode,
            content_type: resp.content_type,
            count: resp.count,
            size: resp.size,
            depth: resp.depth,
        };

        return Ok(metadata);
    }
}

export class PathOpEnvStub {
    protected requestor: OpEnvRequestor;
    protected sid_: JSBI;
    protected target?: ObjectId;
    protected target_dec_id?: ObjectId;

    public constructor(requestor: OpEnvRequestor, target?: ObjectId, target_dec_id?: ObjectId) {
        this.requestor = requestor;
        this.sid_ = requestor.get_sid();
        this.target = target;
        this.target_dec_id = target_dec_id;
    }

    // lock
    public async lock(
        path_list: string[],
        duration_in_millsecs: JSBI,
    ): Promise<BuckyResult<void>> {
        return await this.lock_impl(path_list, duration_in_millsecs, false);
    }

    public async try_lock(
        path_list: string[],
        duration_in_millsecs: JSBI,
    ): Promise<BuckyResult<void>> {
        return await this.lock_impl(path_list, duration_in_millsecs, true);
    }

    async lock_impl(
        path_list: string[],
        duration_in_millsecs: JSBI,
        try_lock: boolean,
    ): Promise<BuckyResult<void>> {
        const req: OpEnvLockOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            path_list,
            duration_in_millsecs,
            try_lock,
        };
        const r = await this.requestor.lock(req);
        if (r.err) {
            return r;
        }
        return Ok(undefined);
    }

    public async get_by_key(
        path: string,
        key: string
    ): Promise<BuckyResult<ObjectId | undefined>> {
        const req: OpEnvGetByKeyOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            key,
            path,
        };
        const r = await this.requestor.get_by_key(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        let value;
        if (resp.value) {
            value = resp.value!;
        }
        return Ok(value);
    }

    public async create_new(
        path: string,
        key: string,
        content_type: ObjectMapSimpleContentType,
    ): Promise<BuckyResult<void>> {
        const req: OpEnvCreateNewOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            path,
            key,
            content_type,
        };
        const r = await this.requestor.create_new(req);
        if (r.err) {
            return r;
        }
        return Ok(undefined);
    }

    public async insert_with_key(
        path: string,
        key: string,
        value: ObjectId
    ): Promise<BuckyResult<void>> {
        const req: OpEnvInsertWithKeyOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            key,
            value,
            path,
        };
        const r = await this.requestor.insert_with_key(req);
        if (r.err) {
            return r;
        }
        return Ok(undefined);
    }

    public async set_with_key(
        path: string,
        key: string,
        value: ObjectId,
        prev_value?: ObjectId,
        auto_insert?: boolean
    ): Promise<BuckyResult<ObjectId | undefined>> {
        const req: OpEnvSetWithKeyOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            path,
            key,
            value,
            prev_value,
            auto_insert: auto_insert ? auto_insert : false,
        };
        const r = await this.requestor.set_with_key(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        let prev_value_;
        if (resp.prev_value) {
            prev_value_ = resp.prev_value;
        }
        return Ok(prev_value_);
    }

    public async remove_with_key(
        path: string,
        key: string,
        prev_value?: ObjectId
    ): Promise<BuckyResult<ObjectId | undefined>> {
        const req: OpEnvRemoveWithKeyOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            key,
            path,
            prev_value,
        };
        const r = await this.requestor.remove_with_key(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        let value;
        if (resp.value) {
            value = resp.value;
        }
        return Ok(value);
    }

    // map methods with full_path
    public async get_by_path(
        full_path: string
    ): Promise<BuckyResult<ObjectId | undefined>> {
        const req: OpEnvGetByKeyOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            key: full_path,
        };
        const r = await this.requestor.get_by_key(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        let value;
        if (resp.value) {
            value = resp.value!;
        }
        return Ok(value);
    }

    public async create_new_with_path(
        full_path: string,
        content_type: ObjectMapSimpleContentType,
    ): Promise<BuckyResult<void>> {
        const req: OpEnvCreateNewOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            key: full_path,
            content_type,
        };
        const r = await this.requestor.create_new(req);
        if (r.err) {
            return r;
        }
        return Ok(undefined);
    }

    public async insert_with_path(
        full_path: string,
        value: ObjectId
    ): Promise<BuckyResult<void>> {
        const req: OpEnvInsertWithKeyOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            key: full_path,
            value,
        };
        const resp = await this.requestor.insert_with_key(req);
        if (resp.err) {
            return resp;
        }
        return Ok(undefined);
    }

    public async set_with_path(
        full_path: string,
        value: ObjectId,
        prev_value?: ObjectId,
        auto_insert?: boolean
    ): Promise<BuckyResult<ObjectId | undefined>> {
        const req: OpEnvSetWithKeyOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            value,
            auto_insert: auto_insert ? auto_insert : false,
            prev_value,
            key: full_path,
        };
        const resp = await this.requestor.set_with_key(req);
        if (resp.err) {
            return resp;
        }
        let value_;
        if (resp.unwrap().prev_value) {
            value_ = resp.unwrap().prev_value;
        }
        return Ok(value_);
    }

    public async remove_with_path(
        full_path: string,
        prev_value?: ObjectId
    ): Promise<BuckyResult<ObjectId | undefined>> {
        const req: OpEnvRemoveWithKeyOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            key: full_path,
            prev_value,
        };
        const resp = await this.requestor.remove_with_key(req);
        if (resp.err) {
            return resp;
        }
        let value;
        if (resp.unwrap().value) {
            value = resp.unwrap().value!;
        }
        return Ok(value);
    }

    // set methods
    public async contains(
        path: string,
        object_id: ObjectId
    ): Promise<BuckyResult<boolean>> {
        const req: OpEnvContainsOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            value: object_id,
            path,
        };
        const resp = await this.requestor.contains(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().result as boolean);
    }

    public async insert(
        path: string,
        object_id: ObjectId
    ): Promise<BuckyResult<boolean>> {
        const req: OpEnvInsertOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            value: object_id,
            path,
        };
        const resp = await this.requestor.insert(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().result as boolean);
    }

    public async remove(
        path: string,
        object_id: ObjectId
    ): Promise<BuckyResult<boolean>> {
        const req: OpEnvRemoveOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            value: object_id,
            path,
        };
        const resp = await this.requestor.remove(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().result);
    }

    // get_current_root
    public async get_current_root(): Promise<BuckyResult<DecRootInfo>> {
        const req: OpEnvGetCurrentRootOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
        };
        const r = await this.requestor.get_current_root(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        const info: DecRootInfo = {
            root: resp.root,
            revision: resp.revision,
            dec_root: resp.dec_root,
        };

        return Ok(info);
    }

    // transcation
    public async update(): Promise<BuckyResult<DecRootInfo>> {
        const req: OpEnvCommitOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            op_type: OpEnvCommitOpType.Update,
        };
        const r = await this.requestor.commit(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        const info: DecRootInfo = {
            root: resp.root,
            revision: resp.revision,
            dec_root: resp.dec_root,
        };

        return Ok(info);
    }

    public async commit(): Promise<BuckyResult<DecRootInfo>> {
        const req: OpEnvCommitOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
        };
        const r = await this.requestor.commit(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        const info: DecRootInfo = {
            root: resp.root,
            revision: resp.revision,
            dec_root: resp.dec_root,
        };

        return Ok(info);
    }

    public async abort(): Promise<BuckyResult<void>> {
        const req: OpEnvAbortOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
        };
        const resp = await this.requestor.abort(req);
        if (resp.err) {
            return resp;
        }

        return Ok(undefined);
    }

    // list
    public async list(path: string): Promise<BuckyResult<ObjectMapContentItem[]>> {
        const req: OpEnvListOutputRequest = {
            common: {
                target_dec_id: this.target_dec_id,
                target: this.target,
                flags: 0,
                sid: JSBI.BigInt(0)
            },
            path
        }

        const r = await this.requestor.list(req)
        if (r.err) {
            return r;
        }

        return Ok(r.unwrap().list)
    }

    // metadata
    public async metadata(path: string): Promise<BuckyResult<ObjectMapMetaData>> {
        const req: OpEnvMetadataOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            path,
        };
        const r = await this.requestor.metadata(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        const metadata: ObjectMapMetaData = {
            content_mode: resp.content_mode,
            content_type: resp.content_type,
            count: resp.count,
            size: resp.size,
            depth: resp.depth,
        };

        return Ok(metadata);
    }
}

export class IsolatePathOpEnvStub extends PathOpEnvStub {
    // methods
    public async create_new(
        content_type: ObjectMapSimpleContentType
    ): Promise<BuckyResult<void>> {
        const req: OpEnvCreateNewOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            content_type,
        };
        const r = await this.requestor.create_new(req);
        if (r.err) {
            return r;
        }
        return Ok(undefined);
    }

    public async load(target: ObjectId, inner_path?: string): Promise<BuckyResult<void>> {
        const req: OpEnvLoadOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            target,
            inner_path
        };
        const r = await this.requestor.load(req);
        if (r.err) {
            return r;
        }
        return Ok(undefined);
    }

    public async load_by_path(path: string): Promise<BuckyResult<void>> {
        const req: OpEnvLoadByPathOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
                sid: this.sid_,
            },
            path,
        };
        const r = await this.requestor.load_by_path(req);
        if (r.err) {
            return r;
        }
        return Ok(undefined);
    }
}

export class GlobalStateAccessorStub {
    constructor(private requestor: GlobalStateAccessorRequestor, private target?: ObjectId, private target_dec_id?: ObjectId) {
    }

    public async get_object_by_path(
        inner_path: string
    ): Promise<BuckyResult<NONGetObjectOutputResponse>> {
        const req: RootStateAccessGetObjectByPathOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
            },
            inner_path,
        };
        const r = await this.requestor.get_object_by_path(req);
        if (r.err) {
            return r;
        }

        const resp = r.unwrap();
        return Ok(resp.object);
    }

    public async list(
        inner_path: string, page_index?: number, page_size?: number
    ): Promise<BuckyResult<ObjectMapContentItem[]>> {
        const req: RootStateAccessListOutputRequest = {
            common: {
                flags: 0,
                target: this.target,
                target_dec_id: this.target_dec_id,
            },
            inner_path,
            page_index,
            page_size,
        };
        const r = await this.requestor.list(req);
        if (r.err) {
            return r;
        }

        return Ok(r.unwrap().list);
    }
}