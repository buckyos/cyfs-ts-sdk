// non_stack的http服务url
export const NON_STACK_HTTP_URL = "http://127.0.0.1:1318";
export const NON_STACK_WS_URL = "ws://127.0.0.1:1319";

export const RUNTIME_NON_STACK_HTTP_URL = "http://127.0.0.1:1322";
export const RUNTIME_NON_STACK_WS_URL = "ws://127.0.0.1:1323";

////// ws的cmd定义
// CMD=0表示是response，大于0表示request

// events
export const ROUTER_WS_EVENT_CMD_ADD = 1;
export const ROUTER_WS_EVENT_CMD_REMOVE = 2;
export const ROUTER_WS_EVENT_CMD_EVENT = 3;

// router_handlers
export const ROUTER_WS_HANDLER_CMD_ADD = 11;
export const ROUTER_WS_HANDLER_CMD_REMOVE = 12;
export const ROUTER_WS_HANDLER_CMD_EVENT = 13;

// 基于ws的http request
export const HTTP_CMD_REQUEST = 21;