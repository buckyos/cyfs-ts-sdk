// usage: build.js <env> <channel> <type>
// env: rn/node/h5
// channel: nightly/beta/stable
// type: sdk/tool, default sdk

const child_process = require("child_process");
const path = require("path");

let type = process.argv[2] || "sdk";
let env = process.argv[3] || "node";
let channel = process.argv[4] || "nightly";


let webpack_config;

if (type === "tool") {
    webpack_config = "src/webpack.tool.config.js"
} else {
    if (env === "rn") {
        webpack_config = "src/webpack.rn.config.js"
    } else if (env === "h5") {
        webpack_config = "src/webpack.config.js"
    } else {
        webpack_config = "src/webpack.node.config.js"
    }
}

let process_env = process.env;
process_env['cyfs_pack_env'] = env
process_env['cyfs_sdk_channel'] = channel
process_env['PATH'] = process_env['PATH']+';'+path.join(__dirname, 'node_modules', '.bin')
console.log(process_env['PATH'])

child_process.spawnSync(`webpack --config ${webpack_config}`, {shell: true, stdio: 'inherit', process_env});