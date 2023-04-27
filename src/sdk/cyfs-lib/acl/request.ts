import { JsonCodec } from "..";
import { AccessPermissions, BuckyResult, ObjectId, Ok } from "../../cyfs-base";
import { RequestSourceInfo, SourceHelper } from "../access/source";
import { AclAction } from "./def";

export interface AclHandlerRequest {
    // The request's target dec
    dec_id: ObjectId,

    // request source
    source: RequestSourceInfo,

    // full req_path = {req_path}?{query_string}
    req_path: string,
    req_query_string?: string,

    // The required permissions
    permissions: AccessPermissions,
}

export class AclHandlerRequestJsonCodec extends JsonCodec<AclHandlerRequest> {
    encode_object(param: AclHandlerRequest): any {
        return {
            source: SourceHelper.source_to_obj(param.source),
            req_path: param.req_path,
            req_query_string: param.req_query_string,
            dec_id: param.dec_id,
            permissions: param.permissions
        };
    }

    decode_object(o: any): BuckyResult<AclHandlerRequest> {
        const dec_id = ObjectId.from_base_58(o.dec_id);
        if (dec_id.err) {
            return dec_id;
        }

        const permissions = AccessPermissions.from_str(o.permissions);
        if (permissions.err) {
            return permissions;
        }

        return Ok({
            dec_id: dec_id.unwrap(),
            source: SourceHelper.obj_to_source(o.source),
            req_path: o.req_path,
            req_query_string: o.req_query_string,
            permissions: permissions.unwrap()
        });
    }
}

export interface AclHandlerResponse {
    action: AclAction,
}

export class AclHandlerResponseJsonCodec extends JsonCodec<AclHandlerResponse> {}