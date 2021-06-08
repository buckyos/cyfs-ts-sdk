这里是一个DEC App的根目录，上传APP时，应以这个根目录为准生成一个Dir，将这个Dir上传到OOD，并传播DirId

一个DEC APP目录应至少包含以下内容：
+ 根配置文件 package.cfg，json格式，或者toml格式？toml手工编辑更方便
  > 配置文件里应有：可验证的作者信息, appid, 对app的简单描述
  > 
  > 未确定：是否可以让用户配置默认的目录指向？
   
+ Service App目录 /service，这个目录下放置App的Service端，跑在用户OOD上，由AppManager负责管理，通过Gateway进行通信
+ /service 下有一个配置文件 target.cfg，配置不同target下service的位置
  > + 默认不同target下service位置不同，在/service/<target_name>/<service_name>.zip
  > + service在打包的时候一定会打包成一个zip文件，由app_manager解开到指定位置，zip包里可以是二进制也可以是文件夹
  > + .zip的根目录有service的配置文件service.cfg，和现在service的package.cfg类似，配置service的管理命令
  > 
+ Web目录 /web, 放置web版client app页面
  > 当浏览器访问cyfs://<app_id>时，实际会访问cyfs://<app_dir_id>/web/index.html
  > 
  > 流程：从app_id取到app对象，app对象的Body部分可以取到app_dir_id，再通过dir_id加载对应文件
  > 
+ 未确定：可选的/client目录，用于放置client的安装包或可执行文件？
  > 如果cyfs和系统深度整合，可以实现自动安装或者启动某个app的client端
  > 仿照service，也放置在/client/<target_name>下，同样有一个target.cfg配置文件
  > 
待思考：配置文件过多，每一级都需要一个配置文件。可以考虑将某些一定存在的配置文件合并，都放在根配置里

我们可以从这个最终目标反推开发工具和App系统组件的需求：
+ 类似buckyos的cyfs-dev工具、
  > + 开发者身份的创建/绑定
  > + 创建项目（工程配置文件，App Object）
  > + 编译项目，根据配置文件将项目编译好，并创建正确的dist目录结构
  > + 编辑配置：根据一个meta配置描述文件，编译时生成对应的dist配置
  > + 发布项目，将dist文件夹和App Object发布到People OOD
  > + 本地项目调试，细节待定
+ App Manager，负责App Servive端（可能也包括client端）的安装，启动，保活等
  > + 根据一个配置文件自动管理OOD上的App
  > + 支持多种来源的配置文件，链上、本地、有正确签名的Object
  > + 通过一些控制Object修改配置文件，实现App的自动安装、卸载等
  > + App的下载，管理。这块逻辑和ood-daemon完全相同，可以想办法复用
