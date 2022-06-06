
// target采用链式输出，一个target链包括
// target1->target2->target3->...
// target有两种模式：一种是copy，一种是pass
//  copy模式下，target会先自己输出，然后输出到下一个target
//  pass模式下，target会尝试传递给下一个target，如果传递成功，那么自己不保存；传递失败，可以丢弃或者重试的策略，取决于对应的target实现

/*
options = {
    'folder' : folder,             // 文件输出目录和名字，必选参数
    'filename' : filename,
    'filemaxsize' : 1024 * 1024 * 16,       //单个日志文件的最大个数
    'filemaxcount' ： 10，                  // 日志文件最大数量
    'mode' : 'async'/'sync',         // 输出模式：同步or异步，默认异步
}
 */
class LogFileTarget
{
    constructor(options)
    {

        assert(options.folder);
        assert(options.filename);
        this.m_folder = options.folder;
        this.m_filename = options.filename;
        this.m_filePath = null; // 当前文件完整路径

        this.m_fileMaxSize = 1024 * 1024 * 16;
        if (options.filemaxsize)
        {
            this.m_fileMaxSize = options.filemaxsize;
        }

        this.m_fileMaxCount = 10;
        if (options.filemaxcount)
        {
            this.m_fileMaxCount = options.filemaxcount;
        }

        this.m_fd = null;
        this.m_curFileIndex = 0;
        this.m_writtenSize = 0;

        // 打开文件失败后，重试时间间隔
        this.m_retryInterval = 1000 * 5;

        // 0: 已经成功打开文件
        // 1: 尚未成功打开文件
        this.m_status = 1;

        this._nextFilePath((index, filePath) => {
            this.m_curFileIndex = index;
            this.m_filePath = filePath;
            this._open();
        });
    }

    // OnComplete(fileIndex, filePath)
    _nextFilePath(OnComplete)
    {
        let tm = null;
        let index = 0;
        let curIndex = this.m_curFileIndex;
        for (let i = 0; i < this.m_fileMaxCount; ++i)
        {
            const fullPath = this.m_folder + '/' + this.m_filename + '.' + curIndex + '.log';
            if (!fs.existsSync(fullPath))
            {
                index = curIndex;
                break;
            }

            // 选取最老的一个文件
            const stat = fs.lstatSync(fullPath);
            if (stat.isFile())
            {
                if (!tm)
                {
                    tm = stat.mtime;
                    index = curIndex;
                }
                else if (stat.mtime < tm)
                {
                    tm = stat.mtime;
                    index = curIndex;
                }
            }
            else
            {
                // 不是日志文件？直接忽略
            }

            curIndex++;
            curIndex = curIndex % this.m_fileMaxCount;
        }

        const filePath = this.m_folder + '/' + this.m_filename + '.' + index + '.log';
        origin_console.log(filePath);

        OnComplete(index, filePath);
    }
}

// 异步输出到文件
class AsyncLogFileTarget extends LogFileTarget
{
    constructor(options)
    {
        super(options);

        this.m_fs = null;
        this.m_ready = false;
    }

    output(logString, option, onComplete)
    {
        if (this.m_fs)
        {
            if (this.m_ready)
            {
                // 增加大小
                this.m_writtenSize += logString.length;
                if (this.m_writtenSize >= this.m_fileMaxSize)
                {
                    // 超出了最大大小，那么关闭当前文件，继续下一个
                    origin_console.log('size extend!', this.m_writtenSize, this.m_fileMaxSize);
                    this._close();

                    this._nextFilePath((index, filePath) => {
                        this.m_curFileIndex = index;
                        this.m_filePath = filePath;
                        this._open();
                    });
                    onComplete(ErrorCode.RESULT_FAILED, logString, option);
                    return false;
                }

                //origin_console.log('write', logString, logString.length);
                this.m_ready = this.m_fs.write(logString + option.lbr, 'utf8', (err) => {
                    if (err)
                    {
                        onComplete(ErrorCode.RESULT_FAILED, logString, option);
                    }
                    else
                    {
                        onComplete(0, logString, option);
                    }
                });
            }
            else
            {
                // 还在等待drain事件，所以直接失败
                onComplete(ErrorCode.RESULT_FAILED, logString, option);
            }
        }
        else
        {
            // 文件尚未打开，那么直接失败
            onComplete(ErrorCode.RESULT_FAILED, logString, option);
        }

        return false;
    }

    flush()
    {
    }

    _close()
    {
        if (this.m_fd)
        {
            let fd = this.m_fd;
            this.m_fd = null;
            this.m_fs = null;
            this.m_ready = false;
            this.m_writtenSize = 0;

            fs.close(fd, () => {
                origin_console.log('close fd success!', fd);
            });
        }
    }

    _open()
    {
        // 如果日志文件已经存在，那么需要先删除，确保新日志文件的创建时间是最新的
        try
        {
            if (fs.existsSync(this.m_filePath))
            {
                fs.removeSync(this.m_filePath);
            }
        }
        catch (e)
        {
            origin_console.error('delete log file failed! file=', this.m_filePath, e);
        }

        fs.open(this.m_filePath, 'w+', (err, fd) => {
            if (err)
            {
                origin_console.error(`open log file failed: file=${this.m_path}, err=${err.message}`);

                // 尝试失败处理
                this._onOpenFailed(err);
            }
            else
            {
                origin_console.info(
                    `open log file success: file=${this.m_filePath}`,
                );

                this._onOpenSuccess(fd);
            }
        });
    }

    _onOpenSuccess(fd)
    {
        assert(!this.m_fs);
        assert(fd);

        const opt = {
            'flags' : 'w',
            'fd' : fd,
            'mode' : 0o666,
            'autoClose' : true,
        };

        this.m_fd = fd;
        this.m_fs = fs.createWriteStream(null, opt);
        this.m_ready = true;

        this.m_fs.on('drain', () => {
            this.m_ready = true;
        });
    }

    _onOpenFailed(err)
    {
        if (!fs.existsSync(this.m_folder))
        {
            origin_console.log('will create dir', this.m_folder);
            // 目录不存在，那么我们需要递归的创建目录
            fs.ensureDir(this.m_folder, (err) => {
                if (err)
                {
                    origin_console.error('create dir failed:', this.m_folder);
                    this._stopOpen(err);
                }
                else
                {
                    origin_console.info('create dir success:', this.m_folder);
                    // 再次尝试打开
                    this._open();
                }
            });
        }
        else
        {
            this._stopOpen(err);
        }
    }

    _stopOpen(error)
    {
        setTimeout(() => {
            this._open();
        }, this.m_retryInterval);
    }
}

// 同步输出到目标文件
class SyncLogFileTarget extends LogFileTarget
{
    constructor(options)
    {
        super(options);

        this.m_pos = 0;
    }

    // 同步模式直接返回
    output(logString, option)
    {
        if (this.m_fd == null)
        {
            return false;
        }

        // 增加大小
        this.m_writtenSize += logString.length;
        if (this.m_writtenSize >= this.m_fileMaxSize)
        {
            // 超出了最大大小，那么关闭当前文件，继续下一个
            origin_console.log('size extend:', this.m_writtenSize, this.m_fileMaxSize);
            this._close();

            let ret = false;
            this._nextFilePath((index, filePath) => {
                this.m_curFileIndex = index;
                this.m_filePath = filePath;
                ret = this._open();
            });

            if (!ret)
            {
                return false;
            }
        }

        let ret = true;
        try
        {
            this.m_pos += fs.writeSync(this.m_fd, logString + option.lbr, this.m_pos, 'utf8');
        }
        catch (error)
        {
            origin_console.log('write log failed:', error, this.m_filePath, logString);
            ret = false;
        }

        return ret;
    }

    _open()
    {
        assert(this.m_fd == null);
        try
        {
            this.m_fd = fs.openSync(this.m_filePath, 'w+');
        }
        catch (error)
        {
            this.m_fd = null;
            origin_console.error('open file failed:', this.m_filePath, error);
        }

        if (this.m_fd)
        {
            origin_console.error(`open log file success: file=${this.m_filePath}`);
            this.m_pos = 0;

            return true;
        }
        else
        {
            origin_console.error(`open log file failed: file=${this.m_filePath}`);
            // 失败后处理
            this._onOpenFailed();

            return false;
        }
    }

    _close()
    {
        if (this.m_fd)
        {
            let fd = this.m_fd;
            this.m_fd = null;
            this.m_writtenSize = 0;

            try
            {
                fs.closeSync(fd);
                origin_console.log('close fd success!', fd);
            }
            catch (error)
            {
                origin_console.error('close fd failed!', fd, error);
            }
        }
    }

    _onOpenFailed(err)
    {
        if (!fs.existsSync(this.m_folder))
        {
            origin_console.log('will create dir', this.m_folder);
            // 目录不存在，那么我们需要递归的创建目录
            try
            {
                fs.ensureDirSync(this.m_folder);
            }
            catch (err)
            {
                origin_console.error('create dir exception:', this.m_folder, err);
            }

            if (fs.existsSync(this.m_folder))
            {
                origin_console.info('create dir success:', this.m_folder);
                // 再次尝试打开
                this._open();
            }
            else
            {
                origin_console.error('create dir failed:', this.m_folder);
                this._stopOpen(err);
            }
        }
        else
        {
            this._stopOpen(err);
        }
    }

    _stopOpen(error)
    {
        this.m_status = -1;
        this.m_lastOpenTime = new Date();

        setTimeout(() => {
            this._open();
        }, this.m_retryInterval);
    }
}
