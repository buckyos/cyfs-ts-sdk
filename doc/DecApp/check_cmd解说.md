check_cmd.js是demo工程中的例子，目的是为了提供一套符合Dec App Service规范需求的start, stop, status, install启动参数

下边我们从代码的角度，讲解一下check_cmd的实现原理，以便各位开发者修改，改进这个模块

注意：demo中提供的check_cmd模块只是为了示例讲解所用，不推荐直接使用到正式工程中。在工程中使用该模块带来的任何问题或损失，均与CYFS SDK无关

首先，我们来看一下Dec App Service规范中，对启动脚本的要求:
> 一个正确的Dec App Service，需要在service_config.cfg配置文件中，提供以下脚本：
+ install: 字符串数组，在Dec App安装，升级后，会按照数组顺序，将字符串当作命令，依次执行。某条命令无法执行的情况，会报错返回，不会执行后边的其他命令
+ start: 字符串，在需要Service启动时被调用，该命令实现上需要兼容被多次调用的情况，需保证该命令被多次调用，Service的运行不出问题
+ stop: 字符串，在需要Service停止时被调用。该命令必须返回。同样要兼容被多次调用的情况
+ status: 字符串，可在任意时间被调用，检测service是否在运行。service在运行中，返回1。不在运行中则返回0

在check_cmd模块中，是用了文件进程锁，和node process模块的特性，来完成以下需求的。

我们先看主体的check_cmd_and_exec函数：
```javascript
function check_cmd_and_exec(name) {
    // 尝试使用Pid文件来管理进程锁
    let pid_lock_path = Path.join(get_cyfs_root_path(), "run");
    if (!fs.existsSync(pid_lock_path)) {
        fs.mkdirSync(pid_lock_path, { recursive: true });
    }
    // 检查{pid_lock_path}/{name}.pid文件是否存在
    let pid_lock_file = Path.join(pid_lock_path, `${name}.pid`);
    let pid_lock = new PidLock(pid_lock_file);
    // 默认action为start
    let action_arg = process.argv[2];
    switch (action_arg) {
        case "--install":
            return true;
        case "--stop":
            pid_lock.stop();
            process.exit(0);
            break;
        case "--status":
            {
                let pid = pid_lock.check();
                if (pid === undefined) {
                    process.exit(0);
                }
                else {
                    process.exit(1);
                }
                break;
            }
        // 默认都按照--start来对应
        default:
            {
                if (!pid_lock.ensure()) {
                    console.log("process already exists, exit.");
                    process.exit(0);
                }
                return false;
            }
    }
}
```

从上述代码可以看出，check_cmd使用了{cyfs_root}/run/{name}.pid这个文件，来判断指定name对应的进程是否还存在。并且，对应不同的命令行参数，做不同的行为