import {DeviceCategory, DeviceId, None, ObjectId, ObjectTypeCode, Option} from "../../cyfs-base";
import { ObjectCategory, ZoneDirection } from '../events/def';


export class RouterEventFilter {
    constructor(
        public obj_type?: number,
        public obj_type_code?: ObjectTypeCode,
        public obj_category?: ObjectCategory,

        public dec_id?: ObjectId,
        public owner_id?: ObjectId,

        public device_id?: DeviceId,
        public device_category?: DeviceCategory,

        public direction?: ZoneDirection,
    ){
        // ignore
    }

    static default(): RouterEventFilter {
        return new RouterEventFilter();
    }
}