import { BuckyResult, CYFS_DEC_ID, CYFS_FLAGS, CYFS_META_ACTION, CYFS_TARGET, CYFS_TARGET_DEC_ID, Err, error, ObjectId, Ok } from "../../cyfs-base";
import { BaseRequestor, RequestorHelper } from "../base/base_requestor";
import { JsonCodec } from "../base/codec";
import { HttpRequest } from "../base/http_request";
import { GlobalStateCategory } from "../root_state/def";
import { GlobalStatePathAccessItem, GlobalStatePathGroupAccess, MetaAction } from "./def";
import { GlobalStateMetaAddAccessOutputRequest, GlobalStateMetaAddAccessOutputResponse, GlobalStateMetaAddLinkOutputRequest, GlobalStateMetaAddLinkOutputResponse, GlobalStateMetaAddObjectMetaOutputRequest, GlobalStateMetaAddObjectMetaOutputResponse, GlobalStateMetaAddPathConfigOutputRequest, GlobalStateMetaAddPathConfigOutputResponse, GlobalStateMetaClearAccessOutputRequest, GlobalStateMetaClearAccessOutputResponse, GlobalStateMetaClearLinkOutputRequest, GlobalStateMetaClearLinkOutputResponse, GlobalStateMetaClearObjectMetaOutputRequest, GlobalStateMetaClearObjectMetaOutputResponse, GlobalStateMetaClearPathConfigOutputRequest, GlobalStateMetaClearPathConfigOutputResponse, GlobalStateMetaRemoveAccessOutputRequest, GlobalStateMetaRemoveAccessOutputResponse, GlobalStateMetaRemoveLinkOutputRequest, GlobalStateMetaRemoveLinkOutputResponse, GlobalStateMetaRemoveObjectMetaOutputRequest, GlobalStateMetaRemoveObjectMetaOutputResponse, GlobalStateMetaRemovePathConfigOutputRequest, GlobalStateMetaRemovePathConfigOutputResponse, MetaOutputRequestCommon } from "./output_request";

class MetaRequestorHelper {
    static encode_add_req(req: GlobalStateMetaAddAccessOutputRequest): any {
        return {common: req.common, item: req.item.to_obj()}
    }

    static async decode_remove_resp(resp: Response): Promise<GlobalStateMetaRemoveAccessOutputResponse> {
        const resp_obj = await resp.json();
        return {item: resp_obj.item?GlobalStatePathAccessItem.from_obj(resp_obj.item):undefined}
    }
}

export class GlobalStateMetaRequestor {
    service_url: string;

    constructor(public category: GlobalStateCategory, private requestor: BaseRequestor, private dec_id?: ObjectId) {
        this.service_url = `http://${requestor.remote_addr()}/${this.category}/meta/`;
    }

    static new_root_state(requestor: BaseRequestor, dec_id?: ObjectId): GlobalStateMetaRequestor {
        return new GlobalStateMetaRequestor(GlobalStateCategory.RootState, requestor, dec_id);
    }

    static new_local_cache(requestor: BaseRequestor, dec_id?: ObjectId): GlobalStateMetaRequestor {
        return new GlobalStateMetaRequestor(GlobalStateCategory.LocalCache, requestor, dec_id);
    }

    encode_common_headers(
        action: MetaAction,
        com_req: MetaOutputRequestCommon,
        http_req: HttpRequest,
    ): void {
        if (com_req.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, com_req.dec_id.to_string());
        } else if (this.dec_id) {
            http_req.insert_header(CYFS_DEC_ID, this.dec_id.to_string());
        }
        if (com_req.target) {
            http_req.insert_header(CYFS_TARGET, com_req.target.to_base_58());
        }
        if (com_req.target_dec_id) {
            http_req.insert_header(CYFS_TARGET_DEC_ID, com_req.target_dec_id.to_base_58());
        }

        http_req.insert_header(CYFS_FLAGS, com_req.flags.toString());

        http_req.insert_header(CYFS_META_ACTION, action);
    }

    async request<T>(http_req: HttpRequest, name: string, req: any, decoder?: (resp: Response) => Promise<T>): Promise<BuckyResult<T>> {
        const resp_r = await this.requestor.request(http_req);
        if (resp_r.err) {
            return resp_r;
        }
        const resp = resp_r.unwrap()

        if (resp.status === 200) {
            let p;
            if (decoder) {
                p = await decoder(resp)
            } else {
                p = (await resp.json()) as T;
            }
            console.info(`global state meta ${name} success: req=${JSON.stringify(req)}, resp=${JSON.stringify(p)}`);
            return Ok(p)
        } else {
            const e = await RequestorHelper.error_from_resp(resp);
            console.error(`global state meta ${name} error! req=${JSON.stringify(req)}, ${e}`);
            return Err(e)
        }
    }

    // global-state-meta add-access
    encode_add_access_request(req: GlobalStateMetaAddAccessOutputRequest): HttpRequest {
        const url = this.service_url + "access";
        const http_req = new HttpRequest("Put", url);
        this.encode_common_headers(MetaAction.GlobalStateAddAccess, req.common, http_req);

        http_req.set_json_body(MetaRequestorHelper.encode_add_req(req));
        return http_req;
    }

    async add_access(
        req: GlobalStateMetaAddAccessOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaAddAccessOutputResponse>> {
        const http_req = this.encode_add_access_request(req);
        return this.request(http_req, "add access", req);
    }

    // global-state-meta remove-access
    encode_remove_access_request(req: GlobalStateMetaRemoveAccessOutputRequest): HttpRequest {
        const url = this.service_url + "access";
        const http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(
            MetaAction.GlobalStateRemoveAccess,
            req.common,
            http_req,
        );

        http_req.set_json_body(MetaRequestorHelper.encode_add_req(req));
        return http_req;
    }

    async remove_access(req: GlobalStateMetaRemoveAccessOutputRequest): Promise<BuckyResult<GlobalStateMetaRemoveAccessOutputResponse>> {
        const http_req = this.encode_remove_access_request(req);
        return this.request(http_req, "remove access", req, async (resp) => {
            return await MetaRequestorHelper.decode_remove_resp(resp)
        });
    }

    // global-state-meta clear-access
    encode_clear_access_request(req: GlobalStateMetaClearAccessOutputRequest): HttpRequest {
        const url = this.service_url + "accesses";
        const http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(
            MetaAction.GlobalStateClearAccess,
            req.common,
            http_req,
        );

        http_req.set_json_body(req);
        return http_req
    }

    async clear_access(
        req: GlobalStateMetaClearAccessOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaClearAccessOutputResponse>> {
        const http_req = this.encode_clear_access_request(req);
        return this.request(http_req, "clear access", req)
    }

    // global-state-meta add-link
    encode_add_link_request( req: GlobalStateMetaAddLinkOutputRequest): HttpRequest {
        const url = this.service_url + "link";
        const http_req = new HttpRequest("Put", url);
        this.encode_common_headers(MetaAction.GlobalStateAddLink, req.common, http_req);

        http_req.set_json_body(req);
        return http_req
    }

    async add_link(
        req: GlobalStateMetaAddLinkOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaAddLinkOutputResponse>> {
        const http_req = this.encode_add_link_request(req);
        return this.request(http_req, "add link", req);
    }

    // global-state-meta remove-access
    encode_remove_link_request( req: GlobalStateMetaRemoveLinkOutputRequest): HttpRequest {
        const url = this.service_url + "link";
        const http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(
            MetaAction.GlobalStateRemoveLink,
            req.common,
            http_req,
        );

        http_req.set_json_body(req);
        return http_req
    }

    async remove_link(
        req: GlobalStateMetaRemoveLinkOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaRemoveLinkOutputResponse>> {
        const http_req = this.encode_remove_link_request(req);
        return this.request(http_req, "remove link", req);
    }

    // global-state-meta clear-link
    encode_clear_link_request( req: GlobalStateMetaClearLinkOutputRequest): HttpRequest {
        const url = this.service_url + "links";
        const http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(MetaAction.GlobalStateClearLink, req.common, http_req);

        http_req.set_json_body(req);
        return http_req
    }

    async clear_link(
        req: GlobalStateMetaClearLinkOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaClearLinkOutputResponse>> {
        const http_req = this.encode_clear_link_request(req);
        return this.request(http_req, "clear link", req);
    }

    encode_add_object_meta_request(req: GlobalStateMetaAddObjectMetaOutputRequest): HttpRequest {
        const url = this.service_url + "object-meta";
        const http_req = new HttpRequest("Put", url);
        this.encode_common_headers(
            MetaAction.GlobalStateAddObjectMeta,
            req.common,
            http_req,
        );

        http_req.set_json_body(req);
        return http_req;
    }

    async add_object_meta(
        req: GlobalStateMetaAddObjectMetaOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaAddObjectMetaOutputResponse>> {
        const http_req = this.encode_add_object_meta_request(req);
        return this.request(http_req, "add object meta", req);
    }

    encode_remove_object_meta_request(
        req: GlobalStateMetaRemoveObjectMetaOutputRequest,
    ): HttpRequest {
        const url = this.service_url + "object-meta";
        const http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(
            MetaAction.GlobalStateRemoveObjectMeta,
            req.common,
            http_req,
        );

        http_req.set_json_body(req);
        return http_req;
    }

    async remove_object_meta(
        req: GlobalStateMetaRemoveObjectMetaOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaRemoveObjectMetaOutputResponse>> {
        const http_req = this.encode_remove_object_meta_request(req);
        return this.request(http_req, "remove object meta", req, async (resp) => {
            const resp_obj = await resp.json();
            if (resp_obj.item) {
                resp_obj.item.access = GlobalStatePathGroupAccess.from_obj(resp_obj.item.access)
            }
            return resp_obj as GlobalStateMetaRemoveObjectMetaOutputResponse;
        });
    }

    encode_clear_object_meta_request(
        req: GlobalStateMetaClearObjectMetaOutputRequest,
    ): HttpRequest {
        const url = this.service_url + "object-metas";
        const http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(
            MetaAction.GlobalStateClearObjectMeta,
            req.common,
            http_req,
        );

        http_req.set_json_body(req);
        return http_req;
    }

    async clear_object_meta(
        req: GlobalStateMetaClearObjectMetaOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaClearObjectMetaOutputResponse>> {
        const http_req = this.encode_clear_object_meta_request(req);
        return this.request(http_req, "clear object meta", req)
    }


    encode_add_path_config_request(req: GlobalStateMetaAddPathConfigOutputRequest): HttpRequest {
        const url = this.service_url + "path-config";
        const http_req = new HttpRequest("Put", url);
        this.encode_common_headers(
            MetaAction.GlobalStateAddPathConfig,
            req.common,
            http_req,
        );

        http_req.set_json_body(req);
        return http_req;
    }

    async add_path_config(
        req: GlobalStateMetaAddPathConfigOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaAddPathConfigOutputResponse>> {
        const http_req = this.encode_add_path_config_request(req);
        return this.request(http_req, "add path config", req);
    }

    encode_remove_path_config_request(
        req: GlobalStateMetaRemovePathConfigOutputRequest,
    ): HttpRequest {
        const url = this.service_url + "path-config";
        const http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(
            MetaAction.GlobalStateRemovePathConfig,
            req.common,
            http_req,
        );

        http_req.set_json_body(req);
        return http_req;
    }

    async remove_path_config(
        req: GlobalStateMetaRemovePathConfigOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaRemovePathConfigOutputResponse>> {
        const http_req = this.encode_remove_path_config_request(req);
        return this.request(http_req, "remove path config", req);
    }

    encode_clear_path_config_request(
        req: GlobalStateMetaClearPathConfigOutputRequest,
    ): HttpRequest {
        const url = this.service_url + "path-config";
        const http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(
            MetaAction.GlobalStateClearPathConfig,
            req.common,
            http_req,
        );

        http_req.set_json_body(req);
        return http_req;
    }

    async clear_path_config(
        req: GlobalStateMetaClearPathConfigOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaClearPathConfigOutputResponse>> {
        const http_req = this.encode_clear_object_meta_request(req);
        return this.request(http_req, "clear path config", req)
    }
}