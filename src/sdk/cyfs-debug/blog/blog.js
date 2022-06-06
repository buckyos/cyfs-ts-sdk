const os = require('os');
const path = require('path');
const assert = require('assert');
const fs = require('fs-extra');
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
        return global;
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
class BLogNodeEnv {
    platform() {
        return os.platform();
    }
    isAttachTTY() {
        if (process.stdout && process.stdout.isTTY) {
            return true;
        }
        return false;
    }
    filterOptions(options) {
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
class BLogStackHelper {
    static _getStack(func) {
        const old = Error.prepareStackTrace;
        Error.prepareStackTrace = (error, stack) => {
            return stack;
        };
        const err = new Error();
        Error.captureStackTrace(err, func);
        const stack = err.stack;
        Error.prepareStackTrace = old;
        return stack;
    }
    static _getPos(stack, frameIndex) {
        const frame = stack[frameIndex];
        const pos = {
            'line': frame.getLineNumber(),
            'file': frame.getFileName(),
            'func': frame.getFunctionName(),
        };
        return pos;
    }
    static getStack(info) {
        const stack = BLogStackHelper._getStack(BLogStackHelper.getStack);
        if (info.pos) {
            info.pos = BLogStackHelper._getPos(stack, info.frame + 1);
            if (info.pos.file && !info.fullpath) {
                info.pos.file = path.basename(info.pos.file);
            }
        }
        if (info.stack) {
            info.stack = '';
            for (let index = info.frame + 1; index < stack.length; ++index) {
                info.stack += `${stack[index].toString()}\n`;
            }
        }
    }
}
class BLogArgConvert {
    constructor() {
        this.m_util = require('util');
    }
    convertArg(arg) {
        if (typeof arg === 'string') {
            return arg;
        } else {
            if (typeof arg['toString'] === 'function') {
                return arg['toString']();
            }
            if (typeof arg['toJSON'] === 'function') {
                return arg['toJSON']();
            }
            return this.m_util.inspect(arg, { showHidden: true, depth: 3 });
        }
    }
}
class BLogKeyFilter {
    constructor(keyList) {
        this.m_keyList = keyList;
        this.m_handler = {
            get: (target, key) => {
                return this._get(target, key);
            },
            getOwnPropertyDescriptor: (target, key) => {
                return this._getOwnPropertyDescriptor(target, key);
            }
        };
    }
    filter(obj) {
        return new Proxy(obj, this.m_handler);
    }
    _private(key) {
        return (Object.getOwnPropertyDescriptor(this.m_keyList, key) != null);
    }
    _get(target, key) {
        const obj = this._private(key) ? '******' : Reflect.get(target, key);
        if (obj && typeof obj === 'object') {
            return new Proxy(obj, this.m_handler);
        } else {
            return obj;
        }
    }
    _getOwnPropertyDescriptor(target, key) {
        const obj = Reflect.getOwnPropertyDescriptor(target, key);
        if (this._private(key)) {
            obj.value = '******';
        } else if (obj && obj.value && typeof obj.value === 'object') {
            obj.value = new Proxy(obj.value, this.m_handler);
        }
        return obj;
    }
}
const BLogEnv = new BLogNodeEnv();
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
class LogFileTarget
{
    constructor(options)
    {
        assert(options.folder);
        assert(options.filename);
        this.m_folder = options.folder;
        this.m_filename = options.filename;
        this.m_filePath = null;
        this.m_fileMaxSize = 1024 * 1024 * 16;
        if (options.filemaxsize)
        {
            this.m_fileMaxSize = options.filemaxsize;
        }
        this.m_fileMaxCount = 10;
        if (options.filemaxcount)
        {
            this.m_fileMaxCount = options.filemaxcount;
        }
        this.m_fd = null;
        this.m_curFileIndex = 0;
        this.m_writtenSize = 0;
        this.m_retryInterval = 1000 * 5;
        this.m_status = 1;
        this._nextFilePath((index, filePath) => {
            this.m_curFileIndex = index;
            this.m_filePath = filePath;
            this._open();
        });
    }
    _nextFilePath(OnComplete)
    {
        let tm = null;
        let index = 0;
        let curIndex = this.m_curFileIndex;
        for (let i = 0; i < this.m_fileMaxCount; ++i)
        {
            const fullPath = this.m_folder + '/' + this.m_filename + '.' + curIndex + '.log';
            if (!fs.existsSync(fullPath))
            {
                index = curIndex;
                break;
            }
            const stat = fs.lstatSync(fullPath);
            if (stat.isFile())
            {
                if (!tm)
                {
                    tm = stat.mtime;
                    index = curIndex;
                }
                else if (stat.mtime < tm)
                {
                    tm = stat.mtime;
                    index = curIndex;
                }
            }
            else
            {
            }
            curIndex++;
            curIndex = curIndex % this.m_fileMaxCount;
        }
        const filePath = this.m_folder + '/' + this.m_filename + '.' + index + '.log';
        origin_console.log(filePath);
        OnComplete(index, filePath);
    }
}
class AsyncLogFileTarget extends LogFileTarget
{
    constructor(options)
    {
        super(options);
        this.m_fs = null;
        this.m_ready = false;
    }
    output(logString, option, onComplete)
    {
        if (this.m_fs)
        {
            if (this.m_ready)
            {
                this.m_writtenSize += logString.length;
                if (this.m_writtenSize >= this.m_fileMaxSize)
                {
                    origin_console.log('size extend!', this.m_writtenSize, this.m_fileMaxSize);
                    this._close();
                    this._nextFilePath((index, filePath) => {
                        this.m_curFileIndex = index;
                        this.m_filePath = filePath;
                        this._open();
                    });
                    onComplete(ErrorCode.RESULT_FAILED, logString, option);
                    return false;
                }
                this.m_ready = this.m_fs.write(logString + option.lbr, 'utf8', (err) => {
                    if (err)
                    {
                        onComplete(ErrorCode.RESULT_FAILED, logString, option);
                    }
                    else
                    {
                        onComplete(0, logString, option);
                    }
                });
            }
            else
            {
                onComplete(ErrorCode.RESULT_FAILED, logString, option);
            }
        }
        else
        {
            onComplete(ErrorCode.RESULT_FAILED, logString, option);
        }
        return false;
    }
    flush()
    {
    }
    _close()
    {
        if (this.m_fd)
        {
            let fd = this.m_fd;
            this.m_fd = null;
            this.m_fs = null;
            this.m_ready = false;
            this.m_writtenSize = 0;
            fs.close(fd, () => {
                origin_console.log('close fd success!', fd);
            });
        }
    }
    _open()
    {
        try
        {
            if (fs.existsSync(this.m_filePath))
            {
                fs.removeSync(this.m_filePath);
            }
        }
        catch (e)
        {
            origin_console.error('delete log file failed! file=', this.m_filePath, e);
        }
        fs.open(this.m_filePath, 'w+', (err, fd) => {
            if (err)
            {
                origin_console.error(`open log file failed: file=${this.m_path}, err=${err.message}`);
                this._onOpenFailed(err);
            }
            else
            {
                origin_console.info(
                    `open log file success: file=${this.m_filePath}`,
                );
                this._onOpenSuccess(fd);
            }
        });
    }
    _onOpenSuccess(fd)
    {
        assert(!this.m_fs);
        assert(fd);
        const opt = {
            'flags' : 'w',
            'fd' : fd,
            'mode' : 0o666,
            'autoClose' : true,
        };
        this.m_fd = fd;
        this.m_fs = fs.createWriteStream(null, opt);
        this.m_ready = true;
        this.m_fs.on('drain', () => {
            this.m_ready = true;
        });
    }
    _onOpenFailed(err)
    {
        if (!fs.existsSync(this.m_folder))
        {
            origin_console.log('will create dir', this.m_folder);
            fs.ensureDir(this.m_folder, (err) => {
                if (err)
                {
                    origin_console.error('create dir failed:', this.m_folder);
                    this._stopOpen(err);
                }
                else
                {
                    origin_console.info('create dir success:', this.m_folder);
                    this._open();
                }
            });
        }
        else
        {
            this._stopOpen(err);
        }
    }
    _stopOpen(error)
    {
        setTimeout(() => {
            this._open();
        }, this.m_retryInterval);
    }
}
class SyncLogFileTarget extends LogFileTarget
{
    constructor(options)
    {
        super(options);
        this.m_pos = 0;
    }
    output(logString, option)
    {
        if (this.m_fd == null)
        {
            return false;
        }
        this.m_writtenSize += logString.length;
        if (this.m_writtenSize >= this.m_fileMaxSize)
        {
            origin_console.log('size extend:', this.m_writtenSize, this.m_fileMaxSize);
            this._close();
            let ret = false;
            this._nextFilePath((index, filePath) => {
                this.m_curFileIndex = index;
                this.m_filePath = filePath;
                ret = this._open();
            });
            if (!ret)
            {
                return false;
            }
        }
        let ret = true;
        try
        {
            this.m_pos += fs.writeSync(this.m_fd, logString + option.lbr, this.m_pos, 'utf8');
        }
        catch (error)
        {
            origin_console.log('write log failed:', error, this.m_filePath, logString);
            ret = false;
        }
        return ret;
    }
    _open()
    {
        assert(this.m_fd == null);
        try
        {
            this.m_fd = fs.openSync(this.m_filePath, 'w+');
        }
        catch (error)
        {
            this.m_fd = null;
            origin_console.error('open file failed:', this.m_filePath, error);
        }
        if (this.m_fd)
        {
            origin_console.error(`open log file success: file=${this.m_filePath}`);
            this.m_pos = 0;
            return true;
        }
        else
        {
            origin_console.error(`open log file failed: file=${this.m_filePath}`);
            this._onOpenFailed();
            return false;
        }
    }
    _close()
    {
        if (this.m_fd)
        {
            let fd = this.m_fd;
            this.m_fd = null;
            this.m_writtenSize = 0;
            try
            {
                fs.closeSync(fd);
                origin_console.log('close fd success!', fd);
            }
            catch (error)
            {
                origin_console.error('close fd failed!', fd, error);
            }
        }
    }
    _onOpenFailed(err)
    {
        if (!fs.existsSync(this.m_folder))
        {
            origin_console.log('will create dir', this.m_folder);
            try
            {
                fs.ensureDirSync(this.m_folder);
            }
            catch (err)
            {
                origin_console.error('create dir exception:', this.m_folder, err);
            }
            if (fs.existsSync(this.m_folder))
            {
                origin_console.info('create dir success:', this.m_folder);
                this._open();
            }
            else
            {
                origin_console.error('create dir failed:', this.m_folder);
                this._stopOpen(err);
            }
        }
        else
        {
            this._stopOpen(err);
        }
    }
    _stopOpen(error)
    {
        this.m_status = -1;
        this.m_lastOpenTime = new Date();
        setTimeout(() => {
            this._open();
        }, this.m_retryInterval);
    }
}
const LOG_AGENT_PROTOCAL_VERSION = 1;
const LOG_AGENT_MAGIC_NUM = 201707019;
const LOG_AGENT_CMD = {
    NONE: 0,
    REG: 1,
    LOG: 2
};
const MAX_SEQ = 4294967295;
const LogTCPTargetPackageHeader = {
    'magic': LOG_AGENT_MAGIC_NUM,
    'version': LOG_AGENT_PROTOCAL_VERSION,
    'cmd': 0,
    'seq': 0,
    'bodyLen': 0,
};
const g_logTCPTargetPackageHeaderSize = 20;
class LogTCPTargetPackageEncoder {
    constructor() {
        this.m_buffer = null;
        this.m_dataLength = 0;
    }
    encode(cmd, seq, logString) {
        const bodyLength = Buffer.byteLength(logString);
        const fullLength = g_logTCPTargetPackageHeaderSize + bodyLength;
        let buffer = Buffer.allocUnsafe(g_logTCPTargetPackageHeaderSize + bodyLength);
        buffer.writeUInt32LE(LogTCPTargetPackageHeader.magic, 0);
        buffer.writeUInt32LE(LogTCPTargetPackageHeader.version, 4);
        buffer.writeUInt32LE(cmd, 8);
        buffer.writeUInt32LE(seq, 12);
        buffer.writeUInt32LE(bodyLength, 16);
        buffer.write(logString, 20, bodyLength, 'utf8');
        this.m_dataLength = fullLength;
        this.m_buffer = buffer;
    }
    getBuffer() {
        return this.m_buffer;
    }
    getDataLength() {
        return this.m_dataLength;
    }
    _grow(fullLength) {
    }
}
class LogTCPTarget {
    constructor(options) {
        assert(options);
        this.m_host = options.host;
        this.m_port = options.port;
        this.m_initString = options.init;
        if (this.m_initString) {
            assert(typeof this.m_initString === 'string');
        }
        blog.info('options:', options);
        this.m_retryInterval = 1000 * 5;
        this.m_connected = false;
        this.m_pending = false;
        this.m_seq = 0;
        this.m_encoder = new LogTCPTargetPackageEncoder();
        this.m_needOpen = true;
        this._open();
    }
    increaseSeq() {
        ++this.m_seq;
        if (this.m_seq >= MAX_SEQ) {
            this.m_seq = 0;
        }
    }
    formatLog(logString) {
        if (logString[0] != '[') {
            return null;
        }
        let len = logString.length;
        let level = '',
            time = '',
            category = '',
            extInfo = '';
        let index = 1;
        for (; index < len && logString[index] != ']'; ++index) {
            level += logString[index];
        }
        index += 3;
        for (; index < len && logString[index] != ']'; ++index) {
            time += logString[index];
        }
        index += 2;
        if (logString[index] == '{') {
            index += 1;
            for (; index < len && logString[index] != '}'; ++index) {
                category += logString[index];
            }
            index += 3;
        } else if (logString[index] == '<') {
            index += 1;
        }
        for (; index < len && logString[index] != '>'; ++index) {
            extInfo += logString[index];
        }
        if (index == len) {
            return null;
        }
        let logBody = logString.slice(index + 2);
        let header = [BLogLevel.toLevel(level), new Date(time).getTime(), category, extInfo];
        return header.join('@') + '*' + logBody;
    }
    output(logString, option, OnComplete) {
        let ret;
        if (this.m_connected && !this.m_pending) {
            let formatString = this.formatLog(logString);
            assert(formatString);
            const curSeq = this.m_seq;
            this.m_encoder.encode(LOG_AGENT_CMD.LOG, curSeq, formatString);
            this.increaseSeq();
            let needCallback = false;
            if (typeof collector !== 'undefined') {
                collector.begin('log_send', curSeq);
            }
            ret = this.m_sock.write(this.m_encoder.getBuffer(), 'binary', () => {
                if (typeof collector !== 'undefined') {
                    collector.end('log_send', curSeq, 0);
                }
                if (needCallback) {
                    assert(this.m_pending);
                    this.m_pending = false;
                    OnComplete(0, logString, option);
                }
            });
            if (ret) {
                this.m_pending = false;
            } else {
                this.m_pending = true;
                needCallback = true;
            }
        } else {
            ret = false;
            OnComplete(ErrorCode.RESULT_FAILED, logString, option);
        }
        return ret;
    }
    _open() {
        assert(!this.m_sock);
        assert(!this.m_connected);
        this.m_sock = new net.Socket({
            'readable': false,
            'writable': true,
        });
        let parser = null;
        this.m_sock.on('connect', () => {
            BX_DEBUG('connect log sock target success!');
            parser = new LogTCPDataParser((header, buffer, pos) => {
                if (header.m_magicNum != LOG_AGENT_MAGIC_NUM) {
                    BX_WARN('magic num not match, header:', header);
                    return ErrorCode.RESULT_INVALID_PARAM;
                }
                if (header.m_cmd === LOG_AGENT_CMD.REG) {
                    let bodyData = buffer.toString('utf8', pos, pos + header.m_dataLength);
                    let body = JSON.parse(bodyData);
                    if (body.enableFileLog == 1) {
                        let logDir = '';
                        let logFileName = '';
                        if (body.logDir) {
                            logDir = body.logDir;
                        } else {
                            logDir = '/var/blog/' + body.serviceid;
                        }
                        if (body.logFileName) {
                            logFileName = body.logFileName;
                        } else {
                            logFileName = `${body.serviceid}[${body.nodeid}][${process.pid}]`;
                        }
                        BX_EnableFileLog(logDir, logFileName, null, body.logFileMaxSize, body.logFileMaxCount);
                        BX_INFO('return from agent, will output file log:', logDir, logFileName);
                    }
                } else if (header.m_cmd === LOG_AGENT_CMD.LOG) {
                }
                return ErrorCode.RESULT_OK;
            });
            this.m_needOpen = false;
            assert(!this.m_connected);
            this.m_connected = true;
            this._sendInitPackage();
        });
        this.m_sock.on('data', (data) => {
            if (!parser.pushData(data)) {
                BX_WARN(`parse data error`);
                this.m_sock.destroy();
            }
        });
        this.m_sock.on('close', (hadError) => {
            this.m_connected = false;
            parser = null;
            BX_DEBUG('log sock target connection closed! hadError=', hadError);
            this._retryConnect();
        });
        this.m_sock.on('error', (err) => {
            this.m_connected = false;
            parser = null;
            BX_WARN('connect log sock target err! err=', err.stack);
        });
        this._connect();
    }
    _connect() {
        assert(this.m_sock);
        assert(!this.m_connected);
        const options = {
            'host': this.m_host,
            'port': this.m_port,
        };
        this.m_sock.connect(options);
    }
    _sendInitPackage() {
        if (this.m_initString) {
            this.m_encoder.encode(LOG_AGENT_CMD.REG, this.m_seq, this.m_initString);
            this.increaseSeq();
            this.m_sock.write(this.m_encoder.getBuffer(), 'binary');
        }
    }
    _retryConnect() {
        setTimeout(() => {
            this._connect();
        }, this.m_retryInterval);
    }
}
class LogTCPPackageHeader {
    constructor() {
        this.reset();
    }
    reset() {
        this.m_magicNum = LOG_AGENT_MAGIC_NUM;
        this.m_version = LOG_AGENT_PROTOCAL_VERSION;
        this.m_cmd = LOG_AGENT_CMD.NONE;
        this.m_dataLength = 0;
        this.m_seq = 0;
    }
    decode(buffer, pos) {
        if (buffer.length < pos + g_logTCPTargetPackageHeaderSize) {
            return false;
        }
        this.m_magicNum = buffer.readUInt32LE(pos);
        this.m_version = buffer.readUInt32LE(pos + 4);
        this.m_cmd = buffer.readUInt32LE(pos + 8);
        this.m_seq = buffer.readUInt32LE(pos + 12);
        this.m_dataLength = buffer.readUInt32LE(pos + 16);
        if (this.m_magicNum != LOG_AGENT_MAGIC_NUM) {
            BX_WARN(`magic num not match, magic=${this.m_magicNum}`);
            return false;
        }
        if (this.m_dataLength <= 0 || this.m_dataLength > PACKAGE_MAX_LENGTH) {
            BX_WARN(`invalid package length, length=${this.m_dataLength}`);
            return false;
        }
        return true;
    }
    getDataLength() {
        return this.m_dataLength;
    }
    getCmd() {
        return this.m_cmd;
    }
    getSeq() {
        return this.m_seq;
    }
    getInfo() {
        return {
            magicNum: this.m_magicNum,
            version: this.m_version,
            cmd: this.m_cmd,
            seq: this.m_seq,
            dataLength: this.m_dataLength
        };
    }
}
const PACKAGE_MAX_LENGTH = 1024 * 8;
class LogTCPDataParser {
    constructor(onRecvPackage) {
        this.m_dataBuffer = Buffer.allocUnsafe(PACKAGE_MAX_LENGTH + 1);
        this.m_onRecvPackage = onRecvPackage;
        this.m_header = new LogTCPPackageHeader();
        this.m_data = null;
        this.reset();
    }
    reset() {
        this.m_leftSize = g_logTCPTargetPackageHeaderSize;
        this.m_status = 0;
        this.m_dataSize = 0;
    }
    pushData(srcBuffer) {
        let srcLen = srcBuffer.length;
        let offset = 0;
        let ret = true;
        let parsePos = 0;
        let parseBuffer = null;
        let copyLen = 0;
        for (;;) {
            if (srcLen < this.m_leftSize) {
                copyLen = srcBuffer.copy(this.m_dataBuffer, this.m_dataSize, offset, offset + srcLen);
                this.m_dataSize += srcLen;
                this.m_leftSize -= srcLen;
                break;
            } else {
                if (this.m_dataSize != 0) {
                    copyLen = srcBuffer.copy(this.m_dataBuffer, this.m_dataSize, offset, offset + this.m_leftSize);
                    this.m_dataSize = 0;
                    parseBuffer = this.m_dataBuffer;
                    parsePos = 0;
                } else {
                    parseBuffer = srcBuffer;
                    parsePos = offset;
                }
                srcLen -= this.m_leftSize;
                offset += this.m_leftSize;
                if (this.m_status === 0) {
                    ret = this.onRecvHeader(parseBuffer, parsePos);
                } else if (this.m_status === 1) {
                    ret = this.onRecvBody(parseBuffer, parsePos);
                    this.reset();
                } else {
                    BX_WARN('unexpected status!', this.m_status);
                    ret = false;
                }
                if (!ret) {
                    break;
                }
            }
        }
        return ret;
    }
    onRecvHeader(buffer, pos) {
        if (!this.m_header.decode(buffer, pos)) {
            BX_WARN('decode header failed! ');
            return false;
        }
        assert(this.m_status === 0);
        this.m_status = 1;
        this.m_leftSize = this.m_header.m_dataLength;
        return true;
    }
    onRecvBody(buffer, pos) {
        let ret = this.m_onRecvPackage(this.m_header, buffer, pos);
        return ret === ErrorCode.RESULT_OK;
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
    addFileTarget(options) {
        let rootFolder;
        if (os.platform() === 'win32') {
            rootFolder = 'C:\\cyfs\\log\\';
        } else {
            rootFolder = '/cyfs/log/';
        }
        let fileName = path.basename(require.main.filename || require.main.i || 'node.js', '.js');
        if (!fileName || fileName.length <= 0) {
            fileName = 'node';
        }
        fileName += '[' + process.pid + ']';
        const defaultOptions = {
            'rootFolder': rootFolder,
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
        defaultOptions.folder = defaultOptions.rootFolder;
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
class BLogStaticConfigLoader
{
    constructor()
    {
        this.m_configFile = null;
        this.m_configFileName = 'blog.cfg';
        this.m_globalDir = '';
        const platform = BLogEnv.platform();
        if (platform === 'win32')
        {
            this.m_globalDir = 'c:\\blog';
        }
        else
        {
            this.m_globalDir = '/etc/blog';
        }
        this.onchange = null;
    }
    _monitorChange()
    {
        fs.watchFile(this.m_configFile, () => {
            origin_console.log('blog config file changed, file=', this.m_configFile);
            if (this.onchange)
            {
                this.onchange();
            }
        });
    }
    _findCFGFile()
    {
        assert(this.m_configFile == null);
        const mainfile = process.argv[1];
        assert(mainfile);
        const fileInfo = path.parse(mainfile);
        const processConfig = fileInfo.dir + '/' + this.m_configFileName;
        if (fs.existsSync(processConfig))
        {
            origin_console.log('will use blog process config:', processConfig);
            this.m_configFile = processConfig;
            return true;
        }
        const globalConfig = this.m_globalDir + '/' + this.m_configFileName;
        if (fs.existsSync(globalConfig))
        {
            origin_console.log('will use blog global config:', globalConfig);
            this.m_configFile = globalConfig;
            return true;
        }
        return false;
    }
    load(appid)
    {
        if (this.m_configFile == null)
        {
            if (!this._findCFGFile())
            {
                return;
            }
            assert(this.m_configFile);
            this._monitorChange();
        }
        try
        {
            const context = fs.readFileSync(this.m_configFile, 'utf8');
            const jsonConfig = JSON.parse(context);
            if (jsonConfig)
            {
                return this._parse(appid, jsonConfig);
            }
        }
        catch (err)
        {
            origin_console.error(`parse blog config failed! file=${this.m_configFile}, err=${err}`);
        }
        return null;
    }
    _parse(appid, jsonConfig)
    {
        if (appid == null || appid == '')
        {
            appid = 'global';
        }
        let configNode = jsonConfig[appid];
        if (configNode == null)
        {
            configNode = jsonConfig.global;
        }
        else
        {
            for (const key in jsonConfig.global)
            {
                if (!configNode.hasOwnProperty(key))
                {
                    configNode[key] = jsonConfig.global[key];
                }
            }
        }
        return configNode;
    }
}
class BLogStaticConfig
{
    constructor(option)
    {
        this.m_option = option;
        if (BLogEnv.isAttachTTY())
        {
            this.m_option.enableConsoleTarget(true);
        }
        option.onAppidChange = () => {
            this._load();
        };
        this.m_loader = new BLogStaticConfigLoader();
        this.m_loader.onchange = () => {
            this._load();
        };
    }
    init()
    {
        return this._load();
    }
    _load()
    {
        const config = this.m_loader.load(this.m_option.getAppID());
        if (config)
        {
            this._parseConfig(config);
        }
    }
    _parseConfig(configNode)
    {
        for (const key in configNode)
        {
            const value = configNode[key];
            if (key === 'off')
            {
                this.m_option.setSwitch(!value);
            }
            else if (key === 'level')
            {
                this.m_option.setLevel(value);
            }
            else if (key === 'pos')
            {
                this.m_option.enablePos(value);
            }
            else if (key === 'fullpath')
            {
                this.m_option.enableFullPath(value);
            }
            else if (key === 'stack')
            {
                this.m_option.enableStack(value);
            }
            else if (key === 'separator')
            {
                this.m_option.setSeparator(value);
            }
            else if (key === 'itemmaxlength')
            {
                this.m_option.setItemMaxLength(parseInt(value));
            }
            else if (key === 'console')
            {
                if (!BLogEnv.isAttachTTY())
                {
                    this.m_option.enableConsoleTarget(value);
                }
            }
            else if (key === 'filetarget')
            {
                if (value instanceof Array)
                {
                    for (const item of value)
                    {
                        this._parseFileTarget(item);
                    }
                }
                else if (typeof value === 'object')
                {
                    this._parseFileTarget(value);
                }
                else
                {
                    if (value)
                    {
                        this.m_option.addFileTarget({});
                    }
                }
            }
            else
            {
                origin_console.error('unknown blog config key:', key, value);
            }
        }
    }
    _parseFileTarget(configValue)
    {
        const options = {};
        for (const key of configValue)
        {
            const value = configValue[key];
            if (key === 'rootdir')
            {
                options.rootFolder = value;
            }
            else if (key === 'subdir')
            {
                options.subFolder = value;
            }
            else if (key === 'filename')
            {
                options.filename = value;
            }
            else if (key === 'filemaxsize')
            {
                options.filemaxsize = value;
            }
            else if (key === 'filemaxcount')
            {
                options.filemaxcount = value;
            }
            else if (key === 'mode')
            {
                options.mode = value;
            }
            else
            {
                origin_console.error('unknown filetarget config key:', key, value);
            }
        }
        this.m_option.addFileTarget(options);
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
        const staticConfig = new BLogStaticConfig(instance);
        staticConfig.init();
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
        if (typeof collector !== 'undefined')
        {
            collector.once('log_item', stringValue.length);
        }
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
    const addFileTarget = (options) => {
        return logObj.getOptions().addFileTarget(options);
    };
    const addSocketTarget = (options) => {
        return logObj.getOptions().addSocketTarget(options);
    };
    const addTarget = (target) => {
        return logObj.getOptions().addTarget(target);
    };
    const enableConsoleTarget = (enable) => {
        return logObj.getOptions().enableConsoleTarget(enable);
    };
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
        'addFileTarget' : addFileTarget,
        'addSocketTarget' : addSocketTarget,
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
    if (blog.getAppID() == null)
    {
        blog.setAppID(options.service);
    }
    blog.addSocketTarget(targetDefaultOptions);
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
module.exports.BX_EnableFileLog = BX_EnableFileLog;
module.exports.BX_EnableSocketLog = BX_EnableSocketLog;
module.exports.LOG_AGENT_PROTOCAL_VERSION = LOG_AGENT_PROTOCAL_VERSION;
module.exports.LOG_AGENT_MAGIC_NUM = LOG_AGENT_MAGIC_NUM;
module.exports.LOG_AGENT_CMD = LOG_AGENT_CMD;