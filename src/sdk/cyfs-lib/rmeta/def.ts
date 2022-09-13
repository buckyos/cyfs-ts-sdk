import { ObjectId } from "../../cyfs-base";

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

    // specified dec, None for any dec
    dec?: ObjectId,

    access: number,
}

export class GlobalStatePathGroupAccess {
    default?: number;
    specified?: GlobalStatePathSpecifiedGroup;
    private constructor() {}
    static Specified(group: GlobalStatePathSpecifiedGroup): GlobalStatePathGroupAccess {
        let self = new GlobalStatePathGroupAccess();
        self.specified = group;
        return self;
    }

    static Default(access: number): GlobalStatePathGroupAccess {
        let self = new GlobalStatePathGroupAccess();
        self.default = access;
        return self;
    }

    to_obj(): any {
        if (this.default) {
            return {default: this.default}
        } else if (this.specified) {
            return {specified: this.specified}
        }
    }

    static from_obj(obj: any): GlobalStatePathGroupAccess {
        if (obj.default) {
            return GlobalStatePathGroupAccess.Default(obj.default)
        } else if (obj.specified) {
            return GlobalStatePathGroupAccess.Specified({
                zone: obj.specified.zone?ObjectId.from_base_58(obj.specified.zone).unwrap():undefined,
                dec: obj.specified.dec?ObjectId.from_base_58(obj.specified.dec).unwrap():undefined,
                access: obj.access
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

    static fix_path(path: string): string {
        let new_path = path.trim();
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

    public new(path: string, access: number): GlobalStatePathAccessItem {
        return new GlobalStatePathAccessItem(GlobalStatePathAccessItem.fix_path(path), GlobalStatePathGroupAccess.Default(access))
    }

    public new_group(path: string, zone: ObjectId|undefined, dec: ObjectId|undefined, access: number): GlobalStatePathAccessItem {
        return new GlobalStatePathAccessItem(GlobalStatePathAccessItem.fix_path(path), GlobalStatePathGroupAccess.Specified({
            zone,
            dec,
            access
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