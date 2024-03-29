export enum RouterHandlerAction {
    Default = 'Default',
    Response = 'Response',

    Reject = 'Reject',
    Drop = 'Drop',

    Pass = 'Pass',
}

export enum RouterHandlerCategory {
    PutObject = 'put_object',
    GetObject = 'get_object',

    PostObject = 'post_object',

    DeleteObject = 'delete_object',

    GetData = "get_data",
    PutData = "put_data",
    DeleteData = "delete_data",

    SignObject = "sign_object",
    VerifyObject = "verify_object",

    EncryptData = "encrypt_data",
    DecryptData = "decrypt_data",

    Acl = "acl",
    Interest = "interest"
}

export enum RouterHandlerChain {
    PreNOC = "pre_noc",
    PostNOC = "post_noc",

    PreRouter = "pre_router",
    PostRouter = "post_router",

    PreForward = "pre_forward",
    PostForward = "post_forward",

    PreCrypto = "pre_crypto",
    PostCrypto = "post_crypto",

    Handler = "handler",

    Acl = "acl",

    NDN = "ndn"
}