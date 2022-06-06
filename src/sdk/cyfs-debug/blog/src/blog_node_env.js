class BLogNodeEnv {

    // 平台
    platform() {
        return os.platform();
    }

    isAttachTTY() {
        if (process.stdout && process.stdout.isTTY) {
            return true;
        }

        return false;
    }

    // 对日志选项进行预处理
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

// 输出到控制台
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

    /*
    info = {
        frame : [integer],
        pos : [boolean],
        fullpath : [boolean]
        stack : [boolean],
    }*/
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

// 对指定内容的关键字进行过滤
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
