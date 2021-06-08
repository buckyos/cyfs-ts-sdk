/*
common_options = {
    'mode' : copy or pass
}
*/

// target采用链式输出，一个target链包括
// target1->target2->target3->...
// target有两种模式：一种是copy，一种是pass
//  copy模式下，target会先自己输出，然后输出到下一个target
//  pass模式下，target会尝试传递给下一个target，如果传递成功，那么自己不保存；传递失败，可以丢弃或者重试的策略，取决于对应的target实现

// 输出模式
const LogTargetMode = {
    'ASYNC' : 0,
    'SYNC' : 1,
};

const LogMemoryCacheStatus = {
    'READY' : 0,
    'PENDING' : 1,
};

/*
options = {
    'maxCount' : 1024 * 10,         // 最大缓存的日志条数，-1表示没有限制
    'maxSize' : 1024 * 1024 * 128,  // 最大缓存的日志大小，-1表示没有限制
}
*/
class LogMemoryCache
{
    constructor(options, target)
    {
        this.m_maxSize = -1;
        this.m_maxCount = 1024 * 10;
        if (options.maxSize)
        {
            this.m_maxSize = options.maxSize;
        }
        if (options.maxCount)
        {
            this.m_maxCount = options.maxCount;
        }

        this.m_retryInterval = 1000;
        this.m_retryMaxCount = 5;

        this.m_target = target;
        assert(this.m_target);

        this.m_logs = new LinkedList();
        this.m_size = 0;
    }

    // 链接到下一个
    chain(nextTarget, mode)
    {
        this.m_target = nextTarget;
        this.m_mode = mode;
        if (!nextTarget)
        {
            this.m_mode = 'copy'; // 如果是最后一个target，那么强制采用copy模式
        }
    }

    _onItemCompelte(logItem, ret)
    {
        const cb = logItem.c;
        if (cb)
        {
            cb(ret, logItem.l, logItem.o);
        }
    }

    _continue()
    {

        // 在一个条目发送完毕，调用continue之前，做一次limit检测
        // 做limit检测需要注意一定不能在pending状态下，否则会导致次序错乱
        this._checkLimit();

        while (!this.m_logs.empty())
        {
            const logItem = this.m_logs.pop_front();

            if (this._outputItem(logItem))
            {
                // 直接发送成功，那么继续下一条
            }
            else
            {
                // pending，需要等待
                break;
            }
        }
    }

    _cacheLog(logString, options, onComplete, back = true)
    {
        const item = {
            'l' : logString,
            'o' : options,
            'c' : onComplete,
            'r' : 0, // 重试次数
        };

        this._cacheItem(item, back);
    }

    _cacheItem(logItem, back = true)
    {

        this.m_size += logItem.l.length;

        if (back)
        {
            this.m_logs.push_back(logItem);
        }
        else
        {
            this.m_logs.push_front(logItem);
        }
    }

    // 检测缓存是否超出限制
    _checkLimit()
    {
        // 检查是否超出最大条数限制
        if (this.m_maxCount > 0)
        {
            while (this.m_logs.size() > this.m_maxCount)
            {
                const oldItem = this.m_logs.pop_front();
                this._onItemCompelte(oldItem);
            }
        }

        // 检查是否超出内存大小限制
        if (this.m_maxSize > 0)
        {
            while (this.m_size > this.m_maxSize)
            {
                const oldItem = this.m_logs.pop_front();
                if (oldItem)
                {
                    this.m_size -= oldItem.l.length;
                    assert(this.m_size >= 0);

                    this._onItemCompelte(oldItem);
                }
                else
                {
                    break;
                }
            }
        }
    }
}

class AsyncLogMemoryCache extends LogMemoryCache
{
    constructor(options, target)
    {
        super(options, target);

        this.m_status = LogMemoryCacheStatus.READY;
    }

    // OnComplete(ret)
    // 返回true表示输出成功，false表示pending，需要等待OnComplete回调处理
    output(logString, options, onComplete)
    {

        const item = {
            'l' : logString,
            'o' : options,
            'c' : onComplete,
            'r' : 0, // 重试次数
        };

        let ret = false;
        if (this.m_status === LogMemoryCacheStatus.READY &&
            this.m_logs.empty())
        {
            ret = this._outputItem(item);
        }
        else
        {
            // 已经在发送中，那么这里直接返回
            this._cacheItem(item, true);
        }

        return ret;
    }

    flush()
    {
        while (!this.m_logs.empty())
        {
            const logItem = this.m_logs.pop_front();

            if (this._outputItem(logItem))
            {
                // 直接发送成功，那么继续下一条
            }
            else
            {
                // pending，需要等待
                break;
            }
        }
    }

    _outputItem(logItem)
    {
        assert(this.m_status === LogMemoryCacheStatus.READY);
        this.m_status = LogMemoryCacheStatus.PENDING;

        // 标识是不是同步调用
        let inCall = true;
        const outputRet = this.m_target.output(logItem.l, logItem.o, (ret) => {
            // 切换回ready状态
            assert(this.m_status === LogMemoryCacheStatus.PENDING);
            this.m_status = LogMemoryCacheStatus.READY;

            if (ret === 0)
            {
                // 通知
                if (logItem.c)
                {
                    logItem.c(ret);
                }

                if (inCall)
                {
                    // 异步发送下一条
                    setTimeout(() => {
                        this._continue();
                    }, 0);
                }
                else
                {
                    this._continue();
                }
            }
            else
            {
                //origin_console.log('output failed', logItem);
                // 失败，需要等待并重试
                ++logItem.r;
                if (logItem.r > this.m_retryMaxCount)
                {
                    // 超出最大重试次数,那么该条目失败
                    if (logItem.c)
                    {
                        logItem.c(ErrorCode.RESULT_FAILED);
                    }

                    if (inCall)
                    {
                        // 异步发送下一条
                        setTimeout(() => {
                            this._continue();
                        }, 0);
                    }
                    else
                    {
                        this._continue();
                    }
                }
                else
                {
                    // 继续缓存该条目，等待重试
                    this._cacheItem(logItem, false);
                    setTimeout(() => {
                        this._continue();
                    }, this.m_retryInterval);
                }
            }
        });

        inCall = false;

        if (outputRet)
        {
            // 切换到pending状态
            this.m_status = LogMemoryCacheStatus.READY;
        }

        return outputRet;
    }
}

class SyncLogMemoryCache extends LogMemoryCache
{
    constructor(options, target)
    {
        super(options, target);

        this.m_timer = null;
    }

    // onComplete(ret, logString, options)
    // 返回true表示输出成功，false表示pending，需要等待onComplete回调处理
    output(logString, options, onComplete)
    {

        const item = {
            'l' : logString,
            'o' : options,
            'c' : onComplete,
            'r' : 0, // 重试次数
        };

        let ret = false;
        if (this.m_logs.empty())
        {
            ret = this._outputItem(item);
        }
        else
        {
            this._cacheLog(item, true);
        }

        return ret;
    }

    flush()
    {
        //  调用一次continue输出
        this._continue();
    }

    _outputItem(logItem)
    {
        let ret = this.m_target.output(logItem.l, logItem.o);
        if (ret)
        {
            // 通知
            if (logItem.c)
            {
                logItem.c(ret, logItem.l, logItem.o);
            }
        }
        else
        {
            // 输出失败后，重新缓存
            this._cacheItem(logItem, false);

            // 开启重试timer
            if (this.m_timer == null)
            {
                this.m_timer = setTimeout(() => {
                    this.m_timer = null;
                    this._continue();
                }, this.m_retryInterval);
            }
        }

        return ret;
    }
}
