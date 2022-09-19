import { BuckyResult, Ok, ObjectId, BuckyErrorCode, Err, BuckyError } from "../../cyfs-base";
import { JsonCodec } from "../base/codec";

export enum NDNAction {
    PutData = "put-data",
    GetData = "get-data",
    DeleteData = "delete-data",

    PutSharedData = "put-shared-data",
    GetSharedData = "get-shared-data",

    QueryFile = "query-file",
}

export enum NDNAPILevel {
    NDC = "ndc",
    NDN = "ndn",
    Router = "router",
}

export enum NDNPutDataResult {
    Accept = "Accept",
    AlreadyExists = "AlreadyExists",
}

export class NDNDataRefererObject {
    constructor(public object_id: ObjectId, public inner_path?: string) {}
    toString(): string {
        if (this.inner_path) {
            return `${this.object_id.toString()}/${this.inner_path}`;
        } else {
            return this.object_id.toString();
        }
    }
    toJSON():string {
        return this.toString();
    }
}

export class NDNDataRefererObjectJsonCodec extends JsonCodec<NDNDataRefererObject> {
    constructor(){super()}

    decode_object(o: any): BuckyResult<NDNDataRefererObject> {
        const parts = (o as string).split("/");
        if (parts.length == 0) {
            const msg = `invalid NDNDataRefererObject, object_id not found! ${o}`;
            console.error(msg)
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }
        const id = ObjectId.from_base_58(parts[0]);
        if (id.err) {
            return id;
        }
        let inner_path;
        if (parts.length > 1) {
            inner_path = parts.slice(1).join("/");
        }

        return Ok(new NDNDataRefererObject(id.unwrap(), inner_path));
    }
}