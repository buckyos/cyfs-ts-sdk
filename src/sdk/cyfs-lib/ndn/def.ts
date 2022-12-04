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

export enum NDNDataType {
    Mem = "memory",
    SharedMem = "shared_memory",
}

export class NDNDataRefererObject {
    constructor(public target: ObjectId|undefined, public object_id: ObjectId, public inner_path?: string) {}
    toString(): string {
        let last;
        if (this.inner_path) {
            let inner_path = this.inner_path;
            if (inner_path.startsWith("/")) {
                inner_path = inner_path.substring(1);
            }

            last = `${this.object_id.toString()}/${inner_path}`;
        } else {
            last = this.object_id.toString();
        }

        if (this.target) {
            last = `${this.target.toString()}:${last}`
        }

        return encodeURIComponent(last);
    }

    static from_str(org_value: string): BuckyResult<NDNDataRefererObject> {
        const value = decodeURIComponent(org_value);
        const parts = value.split("/");
        if (parts.length === 0) {
            const msg = `invalid NDNDataRefererObject, object_id not found! ${value}`;
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        const id_parts = parts[0].split(":");
        let target, object_id;
        if (id_parts.length === 1) {
            const r = ObjectId.from_str(id_parts[0]);
            if (r.err) {
                const msg = `invalid NDNDataRefererObject object_id format! ${value}, ${r.val}`
                console.error(msg);
                return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg))
            }

            object_id = r.unwrap();
        } else if (id_parts.length === 2) {
            let r = ObjectId.from_str(id_parts[0]);
            if (r.err) {
                const msg = `invalid NDNDataRefererObject target format! ${value}, ${r.val}`
                console.error(msg);
                return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg))
            }

            target = r.unwrap();

            r = ObjectId.from_str(id_parts[1]);
            if (r.err) {
                const msg = `invalid NDNDataRefererObject object_id format! ${value}, ${r.val}`
                console.error(msg);
                return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg))
            }

            object_id = r.unwrap();
        } else {
            const msg = `invalid NDNDataRefererObject, object_id not found! ${value}`
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg))
        }
        
        let inner_path;
        if (parts.length > 1) {
            inner_path = parts.slice(1).join("/");
            if (inner_path !== "/") {
                inner_path = "/" + inner_path;
            }
        }

        return Ok(new NDNDataRefererObject(target, object_id, inner_path))
    }
}