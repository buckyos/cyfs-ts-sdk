class GlobalUtility {
    static _global() {
//=>#if defined(_NODEJS) || defined(_RNJS) || defined(_WXJS)
        return global;
//=>#elif defined(_H5JS)
        return window;
//=>#else
//=>#error "unsupport platform!"
//=>#endif
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

    // 全局变量操作接口
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
