一个标准的cyfs工程配置如下：
```json
{
  "app_name": "test-app",
  "version": "1.0.0",
  "description": "",
  "icon": "",
  "service": {
    "pack": [
      "service"
    ],
    "type": "node",
    "dist_targets": [
      "x86_64-pc-windows-msvc",
      "x86_64-unknown-linux-gnu"
    ],
    "app_config": {
      "default": "service_package.cfg"
    }
  },
  "web": {
    "folder": "www",
    "entry": "index.html"
  },
  "dist": "dist",
  "ext_info": {
    "medias": {
      "list": [
        "cyfs://5r4MYfFSLX4ncxzPyp5KMmzSWF1vBPZgzmdSWkLFEQDm/7jMmeXZhRyaDwo3cc1HKHfWLNEsoDE8rxeobThjtCjmj/1.jpg",
        "cyfs://5r4MYfFSLX4ncxzPyp5KMmzSWF1vBPZgzmdSWkLFEQDm/7jMmeXZhRyaDwo3cc1HKHfWLNEsoDE8rxeobThjtCjmj/2.png",
        "cyfs://5r4MYfFSLX4ncxzPyp5KMmzSWF1vBPZgzmdSWkLFEQDm/7jMmeXZhRyaDwo3cc1HKHfWLNEsoDE8rxeobThjtCjmj/3.jpg"
      ]
    }
  },
  "app_id": "xxxxxxxxxxx"
}
```

+ app_name: 在`cyfs create -n`中输入的名字，也是该app的名字。同一个owner的app名字不能相同。支持中文等非ASCII字符，这个名字会显示在应用商店和App管理界面上
+ version: 表示**App的当前版本**，当执行`cyfs deploy`时，会打包并部署**App的当前版本**，部署后，会将该版本的第三位自动加一，作为新的当前版本
+ description：App描述，每次部署时，此处填写的描述文字会更新到App对象中，在应用商店上显示。
+ icon: App图标，只支持cyfs链接。每次部署时更新，在应用商店和App管理界面上展示
+ service：配置Dec App Service相关打包和运行配置，详情下述
  > + pack: 指示打包Service时，需要打包哪些目录
  > + type: 指定service的类型，目前支持"node"和"rust"两种
  > > - 当指定为"node"时，会将service的打包目录，cyfs目录，package.json文件一起拷贝到`${dist}/service/${target}`目录下
  > > - 当指定为"rust"时，只将service的打包目录拷贝到`${dist}/service`下，service的编译等工作需用户事先手动执行
  > + dist_targets：指定service支持哪些平台，默认和ood支持的平台一致。如果在OOD支持，但service不支持的平台上安装该Dec App，会返回安装失败错误
  > + app_config: 配置service的运行配置。可以通过添加[target_name]:[config_path]字段的形式，给每个平台配置不同的运行配置。默认的default表示当没有该平台对应配置时，使用的默认配置
+ web: 配置Dec App Web部分的相关打包和运行配置，详情下述
  > + folder: 配置Dec App Web部分的根目录
  > + entry: 可配置Web首页的文件名，当前该配置修改无效，首页文件名必须为index.html
+ dist: 打包临时目录的名字，默认为"dist"。如果该默认值与其他本地目录冲突，可以修改为其他不冲突的目录名
+ ext_info：与App部署，安装，运行无关的其他配置，一般与App的展示有关。详情下述
  > + medias: 配置App相关的媒体信息，目前应用商店的DecApp详情页会使用该信息
  > > + list: 配置DecApp详情页中展示的应用截图。只支持cyfs链接，展示的截图顺序与配置顺序相同
+ app_id：由owner id和app_name计算得来的app id，不能自行修改。在代码中任何需要使用Dec App Id的地方，需要用这里展示的ID。