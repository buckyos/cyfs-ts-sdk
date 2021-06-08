// 基于wx的localstorage的日志本地存储
class BLogWXLocalStorage
{
    static removeItemSync(key)
    {
        return wx.removeStorageSync(key);
    }

    static setItemSync(key, value)
    {
        return wx.setStorageSync(key, value);
    }

    static getItemSync(key)
    {
        return wx.getStorageSync(key);
    }

    static removeItemAsync(key, onCompelte)
    {
        const logItem = {
            key : key,
            success : () => { onCompelte(true); },
            fail : () => { onCompelte(false); },
        };

        wx.removeStorage(logItem);
    }

    static setItemAsync(key, value, onCompelte)
    {
        const logItem = {
            key : key,
            data : value,
            success : () => { onCompelte(true); },
            fail : () => { onCompelte(false); },
        };

        wx.setStorage(logItem);
    }

    static getItemAsync(key, onCompelte)
    {
        const logItem = {
            key : key,
            success : (res) => { onCompelte(true, res.data); },
            fail : () => { onCompelte(false); },
        };

        wx.getStorage(logItem);
    }
}

class BLogWXEnv
{
    constructor() {}

    get localStorage()
    {
        return BLogWXLocalStorage;
    }

    // 平台
    platform()
    {
        return 'wx';
    }

    isAttachTTY()
    {
        return false;
    }

    // 对日志选项进行预处理
    filterOptions(options)
    {
        options.enablePos(false);
    }
}

const g_clFuncs = {
    // wx下trace无输出，直接定位到debug上
    [BLogLevel.TRACE] : origin_console.debug,
    [BLogLevel.DEBUG] : origin_console.debug,
    [BLogLevel.INFO] : origin_console.info,
    [BLogLevel.WARN] : origin_console.warn,
    [BLogLevel.ERROR] : origin_console.error,
    [BLogLevel.CHECK] : origin_console.error,
    [BLogLevel.FATAL] : origin_console.error,
};

// 输出到控制台
class BLogConsoleTarget
{
    constructor()
    {
    }

    output(logStringItem, options)
    {
        let func = g_clFuncs[options.level];
        if (func)
        {
            func('', logStringItem);
        }
        else
        {
            origin_console.log('', logStringItem);
        }
    }
}

class BLogArgConvert
{
    constructor()
    {
        this.m_convertFuncs = {
            'object' : (arg) => {
                return JSON.stringify(arg);
            },

            'undefined' : () => {
                return 'undefined';
            },

            'function' : () => {
                return '';
            },

            'string' : (arg) => {
                return arg;
            },
        };
    }

    convertArg(arg)
    {
        const type = typeof arg;
        let result;
        try
        {
            let convertFunc = this.m_convertFuncs[type];
            if (convertFunc)
            {
                result = convertFunc(arg);
            }
            else
            {
                result = arg.toString();
            }
        }
        catch (err)
        {
            result = '[!!!exception args!!!]';
        }

        return result;
    }
}

var assert = origin_console.assert;
