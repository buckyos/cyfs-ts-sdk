import { DeviceId, ObjectId } from "../../cyfs-base";

export enum RequestProtocol {
    Native = "native",
    Meta = "meta",
    Sync = "sync",
    HttpBdt = "http-bdt",
    HttpLocal = "http-local",
    HttpLocalAuth = "http-local-auth",
    DatagramBdt = "datagram-bdt",
    // bdt层的chunk数据传输
    DataBdt = "data-bdt",
}

export enum DeviceZoneCategory {
    CurrentDevice = "current-device",
    CurrentZone = "current-zone",
    FriendZone = "friend-zone",
    OtherZone = "other-zone",
}

export interface DeviceZoneInfo {
    device?: DeviceId,
    zone?: ObjectId,
    zone_category: DeviceZoneCategory,
}

export interface RequestSourceInfo {
    protocol: RequestProtocol,
    zone: DeviceZoneInfo,
    dec: ObjectId,

    // is passed the acl verified
    verified: boolean,
}

export class SourceHelper {
    static zone_to_obj(zone: DeviceZoneInfo): any {
        return {
            device: zone.device?zone.device.to_base_58():undefined,
            zone: zone.zone?zone.zone.to_base_58():undefined,
            zone_category: zone.zone_category
        }
    }

    static obj_to_zone(obj: any): DeviceZoneInfo {
        return {
            device: obj.device?DeviceId.from_base_58(obj.device).unwrap():undefined,
            zone: obj.zone?ObjectId.from_base_58(obj.zone).unwrap():undefined,
            zone_category: obj.zone_category
        }
    }

    static source_to_obj(source: RequestSourceInfo): any {
        return {
            protocol: source.protocol,
            zone: SourceHelper.zone_to_obj(source.zone),
            dec: source.dec.to_base_58(),
            verified: source.verified
        }
    }

    static obj_to_source(obj: any): RequestSourceInfo {
        return {
            protocol: obj.protocol,
            zone: SourceHelper.obj_to_zone(obj.zone),
            dec: ObjectId.from_base_58(obj.dec).unwrap(),
            verified: obj.verified
        }
    }
}