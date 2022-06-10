\- [CYFS-SDK Quick Start](#CYFS-SDK Quick Start)

 \- [Environment Requirements](#Environment%20Requirements)

 \- [Upload](#Upload)

 \- [View](#View)

 \- [download](#download)

# CYFS-SDK Quick Start

## Environment Requirements

Before following this document, please make sure you have done the following.
- Installed HyperSend and created an account
- Bound your OOD using HyperSend and kept the OOD online
- Installed the CYFS Browser locally and bound it using HyperSend

Before executing any of the following commands, make sure that the CYFS Browser is open and can be properly initialized. Closing the CYFS Browser will cause command execution to fail

## Upload

+ Upload your first copy of data in the CYFS world

```shell
## Upload data using the upload command
cyfs upload --help
Usage: cyfs upload [options] <path>

upload any file or dir to ood/runtime

Arguments:
  path upload path, file or dir

Options:
  -e, --endpoint <endpoint> cyfs endpoint, ood or runtime (default: "runtime")
  -t, --target <target> cyfs upload target, ood or runtime (default: "runtime")
  -s, --save <save_path> save obj to path
  -h, --help display help for command

# For example, to upload a static website or any file (folder) to ood:
Execute `cyfs upload . /rfc-sites -e ood -t ood ` Console output
[info],[2022-05-31 17:17:19.260],<>,directory[object Object] upload complete, can be opened with cyfs browser cyfs://o/5r4MYfFDmENKMkjtaZztmnpSNTDSoRd6kCWuLSo4ftMS/ 95RvaS5RAbFgEzkzFXima9DMKT4yjtHuorxSczbVzSrG/{directory internal path} to access the corresponding file, cyfs.js:68625

```

## View

+ View in CYFS-Broswer browser

```shell
## After the previous upload, look for the final Schema output, stitching the path to your previous site (folder)
``cyfs://o/5r4MYfFDmENKMkjtaZztmnpSNTDSoRd6kCWuLSo4ftMS/95RvaS5RAbFgEzkzFXima9DMKT4yjtHuorxSczbVzSrG/index.html``
The basic format of this Schema is `cyfs://o` + `owner` + `dec_app_id` + `resource uri`

# Use the URL after the above stitching paste it into the address bar and open it in the CYFS browser, see the effect, F12 open the modulation tool in the `Network` view each resource compared to the traditional Web to see if you can find the egg.


````



## Download

+ Do the following in the terminal

``` shell
## I uploaded my previous file (folder), static site, and I want to download it back to see how my resources are stored in CYFS, using the following action
Execute `cyfs get cyfs://o/5r4MYfFDmENKMkjtaZztmnpSNTDSoRd6kCWuLSo4ftMS/95RvaS5RAbFgEzkzFXima9DMKT4yjtHuorxSczbVzSrG -s . /`, in the current directory `upload_map` fetch your content, see how all are binary data it, this is CYFS world using standardized encoding after the content, look forward to your break through the fog, explore the CYFS Web3.0 world.


```



