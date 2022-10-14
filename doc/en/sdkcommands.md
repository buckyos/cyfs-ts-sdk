## Create identity files for experience development
Crea## Create identity file or activate CYFS stack
You can create the identity file for the desired people, ood, runtime, and activate OOD and Runtime without using the wallet, or you can activate the local OOD or runtime.

After creating or activating a stack with this command, the generated helper will be printed on the console. Use this helper to restore the identity in the Cyber Chat to continue managing the identity and activated devices with the Cyber Chat

```cyfs desc [-m <mnemonic>] [-s <save_path>] [-a] [--only-ood] [--only-runtime]```
- With -m <mnemonic>, you can enter a pre-existing mnemonic. Words are separated by spaces and the entire mnemonic string is enclosed in double quotes. The same mnemonic will generate the same people identity
-a, enter activation mode. No identity file is generated, only the local OOD or runtime is activated, which requires the OOD or runtime process to be started.
-s, --save Enter generate mode when the -a argument is not specified. Generate the identity file locally. This parameter specifies the path where the identity file is saved. If this parameter is not specified, it will be saved in the default path `%USERHOME%/.cyfs_profile`
--only-ood 
  > - in activation mode, activates only the local OOD, not if ood is already activated, or if `-m` is entered for a helper corresponding to a person who already has ood bound
  > - In generation mode, only people and ood identities are generated. If thepeople identity already exists in the chain, no identity is generated
--only-runtime 
  > - In activate mode, activate only local runtime. recommended to be used with the `-m` argument. Activating runtime without `-m` will report an error. If the runtime is already activated, it will not be activated again
  > - In spawn mode, only the runtime identity is generated. Recommended to be used with the `-m` argument. Without `-m` the generated runtime identity is meaningless

Running the command in generate mode automatically generates the correct people, ood, and runtime identity files, and automatically uploads the people and ood. The identity file is stored in the specified save path with the following name
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

## Try out the public OOD
If you have a CYFS browser installed but not yet activated, you can use this command to quickly get the CYFS browser connected to the official public OOD and can experience the full functionality of the CYFS network
`cyfs trial [--force] [--clean]`
This command does not work if the browser is activated
--force forces the trial to be activated, if the browser is already activated, the existing identity file will be backed up
--clean Clears the trial identity. If there is an existing identity file, it will be restored

## CYFS Shell
The CYFS Shell is an interactive command line that allows developers to manipulate the root state of devices within this zone in a Linux Shell-like experience

Detailed instructions for operating the shell can be found in
[CYFS TOOL Shell command explanation](./CYFS-SHELL.md)

## Meta
The CYFS tool provides a set of commands to interact with MetaChain

`cyfs meta <subcommands>`

A guide to the meta series of commands can be found in
[CYFS TOOL Meta commands detailed explanation](./CYFS-TOOL-Meta.md)