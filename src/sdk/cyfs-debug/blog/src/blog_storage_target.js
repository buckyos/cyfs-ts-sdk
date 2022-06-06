// target采用链式输出，一个target链包括
// target1->target2->target3->...
// target有两种模式：一种是copy，一种是pass
//  copy模式下，target会先自己输出，然后输出到下一个target
//  pass模式下，target会尝试传递给下一个target，如果传递成功，那么自己不保存；传递失败，可以丢弃或者重试的策略，取决于对应的target实现

/*
const BLogLocalStorage = {
    removeItemSync(key)
    setItemSync(key, value)
    getItemSync(key)

    //onCompelte(success)
    removeItemAsync(key, onCompelte)
    setItemAsync(key, value, onCompelte)

    //onCompelte(success, value)
    getItemAsync(key, onCompelte)
}
*/

/*
options = {
    'maxsize' : 1024 * 1024 * 16,    // storage输出的最大日志size
    'erasesize' ： 10，                  // 超出最大大小后，一次删除的大小
    'mode' : 'async'/'sync',         // 输出模式：同步or异步，默认异步
}
 */
class LogStorageTarget
{
    constructor(options, storage)
    {

        this.m_storage = storage;

        this.m_maxSize = 1024 * 1024 * 10;
        this.m_eraseSize = 1024 * 32; // 每次超出大小后，一次擦除的大小

        if (options.maxSize != null)
        {
            this.m_maxSize = options.maxSize;
        }
        if (options.eraseSize != null)
        {
            this.m_eraseSize = options.eraseSize;
        }

        this.m_beginIndex = 0;
        this.m_curIndex = 0;
        this.m_writtenSize = 0;

        // 记录日志index对应的长度
        this.m_sizeMap = {};
    }

    _nextKey(index)
    {
        if (index)
        {
            return '__blog_' + index;
        }
        else
        {
            return '__blog_' + this.m_curIndex++;
        }
    }

    // 现在强制同步擦除
    syncErase()
    {
        let eraseSize = 0;
        while (this.m_beginIndex < this.m_curIndex)
        {
            const index = this.m_beginIndex;
            const key = this._nextKey(index);
            try
            {
                BLogEnv.localStorage.removeItemSync(key);
            }
            catch (e)
            {
                origin_console.error('remove log failed:', key, e);
            }

            // 删除大小
            const size = this.m_sizeMap[index];
            if (size != null)
            {
                eraseSize += size;
                delete this.m_sizeMap[index];
            }

            ++this.m_beginIndex;
            if (eraseSize >= this.m_eraseSize)
            {
                break;
            }
        }
    }
}

// 异步输出到文件
class AsyncLogStorageTarget extends LogStorageTarget
{
    constructor(options)
    {
        super(options);

        this.m_fs = null;
        this.m_ready = false;
    }

    _onOutputComplete(result, index, logString, option, onComplete)
    {
        if (result !== 0)
        {
            delete this.m_sizeMap[index];
            this.m_writtenSize -= logString.length;
        }

        assert(this.m_writtenSize >= 0);

        if (onComplete)
        {
            onComplete(result, logString, option);
        }
    }

    output(logString, option, onComplete)
    {

        // 先估算大小
        if (this.m_writtenSize + logString.length >= this.m_maxSize)
        {
            // 超出了最大大小，那么需要擦除一部分
            origin_console.log('size extend!', this.m_writtenSize);
            this.syncErase();
        }

        // 记录当前大小，并更新
        const index = this.m_curIndex++;
        this.m_sizeMap[index] = logString.length;
        this.m_writtenSize += logString.length;

        const key = this._nextKey(index);

        BLogEnv.localStorage.setItemAsync(key, logString, (success) => {
            if (success)
            {
                this._onOutputComplete(0, index, logString, option, onComplete);
            }
            else
            {
                this._onOutputComplete(ErrorCode.RESULT_FAILED, index, logString, option, onComplete);
            }
        });

        return false;
    }
}

// 同步输出到目标文件
class SyncLogStorageTarget extends LogStorageTarget
{
    constructor(options)
    {
        super(options);
    }

    // 同步模式直接返回
    output(logString, option)
    {

        // 先估算大小
        if (this.m_writtenSize + logString.length >= this.m_maxSize)
        {
            // 超出了最大大小，那么需要擦除一部分
            origin_console.log('size extend!', this.m_writtenSize);
            this.syncErase();
        }

        const index = this.m_curIndex;
        const key = this._nextKey(index);
        let ret = true;
        try
        {
            BLogEnv.localStorage.setItemSync(key, logString);
        }
        catch (e)
        {
            origin_console.log('set storage failed:', e, logString);
            ret = false;
        }

        if (ret)
        {
            this.m_curIndex++;
            this.m_writtenSize += logString.length;
            this.m_sizeMap[index] = logString.length;
        }

        return ret;
    }
}
