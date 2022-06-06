export enum CoreObjectType {
    // ZONE
    Zone = 32,

    // admin control
    Admin = 33,

    // 基于object的存储
    Storage = 40,

    // 文本对象
    Text = 41,

    // 通讯录
    FriendList = 130,

    // 主题订阅[150-160]
    Topic = 150,
    TopicSubscribe = 151,
    TopicSubscribeSuccess = 152,
    TopicUnsubscribe = 153,
    TopicUnsubscribeSuccess = 154,
    TopicPublishStatus = 155,
    TopicPublish = 156,
    TopicPublishReq = 157,
    TopicPublishResp = 158,
    TopicMessageList = 159,

    //meta相关
    BlockV1 = 300,
    MetaProto = 301,
    MetaMinerGroup = 302,
    BlockV2 = 303,

    // Trans
    TransContext = 350,
    
    // app相关
    DecApp = 400,
    AppStatus = 401,
    AppList = 402,
    // PutApp = 403,
    // RemoveApp = 404,
    AppStoreList = 405,
    AppExtInfo = 406,

    DefaultAppList = 407,
    SetDefaultApp = 408,

    // AppLocalStatus = 409,
    AppCmd = 410,
    AppLocalStatus = 411,
    // AppListEx = 412,
    AppCmdList = 413,
    AppSetting = 414,
    AppManagerAction = 415,
    AppLocalList = 416,
    // 钱包相关对象
    NFTList = 500,

    // Perf
    PerfOperation = 600,

    // IM通用对象
    AddFriend = 1001,
    FriendOption = 1002,
    Msg = 1003,
    RemoveFriend = 1004,

    // 错误
    ErrObjType = 32767
}

export function number_2_core_object_type(x:number): CoreObjectType{
    if (typeof CoreObjectType[x] === 'undefined') {
        return CoreObjectType.ErrObjType;
    }
    return x as CoreObjectType;
}

export function number_2_core_object_name(x:number): string{
    if (typeof CoreObjectType[x] === 'undefined') {
        return "CoreObjectType.ErrObjType";
    }
    return `CoreObjectType.${CoreObjectType[number_2_core_object_type(x)]}`;
}
