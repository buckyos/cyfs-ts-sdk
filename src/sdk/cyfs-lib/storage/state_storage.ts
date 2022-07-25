import JSBI from "jsbi";
import { BuckyError, BuckyErrorCode, BuckyResult, Err, ObjectId, ObjectMapSimpleContentType, Ok } from "../../cyfs-base";
import { get_system_dec_app } from "../../cyfs-core";
import { GlobalStateCategory } from "../root_state/def";
import { ObjectMapContentItem } from "../root_state/output_request";
import { GlobalStateStub, PathOpEnvStub, SingleOpEnvStub } from "../root_state/stub";
import { SharedCyfsStack } from "../stack/stack";

interface StorageOpData {
    path_stub: PathOpEnvStub,
    single_stub: SingleOpEnvStub,
    current?: ObjectId,
}

export class StateStorage {
    stack: SharedCyfsStack;
    category: GlobalStateCategory;
    path_: string;
    content_type: ObjectMapSimpleContentType;
    target?: ObjectId;
    dec_id?: ObjectId;
    dirty: boolean;
    auto_save: boolean;
    op_data?: StorageOpData
    constructor(
        stack: SharedCyfsStack,
        category: GlobalStateCategory,
        path: string,
        content_type: ObjectMapSimpleContentType,
        target?: ObjectId,
        dec_id?: ObjectId,
    ) {
        this.stack = stack;
        this.category = category;
        this.path_ = path;
        this.content_type = content_type;
        this.target = target;
        this.dec_id = dec_id;
        this.dirty = false;
        this.auto_save = false;
    }

    path(): string {
        return this.path_;
    }

    stub(): SingleOpEnvStub {
        return this.op_data!.single_stub
    }

    is_dirty(): boolean {
        return this.dirty
    }

    set_dirty(dirty: boolean): void {
        this.dirty = dirty
    }

    async init(): Promise<BuckyResult<[]>> {
        if (this.op_data) {
            return Err(new BuckyError(BuckyErrorCode.AlreadyExists, "state storage already init"));
        }

        const op_data = await this.load();
        if (op_data.err) {
            return op_data;
        }

        this.op_data = op_data.unwrap()

        return Ok([])
    }

    async load(): Promise<BuckyResult<StorageOpData>> {
        let state;
        if (this.category === GlobalStateCategory.RootState) {
            state = this.stack.root_state();
        } else {
            state = this.stack.local_cache();
        }

        const dec_id = this.dec_id || get_system_dec_app().object_id

        const stub = new GlobalStateStub(state, this.target, dec_id);

        const path_stub_r = await stub.create_path_op_env();
        if (path_stub_r.err) {
            return path_stub_r;
        }
        const path_stub = path_stub_r.unwrap();

        (await path_stub.lock([this.path_], JSBI.BigInt(1))).unwrap()

        const single_stub_r = await stub.create_single_op_env();
        if (single_stub_r.err) {
            return single_stub_r;
        }

        const single_stub = single_stub_r.unwrap();

        const current_r = await path_stub.get_by_path(this.path_);
        if (current_r.err) {
            return current_r;
        }
        const current = current_r.unwrap()
        if (current) {
            const r = await single_stub.load(current);
            if (r.err) {
                return r;
            }
        } else {
            const r = await single_stub.create_new(this.content_type);
            if (r.err) {
                return r;
            }
        }

        return Ok({
            path_stub,
            single_stub,
            current,
        });
    }

    async save(): Promise<BuckyResult<[]>> {
        if (!this.dirty) {
            return Ok([])
        }
        this.dirty = false

        const ret = await this.commit_impl()
        if (ret.err) {
            this.dirty = true;
        }

        return ret;
    }

    async abort(): Promise<void> {
        this.stop_save();

        if (this.op_data) {
            await this.abort_impl();
        }
    }

    async abort_impl(): Promise<void> {
        console.info(`will abort state storage: path=${this.path_}`);

        let r = await this.op_data!.single_stub.abort();
        if (r.err) {
            console.error(`abort state storage single stub error! path=${this.path_}, ${r.val}`);
        }

        r = await this.op_data!.path_stub.abort();
        if (r.err) {
            console.error(`abort state storage path stub error! path=${this.path_}, ${r.val}`);
        }

        this.set_dirty(false)
    }

    async commit_impl(): Promise<BuckyResult<[]>> {
        // first hold the lock for update
        const current = this.op_data!.current!;

        const r = await this.op_data!.single_stub.update();
        if (r.err) {
            console.error(`commit state storage failed! path=${this.path_}, ${r.val}`);
            return r;
        }

        const new_root = r.unwrap()

        if (current && new_root.equals(current)) {
            console.debug(`commit state storage but not changed! path=${this.path_}, current=${new_root}`);
            return Ok([])
        }

        const path_r = await this.op_data!.path_stub.set_with_path(this.path_, new_root, current, true);
        if (path_r.err) {
            console.error(
                `update state storage but failed! path=${this.path_}, current=${new_root}, prev=${current}, ${path_r.val}`
            );
            return path_r;
        } else {
            console.info(`update state storage success! path=${this.path_}, current=${new_root}, prev=${current}`);
        }

        const path_update_r = await this.op_data!.path_stub.update()
        if (path_update_r.err) {
            console.error(
                `commit state storage to global state failed! path=${this.path_}, ${path_update_r.val}`
            );
            return path_update_r;
        }

        this.op_data!.current = new_root;

        console.info(`commit state storage to global state success! path=${this.path_}`);

        return Ok([])
    }

    start_save(dur: number): void {
        if (this.auto_save) {
            console.warn(`storage already in saving state! path=${this.path_}`);
            return;
        }
        this.auto_save = true

        const timer = setInterval(async () => {
            if (!this.auto_save) {
                console.warn(`storage auto save stopped! path=${this.path_}`);
                clearInterval(timer);
            }
            await this.save()
        }, dur)
    }

    stop_save(): void {
        this.auto_save = false;
        console.info(`stop state storage auto save! path=${this.path_}`);
    }
}

export class StateStorageMap {
    constructor(private storage_: StateStorage) {}

    storage(): StateStorage {
        return this.storage_;
    }

    async save(): Promise<BuckyResult<[]>> {
        return await this.storage_.save()
    }

    async abort() {
        await this.storage_.abort()
    }

    async get(key: string): Promise<BuckyResult<ObjectId | undefined>> {
        return await this.storage_.stub().get_by_key(key)
    }

    async set(
        key: string,
        value: ObjectId,
    ): Promise<BuckyResult<ObjectId | undefined>> {
        return await this.set_ex(key, value, undefined, true)
    }

    async set_ex(
        key: string,
        value: ObjectId,
        prev_value: ObjectId | undefined,
        auto_insert: boolean,
    ): Promise<BuckyResult<ObjectId | undefined>> {
        const ret = await this.storage_.stub().set_with_key(key, value, prev_value, auto_insert);
        if (ret.err) {
            return ret;
        }

        if (ret.unwrap() === undefined || !ret.unwrap()!.equals(value)) {
            this.storage_.set_dirty(true);
        }

        return Ok(ret.unwrap())
    }

    async insert(key: string, value: ObjectId): Promise<BuckyResult<void>> {
        const ret = await this.storage_.stub().insert_with_key(key, value);
        if (ret.err) {
            return ret;
        }
        this.storage_.set_dirty(true);

        return Ok(ret.unwrap())
    }

    async remove(key: string): Promise<BuckyResult<ObjectId|undefined>> {
        return await this.remove_ex(key)
    }

    async remove_ex(
        key: string,
        prev_value?: ObjectId,
    ): Promise<BuckyResult<ObjectId|undefined>> {
        const ret = await this.storage_.stub().remove_with_key(key, prev_value);
        if (ret.err) {
            return ret;
        }

        if (ret.unwrap()) {
            this.storage_.set_dirty(true);
        }

        return Ok(ret.unwrap())
    }

    async next(step: number): Promise<BuckyResult<[string, ObjectId][]>> {
        const list = await this.storage_.stub().next(step);
        if (list.err) {
            return list;
        }

        return this.convert_list(list.unwrap())
    }

    async reset(): Promise<BuckyResult<void>> {
        return await this.storage_.stub().reset();
    }

    async list(): Promise<BuckyResult<[string, ObjectId][]>> {
        const list = await this.storage_.stub().list();
        if (list.err) {
            return list;
        }

        return this.convert_list(list.unwrap())
    }

    convert_list(list: ObjectMapContentItem[]): BuckyResult<[string, ObjectId][]> {
        const ret:[string, ObjectId][] = [];
        if (list.length === 0) {
            return Ok(ret);
        }

        if (list[0].content_type != ObjectMapSimpleContentType.Map) {
            const msg = `state storage is not valid map type! path=${this.storage().path()}, type=${list[0].content_type}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        list.forEach((value) => {
            if (value.content_type === ObjectMapSimpleContentType.Map) {
                ret.push([value.map!.key, value.map!.value])
            }
        })

        return Ok(ret)
    }
}

export class StateStorageSet {
    constructor(private storage_: StateStorage) {}

    storage(): StateStorage {
        return this.storage_;
    }

    async save(): Promise<BuckyResult<[]>> {
        return await this.storage_.save()
    }

    async abort() {
        await this.storage_.abort()
    }

    async contains(object_id: ObjectId): Promise<BuckyResult<boolean>> {
        return await this.storage_.stub().contains(object_id)
    }

    async insert(object_id: ObjectId): Promise<BuckyResult<boolean>> {
        const ret = await this.storage_.stub().insert(object_id);
        if (ret.err) {
            return ret;
        }
        this.storage_.set_dirty(true);

        return Ok(ret.unwrap())
    }

    async remove(object_id: ObjectId): Promise<BuckyResult<boolean>> {
        const ret = await this.storage_.stub().remove(object_id);
        if (ret.err) {
            return ret;
        }
        this.storage_.set_dirty(true);

        return Ok(ret.unwrap())
    }

    async next(step: number): Promise<BuckyResult<ObjectId[]>> {
        const list = await this.storage_.stub().next(step);
        if (list.err) {
            return list;
        }

        return this.convert_list(list.unwrap())
    }

    async reset(): Promise<BuckyResult<void>> {
        return await this.storage_.stub().reset();
    }

    async list(): Promise<BuckyResult<ObjectId[]>> {
        const list = await this.storage_.stub().list();
        if (list.err) {
            return list;
        }

        return this.convert_list(list.unwrap())
    }

    convert_list(list: ObjectMapContentItem[]): BuckyResult<ObjectId[]> {
        const ret:ObjectId[] = [];
        if (list.length === 0) {
            return Ok(ret);
        }

        if (list[0].content_type != ObjectMapSimpleContentType.Set) {
            const msg = `state storage is not valid set type! path=${this.storage().path()}, type=${list[0].content_type}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        list.forEach((value) => {
            if (value.content_type === ObjectMapSimpleContentType.Set) {
                ret.push(value.set!.value)
            }
        })

        return Ok(ret)
    }
}