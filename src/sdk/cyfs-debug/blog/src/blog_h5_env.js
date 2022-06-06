if (window.localStorage == null){
    origin_console.error('This browser does NOT support localStorage');
}

// 基于wx的localstorage的日志本地存储
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

    // h5不支持异步的localstorage，所以使用同步来模拟
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


class BLogH5Env {

    get localStorage() {
        return BLogH5LocalStorage;
    }

    // 平台
    platform() {
        return 'h5';
    }

    isAttachTTY() {
        return false;
    }

    // 对日志选项进行预处理
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
