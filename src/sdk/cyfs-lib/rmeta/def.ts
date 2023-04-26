import { AccessPermissions, AccessString, ObjectId } from "../../cyfs-base";
import { DeviceZoneCategory, RequestSourceInfo } from "../access/source";

export enum MetaAction {
    GlobalStateAddAccess = "global-state-add-access",
    GlobalStateRemoveAccess = "global-state-remove-access",
    GlobalStateClearAccess = "global-state-clear-access",

    GlobalStateAddLink = "global-state-add-link",
    GlobalStateRemoveLink = "global-state-remove-link",
    GlobalStateClearLink = "global-state-clear-link",

    GlobalStateAddObjectMeta = "global-state-add-object-meta",
    GlobalStateRemoveObjectMeta = "global-state-remove-object-meta",
    GlobalStateClearObjectMeta = "global-state-clear-object-meta",

    GlobalStateAddPathConfig = "global-state-add-path-config",
    GlobalStateRemovePathConfig = "global-state-remove-path-config",
    GlobalStateClearPathConfig = "global-state-clear-path-config",
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
    handler?: boolean;
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
    static Handler(): GlobalStatePathGroupAccess {
        const self = new GlobalStatePathGroupAccess();
        self.handler = true;
        return self;
    }

    to_obj(): any {
        if (this.default !== undefined) {
            return {Default: this.default}
        } else if (this.specified !== undefined) {
            return {Specified: this.specified}
        } else if (this.handler) {
            return "Handler"
        } else {
            return {}
        }
    }

    toJSON(): any {
        return this.to_obj()
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
        } else if (obj === "Handler") {
            return GlobalStatePathGroupAccess.Handler()
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

export interface GlobalStateObjectMetaItem {
    // Object dynamic selector
    selector: string,

    // Access value
    access: GlobalStatePathGroupAccess,

    // Object referer's depth, default is 1
    depth?: number,
}

export enum GlobalStatePathStorageState {
    Concrete = 0,
    Virtual = 1,
}

export interface GlobalStatePathConfigItem {
    path: string,

    // 要求存储状态，如为virtual则重建时会跳过。
    storage_state?: GlobalStatePathStorageState,

    // 重建深度.0表示无引用深度，1表示会重建其引用的1层对象。不配置则根据对象的Selector确定初始重建深度。对大文件不自动重建，需要手动将depth设置为1.
    depth?: number,
}

export interface GlobalStatePathHandlerRequest {
    // target_dec_id
    dec_id: ObjectId,

    // request source
    source: RequestSourceInfo,

    // full_req_path = {req_path}?{query_string}
    req_path: string,
    req_query_string?: string,
    
    // The required permissions
    permissions: AccessPermissions,
}