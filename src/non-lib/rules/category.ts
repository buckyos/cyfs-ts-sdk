
export enum RouterRuleCategory {
    PrePutToNOC= 'pre_put_to_noc',
    PostPutToNOC = 'post_put_to_noc',

    PreRequestSign = 'pre_request_sign',
    PostRequestSign = 'post_request_sign',

    PreForwardPut = 'pre_forward_put',
    PostForwardPut = 'post_forward_put',

    PreGetFromNOC = 'pre_get_from_noc',
    PostGetFromNOC = 'post_get_from_noc',

    PreGetFromMeta = 'pre_get_from_meta',
    PostGetFromMeta = 'post_get_from_meta',

    PreForwardGet = 'pre_forward_get',
    PostForwardGet = 'post_forward_get',
}