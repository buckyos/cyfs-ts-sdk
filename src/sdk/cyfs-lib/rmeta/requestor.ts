import { BuckyResult, CYFS_DEC_ID, CYFS_FLAGS, CYFS_META_ACTION, CYFS_TARGET, Err, error, ObjectId, Ok } from "../../cyfs-base";
import { BaseRequestor, RequestorHelper } from "../base/base_requestor";
import { HttpRequest } from "../base/http_request";
import { GlobalStateCategory } from "../root_state/def";
import { GlobalStatePathAccessItem, MetaAction } from "./def";
import { GlobalStateMetaAddAccessOutputRequest, GlobalStateMetaAddAccessOutputResponse, GlobalStateMetaAddLinkOutputRequest, GlobalStateMetaAddLinkOutputResponse, GlobalStateMetaClearAccessOutputRequest, GlobalStateMetaClearAccessOutputResponse, GlobalStateMetaClearLinkOutputRequest, GlobalStateMetaClearLinkOutputResponse, GlobalStateMetaRemoveAccessOutputRequest, GlobalStateMetaRemoveAccessOutputResponse, GlobalStateMetaRemoveLinkOutputRequest, GlobalStateMetaRemoveLinkOutputResponse, MetaOutputRequestCommon } from "./output_request";

class MetaRequestorHelper {
    static encode_add_req(req: GlobalStateMetaAddAccessOutputRequest): any {
        return {common: req.common, item: req.item.to_obj()}
    }

    static async decode_remove_resp(resp: Response): Promise<GlobalStateMetaRemoveAccessOutputResponse> {
        let resp_obj = await resp.json();
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

        http_req.insert_header(CYFS_FLAGS, com_req.flags.toString());

        http_req.insert_header(CYFS_META_ACTION, action);
    }

    // global-state-meta add-access
    encode_add_access_request(req: GlobalStateMetaAddAccessOutputRequest): HttpRequest {
        let url = this.service_url + "access";
        let http_req = new HttpRequest("Put", url);
        this.encode_common_headers(MetaAction.GlobalStateAddAccess, req.common, http_req);

        http_req.set_json_body(MetaRequestorHelper.encode_add_req(req));
        return http_req;
    }

    async add_access(
        req: GlobalStateMetaAddAccessOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaAddAccessOutputResponse>> {
        let http_req = this.encode_add_access_request(req);
        let resp_r = await this.requestor.request(http_req);
        if (resp_r.err) {
            return resp_r;
        }
        let resp = resp_r.unwrap()

        if (resp.status === 200) {
            let p = (await resp.json()) as GlobalStateMetaAddAccessOutputResponse;
            console.info(`global state meta add access success: req=${req}, resp=${p}`);
            return Ok(p)
        } else {
            let e = await RequestorHelper.error_from_resp(resp);
            console.error(`global state meta add access console.error req=${req}, ${e}`);
            return Err(e)
        }
    }

    // global-state-meta remove-access
    encode_remove_access_request(req: GlobalStateMetaRemoveAccessOutputRequest): HttpRequest {
        let url = this.service_url + "access";
        let http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(
            MetaAction.GlobalStateRemoveAccess,
            req.common,
            http_req,
        );

        http_req.set_json_body(MetaRequestorHelper.encode_add_req(req));
        return http_req;
    }

    async remove_access(req: GlobalStateMetaRemoveAccessOutputRequest): Promise<BuckyResult<GlobalStateMetaRemoveAccessOutputResponse>> {
        let http_req = this.encode_remove_access_request(req);
        let resp_r = await this.requestor.request(http_req);
        if (resp_r.err) {
            return resp_r;
        }
        let resp = resp_r.unwrap()

        if (resp.status === 200) {
            let p = await MetaRequestorHelper.decode_remove_resp(resp)
            console.info(
                `global state meta remove access success: req=${req}, resp=${resp}`,
                req, p,
            );
            return Ok(p)
        } else {
            let e = await RequestorHelper.error_from_resp(resp);
            console.error(`global state meta remove access console.error req=${req}, ${e}`);
            return Err(e)
        }
    }

    // global-state-meta clear-access
    encode_clear_access_request(req: GlobalStateMetaClearAccessOutputRequest): HttpRequest {
        let url = this.service_url + "accesses";
        let http_req = new HttpRequest("Delete", url);
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
        let http_req = this.encode_clear_access_request(req);
        let resp_r = await this.requestor.request(http_req);
        if (resp_r.err) {
            return resp_r;
        }
        let resp = resp_r.unwrap()
        if (resp.status === 200) {
            let p = (await resp.json()) as GlobalStateMetaClearAccessOutputResponse
            console.info(
                `global state meta clear access success: req=${req}, resp=${p}`
            );
            return Ok(p)
        } else {
            let e = await RequestorHelper.error_from_resp(resp);
            console.error(`global state meta clear access console.error req=${req}, ${e}`);
            return Err(e)
        }
    }

    // global-state-meta add-link
    encode_add_link_request( req: GlobalStateMetaAddLinkOutputRequest): HttpRequest {
        let url = this.service_url + "link";
        let http_req = new HttpRequest("Put", url);
        this.encode_common_headers(MetaAction.GlobalStateAddLink, req.common, http_req);

        http_req.set_json_body(req);
        return http_req
    }

    async add_link(
        req: GlobalStateMetaAddLinkOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaAddLinkOutputResponse>> {
        let http_req = this.encode_add_link_request(req);
        let resp_r = await this.requestor.request(http_req);
        if (resp_r.err) {
            return resp_r;
        }
        let resp = resp_r.unwrap()

        if (resp.status === 200) {
            let p = (await resp.json()) as GlobalStateMetaAddLinkOutputResponse
            console.info(
                `global state meta add link success: req=${req}, resp=${p}`,
            );
            return Ok(p)
        } else {
            let e = await RequestorHelper.error_from_resp(resp);
            console.error(`global state meta add link console.error req=${req}, ${e}`);
            return Err(e)
        }
    }

    // global-state-meta remove-access
    encode_remove_link_request( req: GlobalStateMetaRemoveLinkOutputRequest): HttpRequest {
        let url = this.service_url + "link";
        let http_req = new HttpRequest("Delete", url);
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
        let http_req = this.encode_remove_link_request(req);
        let resp_r = await this.requestor.request(http_req);
        if (resp_r.err) {
            return resp_r;
        }
        let resp = resp_r.unwrap()

        if (resp.status === 200) {
            let p = (await resp.json()) as GlobalStateMetaRemoveLinkOutputResponse
            console.info(
                `global state meta remove link success: req=${req}, resp=${p}`,
                req, resp,
            );
            return Ok(p)
        } else {
            let e = await RequestorHelper.error_from_resp(resp);
            console.error(`global state meta remove link console.error req=${req}, ${e}`);
            return Err(e)
        }
    }

    // global-state-meta clear-link
    encode_clear_link_request( req: GlobalStateMetaClearLinkOutputRequest): HttpRequest {
        let url = this.service_url + "links";
        let http_req = new HttpRequest("Delete", url);
        this.encode_common_headers(MetaAction.GlobalStateClearLink, req.common, http_req);

        http_req.set_json_body(req);
        return http_req
    }

    async clear_link(
        req: GlobalStateMetaClearLinkOutputRequest,
    ): Promise<BuckyResult<GlobalStateMetaClearLinkOutputResponse>> {
        let http_req = this.encode_clear_link_request(req);
        let resp_r = await this.requestor.request(http_req);
        if (resp_r.err) {
            return resp_r;
        }
        let resp = resp_r.unwrap()

        if (resp.status === 200) {
            let p = (await resp.json()) as GlobalStateMetaClearLinkOutputResponse
            console.info(
                `global state meta clear links success: req=${req}, resp=${p}`
            );
            return Ok(p)
        } else {
            let e = await RequestorHelper.error_from_resp(resp);
            console.error(`global state meta clear links console.error req=${req}, ${e}`, req, e);
            return Err(e)
        }
    }
}