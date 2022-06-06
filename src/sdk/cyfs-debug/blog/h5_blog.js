const BLogLevel = {
    'ALL': 0,
    'TRACE': 1,
    'DEBUG': 2,
    'INFO': 3,
    'WARN': 4,
    'ERROR': 5,
    'CHECK': 6,
    'FATAL': 7,
    'CTRL': 8,
    'OFF': 9,
    'strings': ['all', 'trace', 'debug', 'info', 'warn', 'error', 'check', 'fatal', 'ctrl', 'off'],
    'toString': (level) => {
        return BLogLevel.strings[level];
    },
    'toLevel': (str) => {
        let level = BLogLevel[str.toUpperCase()];
        if (level == null) {
            level = 0;
        }
        return level;
    }
};
const origin_console = console;
const ErrorCode = {
    RESULT_OK: 0,
    RESULT_FAILED: 1,
    RESULT_INVALID_TYPE: 4,
    RESULT_INVALID_PARAM: 11,
};
class GlobalUtility {
    static _global() {
        return window;
    }
    static globalVars() {
        const g = this._global();
        let vars = g.__bucky_global_vars;
        if (g.__bucky_global_vars == null) {
            g.__bucky_global_vars = {};
            vars = g.__bucky_global_vars;
        }
        return vars;
    }
    static setGlobalVaribale(key, value) {
        const vars = this.globalVars();
        vars[key] = value;
    }
    static getGlobalVariable(key) {
        const vars = this.globalVars();
        return vars[key];
    }
    static deleteGlobalVariable(key) {
        const vars = this.globalVars();
        delete vars[key];
    }
}
const BLOG_STACK_EXP = /^\s*at .*(\S+\:\d+|\(native\))/m;
const BLOG_LINE_EXP = /(.+?)(?:\:(\d+))?(?:\:(\d+))?$/;
class BLogStackHelper {
    static _extractLocation(urlLike) {
        if (urlLike.indexOf(':') === -1) {
            return [urlLike];
        }
        const parts = BLOG_LINE_EXP.exec(urlLike.replace(/[\(\)]/g, ''));
        return [parts[1], parts[2] || undefined, parts[3] || undefined];
    }
    static _parseStackString(stackString) {
        const filtered = stackString.split('\n').filter((line) => {
            return !!line.match(BLOG_STACK_EXP);
        });
        return filtered.map((line) => {
            if (line.indexOf('(eval ') > -1) {
                line = line.replace(/eval code/g, 'eval').replace(/(\(eval at [^\()]*)|(\)\,.*$)/g, '');
            }
            const tokens = line.replace(/^\s+/, '').replace(/\(eval code/g, '(').split(/\s+/).slice(1);
            const locationParts = BLogStackHelper._extractLocation(tokens.pop());
            const functionName = tokens.join(' ') || undefined;
            const fileName = ['eval', '<anonymous>'].indexOf(locationParts[0]) > -1 ? undefined : locationParts[0];
            return ({
                functionName: functionName,
                fileName: fileName,
                lineNumber: locationParts[1],
                columnNumber: locationParts[2],
                source: line
            });
        });
    }
    static _getStackString(info) {
        let stack;
        try {
            throw new Error(info);
        } catch (e) {
            stack = e.stack;
        }
        return stack;
    }
    static baseName(path) {
        return path.split(/[\\/]/).pop();
    }
    static getStack(info) {
        const stackString = BLogStackHelper._getStackString('prepare stack');
        const stack = BLogStackHelper._parseStackString(stackString);
        if (info.pos) {
            const frameIndex = info.frame + 3;
            info.pos = null;
            if (stack && stack.length > 0 && frameIndex < stack.length) {
                const frame = stack[frameIndex];
                info.pos = {
                    'line': frame.lineNumber,
                    'file': frame.fileName,
                    'func': frame.functionName,
                };
                if (info.pos.file && !info.fullpath) {
                    info.pos.file = BLogStackHelper.baseName(info.pos.file);
                }
            }
        }
        if (info.stack) {
            if (stack && stack.length > 0) {
                info.stack = '';
                for (let index = info.frame + 3; index < stack.length; ++index) {
                    const frame = stack[index];
                    info.stack += `at ${frame.functionName} (${frame.fileName}:${frame.lineNumber}:${frame.columnNumber})\n`;
                }
            } else {
                info.stack = stackString;
            }
        }
    }
}
if (window.localStorage == null){
    origin_console.error('This browser does NOT support localStorage');
}
class BLogH5LocalStorage {
    static removeItemSync(key) {
        return window.localStorage.removeItem(key);
    }
    static setItemSync(key, value) {
        return window.localStorage.setItem(key, value);
    }
    static getItemSync(key) {
        return window.localStorage.getItem(key);
    }
    removeItemAsync(key, onComplete) {
        window.localStorage.removeItem(key);
        return onComplete(true);
    }
    setItemAsync(key, value, onComplete) {
        window.localStorage.setItem(key, value);
        return onComplete(true);
    }
    getItemAsync(key, onComplete) {
        const value = window.localStorage.getItem(key);
        return onComplete(value != null, value);
    }
}
const g_clFuncs = {
    [BLogLevel.TRACE]: origin_console.trace,
    [BLogLevel.DEBUG]: origin_console.debug,
    [BLogLevel.INFO]: origin_console.info,
    [BLogLevel.WARN]: origin_console.warn,
    [BLogLevel.ERROR]: origin_console.error,
    [BLogLevel.CHECK]: origin_console.error,
    [BLogLevel.FATAL]: origin_console.error,
};
class BLogConsoleTarget {
    constructor() {
    }
    output(logStringItem, options) {
        let func = g_clFuncs[options.level];
        if (func) {
            func(logStringItem);
        } else {
            origin_console.log(logStringItem);
        }
    }
}
class BLogH5Env {
    get localStorage() {
        return BLogH5LocalStorage;
    }
    platform() {
        return 'h5';
    }
    isAttachTTY() {
        return false;
    }
    filterOptions(options) {
        options.enablePos(false);
    }
}
class BLogArgConvert {
    constructor() {
        this.m_convertFuncs = {
            'object': (arg) => {
                return JSON.stringify(arg);
            },
            'undefined': () => {
                return 'undefined';
            },
            'function': () => {
                return '';
            },
            'string': (arg) => {
                return arg;
            },
        };
    }
    convertArg(arg) {
        const type = typeof arg;
        let result;
        try {
            let convertFunc = this.m_convertFuncs[type];
            if (convertFunc) {
                result = convertFunc(arg);
            } else {
                if (typeof arg['toString'] === 'function') {
                    return arg['toString']();
                }
                if (typeof arg['toJSON'] === 'function') {
                    return arg['toJSON']();
                }
                result = JSON.stringify(arg);
            }
        } catch (err) {
            result = '[!!!exception args!!!]';
        }
        return result;
    }
}
var assert = origin_console.assert;
const BLogEnv = new BLogH5Env();
class LinkedListItem {
    constructor(data, pre, next) {
        this.m_data = data;
        this.m_pre = pre;
        this.m_next = next;
    }
}
class LinkedList {
    constructor() {
        this.m_head = null;
        this.m_tail = null;
        this.m_current = null;
        this.m_length = 0;
        this.m_forward = false;
    }
    size() {
        return this.m_length;
    }
    count() {
        return this.m_length;
    }
    empty() {
        return this.m_length === 0;
    }
    back() {
        if (this.m_length === 0) {
            return;
        } else {
            return this.m_tail.m_data;
        }
    }
    front() {
        if (this.m_length === 0) {
            return;
        } else {
            return this.m_head.m_data;
        }
    }
    push_back(data) {
        let item = new LinkedListItem(data, this.m_tail, null);
        if (this.m_length > 0) {
            this.m_tail.m_next = item;
            this.m_tail = item;
        } else {
            this.m_head = item;
            this.m_tail = item;
        }
        ++this.m_length;
        return item;
    }
    pop_back() {
        if (this.m_length <= 0) {
            assert(this.m_head === null);
            assert(this.m_tail === null);
            return;
        }
        assert(this.m_tail);
        let item = this.m_tail;
        --this.m_length;
        if (this.m_length > 0) {
            this.m_tail = item.m_pre;
            this.m_tail.m_next = null;
        } else {
            this.m_head = null;
            this.m_tail = null;
        }
        if (this.m_current === item) {
            this._correct_current();
        }
        return item.m_data;
    }
    push_front(data) {
        let item = new LinkedListItem(data, null, this.m_head);
        if (this.m_length > 0) {
            this.m_head.m_pre = item;
            this.m_head = item;
        } else {
            this.m_tail = item;
            this.m_head = item;
        }
        ++this.m_length;
        return item;
    }
    pop_front() {
        if (this.m_length <= 0) {
            assert(this.m_head === null);
            assert(this.m_tail === null);
            return;
        }
        assert(this.m_head);
        let item = this.m_head;
        --this.m_length;
        if (this.m_length > 0) {
            this.m_head = item.m_next;
            this.m_head.m_pre = null;
        } else {
            this.m_head = null;
            this.m_tail = null;
        }
        if (this.m_current === item) {
            this._correct_current();
        }
        return item.m_data;
    }
    current() {
        if (this.m_current) {
            return this.m_current.m_data;
        } else {
            return;
        }
    }
    current_iterator() {
        return this.m_current;
    }
    _correct_current() {
        if (this.m_current) {
            let item = this.m_current;
            if (this.m_forward) {
                this.m_current = item.m_pre;
            } else {
                this.m_current = item.m_next;
            }
        }
    }
    delete(data) {
        let iterator = this.m_head;
        while (iterator) {
            if (data === iterator.m_data) {
                this.erase(iterator);
                return true;
            }
            iterator = iterator.m_next;
        }
        return false;
    }
    erase(iterator) {
        if (iterator === this.m_head) {
            this.pop_front();
        } else if (iterator === this.m_tail) {
            this.pop_back();
        } else {
            --this.m_length;
            let item = iterator;
            if (iterator === this.m_current) {
                this._correct_current();
            }
            assert(item.m_pre);
            assert(item.m_next);
            item.m_pre.m_next = item.m_next;
            item.m_next.m_pre = item.m_pre;
        }
    }
    reset() {
        this.m_current = null;
    }
    next() {
        this.m_forward = true;
        if (this.m_current) {
            this.m_current = this.m_current.m_next;
        } else {
            this.m_current = this.m_head;
        }
        if (this.m_current) {
            return true;
        } else {
            return false;
        }
    }
    prev() {
        this.m_forward = false;
        if (this.m_current) {
            this.m_current = this.m_current.m_pre;
        } else {
            this.m_current = this.m_tail;
        }
        if (this.m_current) {
            return true;
        } else {
            return false;
        }
    }
    [Symbol.iterator]() {
        return {
            iterator: this.m_head,
            self: this,
            next() {
                if (this.iterator) {
                    const ret = { value: this.iterator.m_data, done: false };
                    this.iterator = this.iterator.m_next;
                    return ret;
                } else {
                    return { value: undefined, done: true };
                }
            }
        };
    }
    clear() {
        let iterator = this.m_head;
        while (iterator) {
            delete iterator.m_data;
            iterator = iterator.m_next;
        }
        this.m_head = null;
        this.m_tail = null;
        this.m_current = null;
        this.m_length = 0;
    }
    exists(data) {
        let iterator = this.m_head;
        while (iterator) {
            if (data === iterator.m_data) {
                return true;
            }
            iterator = iterator.m_next;
        }
        return false;
    }
}
const BLogGetDefaultConsoleTarget = (() => {
    let instance;
    return function() {
        if (!instance) {
            instance = new BLogConsoleTarget();
        }
        return instance;
    };
})();
const LogTargetMode = {
    'ASYNC' : 0,
    'SYNC' : 1,
};
const LogMemoryCacheStatus = {
    'READY' : 0,
    'PENDING' : 1,
};
class LogMemoryCache
{
    constructor(options, target)
    {
        this.m_maxSize = -1;
        this.m_maxCount = 1024 * 10;
        if (options.maxSize)
        {
            this.m_maxSize = options.maxSize;
        }
        if (options.maxCount)
        {
            this.m_maxCount = options.maxCount;
        }
        this.m_retryInterval = 1000;
        this.m_retryMaxCount = 5;
        this.m_target = target;
        assert(this.m_target);
        this.m_logs = new LinkedList();
        this.m_size = 0;
    }
    chain(nextTarget, mode)
    {
        this.m_target = nextTarget;
        this.m_mode = mode;
        if (!nextTarget)
        {
            this.m_mode = 'copy';
        }
    }
    _onItemCompelte(logItem, ret)
    {
        const cb = logItem.c;
        if (cb)
        {
            cb(ret, logItem.l, logItem.o);
        }
    }
    _continue()
    {
        this._checkLimit();
        while (!this.m_logs.empty())
        {
            const logItem = this.m_logs.pop_front();
            if (this._outputItem(logItem))
            {
            }
            else
            {
                break;
            }
        }
    }
    _cacheLog(logString, options, onComplete, back = true)
    {
        const item = {
            'l' : logString,
            'o' : options,
            'c' : onComplete,
            'r' : 0,
        };
        this._cacheItem(item, back);
    }
    _cacheItem(logItem, back = true)
    {
        this.m_size += logItem.l.length;
        if (back)
        {
            this.m_logs.push_back(logItem);
        }
        else
        {
            this.m_logs.push_front(logItem);
        }
    }
    _checkLimit()
    {
        if (this.m_maxCount > 0)
        {
            while (this.m_logs.size() > this.m_maxCount)
            {
                const oldItem = this.m_logs.pop_front();
                this._onItemCompelte(oldItem);
            }
        }
        if (this.m_maxSize > 0)
        {
            while (this.m_size > this.m_maxSize)
            {
                const oldItem = this.m_logs.pop_front();
                if (oldItem)
                {
                    this.m_size -= oldItem.l.length;
                    assert(this.m_size >= 0);
                    this._onItemCompelte(oldItem);
                }
                else
                {
                    break;
                }
            }
        }
    }
}
class AsyncLogMemoryCache extends LogMemoryCache
{
    constructor(options, target)
    {
        super(options, target);
        this.m_status = LogMemoryCacheStatus.READY;
    }
    output(logString, options, onComplete)
    {
        const item = {
            'l' : logString,
            'o' : options,
            'c' : onComplete,
            'r' : 0,
        };
        let ret = false;
        if (this.m_status === LogMemoryCacheStatus.READY &&
            this.m_logs.empty())
        {
            ret = this._outputItem(item);
        }
        else
        {
            this._cacheItem(item, true);
        }
        return ret;
    }
    flush()
    {
        while (!this.m_logs.empty())
        {
            const logItem = this.m_logs.pop_front();
            if (this._outputItem(logItem))
            {
            }
            else
            {
                break;
            }
        }
    }
    _outputItem(logItem)
    {
        assert(this.m_status === LogMemoryCacheStatus.READY);
        this.m_status = LogMemoryCacheStatus.PENDING;
        let inCall = true;
        const outputRet = this.m_target.output(logItem.l, logItem.o, (ret) => {
            assert(this.m_status === LogMemoryCacheStatus.PENDING);
            this.m_status = LogMemoryCacheStatus.READY;
            if (ret === 0)
            {
                if (logItem.c)
                {
                    logItem.c(ret);
                }
                if (inCall)
                {
                    setTimeout(() => {
                        this._continue();
                    }, 0);
                }
                else
                {
                    this._continue();
                }
            }
            else
            {
                ++logItem.r;
                if (logItem.r > this.m_retryMaxCount)
                {
                    if (logItem.c)
                    {
                        logItem.c(ErrorCode.RESULT_FAILED);
                    }
                    if (inCall)
                    {
                        setTimeout(() => {
                            this._continue();
                        }, 0);
                    }
                    else
                    {
                        this._continue();
                    }
                }
                else
                {
                    this._cacheItem(logItem, false);
                    setTimeout(() => {
                        this._continue();
                    }, this.m_retryInterval);
                }
            }
        });
        inCall = false;
        if (outputRet)
        {
            this.m_status = LogMemoryCacheStatus.READY;
        }
        return outputRet;
    }
}
class SyncLogMemoryCache extends LogMemoryCache
{
    constructor(options, target)
    {
        super(options, target);
        this.m_timer = null;
    }
    output(logString, options, onComplete)
    {
        const item = {
            'l' : logString,
            'o' : options,
            'c' : onComplete,
            'r' : 0,
        };
        let ret = false;
        if (this.m_logs.empty())
        {
            ret = this._outputItem(item);
        }
        else
        {
            this._cacheLog(item, true);
        }
        return ret;
    }
    flush()
    {
        this._continue();
    }
    _outputItem(logItem)
    {
        let ret = this.m_target.output(logItem.l, logItem.o);
        if (ret)
        {
            if (logItem.c)
            {
                logItem.c(ret, logItem.l, logItem.o);
            }
        }
        else
        {
            this._cacheItem(logItem, false);
            if (this.m_timer == null)
            {
                this.m_timer = setTimeout(() => {
                    this.m_timer = null;
                    this._continue();
                }, this.m_retryInterval);
            }
        }
        return ret;
    }
}
class LogStorageTarget
{
    constructor(options, storage)
    {
        this.m_storage = storage;
        this.m_maxSize = 1024 * 1024 * 10;
        this.m_eraseSize = 1024 * 32;
        if (options.maxSize != null)
        {
            this.m_maxSize = options.maxSize;
        }
        if (options.eraseSize != null)
        {
            this.m_eraseSize = options.eraseSize;
        }
        this.m_beginIndex = 0;
        this.m_curIndex = 0;
        this.m_writtenSize = 0;
        this.m_sizeMap = {};
    }
    _nextKey(index)
    {
        if (index)
        {
            return '__blog_' + index;
        }
        else
        {
            return '__blog_' + this.m_curIndex++;
        }
    }
    syncErase()
    {
        let eraseSize = 0;
        while (this.m_beginIndex < this.m_curIndex)
        {
            const index = this.m_beginIndex;
            const key = this._nextKey(index);
            try
            {
                BLogEnv.localStorage.removeItemSync(key);
            }
            catch (e)
            {
                origin_console.error('remove log failed:', key, e);
            }
            const size = this.m_sizeMap[index];
            if (size != null)
            {
                eraseSize += size;
                delete this.m_sizeMap[index];
            }
            ++this.m_beginIndex;
            if (eraseSize >= this.m_eraseSize)
            {
                break;
            }
        }
    }
}
class AsyncLogStorageTarget extends LogStorageTarget
{
    constructor(options)
    {
        super(options);
        this.m_fs = null;
        this.m_ready = false;
    }
    _onOutputComplete(result, index, logString, option, onComplete)
    {
        if (result !== 0)
        {
            delete this.m_sizeMap[index];
            this.m_writtenSize -= logString.length;
        }
        assert(this.m_writtenSize >= 0);
        if (onComplete)
        {
            onComplete(result, logString, option);
        }
    }
    output(logString, option, onComplete)
    {
        if (this.m_writtenSize + logString.length >= this.m_maxSize)
        {
            origin_console.log('size extend!', this.m_writtenSize);
            this.syncErase();
        }
        const index = this.m_curIndex++;
        this.m_sizeMap[index] = logString.length;
        this.m_writtenSize += logString.length;
        const key = this._nextKey(index);
        BLogEnv.localStorage.setItemAsync(key, logString, (success) => {
            if (success)
            {
                this._onOutputComplete(0, index, logString, option, onComplete);
            }
            else
            {
                this._onOutputComplete(ErrorCode.RESULT_FAILED, index, logString, option, onComplete);
            }
        });
        return false;
    }
}
class SyncLogStorageTarget extends LogStorageTarget
{
    constructor(options)
    {
        super(options);
    }
    output(logString, option)
    {
        if (this.m_writtenSize + logString.length >= this.m_maxSize)
        {
            origin_console.log('size extend!', this.m_writtenSize);
            this.syncErase();
        }
        const index = this.m_curIndex;
        const key = this._nextKey(index);
        let ret = true;
        try
        {
            BLogEnv.localStorage.setItemSync(key, logString);
        }
        catch (e)
        {
            origin_console.log('set storage failed:', e, logString);
            ret = false;
        }
        if (ret)
        {
            this.m_curIndex++;
            this.m_writtenSize += logString.length;
            this.m_sizeMap[index] = logString.length;
        }
        return ret;
    }
}
class BLogOptionBaseValues {
    constructor() {
        this.m_switch = true;
        this.m_level = BLogLevel.ALL;
        this.m_logger = 'global';
        this.m_pos = true;
        this.m_stack = false;
        this.m_fullPath = false;
        this.m_headers = {};
        this.m_stringHeaders = {};
        this.m_separator = ',';
        this.m_logItemMaxLength = 1024 * 2;
        this.m_targets = [];
        this.m_formatter = new BLogNormalFormatter();
        this.m_levelConfig = [];
        this._initDefaultLevelConfig();
        this.m_appid = null;
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
        for (let i = BLogLevel.ALL; i < BLogLevel.OFF; ++i) {
            this.m_levelConfig[i] = {
                on: true,
            };
        }
        this.m_levelConfig[BLogLevel.CHECK].stack = true;
    }
}
class BLogOptions {
    constructor(baseValues) {
        if (baseValues) {
            this.m_baseValues = baseValues;
        } else {
            this.m_baseValues = new BLogOptionBaseValues();
            this.enableConsoleTarget(true);
        }
        BLogEnv.filterOptions(this);
        this.onAppidChange = null;
    }
    setSwitch(on) {
        this.m_baseValues.m_switch = on ? true : false;
    }
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
    clone() {
        return new BLogOptions(this.m_baseValues.clone());
    }
    cloneCC(cc) {
        return new BlogCCOptions(this.m_baseValues, cc);
    }
    setLoggerName(name) {
        this.m_baseValues.m_logger = name;
    }
    getLoggerName() {
        return this.m_baseValues.m_logger;
    }
    setFormatter(formatter) {
        this.m_baseValues.m_formatter = formatter;
    }
    getFormatter() {
        return this.m_baseValues.m_formatter;
    }
    setSeparator(separator) {
        this.m_baseValues.m_separator = separator;
    }
    getSeparator() {
        return this.m_baseValues.m_separator;
    }
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
    enableStack(enable) {
        this.m_baseValues.m_stack = enable;
    }
    getStack() {
        return this.m_baseValues.m_stack;
    }
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
    setAppID(appid) {
        const old = this.m_baseValues.m_appid;
        this.m_baseValues.m_appid = appid;
        if (this.onAppidChange) {
            this.onAppidChange(appid, old);
        }
    }
    getAppID() {
        return this.m_baseValues.m_appid;
    }
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
    getItemMaxLength() {
        return this.m_baseValues.m_logItemMaxLength;
    }
    setItemMaxLength(length) {
        assert(typeof length === 'number');
        this.m_baseValues.m_logItemMaxLength = length;
    }
    getTargets() {
        return this.m_baseValues.m_targets;
    }
    addTarget(target) {
        this.m_baseValues.m_targets.push(target);
    }
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
}
class BlogCCOptions extends BLogOptions {
    constructor(baseValues, cc) {
        super(baseValues);
        this.m_cc = cc;
    }
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
        strValue += `[${values.level}]${separator}`;
        strValue += `[${BLogNormalFormatter.formatTime(values.time)}]${separator}`;
        if (callOpt && callOpt.category)
        {
            strValue += `{${callOpt.category}}${separator}`;
        }
        strValue += values.traceInfo + separator;
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
        const formatter = options.getFormatter();
        let stringValue = formatter.format(values, this.m_options, callerOpt);
        const maxLength = options.getItemMaxLength();
        if (maxLength > 0 && stringValue.length > maxLength)
        {
            stringValue = stringValue.slice(0, maxLength) + '......';
        }
        if (callerOpt && callerOpt.preTarget)
        {
            if (!callerOpt.preTarget(level, stringValue))
            {
                return;
            }
        }
        const targets = options.getTargets();
        const targetOptions = {
            'level' : level,
            'lbr' : formatter.getLineBreak(),
        };
        targets.forEach((target) => {
            target.output(stringValue, targetOptions);
        });
        return this;
    }
    bind(name, options)
    {
        if (options == null)
        {
            options = {};
        }
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
    const getLogger = function(name) {
        const options = logObj.getOptions().clone();
        options.setLoggerName(name);
        const newLogObj = BLogGetLogManager().getLogger(name, options);
        return BLogModule(newLogObj);
    };
    const clone = () => {
        return BLogModule(logObj.clone());
    };
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
    const enablePos = (enable) => {
        return logObj.getOptions().enablePos(enable);
    };
    const enableFullPath = (enable) => {
        return logObj.getOptions().enableFullPath(enable);
    };
    const addStorageTarget = (options) => {
        return logObj.getOptions().addStorageTarget(options);
    };
    const addTarget = (target) => {
        return logObj.getOptions().addTarget(target);
    };
    const enableConsoleTarget = (enable) => {
        return logObj.getOptions().enableConsoleTarget(enable);
    };
    const filter = (obj) => {
        return obj;
    };
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
        'addStorageTarget' : addStorageTarget,
        'enableConsoleTarget' : enableConsoleTarget,
        'filter' : filter,
    };
    return blog;
}
const blog = BLogModule(BLogGetDefaultLog());
const BLOG_LEVEL_ALL = BLogLevel.ALL;
const BLOG_LEVEL_TRACE = BLogLevel.TRACE;
const BLOG_LEVEL_DEBUG = BLogLevel.DEBUG;
const BLOG_LEVEL_INFO = BLogLevel.INFO;
const BLOG_LEVEL_WARN = BLogLevel.WARN;
const BLOG_LEVEL_ERROR = BLogLevel.ERROR;
const BLOG_LEVEL_CHECK = BLogLevel.CHECK;
const BLOG_LEVEL_FATAL = BLogLevel.FATAL;
const BLOG_LEVEL_OFF = BLogLevel.OFF;
function BX_SetLogLevel(level)
{
    blog.setLevel(level);
}
function BX_SetAppID(appid)
{
    blog.setAppID(appid);
}
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
const hexDigits = "0123456789abcdef";
function createGUID() {
    const s = [];
    for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";
    const uuid = s.join('');
    return uuid;
}
class BaseCallChain {
    constructor(appid) {
        this.m_appid = appid;
         this.m_duringAsync = false;
    }
    get appid() {
        return this.m_appid;
    }
    enterAsyncCall() {
        this.m_duringAsync = true;
    }
    leaveAsyncCall() {
        this.m_duringAsync = false;
    }
    isDuringAsyncCall() {
        return this.m_duringAsync;
    }
}
class CallChain extends BaseCallChain {
    constructor(appid, parentid, ccid, frameid = 0, framename = null) {
        super(appid);
        this.m_parentid = parentid;
        this.m_ccid = ccid;
        if (this.m_ccid == null || this.m_ccid == '') {
            this.m_ccid = createGUID();
        }
        this.m_end = false;
        this.m_frameid = frameid;
        if (this.m_frameid == null) {
            this.m_frameid = 0;
        }
        this.m_callStack = [];
        if (framename == null) {
            framename = '__ccbase';
        }
        this.m_frameid++;
        const frame = new CCFrame(this, this.m_frameid, framename);
        this.m_callStack.push(frame);
        this.m_blog = null;
    }
    get ccid() {
        return this.m_ccid;
    }
    get traceid() {
        return this.m_ccid;
    }
    get parentid() {
        return this.m_parentid;
    }
    get frameid() {
        return this.m_frameid;
    }
    getSeq(autoInc) {
        const frame = this.getCurrentFrame();
        if (frame) {
            return frame.getSeq(autoInc);
        } else {
            return -1;
        }
    }
    get blog() {
        if (this.m_blog == null) {
            this.m_blog = blog.cloneCC(this);
        }
        return this.m_blog;
    }
    getCurrentFrame() {
        assert(this.m_callStack.length > 0);
        if (this.m_callStack.length > 0) {
            return this.m_callStack[this.m_callStack.length - 1];
        } else {
            return null;
        }
    }
    enter(name) {
        this.checkEnd();
        this.m_frameid++;
        const frame = new CCFrame(this, this.m_frameid, name);
        this.m_callStack.push(frame);
        blog.withcc(this).ctrl(`!##ENTER CCFRAME, ${frame.name}@${frame.frameid}`);
        return frame;
    }
    leave(name) {
        this.checkEnd();
        const frame = this.getCurrentFrame();
        if (frame) {
            if (name == null || frame.name === name) {
                this.m_callStack.pop();
                --this.m_frameid;
                blog.withcc(this).ctrl(`!##LEAVE CCFRAME, ${frame.name}@${frame.frameid}`);
            } else {
                blog.withcc(this).fatal(`leave ccframe error, unmatch name: name=${name}, expect=${frame.name}`);
            }
        } else {
            blog.withcc(this).fatal(`leave ccframe error, empty callstack: func=${name}`);
        }
    }
    checkEnd() {
        if (this.m_end) {
            blog.withcc(this).fatal('cc is already ended!');
        }
    }
    end() {
        this.checkEnd();
        if (this.m_callStack.length > 1) {
            blog.withcc(this).fatal(`end error, still in frames! frame=${this.getCurrentFrame().name}`);
            return;
        } else if (this.m_callStack.length < 1) {
            blog.withcc(this).fatal('end error, base frame is not exists!');
            return;
        }
        this.m_isEnd = true;
        blog.withcc(this).ctrl('!##END CALLCHAIN');
        this.m_callStack.pop();
        --this.m_frameid;
    }
    subCC(firstFrameName) {
        return new CallChain(this.m_appid, this.m_ccid, null, 0, firstFrameName);
    }
    serialize(obj) {
        assert(typeof obj === 'object');
        obj.cc = {
            enable: true,
            appid: this.m_appid,
            ccid: this.m_ccid,
            frameid: this.m_frameid,
        };
    }
    static unserialize(obj, framename) {
        let appid = typeof obj.cc === 'object'? obj.cc.appid : null;
        if (appid == null || appid == '' || appid === 'unknown') {
            if (obj.appid || obj.app_id) {
                appid = obj.appid || obj.app_id;
            } else if (blog.getAppID()) {
                appid = blog.getAppID();
            } else {
                appid = 'unknown';
            }
        }
        if (obj.cc) {
            if (obj.cc.enable) {
                return new CallChain(appid, null, obj.cc.ccid || obj.cc.traceid, obj.cc.frameid, framename);
            } else {
                return new DummyCallChain(appid);
            }
        } else {
            return new CallChain(appid);
        }
    }
    static registerBLogMethods(type) {
        const methods = [
            "trace",
            "debug",
            "info",
            "warn",
            "error",
            "fatal",
            "ctrl",
        ];
        for (const name of methods) {
            const level = BLogLevel.toLevel(name);
            assert(type.prototype[name] == undefined);
            type.prototype[name] = function(...args) {
                return this.blog.outputLog(level, 2, args);
            };
        }
        assert(type.prototype.log == undefined);
        type.prototype.log = function(...args) {
            return this.blog.outputLog(BLogLevel.INFO, 2, args);
        };
        assert(type.prototype.assert == undefined);
        type.prototype.assert = function(exp, ...args) {
            return this.blog.checkLog(exp, 2, args);
        };
        assert(type.prototype.check == undefined);
        type.prototype.check = function(exp, ...args) {
            return this.blog.checkLog(exp, 2, args);
        };
        type.prototype.filter = blog.filter;
    }
    static outputLog(level, frame, args, options) {
        const cc = getCurrentCallChain();
        return cc.blog.outputLog(level, frame, args, options);
    }
    static checkLog(exp, frame, args, options) {
        const cc = getCurrentCallChain();
        return cc.blog.checkLog(exp, frame, args, options);
    }
    static registerStaticBLogMethods(type) {
        const methods = [
            "trace",
            "debug",
            "info",
            "warn",
            "error",
            "fatal",
            "ctrl",
        ];
        for (const name of methods) {
            const level = BLogLevel.toLevel(name);
            assert(type[name] == undefined);
            type[name] = function(...args) {
                return CallChain.outputLog(level, 3, args);
            };
        }
        assert(type.log == undefined);
        type.log = function(...args) {
            return CallChain.outputLog(BLogLevel.INFO, 3, args);
        };
        assert(type.assert == undefined);
        type.assert = function(exp, ...args) {
            return CallChain.checkLog(exp, 3, args);
        };
        assert(type.check == undefined);
        type.check = function(exp, ...args) {
            return CallChain.checkLog(exp, 3, args);
        };
        type.filter = blog.filter;
    }
    static _newCallChain(firstFrameName = null) {
        let appid = blog.getAppID();
        if (typeof getCurrentApp === 'function') {
            const app = getCurrentApp();
            if (app) {
                appid = app.getID();
            }
        }
        return new CallChain(appid, null, null, 0, firstFrameName);
    }
    static setCurrentCallChain(cc, firstFrameName = null) {
        if (cc) {
            CallChain.s_one = cc;
        } else {
            if (CallChain.s_one) {
                CallChain.s_one = CallChain.s_one.subCC(firstFrameName);
            } else {
                CallChain.s_one = CallChain._newCallChain(firstFrameName);
            }
        }
    }
    static beginSubCallChain(cc, firstFrameName) {
        let newCC;
        if (cc) {
            newCC = cc.subCC(firstFrameName);
        } else {
            newCC = CallChain._newCallChain(firstFrameName);
        }
        CallChain.setCurrentCallChain(newCC);
    }
    static getCurrentCallChain(firstFrameName = null) {
        if (CallChain.s_one == null) {
            CallChain.setCurrentCallChain(null, firstFrameName);
        } else if (CallChain.s_one.isDuringAsyncCall()) {
            CallChain.setCurrentCallChain(null, firstFrameName);
        }
        return CallChain.s_one;
    }
    static enterAsyncCall() {
        const cc = CallChain.getCurrentCallChain();
        cc.enterAsyncCall();
        return cc;
    }
    static leaveAsyncCall(cc) {
        assert(cc);
        cc.leaveAsyncCall();
        CallChain.setCurrentCallChain(cc);
    }
}
class CCFrame extends BaseCallChain {
    constructor(cc, frameid, name = '') {
        super(cc.appid);
        this.m_cc = cc;
        this.m_frameid = frameid;
        this.m_name = name;
        this.m_blog = null;
        this.m_seq = 0;
    }
    get cc() {
        return this.m_cc;
    }
    get ccid() {
        return this.m_cc.ccid;
    }
    get traceid() {
        return this.m_cc.traceid;
    }
    get parentid() {
        return this.m_cc.parentid;
    }
    get frameid() {
        return this.m_frameid;
    }
    get name() {
        return this.m_name;
    }
    get blog() {
        if (this.m_blog == null) {
            this.m_blog = this.m_cc.blog.cloneCC(this);
        }
        return this.m_blog;
    }
    getSeq(autoInc) {
        const ret = this.m_seq;
        if (autoInc) {
            ++this.m_seq;
        }
        return ret;
    }
    enter(name) {
        return this.m_cc.enter(name);
    }
    leave() {
        return this.m_cc.leave(this.m_name);
    }
    subCC(firstFrameName) {
        return new CallChain(this.appid, this.ccid, null, 0, firstFrameName);
    }
    serialize(obj) {
        assert(typeof obj === 'object');
        obj.cc = {
            enable: true,
            appid: this.appid,
            ccid: this.ccid,
            frameid: this.m_frameid,
        };
    }
}
class DummyCallChain extends BaseCallChain {
    constructor(appid) {
        super(appid);
    }
    get ccid() {
        return null;
    }
    get traceid() {
        return null;
    }
    get parentid() {
        return null;
    }
    get frameid() {
        return null;
    }
    getSeq() {
        return null;
    }
    get blog() {
        if (this.m_blog == null) {
            if (blog.getAppID() !== this.m_appid) {
                this.m_blog = blog.cloneCC(this);
            } else {
                this.m_blog = blog;
            }
        }
        return this.m_blog;
    }
    serialize(obj) {
        assert(typeof obj === 'object');
        obj.cc = {
            enable: false,
            appid: this.m_appid,
        };
    }
    subCC() {
        return new DummyCallChain(this.m_appid);
    }
}
CallChain.registerBLogMethods(CallChain);
CallChain.registerBLogMethods(CCFrame);
CallChain.registerBLogMethods(DummyCallChain);
CallChain.registerStaticBLogMethods(CallChain);
const setCurrentCallChain = CallChain.setCurrentCallChain;
const getCurrentCallChain = CallChain.getCurrentCallChain;
const beginSubCallChain = CallChain.beginSubCallChain;
const BX_GET_CURRENT_CALLCHAIN = getCurrentCallChain;
const BX_SET_CURRENT_CALLCHAIN = setCurrentCallChain;
const BX_ENTER_ASYNC_CALL = CallChain.enterAsyncCall;
const BX_LEAVE_ASYNC_CALL = CallChain.leaveAsyncCall;
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