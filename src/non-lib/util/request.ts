
import {ObjectId} from "../../cyfs-base/objects/object_id";
import {DeviceId} from "../../cyfs-base/objects/device";

export interface ResolveOodRequest {
    object_id: ObjectId;
    owner_id?: ObjectId;
}

export class ResolveOodResponse {
    device_list: DeviceId[] = [];

    public static async from_respone(resp: Response): Promise<ResolveOodResponse> {
        const json = await resp.json();

        const ret = new ResolveOodResponse();
        for (const item of json.device_list) {
            const id = DeviceId.from_base_58(item).unwrap();
            ret.device_list.push(id);
        }

        return ret;
    }
}