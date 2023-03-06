import JSBI from 'jsbi'
import { ObjectMapSimpleContentType } from '../../cyfs-base';

export enum GlobalStateCategory {
    RootState = "root-state",
    LocalCache = "local-cache",
}

export enum RootStateAction {
    GetCurrentRoot = "get-current-root",
    CreateOpEnv = "create-op-env",
}

export enum OpEnvAction {
    // map methods
    GetByKey = "get-by-key",
    InsertWithKey = "insert-with-key",
    SetWithKey = "set-with-key",
    RemoveWithKey = "remove-with-key",

    // set methods
    Contains = "contains",
    Insert = "insert",
    Remove = "remove",

    // single op_env
    Load = "load",
    LoadByPath = "load-by-path",
    CreateNew = "create-new",

    // transaciton
    Lock = "lock",
    Commit = "commit",
    Abort = "abort",

    // metadata
    Metadata = "metadata",

    // get_current_root
    GetCurrentRoot = "get-current-root",

    // interator
    Next = "next",
    Reset = "reset",
    List = "list",
}

export enum ObjectMapOpEnvType {
    Path = "path",
    Single = "single",
    IsolatePath = "isolate-path"
}

export interface OpEnvSetResponse {
    result: boolean,
}

export enum RootStateRootType {
    Global = "global",
    Dec = "dec",
}

export enum ObjectMapContentMode {
    Simple = "simple",
    Hub = "hub",
}

export interface ObjectMapMetaData {
    content_mode: ObjectMapContentMode,
    content_type: ObjectMapSimpleContentType,
    count: JSBI,
    size: JSBI,
    depth: number,
}

export enum GlobalStateAccessMode {
    Read = "read",
    Write = "write",
}

export enum OpEnvCommitOpType {
    Commit = "commit",
    Update = "update",
}
