## DecApp的发布流程
DecApp发布流程分以下几个步骤：
1. 打包：根据工程配置文件，将DecApp的各种文件拷贝到打包目录
2. 上传二进制：将DecApp打包目录上传到OOD
3. 发布DecApp信息：将DecApp信息上传到Meta链
4. 生成app链接供安装

### 打包DecApp
打包App是个本地过程，将DecApp的Service部分，Web部分，和各种配置文件，拷贝到`dist`文件夹，并以特定格式组织，dist文件夹的位置由工程配置文件的dist字段指定

可以单独执行命令`cyfs pack`，手工进行一次打包流程，检查打包过程，和打包后的文件夹是否有错误
打包后的dist文件夹类似下面的组织方式：
```
├─acl
│  └───acl.cfg
│      
├─dependent
│  └───dependent.cfg
│      
├─service
│  ├───x86_64-pc-windows-msvc.zip
│  └───x86_64-unknown-linux-gnu.zip
│      
└─web
```

- acl: 存放service的acl配置文件，打包过程会将你在service.app_acl_config.default字段指定的文件，拷贝到该文件夹下，并重命名为acl.cfg
- dependent: 设计用来存放service的CYFS协议栈依赖配置。当前该功能无效
- service：存放service的二进制文件。按照service.dist_targets的配置，分别给每个平台打包{target}.zip文件，当用ts开发service时，zip文件的内容是service.pack中指定的文件夹，加上对应平台的app_config文件
- web: 存放app的web端内容，打包过程中，会将web.folder文件夹下的内容拷贝至此

如果service.pack为空，则不会产生acl, dependent, service文件夹；如果web.folder为空，则不会产生web文件夹

如果一个app的service.pack和web.folder都为空，则deploy命令无效。不会发布一个空app

### 上传DecApp
目前这里使用CYFS浏览器里的cyfs-client工具，将dist文件夹上传到owner的OOD。由于一些历史及稳定性的原因，暂且没有使用CYFS协议栈的标准上传方法。这里的上传，和使用`cyfs upload`命令的上传是不同的。

### 发布DecApp信息
DecApp上传完成后，将这个版本的信息添加到本地的DecApp对象，然后将对象上链。

### 生成DecApp链接
信息发布成功后，按照以下规则生成链接：`cyfs://{owner_id}/{dec_id}`。由于DecApp对象中已经包含了所有的版本信息，因此，你会注意到，每次发布DecApp时，这个链接都是不变的

## DecApp的安装流程
安装DecApp需要通过app-manager这个OOD Service。基本流程如下：
1. 通知app-namager要安装的DecAppId和版本
2. app-manager检查对应版本的acl配置
3. 下载对应版本的Service和Web文件
4. 如果有web文件夹，将web文件夹添加到OOD，runtime就可以访问自己OOD上的web网页了
5. 如果有service，启动它。app-manager会保活service进程