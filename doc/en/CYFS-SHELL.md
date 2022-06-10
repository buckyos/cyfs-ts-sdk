\- [CYFS-SHELL use](#CYFS-SHELL use)

 \- [ls: list all subnodes in this directory](#ls: list all subnodes in this directory)

 \- [cd: enter the child node, if the child node is not ObjectMap, prompt an error, and stay in the current directory](#cd: enter the child node, if the child node is not ObjectMap, prompt an error, and stay in the current directory)

 \- [cat: show the object content of the child node in json format](#cat: show the object content of the child node in json format)

 \- [dump: save the object content of the child node in binary format, save the path to the current path by default, save the file name as .obj, after saving is complete, prompt the full path of the saved file](#dump: save the object content of the child node in binary format, save the path to the current path by default, save the file name as .obj, after saving is complete, prompt the full path of the saved file )

 \- [get: save the file of the node and subsequent nodes to local, save path default is the current path + node name](#get: save the file of the node and subsequent nodes to local, save path default is the current path + node name)

 \- [rm: delete node, if the node is object map, and there are child nodes, delete failure](#rm: delete node, if the node is object map, and there are child nodes, delete failure)

 \- [target: reselect target, reset path to root after selection](#target: reselect target, reset path to root after selection)

 \- [clear: clear the screen](#clear: clear the screen)

 \- [help: help information](#help: help information)

 \- [exit: exit shell](#exit: exit shell)

# CYFS-SHELL use

> Type cyfs shell [ -e runtime/ood ], enter the interactive command line, select device_id and dec_id and enter the corresponding Root-State root

## ls: list all children in this directory

```shell
 # If `ls` looks at the default root path with `upload_map`
 5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj:/> ls
begin list request
list  success
get object from non service success: ObjectId {
  m_buf: Uint8Array(32) [
    120,   0,   0,   0,   0,   8, 107, 232,
    178, 171, 129,  18,  99, 234,  12, 202,
    183, 111,  63, 182, 207, 159,  30,  79,
    201,  49, 107, 231,  55, 186, 129, 107
  ],
  m_base58: '95RvaS59PMLnnpj5sjMkkZecbMxnZmtRcRaERAp6vMFx'
}
upload_map
```

## cd: enter the child node, if the child node is not ObjectMap, prompt error, and stay in the current directory

```shell
5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj:/> cd upload_map
5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj:/upload_map>
5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj:/upload_map> ls
    7Tk94YfDPuqBCa79XbPueY1jSNKvMYf9EMrCeDQuzhGu
    7Tk94YfKMto76KnMiHgEaHmwvTiJoD3oFYWCZyjS593s
    7Tk94YfLK3iiknAEvTNW9ePq86k4rqxMZQDKLtd4fEQG
    7Tk94Yfh8erNaNg6znzLy55AVUjeMZ7QMhRiAKwD6hWn
    95RvaS5A9zWvmKru4R9DrniTHh1LmSBEjRfRXJF1idgQ
    95RvaS5EM2obVY2WqSydffGyfkcQcTjXLmWfP1T5snHH
    95RvaS5Mcmpu47AxStqTAySTNdHDpgXwhRmncUBUFg2L
    95RvaS5PaMhCTuCz8PqbnCbH3MM4SX66oFBQS1X9ST4p
    95RvaS5Sh1yctNKag456ffZTq6aMF3TCCYZp3kdP6SNf
    95RvaS5VNyrAgtt9am5tHKbfKaFVtVx6j2xuoZxinbBF
    95RvaS5VwsmAfinJGjKMs28bbzHFr6V4VU9wjvjRmX8p
    95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA

```

## cat: Display the object content of this child node in json format

``` shell
5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj:/upload_map> cat 95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA
{
    "body": {
        "content": {},
        "update_time": "2022-06-01T04:07:24.134775+00:00,13298530044134775"
    },
    "desc": {
        "content": {
            "class": "root",
            "content": {
                "m_main.css": "7Tk94YfU6srAW3JHwiir1cfTvxRGVN5HesoxEWiTSqYb",
                "main.css": "7Tk94YfKMto76KnMiHgEaHmwvTiJoD3oFYWCZyjS593s",
                "meta.css": "7Tk94YfZCoWMLZyrP8QSv4bZH7YMWVLbvHaLstup4Kh8",
                "pagination.css": "7Tk94YfPcL9UGRPW9KgBmWRT3PDP7QrYoqy5pKpyKygS",
                "test.css": "7Tk94YfHvY9W1GSPpumau5fdJYegyB3Yeh6ofrKfue11",
                "url.css": "7Tk94YfgSjg8zhVNFZ1nwtQPqEjff4ukj2orV9WmtYYD"
            },
            "content_mode": "simple",
            "content_type": "map",
            "count": "6",
            "depth": 0,
            "size": "259"
        },
        "create_time": "0",
        "object_category": "standard",
        "object_id": "95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA",
        "object_type": 14,
        "object_type_code": "ObjectMap",
        "owner": "5r4MYfFDmENKMkjtaZztmnpSNTDSoRd6kCWuLSo4ftMS"
    }
}
```

## dump: Save the object content of the child node in binary format, save the path to the current path by default, save the file name as .obj, after the save is complete, prompt the full path of the saved file

```shell
5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj:/upload_map/95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA> dump main.css -s e:\
convert cyfs url: cyfs://r/5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj/9tGpLNnDpa8deXEk2NaWGccEu4yFQ2DrTZJPLYLT7gj4//upload_map/95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA/main.css to non url: http://127.0.0.1:1322/r/5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj/9tGpLNnDpa8deXEk2NaWGccEu4yFQ2DrTZJPLYLT7gj4//upload_map/95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA/main.css?mode=object&format=raw
dump obj对象为e:\7Tk94YfKMto76KnMiHgEaHmwvTiJoD3oFYWCZyjS593s.obj
 
```

## get: save the node and subsequent node files to local, save path default is current path + node name

```shell
5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj:/upload_map/95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA/..> get 95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA -s e:\

save path: e:\, target: 5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj, dec_id: 9tGpLNnDpa8deXEk2NaWGccEu4yFQ2DrTZJPLYLT7gj4, inner_path: /upload_map/95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA/../95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA


```

## rm: delete node, if node is object map, and there are child nodes, delete fails

```shell
5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj:/upload_map/95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA/..> rm 95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA
create op_env from root state success: sid = 99
will remove_with_key, sid=99, key=/upload_map/95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA/../95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA, prev_value=undefined
remove_with_key for op_env success: sid=99
remove_with_key success, sid=99, key=/upload_map/95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA/../95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA, prev_value=undefined
will commit for op_env: sid=99
commit for op_env success: sid=99, resp={"dec_root":"95RvaS5NjKcdisTF7m6jWVQ87TesqBAcjqgH6f7sik4C","revision":"14","root":"95RvaS5NjKcdisTF7m6jWVQ87TesqBAcjqgH6f7sik4C"}
```

## target: Re-select target, reset path to root after selection

```shell
5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj:/upload_map/95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA/..>  target -e [runtime/ood]
choose device:> 5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj
dec_id: 9tGpLNnDpa8deXEk2NaWGccEu4yFQ2DrTZJPLYLT7gj4
choose dec_id:> 9tGpLNnDpa8deXEk2NaWGccEu4yFQ2DrTZJPLYLT7gj4
```



## help: Show Help information

```shell
 5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj:/upload_map/95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA/..> help
? Help 
  1) ls,列出该目录下所有子节点
  2) cd,进入该子节点,如果子节点不是ObjectMap,提示错误,并留在当前目录
  3) cat,以json格式展示该子节点的对象内容
  4) dump,以二进制格式保存该子节点的对象内容,保存路径默认为当前路径,保存文件名为.obj,保存完成后,提示保存的文件全路径
  5) get,保存该节点和后续节点的文件到本地,保存路径默认为当前路径+节点名
  6) rm,删除节点,如果节点是object map,且还有子节点,删除失败
  7) target,重新选择target,选择后路径重置为根目录
(Move up and down to reveal more choices)
```

## clear: Clear Screen
```shell
 5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj:/> clear
```

## exit:Exit shell

```shell
# Regular exit
5hLXAcQGjS1hJc88U11Zcwdrk7ZtzSosNmyxzq3jcUdj:/upload_map/95RvaS5frxqyKW6BH6dmNAqadhgtQeg2Lwbn4pdNaQYA/..> exit
PS E:\bucky_work\cyfs-ts-sdk\dist\cyfs-tool-nightly-pub> 

***Ctrl+C Forced exit***
```

