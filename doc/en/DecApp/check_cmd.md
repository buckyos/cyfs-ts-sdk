check_cmd.js is an example in the demo project, which aims to provide a set of start, stop, status, install start parameters that meet the requirements of the Dec App Service specification.

Below we explain the implementation principle of check_cmd from the code point of view, so that you developers can modify and improve this module

Note: The check_cmd module provided in the demo is only for example, it is not recommended to use it directly in the official project. Any problems or losses caused by using this module in the project are not related to CYFS SDK.

First of all, let's look at the Dec App Service specification and the requirements for the startup script:
> A proper Dec App Service requires the following scripts in the service_config.cfg configuration file.
+ install: An array of strings, which will be executed sequentially as commands after Dec App installation and upgrade, in the order of the array. If a command cannot be executed, an error will be returned and no other command will be executed afterwards.
+ start: The string is called when the Service is needed to start, and the implementation of this command needs to be compatible with the case that it is called several times, and it is necessary to ensure that the Service runs without problems when the command is called several times.
+ stop: String to be called when the Service needs to be stopped. The command must return. Also to be compatible with multiple calls
+ status: A string that can be called at any time to check if the service is running. service is running, returns 1. not running, returns 0.

The check_cmd module uses the file process lock and the features of the node process module to accomplish the following requirements.

Let's look at the main check_cmd_and_exec function.

Translated with www.DeepL.com/Translator (free version)
```javascript
function check_cmd_and_exec(name) {
    // Try to use Pid files to manage process locks
    let pid_lock_path = Path.join(get_cyfs_root_path(), "run");
    if (!fs.existsSync(pid_lock_path)) {
        fs.mkdirSync(pid_lock_path, { recursive: true });
    }
    // Check the {pid_lock_path}/{name}.pid file exists
    let pid_lock_file = Path.join(pid_lock_path, `${name}.pid`);
    let pid_lock = new PidLock(pid_lock_file);
    // Default action is start
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
        // The defaults all correspond to the --start
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

As you can see from the above code, check_cmd uses the file {cyfs_root}/run/{name}.pid to determine whether the process corresponding to the specified name still exists. And, it does different behaviors for different command line parameters