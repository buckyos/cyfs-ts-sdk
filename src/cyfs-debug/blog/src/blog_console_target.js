
// env里面定义不同平台下的console输出

const BLogGetDefaultConsoleTarget = (() => {
    let instance;
    return function() {
        if (!instance) {
            instance = new BLogConsoleTarget();
        }

        return instance;
    };
})();
