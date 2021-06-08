import path from "path";
import * as fs from 'fs-extra';

export class CyfsToolContext {
    public cyfs_config_dir: string;
    cyfs_project_exist: boolean;
    project_dir: string;
    cyfs_json: string;
    app?: any;
    owner?: any;

    constructor(workspace: string) {
        this.cyfs_config_dir = path.join(workspace, '.cyfs');
        this.cyfs_project_exist = false;
        this.project_dir = path.dirname(this.cyfs_config_dir);
        this.cyfs_json = path.join(this.project_dir, "cyfs.config.json");
    }

    init() {
        console.log('will check cyfs_config_dir: ', this.cyfs_config_dir);
        if(fs.existsSync(this.cyfs_config_dir)){
            this.cyfs_project_exist = true;
        }

        if(fs.existsSync(this.cyfs_json)){
            this.app = fs.readJSONSync(this.cyfs_json);
        } else {
            this.cyfs_project_exist = false;
            return;
        }

        const owner_config = this.get_owner_config_path();
        if (fs.existsSync(owner_config)) {
            this.owner = fs.readJsonSync(owner_config);
        }
    }

    setup_project(app_name: string, owner_arg: string) {
        fs.ensureDirSync(this.cyfs_config_dir);
        if(!fs.existsSync(this.cyfs_json!)){
            const app = {
                // DECApp 的名字
                "app_name": app_name,

                // 版本
                "version": "1.0.0",

                // 描述
                "description": "",

                // dec service相关配置
                "service": {
                    // 需打包的源文件
                    "pack": [
                        //
                    ],
                    "deploy_target": [ "ood" ], // DECApp 可以部署到 'ood', 'meta'
                    // service输出目录
                    "dist": `dist/service/${app_name}`,
                    // 输出目标平台
                    "dist_targets":[
                        `x86_64-pc-windows-msvc`,
                        `x86_64-unknown-linux-gnu`,
                    ],
                    // service的package.cfg文件位置
                    "app_config" : {
                        "default": "service_package.cfg"
                    },
                },

                // web相关配置
                "web": {
                    // depoly时要上传的目录，以后可能支持列表
                    "folder": "",

                    // WEB 站点可以部署到 'ood', 'runtime'
                    "deploy_target": [ "runtime" ],

                    // 网站首页，默认为index.html，部署后生成url用
                    "entry": "index.html"
                },

                // 直接配置原始路径即可，不必拷贝，每个项目都拷贝是不对的
                "owner_config": path.join('.cyfs','owner.json'),

                "ext_info": {
                },
            };

            this.app = app;

            fs.writeFileSync(this.cyfs_json, JSON.stringify(app, null, 2));

            this.owner = {all: owner_arg};
            this.save_owner();
        }
    }

    get_app_obj_file(): string {
        return path.join(this.cyfs_config_dir, `${this.app.app_name}_app.obj`)
    }

    get_app_ext_file(): string {
        return path.join(this.cyfs_config_dir, `${this.app.app_name}_appext.obj`);
    }

    get_app_pack_path(): string {
        return `${this.app.service.dist}.zip`;
    }

    get_app_fid_path(): string {
        return path.join(path.dirname(this.app.service.dist), 'fid');
    }

    save_app() {
        fs.writeFileSync(this.cyfs_json!, JSON.stringify(this.app, null, 2));
    }

    get_dist_path(): string {
        let dist_path = path.join(this.project_dir!, this.app.service.dist);
        fs.ensureDirSync(dist_path);
        return dist_path;
    }

    get_owner_config_path(): string {
        return path.join(this.cyfs_config_dir, 'owner.json');
    }

    app_owner(): any {
        if(!this.owner || this.owner.all.trim()===''){
            console.log('\nowner配置不存在：');
            console.log(`\n请编辑 ${this.get_owner_config_path()} 配置 owner 的绝对路径\n`);
            console.log('');
            process.exit(0);
        }
        return this.owner
    }

    save_owner() {
        if (this.owner) {
            const owner_config = this.get_owner_config_path();
            fs.writeFileSync(owner_config, JSON.stringify(this.owner, null, 2));
        }
    }

}