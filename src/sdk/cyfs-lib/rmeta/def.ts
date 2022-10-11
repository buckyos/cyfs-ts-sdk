import { AccessPermission, AccessPermissions, AccessString, ObjectId } from "../../cyfs-base";
import { DeviceZoneCategory } from "../access/source";

export enum MetaAction {
    GlobalStateAddAccess = "global-state-add-access",
    GlobalStateRemoveAccess = "global-state-remove-access",
    GlobalStateClearAccess = "global-state-clear-access",

    GlobalStateAddLink = "global-state-add-link",
    GlobalStateRemoveLink = "global-state-remove-link",
    GlobalStateClearLink = "global-state-clear-link",
}

export interface GlobalStatePathLinkItem {
    source: string,
    target: string,
}

export interface GlobalStatePathSpecifiedGroup {
    // device/device's owner(as zone id), None for any zone
    zone?: ObjectId,

    // Choose one between zone and zone_category
    zone_category?: DeviceZoneCategory,

    // specified dec, None for any dec
    dec?: ObjectId,

    // single group permission, treat as u8, init with AccessPermissions or AccessPermission
    access: number,
}

export class GlobalStatePathGroupAccess {
    default?: number;   // full permission, treat as u32, init with AccessString
    specified?: GlobalStatePathSpecifiedGroup;
    private constructor() {}
    static Specified(group: GlobalStatePathSpecifiedGroup): GlobalStatePathGroupAccess {
        const self = new GlobalStatePathGroupAccess();
        self.specified = group;
        return self;
    }

    static Default(access: number): GlobalStatePathGroupAccess {
        const self = new GlobalStatePathGroupAccess();
        self.default = access;
        return self;
    }

    to_obj(): any {
        if (this.default !== undefined) {
            return {Default: this.default}
        } else if (this.specified !== undefined) {
            return {Specified: this.specified}
        } else {
            return {}
        }
    }

    static from_obj(obj: any): GlobalStatePathGroupAccess {
        if (obj.Default) {
            return GlobalStatePathGroupAccess.Default(obj.Default)
        } else if (obj.Specified) {
            return GlobalStatePathGroupAccess.Specified({
                zone: obj.Specified.zone?ObjectId.from_base_58(obj.specified.zone).unwrap():undefined,
                dec: obj.Specified.dec?ObjectId.from_base_58(obj.specified.dec).unwrap():undefined,
                zone_category: obj.Specified.zone_category?obj.Specified.zone_category:undefined,
                access: obj.Specified.access
            })
        } else {
            throw new Error(`decode GlobalStatePathGroupAccess from ${JSON.stringify(obj)} failed`)
        }
    }
}

export class GlobalStatePathAccessItem {
    // GlobalState path, must end with /
    path: string;

    // Access value
    access: GlobalStatePathGroupAccess;

    private static fix_path(path: string): string {
        const new_path = path.trim();
        if (new_path.endsWith("/")) {
            return new_path
        } else {
            return new_path + "/"
        }
    }

    private constructor(path: string, access: GlobalStatePathGroupAccess) {
        this.path = GlobalStatePathAccessItem.fix_path(path);
        this.access = access;
    }

    public static new(path: string, access: AccessString): GlobalStatePathAccessItem {
        return new GlobalStatePathAccessItem(GlobalStatePathAccessItem.fix_path(path), GlobalStatePathGroupAccess.Default(access.value))
    }

    public static new_group(path: string, zone: ObjectId|undefined, zone_category: DeviceZoneCategory|undefined, dec: ObjectId|undefined, access: AccessPermissions): GlobalStatePathAccessItem {
        return new GlobalStatePathAccessItem(GlobalStatePathAccessItem.fix_path(path), GlobalStatePathGroupAccess.Specified({
            zone,
            zone_category,
            dec,
            access: access.value
        }))
    }

    public to_obj(): any {
        return {
            path: this.path,
            access: this.access.to_obj()
        }
    }

    public static from_obj(obj: any): GlobalStatePathAccessItem {
        return new GlobalStatePathAccessItem(obj.path, GlobalStatePathGroupAccess.from_obj(obj.access));
    }
}