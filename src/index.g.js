


const fs = require("fs");
const path = require("path");

function main(){
    // 配置
    const config = {
        // 导出符号定义
        cyfs_d_ts: path.join(__dirname,"cyfs.d.ts"),

        // 导出到windows的全局对象和变量
        index_ts: path.join(__dirname,"index.ts"),

        // tab设置为4个space
        tab: `    `,

        // 源代码目录
        src_dirs: [
            "non-lib/base",
            "non-lib/raw",
            "non-lib/router",
            "non-lib/stack",
            "non-lib/rules",
            "non-lib/util",

            "cyfs-base/base",
            "cyfs-base/crypto",
            "cyfs-base/objects",
            "cyfs-base/objects/proof_of_service",
            "cyfs-base/name",

            "cyfs-core/friends",
            "cyfs-core/storage",
            "cyfs-core/topic",
            "cyfs-core/zone",
            "cyfs-core/app",
            "cyfs-core",

            "cyfs-dec-app/message",
            "cyfs-dec-app",
            "cyfs-meta",

            "cyfs-base-meta/block",
            "cyfs-base-meta/config",
            "cyfs-base-meta/event",
            "cyfs-base-meta/extension",
            "cyfs-base-meta/sn_service",
            "cyfs-base-meta/spv",
            "cyfs-base-meta/tx",
            "cyfs-base-meta/types",
            "cyfs-base-meta/view",
            "cyfs-base-meta/view/method",
            "cyfs-base-meta/view/result",

            "cyfs-im"
        ],

        // 生成模块index.ts的目录
        module_dirs: [
            {
                module: "cyfs-base",
                module_src_dirs:[
                    "base",
                    "crypto",
                    "objects",
                    "objects/proof_of_service",
                    "name",
                ]
            },
            {
                module: "cyfs-base-meta",
                module_src_dirs:[
                    "block",
                    "config",
                    "event",
                    "extension",
                    "sn_service",
                    "spv",
                    "tx",
                    "types",
                    "view",
                    "view/method",
                    "view/result",
                ]
            },
            {
                module: "cyfs-core",
                module_src_dirs:[
                    "friends",
                    "storage",
                    "topic",
                    "zone",
                    "app",
                    "."
                ]
            },
            {
                module: "cyfs-dec-app",
                module_src_dirs:[
                    "message",
                    "."
                ]
            },
            {
                module: "non-lib",
                module_src_dirs:[
                    "base",
                    "raw",
                    "router",
                    "stack",
                    "rules",
                    "util",
                ]
            },
            {
                module: "topic",
                module_src_dirs:[
                   //
                ]
            },
            {
                module: "cyfs-meta",
                module_src_dirs:[
                    "."
                ]
            },
            {
                module: "cyfs-im",
                module_src_dirs:[
                    "."
                ]
            }
        ],
    };

    const regex = new RegExp();
    const index_d_ts_import = [];
    const index_d_ts_symbols = [];
    for(const subDir of config.src_dirs){
        const fullSubDirPath = path.join(__dirname, subDir);
        const files = fs.readdirSync(fullSubDirPath);
        for( const file of files){
            if(path.extname(file)===".ts"){
                const fullFilePath = path.join(fullSubDirPath, file);
                const codes = fs.readFileSync(fullFilePath).toString().split("\n");

                let file_symbols = [];
                for(const code of codes){
                    for(const regex of config.export_regexs){
                        const matches = code.match(regex);
                        if(matches!=null){
                            const symbol = matches[1];
                            file_symbols.push(symbol);
                            index_d_ts_symbols.push(`${symbol}`);
                        }
                    }
                }

                const relative_path = `./${subDir}/${file.replace(".ts","")}`;
                if(file_symbols.length<=1){
                    const import_from = `import { ${file_symbols.join(', ')} } from "${relative_path}";`;
                    index_d_ts_import.push(import_from);
                }else{
                    const import_from = `import {\n${config.tab}${file_symbols.join(`,\n${config.tab}`)}\n} from "${relative_path}";`;
                    index_d_ts_import.push(import_from);
                }

            }
        }
    }

    // 生成模块index.ts
    for(const moduleInfo of config.module_dirs){
        const module_exports = [];
        const module_dir = path.join(__dirname, moduleInfo.module);
        for(const module_src_dir of moduleInfo.module_src_dirs){
            let fullModuleSrcDirPath;
            let relativeModuleSrcDirPath;
            if(module_src_dir==="."){
                fullModuleSrcDirPath = module_dir;
                relativeModuleSrcDirPath = `./`;
            }else{
                fullModuleSrcDirPath = path.join(module_dir, module_src_dir);
                relativeModuleSrcDirPath = `./${module_src_dir}/`;
            }
            const files = fs.readdirSync(fullModuleSrcDirPath);
            for( const file of files){
                if(path.extname(file)==='.ts' && path.basename(file)!=='index.ts'){
                    module_exports.push(`export * from '${relativeModuleSrcDirPath}${file.replace('.ts','')}';`);
                }
            }
        }

        const module_index_ts = path.join(module_dir,"index.ts");
        fs.writeFileSync(module_index_ts, module_exports.join("\n"));
    }

    // 生成index.ts
    const index = [
        ...index_d_ts_import,
        // ...(process.argv.indexOf('no_window')>=0 ? []: window_cyfs),
        `export {`,
        index_d_ts_symbols.map(s=>`${tabs(1)}${s}`).join(",\n"),
        `};`,
        ``,
    ];

    fs.writeFileSync(config.index_ts, index.join('\n'));
}

main();
