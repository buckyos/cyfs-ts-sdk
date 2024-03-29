// Every app has one
export const CYFS_GLOBAL_STATE_META_PATH = "/.cyfs/meta";

// Friends, in system dec's global state
export const CYFS_FRIENDS_PATH = "/user/friends";
export const CYFS_FRIENDS_LIST_PATH = "/user/friends/list";
export const CYFS_FRIENDS_OPTION_PATH = "/user/friends/option";

// AppManager related paths
export const CYFS_APP_LOCAL_LIST_PATH = "/app/manager/local_list";
export const CYFS_APP_LOCAL_STATUS_PATH = "/app/${DecAppId}/local_status";

// Known zones in local-cache
export const CYFS_KNOWN_ZONES_PATH = "/data/known-zones";

// Virtual path for handler and api 
export const CYFS_API_VIRTUAL_PATH = "/.cyfs/api";
export const CYFS_HANDLER_VIRTUAL_PATH = "/.cyfs/api/handler";
export const CYFS_CRYPTO_VIRTUAL_PATH = "/.cyfs/api/crypto";

// System control cmds
export const CYFS_SYSTEM_VIRTUAL_PATH = "/.cyfs/api/system";
export const CYFS_SYSTEM_ADMIN_VIRTUAL_PATH = "/.cyfs/api/system/admin";
export const CYFS_SYSTEM_ROLE_VIRTUAL_PATH = "/.cyfs/api/system/role";
export const CYFS_SYSTEM_APP_VIRTUAL_PATH = "/.cyfs/api/system/app";

//App control cmds (e.g.: Start, Stop, Install, Uninstall)
export const CYFS_SYSTEM_APP_CMD_VIRTUAL_PATH = "/.cyfs/api/system/app/cmd";