/*
每个配置组有如下字段：    
{
    'off' : 0,          // 总开关
    'level' : 'info',   // 日志级别，只输出>=[level]的日志
    'pos' : 0,  // 是否输出位置信息
    'fullpath' : 0, // 输出位置信息时，是否采用全路径
    'stack' : 0,    // 是否输出堆栈信息
    'separator' : ',',  // 日志字段的分隔符
    'console' : 0,      // 是否输出控制台日志
    'file' : 1,         // 是否输出文件日志
    'filetarget' : {    // 可以配置一到多个文件target
        'rootdir' : 'xxx',  // 日志文件根目录
        'subdir' : 'xxx',  // 日志文件子目录
        'filename' : 'xxx', // 日志文件名字
        'filemaxsize' : 'xxx',  // 单个日志文件的最大大小
        'filemaxcount' : 'xxx', // 滚动输出日志文件个数
        'mode' : 'xxx'  // 日志文件输出模式
    }
}

配置文件模式如下:
{
    'global' : {

    },
    [appid1] : {

    },
    [appid2] : {

    }
}
首先读取当前主js同级目录下的blog.cfg，其次读取全局目录下的blog.cfg
*/

class BLogStaticConfigLoader
{
    constructor()
    {
        this.m_configFile = null;
        this.m_configFileName = 'blog.cfg';

        this.m_globalDir = '';
        const platform = BLogEnv.platform();
        if (platform === 'win32')
        {
            this.m_globalDir = 'c:\\blog';
        }
        else
        {
            // *nix平台一律使用/etc/blog
            this.m_globalDir = '/etc/blog';
        }

        // 配置文件改变事件
        this.onchange = null;
    }

    // 动态监控改动
    _monitorChange()
    {
        fs.watchFile(this.m_configFile, () => {
            origin_console.log('blog config file changed, file=', this.m_configFile);
            if (this.onchange)
            {
                this.onchange();
            }
        });
    }

    _findCFGFile()
    {
        assert(this.m_configFile == null);

        // 先查找进程目录,也即node jsfile的jsfile所在目录
        const mainfile = process.argv[1];
        assert(mainfile);

        const fileInfo = path.parse(mainfile);
        const processConfig = fileInfo.dir + '/' + this.m_configFileName;
        if (fs.existsSync(processConfig))
        {
            origin_console.log('will use blog process config:', processConfig);
            this.m_configFile = processConfig;
            return true;
        }

        // 查找全局目录
        const globalConfig = this.m_globalDir + '/' + this.m_configFileName;
        if (fs.existsSync(globalConfig))
        {
            origin_console.log('will use blog global config:', globalConfig);
            this.m_configFile = globalConfig;
            return true;
        }

        //origin_console.log('blog config not specified!');
        return false;
    }

    // appid为空则默认使用全局配置
    load(appid)
    {
        if (this.m_configFile == null)
        {
            if (!this._findCFGFile())
            {
                return;
            }

            // 查找文件成功，需要监视改动
            assert(this.m_configFile);
            this._monitorChange();
        }

        try
        {
            const context = fs.readFileSync(this.m_configFile, 'utf8');
            const jsonConfig = JSON.parse(context);
            if (jsonConfig)
            {
                return this._parse(appid, jsonConfig);
            }
        }
        catch (err)
        {
            origin_console.error(`parse blog config failed! file=${this.m_configFile}, err=${err}`);
        }

        return null;
    }

    _parse(appid, jsonConfig)
    {
        if (appid == null || appid == '')
        {
            appid = 'global';
        }

        // 优先读取app对应的配置
        let configNode = jsonConfig[appid];
        if (configNode == null)
        {
            configNode = jsonConfig.global;
        }
        else
        {
            // 对于没有配置的字段，继承global对应的字段
            for (const key in jsonConfig.global)
            {
                if (!configNode.hasOwnProperty(key))
                {
                    configNode[key] = jsonConfig.global[key];
                }
            }
        }

        return configNode;
    }
}

// 支持node环境下的本地文件配置
class BLogStaticConfig
{
    constructor(option)
    {
        this.m_option = option;

        // 如果当前进程stdout附加到了tty，那么强制开启console输出
        if (BLogEnv.isAttachTTY())
        {
            this.m_option.enableConsoleTarget(true);
        }

        // appid改变后，重新加载
        option.onAppidChange = () => {
            this._load();
        };

        this.m_loader = new BLogStaticConfigLoader();
        this.m_loader.onchange = () => {
            this._load();
        };
    }

    init()
    {
        return this._load();
    }

    _load()
    {
        // 首先读取是否设置了appid
        const config = this.m_loader.load(this.m_option.getAppID());
        if (config)
        {
            this._parseConfig(config);
        }
    }

    _parseConfig(configNode)
    {
        for (const key in configNode)
        {
            const value = configNode[key];
            if (key === 'off')
            {
                this.m_option.setSwitch(!value);
            }
            else if (key === 'level')
            {
                this.m_option.setLevel(value);
            }
            else if (key === 'pos')
            {
                this.m_option.enablePos(value);
            }
            else if (key === 'fullpath')
            {
                this.m_option.enableFullPath(value);
            }
            else if (key === 'stack')
            {
                this.m_option.enableStack(value);
            }
            else if (key === 'separator')
            {
                this.m_option.setSeparator(value);
            }
            else if (key === 'itemmaxlength')
            {
                this.m_option.setItemMaxLength(parseInt(value));
            }
            else if (key === 'console')
            {
                if (!BLogEnv.isAttachTTY())
                {
                    this.m_option.enableConsoleTarget(value);
                }
            }
            else if (key === 'filetarget')
            {
                if (value instanceof Array)
                {
                    for (const item of value)
                    {
                        this._parseFileTarget(item);
                    }
                }
                else if (typeof value === 'object')
                {
                    this._parseFileTarget(value);
                }
                else
                {
                    if (value)
                    {
                        // 直接使用默认
                        this.m_option.addFileTarget({});
                    }
                }
            }
            else
            {
                origin_console.error('unknown blog config key:', key, value);
            }
        }
    }

    _parseFileTarget(configValue)
    {
        const options = {};

        for (const key of configValue)
        {
            const value = configValue[key];
            if (key === 'rootdir')
            {
                options.rootFolder = value;
            }
            else if (key === 'subdir')
            {
                options.subFolder = value;
            }
            else if (key === 'filename')
            {
                options.filename = value;
            }
            else if (key === 'filemaxsize')
            {
                options.filemaxsize = value;
            }
            else if (key === 'filemaxcount')
            {
                options.filemaxcount = value;
            }
            else if (key === 'mode')
            {
                options.mode = value;
            }
            else
            {
                origin_console.error('unknown filetarget config key:', key, value);
            }
        }

        this.m_option.addFileTarget(options);
    }
}
