
/*
日志格式化器，输入数组转换成字符串
values.level
values.time
values.args
values.pos
*/

// 默认的日至格式化器
class BLogNormalFormatter
{
    constructor()
    {
        this.m_converter = new BLogArgConvert();

        if (BLogEnv.platform() === 'win32')
        {
            this.m_lineBreak = '\r\n';
        }
        else if (BLogEnv.platform() === 'darwin')
        {
            this.m_lineBreak = '\r';
        }
        else if (BLogEnv.platform() === 'wx')
        {
            this.m_lineBreak = '\n';
        }
        else
        {
            this.m_lineBreak = '\n';
        }
    }

    getLineBreak()
    {
        return this.m_lineBreak;
    }

    format(values, options, callOpt = null)
    {
        let strValue = '';
        const separator = options.getSeparator();

        // logger在最前
        //strValue += '[' + options.getLoggerName() + ']' + separator;

        strValue += `[${values.level}]${separator}`;
        strValue += `[${BLogNormalFormatter.formatTime(values.time)}]${separator}`;
        if (callOpt && callOpt.category)
        {
            strValue += `{${callOpt.category}}${separator}`;
        }
        strValue += values.traceInfo + separator;

        // 添加用户自定义的headers
        const stringHeaders = options.getStringHeaders();
        if (stringHeaders)
        {
            for (const item in stringHeaders)
            {
                strValue += stringHeaders[item];
                strValue += separator;
            }
        }

        strValue += this.formatArgs(values.args);

        if (values.pos)
        {
            strValue += separator + ' ' + values.pos.file + ':' + values.pos.line;
        }

        if (values.stack)
        {
            strValue += separator + 'stack:' + values.stack;
        }
        //strValue += this.m_lineBreak;

        return strValue;
    }

    convertArg(arg)
    {
        let result;
        try
        {
            result = this.m_converter.convertArg(arg);
        }
        catch (err)
        {
            result = '[!!!exception args!!!]';
        }

        return result;
    }

    formatArgs(args)
    {

        if (args.length < 1)
        {
            return '';
        }

        let maxIndex = 0;
        let value = '';

        // 如果第一个参数是string，那么尝试格式化
        if (typeof args[0] === 'string')
        {
            value = args[0].replace(/{(\d+)}/g,
                                    (match, index) => {
                                        const numIndex = parseInt(index) + 1;
                                        if (numIndex > maxIndex)
                                        {
                                            maxIndex = numIndex;
                                        }

                                        return this.convertArg(args[numIndex]);
                                    });
        }
        else
        {
            value = this.convertArg(args[0]);
        }

        // 把剩余的值用空格分割，依次添加
        for (let index = maxIndex + 1; index < args.length; ++index)
        {
            value += ' ' + this.convertArg(args[index]);
        }

        return value;
    }

    static fixNumber(num)
    {
        let ret;
        if (num >= 0 && num <= 9)
        {
            ret = '0' + num;
        }
        else
        {
            ret = num;
        }

        return ret;
    }

    static formatTime(date)
    {

        const dateString = date.getFullYear() + '-' + BLogNormalFormatter.fixNumber(date.getMonth() + 1) +
                           '-' + BLogNormalFormatter.fixNumber(date.getDate()) +
                           ' ' + BLogNormalFormatter.fixNumber(date.getHours()) +
                           ':' + BLogNormalFormatter.fixNumber(date.getMinutes()) +
                           ':' + BLogNormalFormatter.fixNumber(date.getSeconds()) +
                           '.' + date.getMilliseconds();

        return dateString;
    }
}

function _BLogGetGlobalInstance()
{
    let instance = GlobalUtility.getGlobalVariable('__blog_instance__');
    if (instance == null)
    {
        instance = new BLog();
        GlobalUtility.setGlobalVaribale('__blog_instance__', instance);
    }

    return instance;
}

function _BLogGetGlobalOptions()
{
    let instance = GlobalUtility.getGlobalVariable('__blog_options__');
    if (instance == null)
    {
        instance = new BLogOptions();
//=>#ifdef _BUCKYJS
        const staticConfig = new BLogStaticConfig(instance);
        staticConfig.init();
//=>#endif //_BUCKYJS

        GlobalUtility.setGlobalVaribale('__blog_options__', instance);
    }

    return instance;
}

const BLogGetGlobalOptions = function() {
    let instance;
    return () => {
        if (instance == null)
        {
            instance = _BLogGetGlobalOptions();
        }

        return instance;
    };
}();

class BLog
{
    // options instanceof BLogOptions
    constructor(options)
    {
        if (options)
        {
            this.m_options = options;
        }
        else
        {
            this.m_options = BLogGetGlobalOptions();
        }
    }

    getOptions()
    {
        return this.m_options;
    }

    setFunc(func)
    {
        this.m_framefunc = func;
    }

    log(level, frameIndex, args, cc, callerOpt = null)
    {

        const options = this.m_options;
        if (!options.isOn())
        {
            return this;
        }

        const levelConfig = options.getLevelConfig(level);
        if (levelConfig == null || !levelConfig.on)
        {
            return this;
        }

        const values = {};

        // traceInfo是必带信息，指定了该条日志所属的appid和对应的traceid
        if (cc == null)
        {
            cc = options.getCC();
        }

        const appid = options.getAppID();
        if (cc)
        {
            values.traceInfo = `<${cc.appid || appid || ''}@${cc.traceid || ''}@${cc.frameid || ''}@${cc.getSeq(true) || ''}>`;
        }
        else
        {
            if (appid != null)
            {
                values.traceInfo = `<${appid}>`;
            }
            else
            {
                values.traceInfo = '<>';
            }
        }

        values.level = BLogLevel.toString(level);
        values.time = new Date();
        values.args = args;
        values.headers = options.getHeaders();

        if (levelConfig.pos || levelConfig.stack)
        {
            const info = {
                frame : frameIndex,
                pos : levelConfig.pos,
                fullpath : options.getFullPath(),
                stack : levelConfig.stack,
            };
            BLogStackHelper.getStack(info);

            if (levelConfig.pos && info.pos)
            {
                values.pos = info.pos;
                if (values.pos.file == null)
                {
                    values.pos.file = '[unknown]';
                }
            }

            if (levelConfig.stack && info.stack)
            {
                values.stack = info.stack;
            }
        }

        //origin_console.log(values);
        const formatter = options.getFormatter();
        let stringValue = formatter.format(values, this.m_options, callerOpt);

        // 检查长度
        const maxLength = options.getItemMaxLength();
        if (maxLength > 0 && stringValue.length > maxLength)
        {
            // 超出最大长度后，缩略
            stringValue = stringValue.slice(0, maxLength) + '......';
        }

        // 如果存在preTarget钩子，那么需要调用并判断返回值
        if (callerOpt && callerOpt.preTarget)
        {
            if (!callerOpt.preTarget(level, stringValue))
            {
                return;
            }
        }

        // 输出到targets
        const targets = options.getTargets();
        const targetOptions = {
            'level' : level,
            'lbr' : formatter.getLineBreak(),
        };
        targets.forEach((target) => {
            target.output(stringValue, targetOptions);
        });

        // 统计日志
//=>#ifdef _BUCKYJS
        if (typeof collector !== 'undefined')
        {
            collector.once('log_item', stringValue.length);
        }
//=>#endif // _BUCKYJS

        return this;
    }

    bind(name, options)
    {
        //origin_console.log(name, option);
        if (options == null)
        {
            options = {};
        }

        // 对于没有定义的默认属性，继承当前类
        for (const i in this.m_options)
        {
            if (!options[i])
            {
                options[i] = this.m_options[i];
            }
        }

        const newObj = new BLog(options);

        const __Log = () => {
            return newObj.log(arguments);
        };
        newObj.setFunc(__Log);

        if (name)
        {
            module.exports[name] = __Log;
        }

        return __Log;
    }

    clone()
    {
        return new BLog(this.m_options.clone());
    }

    cloneCC(cc)
    {
        return new BLog(this.m_options.cloneCC(cc));
    }
}

const BLogGetDefaultLog = (() => {
    let logInstance = null;
    return () => {
        if (logInstance == null)
        {
            logInstance = _BLogGetGlobalInstance();
        }

        return logInstance;
    };
})();

class BLogManager
{
    constructor()
    {
        this.m_loggers = {};
    }

    addLogger(name, obj)
    {
        assert(!this.m_loggers[name]);
        this.m_loggers[name] = obj;
    }

    getLogger(name, option)
    {
        let blogObj = this.m_loggers[name];
        if (!blogObj)
        {
            origin_console.log('create new logger:', name);
            blogObj = new BLog(option);
            this.m_loggers[name] = blogObj;
        }

        return blogObj;
    }
}

const BLogGetLogManager = (() => {
    let managerInstance;
    return () => {
        if (!managerInstance)
        {
            managerInstance = new BLogManager();
        }

        return managerInstance;
    };
})();

function BLogModule(logObj)
{

    let blog;
    let __cc;
    const getCC = () => {
        let ret = __cc;
        __cc = null;
        return ret;
    };

    // 设置callchain信息
    const withcc = (cc) => {
        __cc = cc;
        return blog;
    };

    const trace = (...args) => {
        logObj.log(BLogLevel.TRACE, 1, args, getCC());
        return blog;
    };

    const debug = (...args) => {
        logObj.log(BLogLevel.DEBUG, 1, args, getCC());
        return blog;
    };

    const info = (...args) => {
        logObj.log(BLogLevel.INFO, 1, args, getCC());
        return blog;
    };

    const warn = (...args) => {
        logObj.log(BLogLevel.WARN, 1, args, getCC());
        return blog;
    };

    const error = (...args) => {
        logObj.log(BLogLevel.ERROR, 1, args, getCC());
        return blog;
    };

    const checkLog = (exp, frameIndex, args, options) => {
        if (!exp)
        {
            logObj.log(BLogLevel.CHECK, frameIndex, args, getCC(), options);
        }
        return blog;
    };

    const check = (exp, ...args) => {
        return checkLog(exp, 2, args);
    };

    const fatal = (...args) => {
        logObj.log(BLogLevel.FATAL, 1, args, getCC());
        return blog;
    };

    const ctrl = (...args) => {
        logObj.log(BLogLevel.CTRL, 1, args, getCC());
        return blog;
    };

    const outputLog = (level, frameIndex, args, options) => {
        logObj.log(level, frameIndex, args, getCC(), options);
        return blog;
    };

    // 根据当前logger创建新的具名logger
    const getLogger = function(name) {
        const options = logObj.getOptions().clone();
        // 设置为新的名字
        options.setLoggerName(name);

        const newLogObj = BLogGetLogManager().getLogger(name, options);

        return BLogModule(newLogObj);
    };

    // 从当前logger克隆一个新的logger，但不由LoggerManager托管
    const clone = () => {
        return BLogModule(logObj.clone());
    };

    // cloneTraceInfo(callchain) or cloneTraceInfo(appid, traceid/ccid)
    const cloneCC = (cc) => {
        return BLogModule(logObj.cloneCC(cc));
    };

    const getOptions = () => {
        return logObj.getOptions();
    };

    const setLevel = (levelName) => {
        return logObj.getOptions().setLevel(levelName);
    };

    const setSwitch = (on) => {
        return logObj.getOptions().setSwitch(on);
    };

    const addHeader = (name, value) => {
        return logObj.getOptions().addHeader(name, value);
    };

    const removeHeader = (name, value) => {
        return logObj.getOptions().removeHeader(name, value);
    };

    const setAppID = (appid) => {
        return logObj.getOptions().setAppID(appid);
    };

    const getAppID = (appid) => {
        return logObj.getOptions().getAppID(appid);
    };

    const bindCC = (cc) => {
        return logObj.getOptions().bindCC(cc);
    };

    const unbindCC = () => {
        return logObj.getOptions().unbindCC();
    };

    const setSeparator = (separator) => {
        return logObj.getOptions().setSeparator(separator);
    };

    // 开启/关闭文件路径信息
    const enablePos = (enable) => {
        return logObj.getOptions().enablePos(enable);
    };

    const enableFullPath = (enable) => {
        return logObj.getOptions().enableFullPath(enable);
    };

//=>#ifdef _NODEJS
    // target相关
    const addFileTarget = (options) => {
        return logObj.getOptions().addFileTarget(options);
    };

    const addSocketTarget = (options) => {
        return logObj.getOptions().addSocketTarget(options);
    };
//=>#endif //_NODEJS

//=>#if defined(_WXJS) || defined(_H5JS)
    const addStorageTarget = (options) => {
        return logObj.getOptions().addStorageTarget(options);
    };
//=>#endif

    const addTarget = (target) => {
        return logObj.getOptions().addTarget(target);
    };

    const enableConsoleTarget = (enable) => {
        return logObj.getOptions().enableConsoleTarget(enable);
    };

//=>#ifdef _NODEJS
    const _defaultFilter = (() => {
        const s_keyList = {'password' : true, 'token' : true, 'pw' : true};
        const s_filter = new BLogKeyFilter(s_keyList);
        return () => {
            return s_filter;
        };
    })();

    const filter = (obj, keyList) => {
        let filter;
        if (keyList == null)
        {
            filter = _defaultFilter();
        }
        else
        {
            // keylist支持数组和object
            let list;
            if (Array.isArray(keyList))
            {
                list = {};
                for (const item of keyList)
                {
                    list[item] = true;
                }
            }
            else
            {
                assert(typeof keyList === 'object');
                list = keyList;
            }

            filter = new BLogKeyFilter(list);
        }

        return obj == null ? obj : filter.filter(obj);
    };
//=>#else // others
    const filter = (obj) => {
        // 其余平台暂不支持filter
        return obj;
    };
//=>#endif // others
    blog = {
        'withcc' : withcc,

        'trace' : trace,
        'debug' : debug,
        'info' : info,
        'warn' : warn,
        'error' : error,
        'check' : check,
        'fatal' : fatal,
        'ctrl' : ctrl,

        'log' : info,
        'assert' : check,

        'output' : outputLog,

        'outputLog' : outputLog,
        'checkLog' : checkLog,

        'getLogger' : getLogger,
        'clone' : clone,
        'cloneCC' : cloneCC,
        'getOptions' : getOptions,

        'setLevel' : setLevel,
        'setSwitch' : setSwitch,

        'addHeader' : addHeader,
        'removeHeader' : removeHeader,

        'setAppID' : setAppID,
        'getAppID' : getAppID,

        'bindCC' : bindCC,
        'unbindCC' : unbindCC,

        'setSeparator' : setSeparator,

        'enablePos' : enablePos,
        'enableFullPath' : enableFullPath,

        'addTarget' : addTarget,

//=>#ifdef _NODEJS
        'addFileTarget' : addFileTarget,
        'addSocketTarget' : addSocketTarget,
//=>#endif //_NODEJS

//=>#if defined(_WXJS) || defined(_H5JS)
        'addStorageTarget' : addStorageTarget,
//=>#endif
        'enableConsoleTarget' : enableConsoleTarget,

        'filter' : filter,
    };

    return blog;
}

//module.exports = BLogModule(BLogGetDefaultLog());
const blog = BLogModule(BLogGetDefaultLog());

// 日志宏
const BLOG_LEVEL_ALL = BLogLevel.ALL;
const BLOG_LEVEL_TRACE = BLogLevel.TRACE;
const BLOG_LEVEL_DEBUG = BLogLevel.DEBUG;
const BLOG_LEVEL_INFO = BLogLevel.INFO;
const BLOG_LEVEL_WARN = BLogLevel.WARN;
const BLOG_LEVEL_ERROR = BLogLevel.ERROR;
const BLOG_LEVEL_CHECK = BLogLevel.CHECK;
const BLOG_LEVEL_FATAL = BLogLevel.FATAL;
const BLOG_LEVEL_OFF = BLogLevel.OFF;

/*
// 日志全局函数绑定列表
const g_blogBindList = [
    {'BX_LOG' : 'log'},
    {'BX_DEBUG' : 'debug'},
    {'BX_TRACE' : 'trace'},
    {'BX_INFO' : 'info'},
    {'BX_WARN' : 'warn'},
    {'BX_CHECK' : 'check'},
    {'BX_ERROR' : 'error'},
    {'BX_FATAL' : 'fatal'},
    {'BX_CTRL' : 'ctrl'},
    {'BX_ASSERT' : 'assert'},
    {'BX_FILTER' : 'filter'},
];
*/

function BX_SetLogLevel(level)
{
    blog.setLevel(level);
}

function BX_SetAppID(appid)
{
    blog.setAppID(appid);
}

//=>#if defined(_NODEJS)
function BX_EnableFileLog(filedir, appid, fileNameExtra = null, filemaxsize = null, filemaxcount = null)
{
    let logOptions = {};

    if (path.isAbsolute(filedir))
    {
        logOptions.rootFolder = filedir;
        logOptions.subFolder = '';
    }
    else
    {
        logOptions.subFolder = filedir;
    }
    if (!appid || appid === '')
    {
        assert(false);
    }
    let filename = appid;
    if (fileNameExtra)
    {
        filename += fileNameExtra;
    }

    logOptions.filename = filename;

    if (filemaxsize)
    {
        logOptions.filemaxsize = filemaxsize;
    }
    if (filemaxcount)
    {
        logOptions.filemaxcount = filemaxcount;
    }

    blog.addFileTarget(logOptions);
}

//=>#if defined(_BUCKYJS)
/*
const options = {
    host : 'addr',
    port : xxx,
    service : 'servicename',
    nodeid : 'nodeid',
    init : 'xxx',
};
如果指定了init字符串，那么使用init初始化，否则使用service+nodeid初始化
在不指定init情况下，service+nodeid是必选字段，指定了所属服务和进程
host和port不指定的话，使用默认值，也即logAgent的默认配置
*/
function BX_EnableSocketLog(options)
{

    let targetInitString;
    let logDir = '';
    let logFileName = '';

    assert(typeof options.service);
    assert(typeof options.service === 'string');
    assert(options.nodeid == null || typeof options.nodeid === 'number' || typeof options.nodeid === 'string');

    if (options.nodeid == null)
    {
        options.nodeid = '';
    }
    // tcptarget使用service+nodeid信息进行初始化
    let initInfo = {
        serviceid : options.service,
        nodeid : options.nodeid,
        logFileMaxCount : 20,
        logFileMaxSize : 1024 * 1024 * 16,
        enableFileLog : 0
    };
    logDir = '/var/blog/' + options.service;
    logFileName = options.service;
    if (options.nodeid != '')
    {
        logFileName += '[' + options.nodeid + ']';
    }
    logFileName += '[' + process.pid + ']';

    if (options.logDir)
    {
        logDir = options.logDir;
    }
    if (options.logFileName)
    {
        logFileName = options.logFileName;
    }
    initInfo.logDir = logDir;
    initInfo.logFileName = logFileName;

    if (options.enableFileLog != null)
    {
        initInfo.enableFileLog = options.enableFileLog;
    }
    if (options.logFileMaxCount)
    {
        initInfo.logFileMaxCount = options.logFileMaxCount;
    }
    if (options.logFileMaxSize)
    {
        initInfo.logFileMaxSize = options.logFileMaxSize;
    }

    targetInitString = JSON.stringify(initInfo);

    const targetDefaultOptions = {
        host : '127.0.0.1',
        port : 6110,
        init : targetInitString,
    };

    for (const item in options)
    {
        targetDefaultOptions[item] = options[item];
    }

    //BX_EnableFileLog(logDir, logFileName);
    if (blog.getAppID() == null)
    {
        blog.setAppID(options.service);
    }
    blog.addSocketTarget(targetDefaultOptions);
}
//=>#endif // _BUCKYJS

//=>#elif defined(_WXJS) || defined(_H5JS)
// maxSize: 日志存放的最大大小
// eraseSize：日志超出最大大小后，每次擦除的大小
// mode:async/sync 同步还是异步
function BX_EnableFileLog(maxSize = 1024 * 1024 * 10, eraseSize = 1024 * 32, mode = 'async')
{
    const logOptions = {};
    if (maxSize)
    {
        logOptions.maxsize = maxSize;
    }
    if (eraseSize)
    {
        logOptions.erasesize = eraseSize;
    }
    if (mode)
    {
        logOptions.mode = mode;
    }

    blog.addStorageTarget(logOptions);
}
//=>#endif
