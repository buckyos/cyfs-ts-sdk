## DecApp publishing process
The DecApp release process is divided into the following steps.
1. Package: Copy various files of DecApp to the package directory according to the project configuration file
2. Upload binary: upload the DecApp package directory to OOD
3. Publish DecApp information: Upload DecApp information to Meta chain
4. Generate app link for installation

### Package DecApp
Pack the App is a local process, copy the Service part, Web part and various configuration files of DecApp to `dist` folder and organize them in a specific format, the location of the dist folder is specified by the dist field of the project configuration file

You can execute the command `cyfs pack` separately and do a packing process manually to check the packing process and the packed folder for errors.
The packaged dist folder is organized similarly to the following.
```
├─acl
│ └───acl.cfg
│      
├──dependent
│ └───dependent.cfg
│      
├─service
│ ├──x86_64-pc-windows-msvc.zip
│ └───x86_64-unknown-linux-gnu.zip
│      
└──web
```

- acl: the acl configuration file of the service, the packaging process will copy the file you specify in the service.app_acl_config.default field to this folder and rename it to acl.cfg
- dependent: Designed to store the service's CYFS stack dependency configuration. This function is currently disabled
- service: The binary file that holds the service. According to the configuration of service.dist_targets, pack {target}.zip file for each platform respectively. When developing service with ts, the content of the zip file is the folder specified in service.pack, plus the app_config file of the corresponding platform
- web: the contents of the web side of the app will be stored, and the contents of the web.folder will be copied to this folder during the packaging process

If service.pack is empty, no acl, dependent, service folder will be created; if web.folder is empty, no web folder will be created

If both service.pack and web.folder of an app are empty, the deploy command is invalid. An empty app will not be published

### Upload DecApp
Currently, we use the cyfs-client tool in the CYFS browser to upload the dist folder to the OOD of the owner. for some historical and stability reasons, we do not use the standard upload method of the CYFS stack for now. The upload here is different from the upload using the `cyfs upload` command.

### Publish DecApp information
After the DecApp upload is completed, we add this version of information to the local DecApp object, and then we upload the object.

### Generate DecApp link
After the information is published successfully, the link is generated according to the following rule: `cyfs://{owner_id}/{dec_id}`. Since the DecApp object already contains all the version information, you will notice that this link remains the same every time you publish the DecApp

## Installation process of DecApp
To install DecApp, you need to go through the OOD Service, app-manager. the basic process is as follows.
1. app-namager is notified of the DecAppId and version to be installed.
2. app-manager checks the acl configuration of the corresponding version
3. download the service and web file of the corresponding version
4. if there is a web folder, add the web folder to OOD, and the runtime will be able to access the web page on its own OOD
5. if there is service, start it. app-manager will keep service process alive