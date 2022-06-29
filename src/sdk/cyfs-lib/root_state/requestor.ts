import {
    RootStateGetCurrentRootOutputRequest,
    RootStateGetCurrentRootOutputRequestJsonCodec,
    RootStateGetCurrentRootOutputResponse,
    RootStateGetCurrentRootOutputResponseJsonCodec,
    RootStateOutputRequestCommon,
    RootStateCreateOpEnvOutputRequest,
    RootStateCreateOpEnvOutputRequestJsonCodec,
    RootStateCreateOpEnvOutputResponse,
    RootStateCreateOpEnvOutputResponseJsonCodec,
    OpEnvLoadOutputRequest,
    OpEnvLoadOutputRequestJsonCodec,
    OpEnvOutputRequestCommon,
    OpEnvLoadByPathOutputRequest,
    OpEnvLoadByPathOutputRequestJsonCodec,
    OpEnvCreateNewOutputRequest,
    OpEnvCreateNewOutputRequestJsonCodec,
    OpEnvLockOutputRequest,
    OpEnvLockOutputRequestJsonCodec,
    OpEnvCommitOutputRequest,
    OpEnvCommitOutputRequestJsonCodec,
    OpEnvCommitOutputResponse,
    OpEnvCommitOutputResponseJsonCodec,
    OpEnvAbortOutputRequest,
    OpEnvAbortOutputRequestJsonCodec,
    OpEnvGetByKeyOutputRequest,
    OpEnvGetByKeyOutputResponse,
    OpEnvGetByKeyOutputResponseJsonCodec,
    OpEnvInsertWithKeyOutputRequest,
    OpEnvInsertWithKeyOutputRequestJsonCodec,
    OpEnvSetWithKeyOutputRequest,
    OpEnvSetWithKeyOutputRequestJsonCodec,
    OpEnvSetWithKeyOutputResponse,
    OpEnvSetWithKeyOutputResponseJsonCodec,
    OpEnvRemoveWithKeyOutputRequest,
    OpEnvRemoveWithKeyOutputRequestJsonCodec,
    OpEnvRemoveWithKeyOutputResponse,
    OpEnvRemoveWithKeyOutputResponseJsonCodec,
    OpEnvContainsOutputRequest,
    OpEnvContainsOutputResponse,
    OpEnvInsertOutputRequest,
    OpEnvInsertOutputResponse,
    OpEnvRemoveOutputRequest,
    OpEnvRemoveOutputResponse,
    OpEnvSetOutputRequestJsonCodec,
    OpEnvSetResponseJsonCodec,
    OpEnvNextOutputRequest,
    OpEnvNextOutputRequestJsonCodec,
    OpEnvNextOutputResponse,
    OpEnvNextOutputResponseJsonCodec,
    OpEnvMetadataOutputRequest,
    OpEnvMetadataOutputResponse,
    OpEnvMetadataOutputResponseJsonCodec,
    RootStateAccessGetObjectByPathOutputRequest,
    RootStateAccessGetObjectByPathOutputResponse,
    RootStateAccessListOutputRequest,
    RootStateAccessListOutputResponse,
    RootStateAccessListOutputSlimResponseJsonCodec,
} from "./output_request";
import {
    BuckyResult,
    CYFS_DEC_ID,
    CYFS_FLAGS,
    CYFS_TARGET,
    CYFS_ROOT_STATE_ACTION,
    CYFS_OP_ENV_PATH,
    CYFS_OP_ENV_KEY,
    CYFS_OP_ENV_VALUE,
    CYFS_OP_ENV_ACTION,
    CYFS_OP_ENV_SID,
    CYFS_OBJECT_UPDATE_TIME,
    CYFS_OBJECT_EXPIRES_TIME,
    Err,
    ObjectId,
    Ok,
    BuckyError,
    BuckyErrorCode,
    CYFS_REVISION,
    CYFS_ROOT,
} from "../../cyfs-base";
import { BaseRequestor, RequestorHelper } from "../base/base_requestor";
import { HttpRequest } from "../base/http_request";
import { RootStateAction, ObjectMapOpEnvType, OpEnvAction, GlobalStateCategory } from "./def";
import { NONGetObjectOutputResponse } from '../non/output_request';
import { NONRequestor, NONRequestorHelper } from "../non/requestor";
import JSBI from "jsbi";

export class GlobalStateRequestor {
    private category_: GlobalStateCategory;
    private service_url_: string;
    private dec_id_: ObjectId;
    private requestor_: BaseRequestor;

    public constructor(category: GlobalStateCategory, requestor: BaseRequestor, dec_id?: ObjectId) {
        this.category_ = category;
        this.dec_id_ = dec_id!;
        this.requestor_ = requestor;
        this.service_url_ = `http://${requestor.remote_addr()}/${category}/`;
    }

    public get_category(): GlobalStateCategory {
        return this.category_;
    }

    public get_base_requestor(): BaseRequestor {
        return this.requestor_;
    }

    public get_dec_id(): ObjectId {
        return this.dec_id_;
    }

    private encode_common_headers(
        action: RootStateAction,
        com_req: RootStateOutputRequestCommon,
        http_req: HttpRequest
    ) {
        if (com_req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, com_req.dec_id.to_string());
        } else if (this.dec_id_) {
            http_req.insert_header(CYFS_DEC_ID, this.dec_id_.to_string());
        }

        if (com_req.target) {
            http_req.insert_header(CYFS_TARGET, com_req.target.to_string());
        }

        http_req.insert_header(CYFS_FLAGS, com_req.flags.toString());
        http_req.insert_header(CYFS_ROOT_STATE_ACTION, action);
    }

    // get_current_root
    // /root_state/root GET
    private encode_get_current_root_request(
        req: RootStateGetCurrentRootOutputRequest
    ): HttpRequest {
        const url = this.service_url_.concat("root");

        const http_req = new HttpRequest("Post", url);

        this.encode_common_headers(
            RootStateAction.GetCurrentRoot,
            req.common,
            http_req
        );
        http_req.set_string_body(
            new RootStateGetCurrentRootOutputRequestJsonCodec().encode_string(req)
        );

        return http_req;
    }

    public async get_current_root(
        req: RootStateGetCurrentRootOutputRequest
    ): Promise<BuckyResult<RootStateGetCurrentRootOutputResponse>> {
        const http_req = this.encode_get_current_root_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            const result =
                new RootStateGetCurrentRootOutputResponseJsonCodec().decode_object(
                    await resp.json()
                );
            if (result.err) {
                return result;
            }
            return Ok(result.unwrap());
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.warn(`get_current_root error!`, e);
            return Err(e);
        }
    }

    // create_op_env
    // root_state/op_env POST
    private encode_create_op_env_request(
        req: RootStateCreateOpEnvOutputRequest
    ): HttpRequest {
        const url = this.service_url_.concat("op-env");

        const http_req = new HttpRequest("Post", url);

        this.encode_common_headers(
            RootStateAction.CreateOpEnv,
            req.common,
            http_req
        );

        http_req.set_string_body(
            new RootStateCreateOpEnvOutputRequestJsonCodec().encode_string(req)
        );
        return http_req;
    }

    public async create_op_env(
        req: RootStateCreateOpEnvOutputRequest
    ): Promise<BuckyResult<OpEnvRequestor>> {
        const r = await this.create_op_env_impl(req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();
        const sid = resp.sid;
        const opEnvRequestor = new OpEnvRequestor(
            this.get_category(),
            this.get_base_requestor(),
            req.op_env_type,
            sid,
            this.dec_id_
        );

        return Ok(opEnvRequestor);
    }

    async create_op_env_impl(
        req: RootStateCreateOpEnvOutputRequest
    ): Promise<BuckyResult<RootStateCreateOpEnvOutputResponse>> {
        const http_req = this.encode_create_op_env_request(req);

        const r = await this.requestor_.request(http_req);
        if (r.err) {
            return r;
        }
        const resp = r.unwrap();

        if (resp.status === 200) {
            const ret = await resp.json();
            const result =
                new RootStateCreateOpEnvOutputResponseJsonCodec().decode_object(ret);
            if (result.err) {
                return result;
            }
            const sid = result.unwrap().sid;
            console.info(`create op_env from root state success: sid = ${sid}`);
            return Ok({ sid });
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.warn(`create_op_env error! type=${req.op_env_type},`, e);
            return Err(e);
        }
    }
}

export class OpEnvRequestor {
    private category_: GlobalStateCategory;
    private requestor_: BaseRequestor;
    private op_env_type_: ObjectMapOpEnvType;
    private sid_: JSBI;
    private dec_id_: ObjectId;
    private service_url_: string;

    public constructor(
        category: GlobalStateCategory,
        requestor: BaseRequestor,
        op_env_type: ObjectMapOpEnvType,
        sid: JSBI,
        dec_id: ObjectId
    ) {
        this.category_ = category;
        this.requestor_ = requestor;
        this.op_env_type_ = op_env_type;
        this.sid_ = sid;
        this.dec_id_ = dec_id;

        this.service_url_ = `http://${requestor.remote_addr()}/${category}/op-env/`;
    }

    public get_sid(): JSBI {
        return this.sid_;
    }

    public get_dec_id(): ObjectId {
        return this.dec_id_;
    }

    public get_category(): GlobalStateCategory {
        return this.category_;
    }

    private encode_common_headers(
        action: OpEnvAction,
        com_req: OpEnvOutputRequestCommon,
        http_req: HttpRequest
    ) {
        if (com_req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, com_req.dec_id.to_string());
        } else if (this.dec_id_) {
            http_req.insert_header(CYFS_DEC_ID, this.dec_id_.to_string());
        }

        if (com_req.target) {
            http_req.insert_header(CYFS_TARGET, com_req.target.to_string())
        }

        http_req.insert_header(CYFS_FLAGS, com_req.flags.toString());
        http_req.insert_header(CYFS_OP_ENV_ACTION, action);

        if (JSBI.GT(com_req.sid, 0)) {
            http_req.insert_header(CYFS_OP_ENV_SID, com_req.sid.toString());
        } else {
            http_req.insert_header(CYFS_OP_ENV_SID, this.sid_.toString());
        }
    }

    // load
    // op_env/init/target
    public async load(req: OpEnvLoadOutputRequest): Promise<BuckyResult<void>> {
        if (this.op_env_type_ !== ObjectMapOpEnvType.Single) {
            const err_msg = `load method only valid for single_op_env! sid = ${this.sid_}`;
            console.log(err_msg);
            return Ok(undefined);
        }

        console.info(
            `will load for path_op_env: sid=${this.sid_}, target=${req.target}`
        );

        const http_req = this.encode_load_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(
                `load for path_op_env request failed: sid=${this.sid_}, target=${req.target}, ret=${r}`
            );
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            console.info(
                `load for path_op_env success: sid=${this.sid_}, target=${req.target}`
            );

            return Ok(undefined);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(
                `load for path_op_env failed: sid=${this.sid_}, target=${req.target}, err=${e}`
            );

            return Err(e);
        }
    }
    private encode_load_request(req: OpEnvLoadOutputRequest): HttpRequest {
        const url = this.service_url_.concat("init/target");
        const http_req = new HttpRequest("Post", url);
        this.encode_common_headers(OpEnvAction.Load, req.common, http_req);
        const body = new OpEnvLoadOutputRequestJsonCodec().encode_string(req);
        http_req.set_string_body(body);
        return http_req;
    }

    // load_by_path
    public async load_by_path(
        req: OpEnvLoadByPathOutputRequest
    ): Promise<BuckyResult<void>> {
        if (this.op_env_type_ !== ObjectMapOpEnvType.Single) {
            const msg = `load_by_path method only valid for single_op_env! sid={self.sid_}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.UnSupport, msg));
        }

        console.info(
            `will load_by_path for single_op_env: path=${req.path}, sid=${this.sid_}`
        );

        const http_req = this.encode_load_by_path_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(
                `load_by_path for single_op_env request failed: path=${req.path}, sid=${this.sid_}, ret=${r}`
            );

            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            console.log(
                `load_by_path for single_op_env success: path=${req.path}, sid=${this.sid_}`
            );

            return Ok(undefined);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(
                `load_by_path for single_op_env failed: path=${req.path}, sid=${this.sid_}, er=${e}`
            );

            return Err(e);
        }
    }
    private encode_load_by_path_request(
        req: OpEnvLoadByPathOutputRequest
    ): HttpRequest {
        const url = this.service_url_.concat("init/path");

        const http_req = new HttpRequest("Post", url);
        this.encode_common_headers(OpEnvAction.LoadByPath, req.common, http_req);

        http_req.set_string_body(
            new OpEnvLoadByPathOutputRequestJsonCodec().encode_string(req)
        );

        return http_req;
    }

    // create_new
    public async create_new(
        req: OpEnvCreateNewOutputRequest
    ): Promise<BuckyResult<void>> {
        if (this.op_env_type_ !== ObjectMapOpEnvType.Single) {
            const msg = `create_new method only valid for single_op_env! sid={self.sid_}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.UnSupport, msg));
        }

        const http_req = this.encode_create_new_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(`create_new for single_op_env request failed: sid=${this.sid_}, ret=${r}`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            console.log(`create_new for single_op_env success: sid=${this.sid_}`);

            return Ok(undefined);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`create_new for single_op_env failed: sid=${this.sid_}, err=${e}`);

            return Err(e);
        }
    }
    private encode_create_new_request(
        req: OpEnvCreateNewOutputRequest
    ): HttpRequest {
        const url = this.service_url_.concat("init/new");

        const http_req = new HttpRequest("Post", url);
        this.encode_common_headers(OpEnvAction.CreateNew, req.common, http_req);

        http_req.set_string_body(
            new OpEnvCreateNewOutputRequestJsonCodec().encode_string(req)
        );

        return http_req;
    }

    // lock
    // op_env/{op_env_type}/lock
    public async lock(req: OpEnvLockOutputRequest): Promise<BuckyResult<void>> {
        if (this.op_env_type_ !== ObjectMapOpEnvType.Path) {
            const msg = `lock method only valid for path_op_env! sid={self.sid_}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.UnSupport, msg));
        }

        console.info(`will lock for path_op_env: sid=${this.sid_}, list=${req.path_list}, dur=${req.duration_in_millsecs}`);

        const http_req = this.encode_lock_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(`lock for path_op_env request failed: sid=${this.sid_}, ret=${r}`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            console.log(`lock for path_op_env success: sid=${this.sid_}`);

            return Ok(undefined);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`lock for path_op_env failed: sid=${this.sid_}, err=${e}`);

            return Err(e);
        }
    }
    private encode_lock_request(req: OpEnvLockOutputRequest): HttpRequest {
        const url = this.service_url_.concat("lock");

        const http_req = new HttpRequest("Post", url);
        this.encode_common_headers(OpEnvAction.Lock, req.common, http_req);

        http_req.set_string_body(
            new OpEnvLockOutputRequestJsonCodec().encode_string(req)
        );

        return http_req;
    }

    // commit
    public async commit(
        req: OpEnvCommitOutputRequest
    ): Promise<BuckyResult<OpEnvCommitOutputResponse>> {
        console.info(`will commit for op_env: sid=${this.sid_}`);

        const http_req = this.encode_commit_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(`commit for op_env request failed! sid=${this.sid_}, ret=${r}`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            const result = new OpEnvCommitOutputResponseJsonCodec().decode_object(
                await resp.json()
            );
            if (result.err) {
                console.error(`decode commit for path_op_env resp error: sid=${this.sid_}, ret=${result}`);
                return result;
            }

            const response: OpEnvCommitOutputResponse = result.unwrap();
            console.log(`commit for op_env success: sid=${this.sid_}, resp=${JSON.stringify(response)}`);

            return Ok(response);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`commit for path_op_env failed: sid=${this.sid_}, err=${e}`);

            return Err(e);
        }
    }

    private encode_commit_request(req: OpEnvCommitOutputRequest): HttpRequest {
        const url = this.service_url_.concat("transaction");

        const http_req = new HttpRequest("Post", url);
        this.encode_common_headers(OpEnvAction.Commit, req.common, http_req);

        http_req.set_string_body(
            new OpEnvCommitOutputRequestJsonCodec().encode_string(req)
        );

        return http_req;
    }

    // abort
    public async abort(req: OpEnvAbortOutputRequest): Promise<BuckyResult<void>> {
        console.info(`will abort for op_env: sid=${this.sid_}`);

        const http_req = this.encode_abort_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(`abort for op_env request failed! sid=${this.sid_}, ret=${r}`);

            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            console.log(`abort for path_op_env success: sid=${this.sid_}`);

            return Ok(undefined);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`abort for path_op_env failed: sid=${this.sid_}, err=${e}`);

            return Err(e);
        }
    }
    private encode_abort_request(req: OpEnvAbortOutputRequest): HttpRequest {
        const url = this.service_url_.concat("transaction");

        const http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(OpEnvAction.Abort, req.common, http_req);
        http_req.set_string_body(
            new OpEnvAbortOutputRequestJsonCodec().encode_string(req)
        );

        return http_req;
    }

    // metadata
    public async metadata(
        req: OpEnvMetadataOutputRequest
    ): Promise<BuckyResult<OpEnvMetadataOutputResponse>> {
        console.info(`will metadata, sid=${this.sid_}, path=${req.path}`);

        const http_req = this.encode_metadata_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(`metadata request failed, sid=${this.sid_}, path=${req.path}, ret=${r}`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            const result = new OpEnvMetadataOutputResponseJsonCodec().decode_object(
                await resp.json()
            );
            if (result.err) {
                console.error(`decode metadata resp error, sid=${this.sid_}, path=${req.path}, ret=${result}`);
                return result;
            }

            const response: OpEnvMetadataOutputResponse = result.unwrap();
            console.info(`metadata success, sid=${this.sid_}, path=${req.path}, resp=${JSON.stringify(response)}`);

            return Ok(response);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`get metadata error! sid=${this.sid_}, err=${e}`);

            return Err(e);
        }
    }

    private encode_metadata_request(
        req: OpEnvMetadataOutputRequest
    ): HttpRequest {
        const url = this.service_url_.concat("metadata");
        const http_req = new HttpRequest("Get", url);
        this.encode_common_headers(OpEnvAction.Metadata, req.common, http_req);
        if (req.path) {
            http_req.insert_header(CYFS_OP_ENV_PATH, encodeURI(req.path));
        }

        return http_req;
    }

    // get_by_key
    public async get_by_key(
        req: OpEnvGetByKeyOutputRequest
    ): Promise<BuckyResult<OpEnvGetByKeyOutputResponse>> {
        console.info(`will get_by_key, sid=${this.sid_}, key=${req.path ? req.path : req.key}`);

        const http_req = this.encode_get_by_key_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(`get_by_key request error, sid=${this.sid_}, key=${req.path ? req.path : req.key}, ret=${r}`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            const result = new OpEnvGetByKeyOutputResponseJsonCodec().decode_object(
                await resp.json()
            );
            if (result.err) {
                console.error(`decode get_by_key resp error: sid=${this.sid_}, key=${req.path ? req.path : req.key}, ret=${result}`);
                return result;
            }
            const response: OpEnvGetByKeyOutputResponse = result.unwrap();
            console.info(`get_by_key for op_env success: sid=${this.sid_}, key=${req.path ? req.path : req.key}, value=${response.value}`);

            return Ok(response);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`get_by_key for op_env error: sid=${this.sid_}, err=${e}`);
            return Err(e);
        }
    }

    private encode_get_by_key_request(
        req: OpEnvGetByKeyOutputRequest
    ): HttpRequest {
        const url = this.service_url_.concat("map");

        const http_req = new HttpRequest("Get", url);
        this.encode_common_headers(OpEnvAction.GetByKey, req.common, http_req);

        if (req.path) {
            http_req.insert_header(CYFS_OP_ENV_PATH, encodeURI(req.path!));
        }
        http_req.insert_header(CYFS_OP_ENV_KEY, encodeURI(req.key));
        return http_req;
    }

    // insert_with_key
    public async insert_with_key(
        req: OpEnvInsertWithKeyOutputRequest
    ): Promise<BuckyResult<void>> {
        console.info(`will insert_with_key, sid=${this.sid_}, key=${req.path ? req.path : req.key}, value=${req.value}`);

        const http_req = this.encode_insert_with_key_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(`insert_with_key request error, sid=${this.sid_}, key=${req.path ? req.path : req.key}, ret=${r}`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            console.log(`insert_with_key for op_env success: sid=${this.sid_}, key=${req.path ? req.path : req.key}`);
            return Ok(undefined);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`insert_with_key for op_env failed: sid=${this.sid_}, key=${req.path ? req.path : req.key}`);
            return Err(e);
        }
    }

    private encode_insert_with_key_request(
        req: OpEnvInsertWithKeyOutputRequest
    ): HttpRequest {
        const url = this.service_url_.concat("map");

        const http_req = new HttpRequest("Post", url);
        this.encode_common_headers(OpEnvAction.InsertWithKey, req.common, http_req);

        http_req.set_string_body(
            new OpEnvInsertWithKeyOutputRequestJsonCodec().encode_string(req)
        );

        return http_req;
    }

    // set_with_key
    public async set_with_key(
        req: OpEnvSetWithKeyOutputRequest
    ): Promise<BuckyResult<OpEnvSetWithKeyOutputResponse>> {
        console.info(`will set_with_key, sid=${this.sid_}, key=${req.path ? req.path : req.key}, value=${req.value}, auto_insert=${req.auto_insert}, prev_value=${req.prev_value}`);

        const http_req = this.encode_set_with_key_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(`will set_with_key, sid=${this.sid_}, key=${req.path ? req.path : req.key}, ret=${r}`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            const result = new OpEnvSetWithKeyOutputResponseJsonCodec().decode_object(
                await resp.json()
            );
            if (result.err) {
                console.error(`decode set_with_key resp error: sid=${this.sid_}, key=${req.path ? req.path : req.key}, ret=${result}`);
                return result;
            }

            const response: OpEnvSetWithKeyOutputResponse = result.unwrap();
            console.log(`set_with_key for op_env success: sid=${this.sid_}, key=${req.path ? req.path : req.key}, prev_value=${response.prev_value}`);

            return Ok(response);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`set_with_key for op_env failed: sid=${this.sid_}, key=${req.path ? req.path : req.key}, err=${e}`);
            return Err(e);
        }
    }

    private encode_set_with_key_request(
        req: OpEnvSetWithKeyOutputRequest
    ): HttpRequest {
        const url = this.service_url_.concat("map");

        const http_req = new HttpRequest("Put", url);
        this.encode_common_headers(OpEnvAction.SetWithKey, req.common, http_req);

        http_req.set_string_body(
            new OpEnvSetWithKeyOutputRequestJsonCodec().encode_string(req)
        );

        return http_req;
    }

    // remove_with_key
    public async remove_with_key(
        req: OpEnvRemoveWithKeyOutputRequest
    ): Promise<BuckyResult<OpEnvRemoveWithKeyOutputResponse>> {
        console.info(`will remove_with_key, sid=${this.sid_}, key=${req.path ? req.path : req.key}, prev_value=${req.prev_value}`);

        const http_req = this.encode_remove_with_key_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(`remove_with_key request error, sid=${this.sid_}, key=${req.path ? req.path : req.key}, ret=${r}`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            console.log(`remove_with_key for op_env success: sid=${this.sid_}`);
            const result =
                new OpEnvRemoveWithKeyOutputResponseJsonCodec().decode_object(
                    await resp.json()
                );
            if (result.err) {
                console.error(`decode remove_with_key resp error, sid=${this.sid_}, key=${req.path ? req.path : req.key}, ret=${result}`);
                return result;
            }

            const response: OpEnvRemoveWithKeyOutputResponse = result.unwrap();
            console.info(`remove_with_key success, sid=${this.sid_}, key=${req.path ? req.path : req.key}, prev_value=${response.value}`);

            return Ok(response);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`remove_with_key error, sid=${this.sid_}, key=${req.path ? req.path : req.key}, err=${e}`);
            return Err(e);
        }
    }
    private encode_remove_with_key_request(
        req: OpEnvRemoveWithKeyOutputRequest
    ): HttpRequest {
        const url = this.service_url_.concat("map");

        const http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(OpEnvAction.RemoveWithKey, req.common, http_req);

        http_req.set_string_body(
            new OpEnvRemoveWithKeyOutputRequestJsonCodec().encode_string(req)
        );

        return http_req;
    }

    // contains
    public async contains(
        req: OpEnvContainsOutputRequest
    ): Promise<BuckyResult<OpEnvContainsOutputResponse>> {
        console.info(`will contains, sid=${this.sid_}, key=${req.path}, value=${req.value}`);

        const http_req = this.encode_contains_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.info(`contains request error, sid=${this.sid_}, key=${req.path}, ret=${r}`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            const result = new OpEnvSetResponseJsonCodec().decode_object(
                await resp.json()
            );
            if (result.err) {
                console.error(`decode contains resp error, sid=${this.sid_}, key=${req.path}, ret=${result}`);
                return result;
            }

            const response: OpEnvContainsOutputResponse = result.unwrap();
            console.info(`contains success, sid=${this.sid_}, key=${req.path}, exists=${response.result}`);

            return Ok(response);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`contains failed, sid=${this.sid_}, key=${req.path}, err=${e}`);
            return Err(e);
        }
    }

    private encode_contains_request(
        req: OpEnvContainsOutputRequest
    ): HttpRequest {
        const url = this.service_url_.concat("set");

        const http_req = new HttpRequest("Get", url);
        this.encode_common_headers(OpEnvAction.Contains, req.common, http_req);

        if (req.path) {
            http_req.insert_header(CYFS_OP_ENV_PATH, encodeURI(req.path!));
        }
        http_req.insert_header(CYFS_OP_ENV_VALUE, req.value.toString());
        return http_req;
    }

    // insert
    public async insert(
        req: OpEnvInsertOutputRequest
    ): Promise<BuckyResult<OpEnvInsertOutputResponse>> {
        console.info(`will insert, sid=${this.sid_}, key=${req.path}, value=${req.value}`);

        const http_req = this.encode_insert_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.info(`insert request error, sid=${this.sid_}, key=${req.path}, value=${req.value}, ret=${r}`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            const result = new OpEnvSetResponseJsonCodec().decode_object(
                await resp.json()
            );
            if (result.err) {
                console.error(`decode insert resp error, sid=${this.sid_}, key=${req.path}, value=${req.value}, ret=${result}`);
                return result;
            }

            const response: OpEnvInsertOutputResponse = result.unwrap();
            console.info(`insert success, sid=${this.sid_}, key=${req.path}, value=${req.value}, result=${response.result}`);

            return Ok(response);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`insert failed, sid=${this.sid_}, key=${req.path}, value=${req.value}, err=${e}`);

            return Err(e);
        }
    }
    private encode_insert_request(req: OpEnvInsertOutputRequest): HttpRequest {
        const url = this.service_url_.concat("set");

        const http_req = new HttpRequest("Post", url);
        this.encode_common_headers(OpEnvAction.Insert, req.common, http_req);

        http_req.set_string_body(
            new OpEnvSetOutputRequestJsonCodec().encode_string(req)
        );

        return http_req;
    }

    // remove
    public async remove(
        req: OpEnvRemoveOutputRequest
    ): Promise<BuckyResult<OpEnvRemoveOutputResponse>> {
        console.info(`will remove, sid=${this.sid_}, key=${req.path}, value=${req.value}`);

        const http_req = this.encode_remove_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.info(`remove request error, sid=${this.sid_}, key=${req.path}, value=${req.value}, ret=${r}`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            console.log(`remove for op_env success: sid=${this.sid_}`);
            const result = new OpEnvSetResponseJsonCodec().decode_object(
                await resp.json()
            );
            if (result.err) {
                console.error(`decode remove resp error, sid=${this.sid_}, key=${req.path}, value=${req.value}, ret=${result}`);
                return result;
            }
            const response: OpEnvRemoveOutputResponse = result.unwrap();
            console.info(`remove success, sid=${this.sid_}, key=${req.path}, value=${req.value}, result=${response.result}`);

            return Ok(response);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`remove failed, sid=${this.sid_}, key=${req.path}, value=${req.value}, err=${e}`);

            return Err(e);
        }
    }
    private encode_remove_request(req: OpEnvRemoveOutputRequest): HttpRequest {
        const url = this.service_url_.concat("set");

        const http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(OpEnvAction.Remove, req.common, http_req);

        http_req.set_string_body(
            new OpEnvSetOutputRequestJsonCodec().encode_string(req)
        );

        return http_req;
    }

    // next
    public async next(
        req: OpEnvNextOutputRequest
    ): Promise<BuckyResult<OpEnvNextOutputResponse>> {
        console.info(`will next, sid=${this.sid_}, step=${req.step}`);

        const http_req = this.encode_next_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(`next request failed, sid=${this.sid_}, step=${req.step}`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            const result = new OpEnvNextOutputResponseJsonCodec().decode_object(
                await resp.json()
            );
            if (result.err) {
                console.error(`decode next resp failed, sid=${this.sid_}, ret=${result}`);
                return result;
            }
            const response: OpEnvNextOutputResponse = result.unwrap();
            console.info(`next success, sid=${this.sid_}, step=${req.step}, count=${response.list.length}`);

            return Ok(response);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`next failed, sid=${this.sid_}, err=${e}`);
            return Err(e);
        }
    }

    private encode_next_request(req: OpEnvNextOutputRequest): HttpRequest {
        const url = this.service_url_.concat("iterator");

        const http_req = new HttpRequest("Post", url);
        this.encode_common_headers(OpEnvAction.Next, req.common, http_req);

        http_req.set_string_body(
            new OpEnvNextOutputRequestJsonCodec().encode_string(req)
        );

        return http_req;
    }
}

export class GlobalStateAccessRequestor {
    private category_: GlobalStateCategory;
    private service_url_: string;
    private dec_id_: ObjectId;
    private requestor_: BaseRequestor;

    public static new_root_state_access(requestor: BaseRequestor, dec_id?: ObjectId): GlobalStateAccessRequestor {
        return new GlobalStateAccessRequestor(GlobalStateCategory.RootState, requestor, dec_id)
    }

    public static new_local_cache_access(requestor: BaseRequestor, dec_id?: ObjectId): GlobalStateAccessRequestor {
        return new GlobalStateAccessRequestor(GlobalStateCategory.LocalCache, requestor, dec_id)
    }

    public constructor(category: GlobalStateCategory, requestor: BaseRequestor, dec_id?: ObjectId) {
        this.category_ = category;
        this.dec_id_ = dec_id!;
        this.requestor_ = requestor;
        this.service_url_ = `http://${requestor.remote_addr()}/${category}/`;
    }

    public get_dec_id(): ObjectId {
        return this.dec_id_;
    }

    public get_category(): GlobalStateCategory {
        return this.category_;
    }

    private gen_url(inner_path: string): string {
        const str = inner_path.startsWith('/') ? inner_path.substring(1) : inner_path;
        return this.service_url_.concat(str) + "?mode=object";
    }

    private encode_common_headers(
        com_req: RootStateOutputRequestCommon,
        http_req: HttpRequest
    ) {
        if (com_req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, com_req.dec_id.to_string());
        } else if (this.dec_id_) {
            http_req.insert_header(CYFS_DEC_ID, this.dec_id_.to_string());
        }

        if (com_req.target) {
            http_req.insert_header(CYFS_TARGET, com_req.target.to_string())
        }
        http_req.insert_header(CYFS_FLAGS, com_req.flags.toString());

    }

    private encode_get_object_by_path_request(
        req: RootStateAccessGetObjectByPathOutputRequest
    ): HttpRequest {
        const url = this.gen_url(req.inner_path);
        const http_req = new HttpRequest("Get", url);
        this.encode_common_headers(req.common, http_req);
        return http_req;
    }

    public async get_object_by_path(
        req: RootStateAccessGetObjectByPathOutputRequest
    ): Promise<BuckyResult<RootStateAccessGetObjectByPathOutputResponse>> {
        console.info("begin get_object_by_path request");
        const http_req = this.encode_get_object_by_path_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(`get_object_by_path request error`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            console.info(`get_object_by_path success`);
            return await this.decode_get_object_response(resp);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`get_object_by_path error ${e}`);
            return Err(e);
        }
    }

    private async decode_get_object_response(
        resp: Response
    ): Promise<BuckyResult<RootStateAccessGetObjectByPathOutputResponse>> {
        const r = await NONRequestorHelper.decode_get_object_response(resp)
        if (r.err) {
            console.error(`decode object from resp bytes error: ${r.val}`);
            return r;
        }

        const object = r.unwrap();

        const root = RequestorHelper.decode_header(resp, CYFS_ROOT, s => ObjectId.from_base_58(s).unwrap());
        if (root.err) {
            console.error(`decode list resp root header error`, root);
            return root;
        }

        const revision = RequestorHelper.decode_header(resp, CYFS_REVISION, s => JSBI.BigInt(s));
        if (revision.err) {
            console.error(`decode list resp root header error`, revision);
            return revision;
        }

        const response = {
            object,
            root: root.unwrap(),
            revision: revision.unwrap(),
        };

        return Ok(response)
    }

    private encode_list_request(
        req: RootStateAccessListOutputRequest
    ): HttpRequest {
        const url = new URL(this.gen_url(req.inner_path));
        url.searchParams.append("action", "list");

        if (req.page_index != null) {
            url.searchParams.append("page_index", req.page_index.toString());
        }

        if (req.page_size != null) {
            url.searchParams.append("page_size", req.page_size.toString());
        }

        const http_req = new HttpRequest("Get", url.toString());
        this.encode_common_headers(req.common, http_req);
        return http_req;
    }

    public async list(
        req: RootStateAccessListOutputRequest
    ): Promise<BuckyResult<RootStateAccessListOutputResponse>> {
        console.info("begin list request");
        const http_req = this.encode_list_request(req);
        const r = await this.requestor_.request(http_req);
        if (r.err) {
            console.error(`list request error`);
            return r;
        }

        const resp = r.unwrap();
        if (resp.status === 200) {
            const result = new RootStateAccessListOutputSlimResponseJsonCodec().decode_object(
                await resp.json()
            );
            if (result.err) {
                console.error(`decode list resp error`, result);
                return result;
            }
            const slim_resp = result.unwrap();

            const root = RequestorHelper.decode_header(resp, CYFS_ROOT, s => ObjectId.from_base_58(s).unwrap());
            if (root.err) {
                console.error(`decode list resp root header error`, root);
                return root;
            }

            const revision = RequestorHelper.decode_header(resp, CYFS_REVISION, s => JSBI.BigInt(s));
            if (revision.err) {
                console.error(`decode list resp root header error`, revision);
                return revision;
            }

            const response: RootStateAccessListOutputResponse = {
                list: slim_resp.list,
                root: root.unwrap(),
                revision: revision.unwrap(),
            };

            console.info(`list  success`, JSON.stringify(response));

            return Ok(response);
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`list error ${e}`);
            return Err(e);
        }
    }
}