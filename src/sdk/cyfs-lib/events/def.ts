import { BuckyResult, Err, Ok } from '../../cyfs-base';
import { JsonCodec, JsonCodecHelper } from '../base/codec';

export enum ZoneDirection {
    LocalToLocal = "local_to_local",
    LocalToRemote = "local_to_remote",
    RemoteToLocal = "remote_to_local",
}

export interface RouterEventResponse {
    err: number;
    msg?: string;
}

export class RouterEventResponseJsonCodec extends JsonCodec<RouterEventResponse> {
    public decode_object(o: any): BuckyResult<RouterEventResponse> {
        const ret = JsonCodecHelper.decode_number(o.err);
        if (ret.err) {
            return ret;
        }

        const resp: RouterEventResponse = {
            err: ret.unwrap(),
            msg: o.msg as string,
        };

        return Ok(resp);
    }
}