// 基于wx的localstorage的日志本地存储
class BLogRNLocalStorage {
    // RN环境暂时不支持同步的storage
    /*
    static removeItemSync(key) {
        
    }

    static setItemSync(key, value) {
        
    }

    static getItemSync(key) {
        
    }
    */

    removeItemAsync(key, onCompelte) {
        AsyncStorage.removeItem(key, (err) => {
            if (err) {
                onCompelte(false);
            } else {
                onCompelte(true);
            }
        });
    }

    setItemAsync(key, value, onCompelte) {
        AsyncStorage.setItem(key, value, (err) => {
            if (err) {
                onCompelte(false);
            } else {
                onCompelte(true);
            }
        });
    }

    getItemAsync(key, vlaue, onCompelte) {
        AsyncStorage.getItem(key, (err, value) => {
            if (err) {
                onCompelte(false);
            } else {
                onCompelte(true, value);
            }
        });
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
        const func = g_clFuncs[options.level];
        if (func) {
            func(logStringItem);
        } else {
            origin_console.log(logStringItem);
        }
    }
}


class BLogRNEnv {
    get localStorage() {
        return BLogRNLocalStorage;
    }

    // 平台
    platform() {
        return 'rn';
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

// function assert(exp, ...args) {
//     if (!exp) {
//         alert(...args);
//     }
// }
