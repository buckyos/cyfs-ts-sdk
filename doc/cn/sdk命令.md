## 创建身份文件或激活CYFS协议栈
可以创建需要的people, ood, runtime对应的身份文件，不使用钱包即可激活OOD和Runtime。也可以激活本机的OOD或runtime

用此命令创建或激活协议栈后，会在控制台打印生成的助记词。使用此助记词在超送中恢复身份，即可继续用超送管理身份和已激活的设备

```cyfs desc [-m <mnemonic>] [-s <save_path>] [-a] [--only-ood] [--only-runtime]```
- -m <mnemonic>，可以输入一个已存在的助记词。词之间用空格分隔，并用双引号包括整个助记词串。同样的助记词会生成同样的people身份
- -a，进入激活模式。不生成身份文件，只激活本地的OOD或runtime。需要OOD或runtime进程已经启动。
- -s, --save 当不指定-a参数时，进入生成模式。在本地生成身份文件。该参数指定身份文件保存的路径，不指定该参数，会保存在默认路径`%USERHOME%/.cyfs_profile`
- --only-ood 
  > - 在激活模式下，只激活本地的OOD。如果ood已被激活，或者`-m`输入的助记词对应的people已经绑定了ood，则不激活
  > - 在生成模式下，只生成people和ood身份。如果people身份已在链上存在，则不生成身份信息
- --only-runtime 
  > - 在激活模式下，只激活本地的runtime。推荐和`-m`参数一起使用。不加`-m`激活runtime会报错。如果runtime已被激活，则不会再次激活
  > - 在生成模式下，只生成runtime身份。推荐和`-m`参数一起使用。不加`-m`生成的runtime身份无意义

使用生成模式运行该命令后，会自动生成正确的people, ood, runtime身份文件，并且自动将people和ood上链。身份文件以如下的名字存储在指定的保存路径中
- people: people.desc, people.sec
- ood: ood.desc, ood.sec，将这两个文件复制到ood的/cyfs/etc/desc目录下，并改名为device.desc, device.sec，即可激活OOD
- runtime: runtime.desc, runtime.sec.将这两个文件复制到runtime的%APPDATA%/cyfs/etc/desc目录下，并改名为device.desc, device.sec，即可激活Runtime

## 从钱包导入people身份文件
```cyfs import-people -s [save_path]```

执行该命令后，会在控制台展示一个二维码。使用钱包"扫一扫"功能，扫描该二维码，即可将people身份文件导入到PC上，后续可以用该身份文件创建，部署工程。导入的身份文件名为people.desc, people.sec
- -s, --save 指定身份保存的文件夹，默认为`%USERHOME%/.cyfs_profile`

**_注意_**: 导入身份时，钱包所在手机和PC必须在同一个局域网，才能导入成功

**_注意2_**: 控制台请使用等宽字体，否则展示的二维码可能无法扫描或扫描出错

## 创建DecApp
```cyfs create -n <name> -o <owner file>```
- -n, --name 指定工程名，必选项
- -o, --owner 指定工程owner，如不指定该选项，默认为`%USERHOME%/.cyfs_profile/people`

创建cyfs app工程，在执行目录下创建```<name>```文件夹，在该文件夹下初始化cyfs app工程
## 打包DecApp
```cyfs pack```

必须在cyfs app工程目录下执行，打包工程到配置的dist目录。打包前如果需要编译ts或web文件，需要事先自行编译
该命令一般不需单独执行，部署工程前会自动打包工程
## 发布DecApp
编译并发布app。执行该命令前，必须保证本机有正常运行的cyfs协议栈

```cyfs deploy --tag <tag>```

- --tag 发布时，给这个版本打上指定的tag。如果不指定该参数，默认将该版本打上'latest'tag
每次执行该命令，会以cyfs.config.js中记录的当前版本部署DecApp到自己的OOD。上传后，DecApp的小版本号会自动加一

## 修改DecApp信息
```cyfs modify <-l|-s> -o <new_owner_path> -r <version,version> --ext -t <tag>:<version> --remove-tag <tags> -e <endpoint>```

修改存储在本地的App元数据
- -l, --local 只修改本地的app信息，信息不更新到ood或上链
- -s, --show 只展示当前本地的app信息。如指定该参数，其余参数均无效
- -u, --upload 如果没指定-l参数，将更新后的app信息上链
- -o, --owner 重新指定app的owner，指定新的owner会清除所有旧版本数据，并生成新的Dec AppId
- -r, --remove命令，从App元数据中移除指定版本信息；可一次移除多个版本，版本号用逗号分隔
- --ext命令，用配置文件中的内容更新AppExt元数据
- -e, --endpoint 指定当前使用哪个cyfs协议栈，可选项runtime, ood。如不指定该参数，默认为runtime
- -t, --tag 设置某个具体版本的tag
- --remove-tag 删除tag。可以一次删除多个tag, tag之间用逗号分隔
## 方便本机前端调试的命令
```cyfs test [--start] [--stop]```

前端页面调试
- --start: 在runtime页面文件夹下创建指向工程web目录的链接，用cyfs://static/[app_name]即可访问目录下的文件
- --stop: 删除start命令创建的链接
## 上传任意文件或文件夹
```cyfs upload <file or folder> -e <endpoint> -t <target> -s <save_path>```

上传指定文件或文件夹。可以从runtime上传到自己的ood，也可以直接在ood上运行该命令，将文件或文件夹添加到自己的OOD协议栈
当指定了单个文件时，上传这个指定的文件，并生成File对象。当指定了文件夹时，生成对应的ObjectMap对象<br>

上传成功后，返回可在浏览器中访问的cyfs链接。如果上传的是文件夹，则返回这个文件夹的cyfs链接。要通过浏览器访问文件夹下的文件，需要手动在链接后追加内部路径

- -e, --endpoint 指定本机的协议栈类型，可选runtime，ood。如果不指定该参数，默认为runtime
- -t, --target 指定部署对象，可选runtime, ood。如果不指定该参数，默认为runtime，即本协议栈。endpoint为ood的情况下，部署对象必须指定为ood，否则部署会失败
- -s, --save 指定生成的对象元数据的存储路径，如果指定了该参数，本次上传生成的文件/文件夹对象会保存在该路径下，文件名为\<objectid>.fileobj。保存的元数据可以用来后续上传到链，并绑定链上名字

## CYFS Shell
CYFS Shell是一个交互式命令行，可以让开发者以类似Linux Shell的体验操作本zone内设备的root state

Shell的详细操作指南见
[CYFS TOOL Shell命令详解](./CYFS-SHELL使用.md)

## 试用公共OOD
在安装了CYFS浏览器，但尚未激活的情形下，可以使用该命令，快速让CYFS浏览器连接官方的公共OOD，可以体验CYFS网络的全部功能
`cyfs trial [--force] [--clean]`
在浏览器已激活的情况下，该命令不起作用
- --force 强行激活试用，如果浏览器已激活，现存的身份文件会被备份
- --clean 清除试用身份。如果有已存在的身份文件，会被还原

## Meta
CYFS tool提供了一系列命令，用于与MetaChain交互

`cyfs meta <subcommands>`

meta系列命令的操作指南见
[CYFS TOOL Meta命令详解](./CYFS-Tool-Meta%E5%91%BD%E4%BB%A4.md)
