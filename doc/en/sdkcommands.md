## Create identity files for experience development
Create the identity files corresponding to the people, ood, runtime needed for experience development, so that you can activate OOD and Runtime without using the wallet.

**_Note_**: The pople created with this command cannot be imported back into the wallet, if you want to switch back to the official wallet management afterwards, you need to reactivate it and all data will be lost!

```cyfs desc -s <save_path>``
-s, --save specify the path where the identity file is saved, if you don't specify this parameter, it will be saved in the default path `%USERHOME%/.cyfs_profile`

After running this command, the correct identity files for people, ood, and runtime are automatically generated and the people and ood are automatically uploaded. The identity file is stored in the specified save path with the following name
- people: people.desc, people.sec
- ood: ood.desc, ood.sec, copy these two files to ood's /cyfs/etc/desc directory and rename them to device.desc, device.sec to activate ood
- runtime: runtime.desc, runtime.sec. Copy these two files to the %APPDATA%/cyfs/etc/desc directory of runtime and rename them to device.desc, device.sec to activate Runtime

## Import people identity file from wallet
```cyfs import-people -s [save_path]``

After executing this command, a QR code will be displayed in the console. Use the "swipe" function of your wallet to scan the QR code and import the pople identity file to your PC, which you can then use to create and deploy projects. The names of the imported identity files are people.desc, people.sec
-s, --save specify the folder where the identity is saved, default is `%USERHOME%/.cypfs_profile`.

**_Note_**: When importing identities, the wallet must be on the same LAN as the PC in order to import successfully.

**_Note2_**: Please use equal width font for console, otherwise the displayed QR code may not be scanned or scanned with error

## Create DecApp
```cyfs create -n <name> -o <owner file>```
-n, --name Specify the project name, mandatory
-o, --owner Specify the project owner, if you don't specify this option, the default is ``%USERHOME%/.cyfs_profile/people``.

Create cyfs app project, create ```<name>`` folder in the execution directory, initialize cyfs app project in this folder
## Pack the DecApp
``cyfs pack``

Must be executed in the cyfs app project directory, pack the project to the configured dist directory. If you need to compile ts or web files before packing, you need to compile them yourself beforehand
This command is usually not needed to be executed separately, the project will be packaged automatically before deploying the project
## Publish DecApp
Before executing this command, you must make sure you have a running cyfs stack on your machine

```cyfs deploy --tag <tag>``

- If you do not specify this parameter, the release will be tagged with the 'latest' tag by default.
Each time you execute this command, you will deploy DecApp to your OOD with the current version recorded in cyfs.config.js. After uploading, DecApp's minor version number will be automatically added by one

## Modify DecApp information
```cyfs modify <-l|-s> -o <new_owner_path> -r <version,version> --ext -t <tag>:<version> --remove-tag <tags> -e <endpoint> ```

Modify App metadata stored locally
-l, --local Modify only local app information, no update to ood or uplink
-s, --show Show only the current local app information. If this parameter is specified, all other parameters are invalid
-u, --upload Uploads the updated app information if the -l parameter is not specified
-o, --owner Re-specify the app's owner, specifying a new owner will clear all the old version data and generate a new Dec AppId.
-r, --remove command, remove the specified version information from the app metadata; multiple versions can be removed at once, the version numbers are separated by commas
--ext command, update AppExt metadata with the contents of the configuration file
-e, --endpoint specify which cyfs stack is currently used, optionally runtime, ood. if no parameter is specified, default is runtime
-t, --tag Set the tag for a specific version
- --remove-tag 删除tag。可以一次删除多个tag, tag之间用逗号分隔
## 方便本机前端调试的命令
```cyfs test [--start] [--stop]```

前端页面调试
- --start: 在runtime页面文件夹下创建指向工程web目录的链接，用cyfs://static/[app_name]即可访问目录下的文件
- --stop: 删除start命令创建的链接
## 上传任意文件或文件夹
```cyfs upload <file or folder> -e <endpoint> -t <target> -s <save_path>```

上传指定文件或文件夹。 可以从runtime上传到自己的ood，也可以直接在ood上运行该命令，将文件或文件夹添加到自己的OOD协议栈
当指定了单个文件时，上传这个指定的文件，并生成File对象。 当指定了文件夹时，生成对应的ObjectMap对象<br>

上传成功后，返回可在浏览器中访问的cyfs链接。 如果上传的是文件夹，则返回这个文件夹的cyfs链接。 要通过浏览器访问文件夹下的文件，需要手动在链接后追加内部路径

- -e, --endpoint 指定本机的协议栈类型，可选runtime，ood。如果不指定该参数，默认为runtime
- -t, --target 指定部署对象，可选runtime, ood。如果不指定该参数，默认为runtime，即本协议栈。endpoint为ood的情况下，部署对象必须指定为ood，否则部署会失败
- -s, --save 指定生成的对象元数据的存储路径，如果指定了该参数，本次上传生成的文件/文件夹对象会保存在该路径下，文件名为\<objectid>.fileobj。保存的元数据可以用来后续上传到链，并绑定链上名字