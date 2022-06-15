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
- -l, --local Modify only local app information, no update to ood or uplink
- -s, --show Show only the current local app information. If this parameter is specified, all other parameters are invalid
- -u, --upload Uploads the updated app information if the -l parameter is not specified
- -o, --owner Re-specify the app's owner, specifying a new owner will clear all the old version data and generate a new Dec AppId.
- -r, --remove command, remove the specified version information from the app metadata; multiple versions can be removed at once, the version numbers are separated by commas
- --ext command, update AppExt metadata with the contents of the configuration file
- -e, --endpoint specify which cyfs stack is currently used, optionally runtime, ood. if no parameter is specified, default is runtime
- -t, --tag Set the tag for a specific version
- --remove-tag removes a tag, you can remove multiple tags at once, separating them with commas
## Commands to facilitate local front-end debugging
```cyfs test [--start] [--stop]```

Front-end page debugging
- --start: Create a link to the project web directory under the runtime pages folder, and use cyfs://static/[app_name] to access the files in the directory.
- --stop: Delete the link created by start command
## Upload any file or folder
```cyfs upload <file or folder> -e <endpoint> -t <target> -s <save_path>```

Upload the specified file or folder. You can upload from runtime to your own ood, or you can run the command directly on ood to add files or folders to your own OOD protocol stack
When a single file is specified, upload the specified file and generate a File object. When a folder is specified, the corresponding ObjectMap object is generated<br>

After a successful upload, returns a cyfs link that can be accessed in a browser. If the upload is a folder, the cyfs link of the folder is returned. To access files under a folder through a browser, you need to manually append the internal path after the link

- -e, --endpoint Specify the protocol stack type of the machine, optional runtime, ood. If this parameter is not specified, the default is runtime
- -t, --target specifies the deployment object, optional runtime, ood. If this parameter is not specified, the default is runtime, which is the protocol stack. When the endpoint is ood, the deployment object must be specified as ood, otherwise the deployment will fail
- -s, --save Specifies the storage path of the generated object metadata. If this parameter is specified, the file/folder object generated by this upload will be saved in this path, and the file name is \<objectid>.fileobj. The saved metadata can be used for subsequent uploads to the chain and bound to the name on the chain

## CYFS Shell
The CYFS Shell is an interactive command line that allows developers to manipulate the root state of devices within this zone in a Linux Shell-like experience

Detailed instructions for operating the shell can be found in
[CYFS TOOL Shell command explanation](./CYFS-SHELL.md)