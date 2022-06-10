import path from "path";
import * as fs from 'fs-extra';
import { AppExtInfo, DecApp, DecAppDecoder } from "../../sdk";

// config版本，现在从1开始
export const CUR_CONFIG_VERSION = 1;

export class CyfsToolContext {
    public cyfs_config_dir: string;
    cyfs_project_exist: boolean;
    project_dir: string;
    cyfs_json: string;
    app?: any;
    owner?: any;
    app_obj?: DecApp;
    app_ext_obj?: AppExtInfo

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
        } else {
            console.error('cannot found app owner config file at', owner_config)
        }
    }

    setup_project(app_name: string, owner_arg: string) {
        fs.ensureDirSync(this.cyfs_config_dir);
        if(!fs.existsSync(this.cyfs_json!)){
            const app = {
                // config版本
                "config_version": CUR_CONFIG_VERSION,
                // DECApp 的名字
                "app_name": app_name,

                // 版本
                "version": "1.0.0",

                // 描述
                "description": "",

                // 可以配置DecApp图标，这个图标会显示在浏览器的AppManager页面上, 此处需配置一个cyfs或http链接
                "icon": "",

                // dec service相关配置
                "service": {
                    // 需打包的源文件
                    "pack": [
                        //
                    ],
                    "type": "node", // service二进制的type，默认用nodejs编写
                    // 输出目标平台
                    "dist_targets":[
                        `x86_64-pc-windows-msvc`,
                        `x86_64-unknown-linux-gnu`,
                    ],
                    // service的package.cfg文件位置
                    "app_config" : {
                        "default": "service_package.cfg"
                    },
                    "app_dependent_config": {
                        "default": "dependent.cfg"
                    },
                      "app_acl_config": {
                        "default": "acl.cfg"
                    }
                },

                // web相关配置
                "web": {
                    // depoly时要上传的目录
                    "folder": "",

                    // 网站首页，默认为index.html，部署后生成url用
                    "entry": "index.html"
                },
                // dist目录的名字
                "dist": "dist",

                // 直接配置原始路径即可，不必拷贝，每个项目都拷贝是不对的
                "owner_config": path.join('.cyfs','owner.json'),

                "ext_info": {
                    // 配置展示用的媒体文件，目前只支持.jpg格式的图片，图片会以配置顺序展示在应用详情页面
                    "medias": [],
                },
            };

            this.app = app;

            fs.writeFileSync(this.cyfs_json, JSON.stringify(app, null, 2));


            this.owner = {all: path.resolve(process.cwd(), owner_arg)};
            this.save_owner();
        }
    }

    get_app_obj_file(): string {
        return path.join(this.cyfs_config_dir, `${this.app.app_name}_app.obj`)
    }

    get_app_ext_file(): string {
        return path.join(this.cyfs_config_dir, `${this.app.app_name}_appext.obj`);
    }

    get_app_dist_path(): string {
        return `${this.app.dist}`;
    }

    get_app_fid_path(): string {
        return path.join(path.dirname(this.app.dist), 'fid');
    }

    get_app_obj(): DecApp {
        if (this.app_obj) {
            return this.app_obj;
        } else {
            const app = new DecAppDecoder().from_raw(new Uint8Array(fs.readFileSync(this.get_app_obj_file()))).unwrap();
            this.app_obj = app;
            return this.app_obj;
        }
    }

    save_app_obj(): void {
        if (this.app_obj) {
            fs.writeFileSync(this.get_app_obj_file(), this.app_obj.to_vec().unwrap());
            console.log("save app object success");
        }
        
    }

    save_project_config(): void {
        fs.writeFileSync(this.cyfs_json!, JSON.stringify(this.app, null, 2));
    }

    get_owner_config_path(): string {
        return path.join(this.cyfs_config_dir, 'owner.json');
    }

    try_get_app_owner(): string | undefined {
        if (this.owner && this.owner.all.trim()!=='') {
            return this.owner.all.trim();
        }
        return undefined;
    }

    app_owner(): any {
        if(!this.owner || this.owner.all.trim()===''){
            console.log('\nowner配置不存在：');
            console.log(`\n请编辑 ${this.get_owner_config_path()} 配置 owner 的绝对路径\n`);
            console.log('');
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