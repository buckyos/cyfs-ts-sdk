
let BlogUploader = (function() {
    const LOGS_SERVER = `https://${BuckyDomain.services}/services/logs`;
    const assert = origin_console.assert.bind(console);
    const validTimeLengthMin = '0000-00-00 00:00:00.00'.length;
    const validTimeLengthMax = validTimeLengthMin + 1;

    class Parser
    {
        constructor(appid = null)
        {
            this.m_appid = appid;
        }

        parseDatetime(str)
        {
            // datetiem '2017-03-10 16:26:50.805'
            /*let match = str.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{1,2})\.(\d{0,3})/);
            if (match) {
                let [_, year, month, day, hour, minutes, seconds, milliseconds] = match;
                let padding_month = '0' + (parseInt(month) - 1);
                month = padding_month.slice(-2, padding_month.length);
                // return Date.UTC(year, month, day, hour, minutes, seconds, milliseconds || 0);
                return new Date(year, month, day, hour, minutes, seconds, milliseconds || 0).getTime();
            } else {
                return null;
            }*/
            if (str)
            {
                let len = str.length;
                if (len >= validTimeLengthMin && len <= validTimeLengthMax)
                {
                    let time = new Date(str).getTime();
                    if (!isNaN(time))
                    {
                        return time;
                    }
                }
            }
            return null;
        }

        logToObj(log)
        {
            /*const LOG_LEVEL = {
                "all": 0,
                "trace": 1,
                "debug": 2,
                "info": 3,
                "warn": 4,
                "error": 5,
                "fatal": 6,
                "off": 7,
            };*/

            // log  '[info],[2017-03-10 16:26:50.805],[-],test 3,blog_uploader.js:349'
            let match = log.match(/\[([^\[\]]*)\],\[([^\[\]]*)\],\[([^\[\]]*)\]/);
            if (match && match.length === 4)
            {
                let [_, level, datetime, traceInfo] = match;

                datetime = this.parseDatetime(datetime);
                if (!datetime)
                    return null;

                //level = LOG_LEVEL[level];
                //if (level === undefined) return null;
                let logLevel = BLogLevel[level.toUpperCase()];
                if (logLevel === undefined)
                    return null;

                let ccid, runtimeID, moduleID, appid;
                if (traceInfo !== '-') // traceInfo 不为空
                    [ccid, runtimeID, appid] = traceInfo.split(',');

                if (this.m_appid || appid)
                {
                    return {
                        appid : this.m_appid || appid,
                        level : logLevel,
                        logAt : datetime,
                        content : log,
                        runtimeID : runtimeID || null,
                        ccid : ccid || null,
                        moduleID : null
                    };
                }
                else
                {
                    return null;
                }
            }
            else
            {
                return null;
            }
        }
    }

    class Uploader
    {
        constructor(appid = null)
        {
            this.m_appid = appid;
            this.m_LogsServer = LOGS_SERVER;
            this.parser = new Parser(appid);
        }

        // onComplete(err, server_response)
        upload(logs, onComplete)
        {
            let t = new Date().getTime();
            let data = [];
            let parser = this.parser;
            logs.forEach(log => {
                let d = parser.logToObj(log);
                if (d)
                {
                    data.push(d);
                }
                else
                {
                    origin_console.warn('cannot parse log: ', log);
                }
            });

            // origin_console.dir(data);

            BaseLib.postJSONEx(this.m_LogsServer, data, (resp, status, errCode) => {
                // origin_console.dir(resp);
                let json_data;
                if (errCode !== ErrorCode.RESULT_OK)
                {
                    onComplete(errCode);
                    return;
                }
                else if (status !== 200)
                {
                    onComplete(resp || "not 200 http ok");
                    return;
                }
                else
                {
                    try
                    {
                        json_data = JSON.parse(resp);
                        if (typeof (json_data) !== 'object')
                        {
                            onComplete(ErrorCode.RESULT_INVALID_TYPE, resp);
                            return;
                        }
                    }
                    catch (e)
                    {
                        onComplete(e, resp);
                        return;
                    }
                }
                if (json_data.ret !== ErrorCode.RESULT_OK)
                {
                    onComplete(json_data.ret + ', ' + json_data.msg, json_data);
                }
                else
                {
                    onComplete(null, json_data);
                }
            });
        }
    }

    const STORAGE_KEY_UPLOADED = "__watcher_uploaded";

    class Watcher
    {
        constructor(blog, appid)
        {
            this.linebreak = blog.getOptions().m_formatter.m_lineBreak;
            this.BUFFER_SIZE = 1024 * 1024;
            this.m_storageTarget = blog.getOptions().m_targets[1].m_target;
            this.m_uploadedIndex = 0;
            this.uploader = new Uploader(appid);
            this.resumeUpload();
        }

        get m_targetCurIndex()
        {
            return this.m_storageTarget.m_curIndex;
        }

        get m_targetBeginIndex()
        {
            return this.m_storageTarget.m_beginIndex;
        }

        resumeUpload()
        {
        }

        // cb(new_logs)
        startWatch()
        {
            let retry = 0;
            let locked = false;
            let interval = setInterval(() => {
                if (locked)
                {
                    return;
                }
                else
                {
                    let offset = this.getOffset();
                    let target_cur_idx = this.m_targetCurIndex;
                    let target_begin_idx = this.m_targetBeginIndex;
                    if (offset + 1 === target_cur_idx)
                    {
                        origin_console.log('uploaded done.');
                        return;
                    }
                    else
                    {
                        let real_offset = (offset + 1 > target_cur_idx) ? offset : target_begin_idx;

                        this._getLogsAfterOffset(target_begin_idx, (err, idx, logs) => {
                            this._uploadLogs(logs, err => {
                                if (err)
                                {
                                    origin_console.error(err);
                                    if (retry > 3)
                                    {
                                        retry++;
                                    }
                                    else
                                    {
                                        clearInterval(interval);
                                    }
                                }
                                else
                                {
                                    this.setOffset(idx);
                                }
                            });
                        });
                    }
                }
            }, 3000);
        }

        // cb(error=null, offset)
        _uploadLogs(lines, cb)
        {
            this.uploader.upload(lines, (err, resp) => {
                if (err)
                {
                    origin_console.error(err);
                    cb(err);
                }
                else
                {
                    cb(null);
                }
            });
        }

        // cb(error=null, idx, logs)
        // logs {Array}
        _getLogsAfterOffset(offset, cb)
        {
            const MAX_LINES = 1024 * 500;
            let max = offset + MAX_LINES;
            function iter(err, idx, done, logs)
            {
                if (err)
                {
                    cb(err);
                }
                else if (done)
                {
                    cb(null, idx, logs);
                }
                else if (logs.length >= max)
                {
                    cb(null, idx, logs);
                }
                else
                {
                    const obj = {
                        key : '__blog_' + (idx + 1),
                        success : res => {
                            if (res)
                            {
                                let {errMsg, data} = res;
                                if (errMsg === 'getStorage:ok')
                                {
                                    logs.push(data);
                                    iter(null, idx + 1, false, logs);
                                }
                                else
                                {
                                    iter(errMsg);
                                }
                            }
                            else
                            {
                                iter(null, idx, true, logs);
                            }
                        },
                        fail : err => {
                            let {errMsg} = err;
                            if (errMsg === "getStorage:fail data not found")
                            {
                                iter(null, idx, true, logs);
                            }
                            else
                            {
                                iter(err || 'Watcher#_getLogsAfterOffset failed.');
                            }
                        }
                    };
                    wx.getStorage(obj);
                }
            }
            iter(null, offset, false, []);
        }

        // cb(error=null, offset)
        // return offset {Number}
        getOffset()
        {
            return parseInt(wx.getStorageSync(STORAGE_KEY_UPLOADED) || 0);
        }

        // cb(error=null)
        setOffset(offset, cb)
        {
            wx.setStorageSync(STORAGE_KEY_UPLOADED, offset);
        }

        static spawn(blog, appid = null)
        {
            let uploader;
            if (appid)
                assert(appid.length === 10);
            uploader = new Watcher(blog, appid);
            uploader.startWatch();
        }
    }

    return Watcher;
})();

module.exports = BlogUploader;
