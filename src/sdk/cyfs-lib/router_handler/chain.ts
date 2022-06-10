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
}