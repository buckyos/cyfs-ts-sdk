## 准备环境
1. 安装 cyfs-runtime
2. 安装 cyfs-browser

## 初始化身份配置
1. 生成身份配置文件： cyfs desc
2. 将 runtime_xxx.desc 和 runtime_xxx.sec 文件拷贝到 %appdata%/cyfs/etc/desc 目录下，重命名为 device.desc 和  device.sec 文件

## 启动
1. 启动 cyfs-runtime
2. 启动 cyfs 浏览器

## 测试demo网站
1. mkdir test
2. cd test
3. cyfs create
4. cyfs.js deploy -w .\src\cyfs-app\www
5. 粘贴控制台输出的 cyfs 网页地址到 cyfs 浏览器里测试

## 测试部署自定义网站
1. 在 cyfs-app 下创建自定义网站
2. cyfs.js deploy -w .\src\cyfs-app\example
3. 在 src 目录下执行 cyfs deploy -w cyfs-app/example
4. 粘贴控制台输出的 cyfs 网页地址到 cyfs 浏览器里测试