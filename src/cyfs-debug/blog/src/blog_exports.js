module.exports.blog = blog;

module.exports.BLogLevel = BLogLevel;
module.exports.BLOG_LEVEL_ALL = BLOG_LEVEL_ALL;
module.exports.BLOG_LEVEL_TRACE = BLOG_LEVEL_TRACE;
module.exports.BLOG_LEVEL_DEBUG = BLOG_LEVEL_DEBUG;
module.exports.BLOG_LEVEL_INFO = BLOG_LEVEL_INFO;
module.exports.BLOG_LEVEL_WARN = BLOG_LEVEL_WARN;
module.exports.BLOG_LEVEL_ERROR = BLOG_LEVEL_ERROR;
module.exports.BLOG_LEVEL_CHECK = BLOG_LEVEL_CHECK;
module.exports.BLOG_LEVEL_FATAL = BLOG_LEVEL_FATAL;
module.exports.BLOG_LEVEL_OFF = BLOG_LEVEL_OFF;


module.exports.BX_LOG = CallChain.log;
module.exports.BX_TRACE = CallChain.trace;
module.exports.BX_INFO = CallChain.info;
module.exports.BX_WARN = CallChain.warn;
module.exports.BX_DEBUG = CallChain.debug;
module.exports.BX_ERROR = CallChain.error;
module.exports.BX_FATAL = CallChain.fatal;
module.exports.BX_CTRL = CallChain.ctrl;

module.exports.BX_CHECK = CallChain.check;
module.exports.BX_ASSERT = CallChain.assert;

module.exports.BX_FILTER = CallChain.filter;

module.exports.log = CallChain.log;
module.exports.trace = CallChain.trace;
module.exports.info = CallChain.info;
module.exports.warn = CallChain.warn;
module.exports.debug = CallChain.debug;
module.exports.error = CallChain.error;
module.exports.fatal = CallChain.fatal;
module.exports.ctrl = CallChain.ctrl;
module.exports.check = CallChain.check;
module.exports.assert = CallChain.assert;
module.exports.filter = CallChain.filter;

module.exports.BX_GET_CURRENT_CALLCHAIN = BX_GET_CURRENT_CALLCHAIN;
module.exports.BX_SET_CURRENT_CALLCHAIN = BX_SET_CURRENT_CALLCHAIN;
module.exports.BX_ENTER_ASYNC_CALL = BX_ENTER_ASYNC_CALL;
module.exports.BX_LEAVE_ASYNC_CALL = BX_LEAVE_ASYNC_CALL;

module.exports.getCurrentCallChain = getCurrentCallChain;
module.exports.setCurrentCallChain = setCurrentCallChain;
module.exports.beginSubCallChain = beginSubCallChain;

module.exports.BX_SetLogLevel = BX_SetLogLevel;
module.exports.BX_SetAppID = BX_SetAppID;


//=>#ifdef _NODEJS
module.exports.BX_EnableFileLog = BX_EnableFileLog;
//=>#endif //_NODEJS

//=>#ifdef _BUCKYJS
module.exports.BX_EnableSocketLog = BX_EnableSocketLog;
module.exports.LOG_AGENT_PROTOCAL_VERSION = LOG_AGENT_PROTOCAL_VERSION;
module.exports.LOG_AGENT_MAGIC_NUM = LOG_AGENT_MAGIC_NUM;
module.exports.LOG_AGENT_CMD = LOG_AGENT_CMD;
//=>#endif // _BUCKYJS
