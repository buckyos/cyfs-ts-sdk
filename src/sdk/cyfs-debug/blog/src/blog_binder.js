class BLogBinder {
    constructor(target, category) {
        this.m_target = target;
        this.m_level = BLogLevel.INFO;
        this.m_switch = true;
        this.m_preTargetHook = null;
        this.m_frame = 4;

        Object.defineProperty(this, 'm_category', {
            configurable : false,
            enumerable: false,
            writable: false,
            value : category,
        });
    }

    get target() {
        return this.m_target;
    }

    setFrame(frame) {
        this.m_frame = frame;
    }

    // 设置钩子，只可以设置一次
    setHook(preTarget) {
        Object.defineProperty(this, 'm_preTargetHook', {
            configurable : false,
            enumerable: false,
            writable: false,
            value : preTarget,
        });
    }

    setSwitch(on) {
        this.m_switch = on ? true : false;
    }

    isOn(level) {
        return (this.m_switch && level >= this.m_level);
    }

    _getLevelIndex(level) {
        let ret = 0;
        if (typeof(level) === 'number') {
            ret = level;
        } else if (typeof(level) === 'string') {
            ret = BLogLevel.toLevel(level);
        } else {
            assert(false);
        }

        return ret;
    }

    setLevel(level) {
        this.m_level = this._getLevelIndex(level);
        assert(this.m_level >= BLogLevel.ALL && this.m_level <= BLogLevel.OFF);
    }

    getLevel() {
        return BLogLevel.toString(this.m_level);
    }

    outputLog(level, frame, args) {
        const options = {
            preTarget : this.m_preTargetHook,
            category: this.m_category,
        };
        this.target.outputLog(level, frame, args, options);
    }

    checkLog(exp, frame, args) {
        const options = {
            preTarget : this.m_preTargetHook,
            category: this.m_category,
        };

        this.target.checkLog(exp, frame, args, options);
    }

    static registerBLogMethods(type) {
        const methods = [
            'trace',
            'debug',
            'info',
            'warn',
            'error',
            'fatal',
            'ctrl',
        ];

        for (const name of methods) {
            const level = BLogLevel.toLevel(name);
            assert(type.prototype[name] == undefined);
            type.prototype[name] = function(...args) {
                if (this.isOn(level)) {
                    this.outputLog(level, this.m_frame, args);
                }
                return this;
            };
        }

        assert(type.prototype.log == undefined);
        type.prototype.log = function(...args) {
            if (this.isOn(BLogLevel.INFO)) {
                this.outputLog(BLogLevel.INFO, this.m_frame, args);
            }
            return this;
        };

        assert(type.prototype.assert == undefined);
        type.prototype.assert = function(exp, ...args) {
            if (this.isOn(BLogLevel.CHECK)) {
                this.checkLog(exp, this.m_frame, args);
            }
            return this;
        };

        assert(type.prototype.check == undefined);
        type.prototype.check = function(exp, ...args) {
            if (this.isOn(BLogLevel.CHECK)) {
                this.checkLog(exp, this.m_frame, args);
            }
            return this;
        };

        type.prototype.filter = blog.filter;
    }
}

BLogBinder.registerBLogMethods(BLogBinder);
const g_coreBLogBinder = new BLogBinder(CallChain, 'core');

// 用以控制core.js里面的日志开关
const BX_SetCoreBLogLevel = (level) => {
    return g_coreBLogBinder.setLevel(level);
};

const BX_GetCoreBLogLevel = (level) => {
    return g_coreBLogBinder.getLevel(level);
};

const BX_SetCoreBLogSwitch = (on) => {
    return g_coreBLogBinder.setSwitch(on);
};


// BX_XXX全局变量定义，用以在内核使用
const BX_LOG = g_coreBLogBinder.log.bind(g_coreBLogBinder);
const BX_DEBUG = g_coreBLogBinder.debug.bind(g_coreBLogBinder);
const BX_TRACE = g_coreBLogBinder.trace.bind(g_coreBLogBinder);
const BX_INFO = g_coreBLogBinder.info.bind(g_coreBLogBinder);
const BX_WARN = g_coreBLogBinder.warn.bind(g_coreBLogBinder);
const BX_CHECK = g_coreBLogBinder.check.bind(g_coreBLogBinder);
const BX_ERROR = g_coreBLogBinder.error.bind(g_coreBLogBinder);
const BX_FATAL = g_coreBLogBinder.fatal.bind(g_coreBLogBinder);
const BX_CTRL = g_coreBLogBinder.ctrl.bind(g_coreBLogBinder);

const BX_ASSERT = g_coreBLogBinder.assert.bind(g_coreBLogBinder);
const BX_FILTER = g_coreBLogBinder.filter.bind(g_coreBLogBinder);

const setCurrentCallChain = CallChain.setCurrentCallChain;
const getCurrentCallChain = CallChain.getCurrentCallChain;
const beginSubCallChain = CallChain.beginSubCallChain;

const BX_GET_CURRENT_CALLCHAIN = getCurrentCallChain;
const BX_SET_CURRENT_CALLCHAIN = setCurrentCallChain;
const BX_ENTER_ASYNC_CALL = CallChain.enterAsyncCall;
const BX_LEAVE_ASYNC_CALL = CallChain.leaveAsyncCall;
