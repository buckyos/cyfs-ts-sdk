class BLogOptionBaseValues {
    constructor() {
        this.m_switch = true;
        this.m_level = BLogLevel.ALL;

        // 当前logger名字
        this.m_logger = 'global';

        // 位置信息
        this.m_pos = true;

        // 栈信息
        this.m_stack = false;

        // 是否输出完整文件路径
        this.m_fullPath = false;

        // 附加的头部信息
        this.m_headers = {};
        this.m_stringHeaders = {};

        // 分隔符
        this.m_separator = ',';

        // 单条日志最大长度
        this.m_logItemMaxLength = 1024 * 2;

        // 输出目标
        this.m_targets = [];

        this.m_formatter = new BLogNormalFormatter();

        // level config
        /*
        {
            on : [boolean], // 开关
            stack : [boolean]    // 是否输出stack
            pos : [boolean] // 是否输出pos
        }*/
        this.m_levelConfig = [];
        this._initDefaultLevelConfig();

        // 绑定的appid
        this.m_appid = null;

        // callchain
        this.m_cc = null;
    }

    clone() {
        const values = new BLogOptionBaseValues();

        for (const item in this) {
            const value = this[item];
            if (typeof value !== 'object') {
                values[item] = value;
            }
        }

        values.m_levelConfig = this.m_levelConfig.slice();
        values.m_targets = this.m_targets.slice();

        for (const item in this.m_headers) {
            values.m_headers[item] = this.m_headers[item];
        }

        for (const item in this.m_stringHeaders) {
            values.m_stringHeaders[item] = this.m_stringHeaders[item];
        }

        if (this.m_cc) {
            values.m_cc = this.m_cc.subCC('blogClone');
        }

        return values;
    }

    _initDefaultLevelConfig() {
        // 初始化默认level
        for (let i = BLogLevel.ALL; i < BLogLevel.OFF; ++i) {
            this.m_levelConfig[i] = {
                on: true,
                //stack: false,         // 默认不再设置stack和pos，而是继承所在option的配置
                //pos: this.m_pos,
            };
        }

        this.m_levelConfig[BLogLevel.CHECK].stack = true;
    }
}

// 日志选项，每个日志对象都关联了一个日志选项
class BLogOptions {
    constructor(baseValues) {
        if (baseValues) {
            this.m_baseValues = baseValues;
        } else {
            this.m_baseValues = new BLogOptionBaseValues();
//=>#ifndef _BUCKYJS
            this.enableConsoleTarget(true);
//=>#endif // _BUCKYJS
        }

        // 过滤一些不支持的字段
        BLogEnv.filterOptions(this);

        // appid改变事件
        this.onAppidChange = null;
    }

    setSwitch(on) {
        this.m_baseValues.m_switch = on ? true : false;
    }

    // level [string or number]
    _getLevelIndex(level) {
        let ret = 0;
        if (typeof(level) === 'number') {
            ret = level;
        } else if (typeof(level) === 'string') {
            ret = BLogLevel[level.toUpperCase()];
            if (typeof ret === 'undefined') {
                ret = 0;
            }
        } else {
            assert(false);
        }

        return ret;
    }

    // level [string or number]
    setLevel(level) {
        let index = this._getLevelIndex(level);
        assert(index >= BLogLevel.ALL && index <= BLogLevel.OFF);
        if (index >= BLogLevel.OFF) {
            index = BLogLevel.OFF - 1;
        }

        for (let i = BLogLevel.ALL; i < index; ++i) {
            this.m_baseValues.m_levelConfig[i].on = false;
        }
        for (let i = index; i < BLogLevel.OFF; ++i) {
            this.m_baseValues.m_levelConfig[i].on = true;
        }
    }

    setLevelConfig(level, config) {
        const index = this._getLevelIndex(level);
        assert(index >= BLogLevel.ALL && index < BLogLevel.OFF);

        const levelConfig = this.m_baseValues.m_levelConfig[index];
        for (const key of config) {
            levelConfig[key] = config[key];
            if (key === 'pos' && !this.m_baseValues.m_pos) {
                levelConfig[key] = false;
            } else if (key === 'stack' && !this.m_baseValues.m_stack) {
                levelConfig[key] = false;
            }
        }
    }

    getLevelConfig(level) {
        const index = this._getLevelIndex(level);
        //assert(index >= BLogLevel.ALL && index < BLogLevel.OFF);

        const originConfig = this.m_baseValues.m_levelConfig[index];
        const levelConfig = {
            'on' : originConfig.on,
            'stack' : originConfig.stack != null? originConfig.stack : this.m_baseValues.m_stack,
            'pos' : originConfig.pos != null? originConfig.pos : this.m_baseValues.m_pos,
        };
        
        return levelConfig;
    }

    isLevelOn(level) {
        const index = this._getLevelIndex(level);
        const levelConfig = this.m_baseValues.m_levelConfig[index];
        if (levelConfig && levelConfig.on) {
            return true;
        } else {
            return false;
        }
    }

    isOn() {
        return this.m_baseValues.m_switch;
    }

    // 核心方法，从当前options产生一个新的options对象
    clone() {
        return new BLogOptions(this.m_baseValues.clone());
    }

    // 带cc的克隆只是浅拷贝
    cloneCC(cc) {
        return new BlogCCOptions(this.m_baseValues, cc);
    }

    // logger name
    setLoggerName(name) {
        this.m_baseValues.m_logger = name;
    }

    getLoggerName() {
        return this.m_baseValues.m_logger;
    }

    // 格式化器
    setFormatter(formatter) {
        this.m_baseValues.m_formatter = formatter;
    }

    getFormatter() {
        return this.m_baseValues.m_formatter;
    }

    // 分隔符
    setSeparator(separator) {
        this.m_baseValues.m_separator = separator;
    }

    getSeparator() {
        return this.m_baseValues.m_separator;
    }

    // 文件/行号/函数信息
    enablePos(enable) {
        this.m_baseValues.m_pos = enable;
    }

    getPos() {
        return this.m_baseValues.m_pos;
    }

    enableFullPath(enable) {
        this.m_baseValues.m_fullPath = enable;
    }

    getFullPath() {
        return this.m_baseValues.m_fullPath;
    }

    // 栈信息
    enableStack(enable) {
        this.m_baseValues.m_stack = enable;
    }

    getStack() {
        return this.m_baseValues.m_stack;
    }

    // 固定头部
    addHeader(name, value) {
        this.m_baseValues.m_headers[name] = value;
        this.m_baseValues.m_stringHeaders[name] = this.genStringHeader(name);
    }

    removeHeader(name) {
        delete this.m_baseValues.m_headers[name];
        delete this.m_baseValues.m_stringHeaders[name];
    }

    genStringHeader(name) {
        let headerString = '[' + name + '=' + this.m_baseValues.m_headers[name] + ']';
        return headerString;
    }

    getHeaders() {
        return this.m_baseValues.m_headers;
    }

    getStringHeaders() {
        return this.m_baseValues.m_stringHeaders;
    }

    /** cc相关接口 */

    // 设定appid
    setAppID(appid) {
        const old = this.m_baseValues.m_appid;
        this.m_baseValues.m_appid = appid;

        // 尝试触发事件
        if (this.onAppidChange) {
            this.onAppidChange(appid, old);
        }
    }

    getAppID() {
        return this.m_baseValues.m_appid;
    }

    // 绑定callchain
    bindCC(cc) {
        this.m_baseValues.m_cc = cc;
    }

    unbindCC() {
        const cc = this.m_baseValues.m_cc;
        this.m_baseValues.m_cc = null;

        return cc;
    }

    getCC() {
        return this.m_baseValues.m_cc;
    }

    // 单条日志最大长度
    getItemMaxLength() {
        return this.m_baseValues.m_logItemMaxLength;
    }

    setItemMaxLength(length) {
        assert(typeof length === 'number');
        this.m_baseValues.m_logItemMaxLength = length;
    }

    /** target相关接口 */

    // 获取所有的targets
    getTargets() {
        return this.m_baseValues.m_targets;
    }

    // 添加一个target
    addTarget(target) {
        this.m_baseValues.m_targets.push(target);
    }

    // 控制台输出
    enableConsoleTarget(enable) {
        const targets = this.m_baseValues.m_targets;
        const defaultConsoleTarget = BLogGetDefaultConsoleTarget();
        if (enable) {
            let exists = false;
            if (targets.indexOf(defaultConsoleTarget) >= 0) {
                exists = true;
            }

            if (!exists) {
                targets.push(defaultConsoleTarget);
            }
            return defaultConsoleTarget;
        } else {
            let ret = false;
            const index = targets.indexOf(defaultConsoleTarget);
            if (index >= 0) {
                targets.splice(index, 1);
                ret = true;
            }

            return ret;
        }
    }

//=>#ifdef _NODEJS
    // 添加一个文件输出target
    /*
    options = {
        'rootFolder': '/var/blog/,
        'subFolder' : 'xxx',
        'filename': fileName,
        'filemaxsize': 1024 * 1024 * 16,
        'filemaxcount': 20,
        'mode': 'async'/'sync',
    };
    */
    addFileTarget(options) {

        let rootFolder;
        if (os.platform() === 'win32') {
            rootFolder = 'C:\\blog\\';
        } else {
            rootFolder = '/var/blog/';
        }

        let fileName = path.basename(require.main.filename || require.main.i ||  'node.js', '.js');
        if (!fileName || fileName.length <= 0) {
            fileName = 'node';
        }
        
        // 文件目录优先使用appid，其次使用文件名
        const subFolder = this.getAppID() ? this.getAppID() : fileName;
        fileName += '[' + process.pid + ']';

        const defaultOptions = {
            'rootFolder': rootFolder,
            'subFolder': subFolder,
            'filename': fileName,
            'filemaxsize': 1024 * 1024 * 16,
            'filemaxcount': 20,
        };

        if (options) {
            for (let item in options) {
                defaultOptions[item] = options[item];
            }
            if (defaultOptions.rootFolder[defaultOptions.rootFolder.length - 1] != '/' &&
                defaultOptions.rootFolder[defaultOptions.rootFolder.length - 1] != '\\') {
                defaultOptions.rootFolder += '/';
            }
        }

        defaultOptions.folder = defaultOptions.rootFolder + defaultOptions.subFolder;

        let target;
        if (options && options.mode === 'sync') {
            const fileTarget = new SyncLogFileTarget(defaultOptions);
            target = new SyncLogMemoryCache({}, fileTarget);
        } else {
            const fileTarget = new AsyncLogFileTarget(defaultOptions);
            target = new AsyncLogMemoryCache({}, fileTarget);
        }

        this.m_baseValues.m_targets.push(target);
        return target;
    }

    // 添加一个基于tcp连接的输出
    /*
    options = {
        host : xxx,
        port : xxx,
    }
    */
    addSocketTarget(options) {
        assert(options.host);
        assert(options.port);

        const defaultOptions = {};

        for (const item in options) {
            defaultOptions[item] = options[item];
        }

        const sockTarget = new LogTCPTarget(defaultOptions);
        const target = new AsyncLogMemoryCache({}, sockTarget);

        this.m_baseValues.m_targets.push(target);
        return target;
    }
//=>#endif // _NODEJS

    /*
    options = {
        'maxsize': 1024 * 1024 * 10,
        'erasesize': 1024 * 32,
        'mode': 'async'/'sync',
    };
    */
//=>#if defined(_WXJS) || defined(_H5JS)
    addStorageTarget(options) {
        let target;
        if (options.mode && options.mode === 'sync') {
            const fileTarget = new SyncLogStorageTarget(options);
            target = new SyncLogMemoryCache({}, fileTarget);
        } else {
            const fileTarget = new AsyncLogStorageTarget(options);
            target = new AsyncLogMemoryCache({}, fileTarget);
        }

        this.m_baseValues.m_targets.push(target);
        return target;
    }
//=>#endif

//=>#ifdef _RNJS
    addStorageTarget(options) {
        // react native下只支持异步storage日志
        assert(options.mode == null || options.mode === 'async');
       
        const fileTarget = new AsyncLogStorageTarget(options);
        const target = new AsyncLogMemoryCache({}, fileTarget);

        this.m_baseValues.m_targets.push(target);
        return target;
    }
//=>#endif // _RNJS
}

class BlogCCOptions extends BLogOptions {
    constructor(baseValues, cc) {
        super(baseValues);

        // callchain
        this.m_cc = cc;
    }

    // 绑定callchain
    bindCC(cc) {
        this.m_cc = cc;
    }

    unbindCC() {
        const cc = this.m_cc;
        this.m_cc = null;

        return cc;
    }

    getCC() {
        return this.m_cc;
    }

    clone() {
        let cc = null;
        if (this.m_cc) {
            cc = this.m_cc.subCC('clone');
        }
        const baseValues = this.m_baseValues.clone();
        baseValues.bindCC(cc);

        return new BLogOptions(baseValues);
    }

    cloneCC(cc) {
        return new BlogCCOptions(this.m_baseValues, cc);
    }
}
