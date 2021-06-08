// service的端口分配 [1300-1400]
export const CHUNK_MANAGER_PORT: number = 1310;

export const FILE_MANAGER_PORT: number = 1312;

export const ACC_SERVICE_PORT: number = 1313;

export const GATEWAY_CONTROL_PORT: number = 1314;


// non-stack本地提供的默认object http服务端口
export const NON_STACK_HTTP_PORT: number = 1318;

// non-stack的本地web-socket服务端口
// TODO 目前tide+async_h1还不支持websocket协议，所以只能使用独立端口
export const NON_STACK_WS_PORT: number = 1319;


// ood-daemon的控制接口
export const OOD_DAEMON_CONTROL_PORT: number = 1320;

// cufs-runtime的device控制接口，和ood-daemon控制协议一致
export const CYFS_RUNTIME_DAEMON_CONTROL_PORT: number = 1321;


// non-stack本地提供的默认object http服务端口
export const CYFS_RUNTIME_NON_STACK_HTTP_PORT: number = 1322;

// non-stack的本地web-socket服务端口
// TODO 目前tide+async_h1还不支持websocket协议，所以只能使用独立端口
export const CYFS_RUNTIME_NON_STACK_WS_PORT: number = 1323;


// bdt协议栈的默认绑定端口
export const OOD_BDT_STACK_PORT: number = 8050;
export const CYFS_RUNTIME_BDT_STACK_PORT: number = 8051;


// non-stack提供对外服务的bdt协议栈虚端口
export const NON_STACK_BDT_VPORT: number = 84;

// non-stack提供对外服务的sync协议栈虚端口
export const NON_STACK_SYNC_BDT_VPORT: number = 85;


// app的端口分配 [1400-1500]
export const PROXY_MINER_SOCKS5_PORT: number = 1421;

export const IP_RELAY_MINER_PORT: number = 1422;

export const CYFS_META_MINER_PORT: number = 1423;

export const CACHE_MINER_PORT: number = 1424;

export const DNS_PROXY_MINER_PORT: number = 1425;

export const ALWAYS_RUN_MINER_PORT: number = 1426;

export const DSG_CHAIN_MINER_PORT: number = 1427;
