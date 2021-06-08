
## CYFS 项目基本编译命令
* 执行 npm install 安装必要的 node_modules 依赖
* 执行 npm run build 执行构建任务

## CYFS 项目目录结构说明
* cyfsconfig.json 是CYFS项目的配置文件
* cyfs 目录是 cyfs 的 typescript 源码目录
* cyfs-cli 目录是 cyfs 的 nodejs程序目录，使用typescript编程，依赖cyfs
* cyfs-app 目录是 cyfs 的 App目录，App内包含不同平台的CYFS程序包

## cyfs 代码说明
* cyfs 自带了CYFS SDK的TypeScript源码，可以直接添加用户代码
* 执行 npm run build 会自动使用typescirpt+webpack打包并更新到 cyfs-app/www/cyfs_sdk/cyfs_sdk.js

## cyfs-cli 代码说明
* 可在此使用 typescript 编写 CYFS 的命令行程序
* 使用命令 npx tsc 编译后，即可使用 node main.js 执行代码

## cyfs-app 代码说明

#### www 目录

www 目录是去中心化网站的示例项目，其所依赖的 cyfs-sdk/cyfs.js 由外层的 cyfs 经过 typescript 和 webpack 处理后使用打包生成。

网站编写好后，通过命令部署： 
* 部署到本地 cyfs-runtime 环境： cyfs deploy -w cyfs-app/www 
* 部署到用户的OOD环境： cyfs deploy -w cyfs-app/www -t ood -o {ood_desc}
  * 其中 {ood_desc} 是用户OOD的 desc 配置目录
