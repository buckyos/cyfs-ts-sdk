\- [CYFS-SDK快速入门](#CYFS-SDK快速入门)

 \- [环境要求](#环境要求)

 \- [上传](#上传)

 \- [查看](#查看)

 \- [下载](#下载)

# CYFS-SDK 快速入门

## 环境要求

在按照此文档操作之前，请确保您已经做了以下操作：
- 安装超送并创建账户
- 使用超送绑定了您的OOD，并保持OOD在线
- 在本机安装了CYFS Browser，并使用超送绑定

在执行下列任何命令前，请确保CYFS Browser是打开的，并能正常初始化完毕。关闭CYFS Browser将导致命令执行失败

## 上传

+ 上传你在CYFS世界的第一份数据

```shell
# 使用upload命令上传数据
cyfs upload --help
Usage: cyfs upload [options] <path>

upload any file or dir to ood/runtime

Arguments:
  path                       upload path, file or dir

Options:
  -e, --endpoint <endpoint>  cyfs endpoint, ood or runtime (default: "runtime")
  -t, --target <target>      cyfs upload target, ood or runtime (default: "runtime")
  -s, --save <save_path>     save obj to path
  -h, --help                 display help for command

# 例如要上传静态网站或者任意文件(夹)到ood:
执行 `cyfs upload ./rfc-sites  -e ood -t ood ` 控制台输出
[info],[2022-05-31 17:17:19.260],<>,目录[object Object]上传完成，可用cyfs浏览器打开cyfs://o/5r4MYfFDmENKMkjtaZztmnpSNTDSoRd6kCWuLSo4ftMS/95RvaS5RAbFgEzkzFXima9DMKT4yjtHuorxSczbVzSrG/{目录内部路径} 访问对应文件, cyfs.js:68625

```

## 查看

+ 在CYFS-Broswer浏览器查看

```shell
# 之前上传完成后, 留意最后输出的Schema信息, 拼接你之前的站点(文件夹)的路径
`cyfs://o/5r4MYfFDmENKMkjtaZztmnpSNTDSoRd6kCWuLSo4ftMS/95RvaS5RAbFgEzkzFXima9DMKT4yjtHuorxSczbVzSrG/index.html`
这个Schema的基本格式是 `cyfs://o` + `owner` + `dec_app_id` + `resource uri`

# 用上面的拼接完成后的url 粘贴到地址栏在CYFS的浏览器打开吧, 看看效果， F12打开调式工具在`Network` 查看每个资源对比传统Web看看，能发现彩蛋吗。


```



## 下载

+ 在终端中执行下面的操作

``` shell
# 我上传了之前的文件(夹), 静态网站， 我想下载回来看看在CYFS里面我的资源是怎么存储的, 可以用下面的操作
执行 `cyfs get cyfs://o/5r4MYfFDmENKMkjtaZztmnpSNTDSoRd6kCWuLSo4ftMS/95RvaS5RAbFgEzkzFXima9DMKT4yjtHuorxSczbVzSrG  -s ./`, 在当前目录`upload_map`下 fetch了你的内容, 期待你的突破迷雾, 探索 CYFS Web3.0 世界。


```



