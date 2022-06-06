const hexDigits = "0123456789abcdef";

function createGUID() {
    const s = [];
    
    for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    const uuid = s.join('');
    return uuid;
}

class BaseCallChain {
    constructor(appid) {
        this.m_appid = appid;
        
         // 标志当前cc是否处于异步调用中
         this.m_duringAsync = false;
    }

    get appid() {
        return this.m_appid;
    }

    // 当前cc进入和离开异步调用的相关接口
    // 一个cc同时只能进入一次异步调用
    enterAsyncCall() {
        //assert(!this.m_duringAsync);
        this.m_duringAsync = true;
    }

    // 一次enter可以多次leave
    leaveAsyncCall() {
        //assert(this.m_duringAsync);
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

        // 如果指定了ccid，那么继承该ccid；否则创建一个新的ccid
        if (this.m_ccid == null || this.m_ccid == '') {
            this.m_ccid = createGUID();
        }

        // 标志当前callchain是否已经结束
        this.m_end = false;

    
        // 尝试继承当前的frameid，如果没有指定，默认为0
        this.m_frameid = frameid;
        if (this.m_frameid == null) {
            this.m_frameid = 0;
        }

        // 当前调用栈
        this.m_callStack = [];

        // 构造或者继承一个cc后，必须设定当前基准frame
        if (framename == null) {
            framename = '__ccbase';
        }
        this.m_frameid++;
        const frame = new CCFrame(this, this.m_frameid, framename);
        this.m_callStack.push(frame);


        this.m_blog = null;

        /*
        if (subCC) {
            if (parentid == null) {
                blog.withcc(this).trace(`!##START CC, appid=${this.appid}, id=${this.ccid}`);
            } else {
                blog.withcc(this).trace(`!##START SUBCC, appid=${this.appid}, id=${this.ccid}, parent=${this.parentid}`);
            }
        }
        */
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

    // 开启一个新的栈桢
    // return CCFrame
    enter(name) {
        this.checkEnd();

        this.m_frameid++;

        const frame = new CCFrame(this, this.m_frameid, name);
        this.m_callStack.push(frame);

        blog.withcc(this).ctrl(`!##ENTER CCFRAME, ${frame.name}@${frame.frameid}`);

        return frame;
    }

    // 离开一个栈桢，需要和enter配套调用
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

    // 确保尚未结束
    checkEnd() {
        if (this.m_end) {
            blog.withcc(this).fatal('cc is already ended!');
        }
    }

    // 结束当前callchain
    // 一个callchain只可以结束一次，并且结束前不能有未决的frame！！
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

        // 弹出基准frame
        this.m_callStack.pop();
        --this.m_frameid;
    }

    // 开启一个子callchain
    subCC(firstFrameName) {
        return new CallChain(this.m_appid, this.m_ccid, null, 0, firstFrameName);
    }

    // 序列化核心信息到obj
    serialize(obj) {
        assert(typeof obj === 'object');

        obj.cc = {
            enable: true,
            appid: this.m_appid,
            ccid: this.m_ccid,
            frameid: this.m_frameid,
        };
    }

    // 从协议里面相应字段创建出对应的callchain
    static unserialize(obj, framename) {
        // 尝试读取appid
        let appid = typeof obj.cc === 'object'? obj.cc.appid : null;
        if (appid == null || appid == '' || appid === 'unknown') {
            // 如果外层指定了有效的appid，那么尝试使用外层的appid
            if (obj.appid || obj.app_id) {
                appid = obj.appid || obj.app_id;
            } else if (blog.getAppID()) {
                // 如果仍然没有有效的appid，那么使用blog的全局appid
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
            // 创建新的cc
            return new CallChain(appid);
        }
    }

    // 注册blog的常用方法到cc
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

    // 注册blog的常用方法到cc
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

    // 设置新的callChain，如果callChain=null,那么会创建一个新的
    static setCurrentCallChain(cc, firstFrameName = null) {
        if (cc) {
            CallChain.s_one = cc;
        } else {
            // 创建新的
            if (CallChain.s_one) {
                CallChain.s_one = CallChain.s_one.subCC(firstFrameName);
            } else {
                CallChain.s_one = CallChain._newCallChain(firstFrameName);
            }
        }
    }

    // 开始新的子callchain
    // cc是父callchain
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

// callchain里面的一帧
class CCFrame extends BaseCallChain {
    constructor(cc, frameid, name = '') {
        super(cc.appid);
        this.m_cc = cc;
        this.m_frameid = frameid;
        this.m_name = name;
        this.m_blog = null;

        // 每一桢的序号都从0开始
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

    // 开启一个子callchain
    subCC(firstFrameName) {
        return new CallChain(this.appid, this.ccid, null, 0, firstFrameName);
    }

    // 序列化核心信息到obj
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

// 只带appid的callchain，在关闭cc情况下使用，用以减少成本
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
                // 全局blog已经绑定了该appid，那么这里为了降低成本，先直接返回全局blog
                // TODO blog的clone优化后可以返回cloneCC(this)
                this.m_blog = blog;
            }
        }

        return this.m_blog;
    }

    // 序列化核心信息到obj
    serialize(obj) {
        assert(typeof obj === 'object');

        obj.cc = {
            enable: false,
            appid: this.m_appid,
        };
    }

    // 开启一个子callchain
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
