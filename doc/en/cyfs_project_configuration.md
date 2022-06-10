A standard cyfs project configuration is as follows：
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

+ app_name: The name entered in `cyfs create -n`, which is also the name of the app. The app name cannot be the same for the same owner. This name will be displayed in the app store and app management interface.
+ version: indicates the current version of **DecApp**, when executing `cyfs deploy`, it will pack and deploy the current version of **DecApp**, after deploying, the third bit of this version will be automatically added one as the new current version
+ description: DecApp description, every time deploy, the description text filled here will be updated to the DecApp object to be shown on the app store.
+ icon: DecApp icon, only cyfs links are supported. It is updated on each deployment and displayed on the app store and app management interface
+ service: Configure Dec App Service related packaging and running configuration, details below
  > + pack: Indicate which directories to pack when packaging the Service
  > + type: Specify the type of service, currently supports "node" and "rust".
  > > - When "node" is specified, the service package directory, cyfs directory and package.json file will be copied to `${dist}/service/${target}` directory
  > > - When "rust" is specified, only the service package directory will be copied to `${dist}/service`, and the compilation of the service will be performed manually by the user.
  > + dist_targets: Specify which platforms are supported by service, the default is the same as the platforms supported by OOD. If the Dec App is installed on a platform supported by OOD but not supported by service, it will return an installation failure error
  > + app_config: Configure the running configuration of the service. You can configure different runtime configuration for each platform by adding [target_name]:[config_path] fields. The default configuration is used when there is no corresponding configuration for the platform
+ web: Configure the packaging and running configuration of the Dec App Web part, details below
  > + folder: Configure the root directory of the Dec App Web part
  > + entry: The file name of the Web home page can be configured, the current configuration is invalid, the home page file name must be index.html
+ dist: the name of the temporary directory for packaging, the default is "dist". If the default value conflicts with other local directories, you can change it to other non-conflicting directory names
+ ext_info: other configurations not related to App deployment, installation and operation, generally related to App presentation. Details are as follows
  > + medias: Configure the media information related to the app, which is currently used in the DecApp detail page of the app store.
  > > + list: Configure the screenshots of the app displayed in the DecApp detail page. Only cyfs links are supported, and the order of screenshots displayed is the same as the configured order
+ app_id: The app id calculated by owner id and app_name, can't be modified by yourself. Any place in the code that needs to use Dec App Id, you need to use the id shown here.