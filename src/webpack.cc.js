const moment = require('moment');

let pack_env = process.env.cyfs_pack_env?process.env.cyfs_pack_env.trim():'node';
let sdk_channel = process.env.cyfs_sdk_channel?process.env.cyfs_sdk_channel.trim():'nightly';

console.log("cyfs_pack_env:", pack_env);
console.log("cyfs_sdk_channel:", sdk_channel);

let conditionalCompiler = {
    loader : 'js-conditional-compile-loader',
    options : {
        // 这里可以添加不同的条件
        isDebug : process.env.NODE_ENV === 'development', // optional, this expression is default
        node : pack_env === 'node',
        rn : pack_env === 'rn',
        h5 : pack_env === "h5",
        nightly: sdk_channel === 'nightly' || sdk_channel === undefined,
        beta: sdk_channel === 'beta',
        stable: sdk_channel === 'stable',
    }
};

console.log(conditionalCompiler.options);

function get_channel_num(channel) {
    switch (channel) {
        case 'nightly':
            return 0;
        case 'beta':
            return 1;
        case 'stable':
            return 2;
        default:
            return 0;
    }
}

function sdk_version() {
    let version = process.env.cyfs_sdk_version || "0";
    let num_channel = get_channel_num(sdk_channel);
    let build_date = moment().format("yyyy-MM-DD")
    return `1.0.${num_channel}.${version}-${sdk_channel} (${build_date})`;
}

function node_sdk_version() {
    let build_date = moment().format("yyyy-MM-DD")
    return `1.0-${sdk_channel} (${build_date})`;
}

module.exports = {
    conditionalCompiler,
    sdk_version,
    node_sdk_version
};