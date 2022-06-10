const fs = require("fs-extra");
const path = require("path");
const child_process = require('child_process');
const semver = require('semver')

let channel = process.env.cyfs_sdk_channel || "nightly";

let type = process.argv[2];
if (type !== "sdk" && type !== "tool") {
    console.error("error dist type", type)
    process.exit(1)
}

// 根据channel生成package名字
// sdk叫cyfs-sdk-{channel}, 当前最稳定版不加channel
// tool叫cyfs-tool-{channel}, 当前最稳定版不加channel
let package_name = getPackageName(type, channel)

function getPackageName(type, channel) {
    let package_name = `cyfs-${type}`;
    if (channel === "nightly") {
        package_name += "-nightly"
    } else if(channel === "beta") {
        // 我们现在没有stable版本，beta版就叫cyfs-sdk, 或cyfs-tool
        // package_name += "-beta"
    } else if(channel === "stable") {
        // package_name = "cyfs-sdk"
    } else {
        console.error(`invalid channel ${channel}`)
        process.exit(1)
    }

    return package_name
}

// 我们一定是先发beta，再升级成latest的，这里取beta的版本号
// 如果是nightly，不发beta版，直接取正式版本的版本号
function getNPMVersion(name, default_ver){
    let cmd;
    if (channel === "nightly") {
        cmd = `npm view ${name} version`;
    } else {
        cmd = `npm view ${name}@beta version`;
    }
    try{
        let v = child_process.execSync(cmd);
        return v.toString().trim();
    }catch(e){
        return
    }
}

function increseBuildNo(version, package_version){
    if (version === undefined) {
        return package_version
    }
    // 如果package.json里的前两位主版本号与线上不同，这时候要重新计算版本号,就以package的为准
    if (semver.major(version) !== semver.major(package_version) || semver.minor(version) !== semver.minor(package_version)) {
        return package_version
    }
    return semver.inc(version, 'patch')
}

const copys = {
    "sdk": {
        "out/cyfs_node.js": "index.js",
        "out/cyfs_node.d.ts": "index.d.ts",
        "package.json": "package.json"
    },
    "tool": {
        "demo": "demo",
        "src/tool/cyfs.js": "cyfs.js",
        "src/tool/contract.js": "contract.js",
        "package.json": "package.json"
    }
}

const tool_only_deps = [
    "inquirer",
    "inquirer-command-prompt",
    "minimist",
    "commander",
    "qrcode-terminal"
]

const sdk_only_deps = [
    "bs58",
    "buffer",
    "google-protobuf",
    "hex-to-array-buffer",
    "js-sha256",
    "jsencrypt",
    "node-localstorage",
    "os-browserify",
    "path-browserify",
    "process",
    "ts-results",
    "tslib",
    "websocket"
]

function main(){
    console.time("main")
    let package_config = require('./package.json');
    const old_version = getNPMVersion(package_name, package_config.version);
    let version = increseBuildNo(old_version, package_config.version);
    console.timeLog("main", `${package_name} 下一个版本号:`, version);
    const pubDir = path.join(__dirname, "dist", `${package_name}-pub`);
    fs.emptyDirSync(pubDir);
    console.timeLog("main", "empty dist dir")
    for (const copy_src in copys[type]) {
        const src = path.join(__dirname, copy_src);
        const dest = path.join(pubDir, copys[type][copy_src]);
        fs.copySync(src, dest);
    }
    console.timeLog("main", "copy fil")
    let sdk_name, sdk_cur_ver;
    if (type === "tool") {
        sdk_name = getPackageName('sdk', channel);
        sdk_cur_ver = getNPMVersion(sdk_name, package_config.version);
    }

    // 重命名demo/.gitignore, 否则npm不会打包这个文件
    if (type === 'tool') {
        fs.renameSync(`${pubDir}/demo/.gitignore`, `${pubDir}/demo/gitignore`)

        // 修改demo的package.json，把cyfs-sdk指向正确的版本
        let demoConfigPath = path.join(pubDir, 'demo', 'package.json');
        let demoConfig = JSON.parse(fs.readFileSync(demoConfigPath))
        // 添加cyfs依赖, 就用当前版本
        demoConfig.dependencies = {}
        demoConfig.dependencies['cyfs-sdk'] = `npm:${sdk_name}@${sdk_cur_ver}`
        fs.writeFileSync(demoConfigPath, JSON.stringify(demoConfig, null, 2))

        console.timeLog("main", "adjust demo")
    }

    // 修改包的package.json
    let packageJsonFile = path.join(pubDir, `package.json`);
    let newPackageJson = JSON.parse(fs.readFileSync(packageJsonFile));
    // 修改包的版本
    newPackageJson.version = version;
    // 修改包的名字
    newPackageJson.name = package_name;
    // 删掉scripts部分
    delete newPackageJson.scripts;
    // 删掉devDependence
    delete newPackageJson.devDependencies;
    switch (type) {
        case "sdk":
            // 删除bin部分
            delete newPackageJson.bin
            // 删除tool的专有依赖
            for (const key of tool_only_deps) {
                delete newPackageJson.dependencies[key]
            }
            break;
        case "tool":
            // 添加cyfs依赖, 就用当前版本
            newPackageJson.dependencies['cyfs-sdk'] = `npm:${sdk_name}@~${semver.major(sdk_cur_ver)}.${semver.minor(sdk_cur_ver)}`

            // 删除sdk的专有依赖
            for (const key of sdk_only_deps) {
                delete newPackageJson.dependencies[key]
            }
            break;
        default:
            break;
    }
    fs.writeFileSync(packageJsonFile, JSON.stringify(newPackageJson, null, 2));
    console.timeLog("main", "adjust package")
}

main();