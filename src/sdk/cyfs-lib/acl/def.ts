export enum AclDirection {
    Any = "*",

    In = "in",
    Out = "out",
}

export enum AclOperation {
    Any = "*",

    GetObject = "get-object",
    PutObject = "put-object",
    PostObject = "post-object",
    SelectObject = "select-object",
    DeleteObject = "delete-object",

    SignObject = "sign-object",
    VerifyObject = "verify-object",

    PutData = "put-data",
    GetData = "get-data",
    DeleteData = "delete-data",

    // non/ndn的一些通用操作
    Get = "get",
    Put = "put",
    Delete = "delete",

    Read = "read",
    Write = "write",

    // sign+verify
    Crypto = "crypto",
}

export interface AclAction {
    direction: AclDirection,
    operation: AclOperation,
}

export enum AclAccess {
    Accept = "accept",
    Reject = "reject",
    Drop = "drop",
    Pass = "pass",
}