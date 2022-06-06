const LOG_AGENT_PROTOCAL_VERSION = 1;
const LOG_AGENT_MAGIC_NUM = 201707019;
const LOG_AGENT_CMD = {
    NONE: 0,
    REG: 1,
    LOG: 2
};

const MAX_SEQ = 4294967295;

const LogTCPTargetPackageHeader = {
    'magic': LOG_AGENT_MAGIC_NUM,
    'version': LOG_AGENT_PROTOCAL_VERSION,
    'cmd': 0,
    'seq': 0,
    'bodyLen': 0,
};

const g_logTCPTargetPackageHeaderSize = 20;

class LogTCPTargetPackageEncoder {
    constructor() {
        //this.m_buffer = Buffer.allocUnsafe(1024 * 4);
        this.m_buffer = null;
        this.m_dataLength = 0;
    }

    encode(cmd, seq, logString) {
        const bodyLength = Buffer.byteLength(logString);
        const fullLength = g_logTCPTargetPackageHeaderSize + bodyLength;
        /*if (fullLength > this.m_buffer.length) {
            this._grow(fullLength);
        }*/
        let buffer = Buffer.allocUnsafe(g_logTCPTargetPackageHeaderSize + bodyLength);
        buffer.writeUInt32LE(LogTCPTargetPackageHeader.magic, 0);
        buffer.writeUInt32LE(LogTCPTargetPackageHeader.version, 4);
        buffer.writeUInt32LE(cmd, 8);
        buffer.writeUInt32LE(seq, 12);
        buffer.writeUInt32LE(bodyLength, 16);
        buffer.write(logString, 20, bodyLength, 'utf8');
        this.m_dataLength = fullLength;
        this.m_buffer = buffer;
    }

    getBuffer() {
        return this.m_buffer;
    }

    getDataLength() {
        return this.m_dataLength;
    }

    _grow(fullLength) {
        /*let newLength = this.m_buffer.length;
        while (newLength < fullLength) {
            newLength *= 2;
        }

        this.m_buffer = Buffer.allocUnsafe(newLength);*/
    }
}

class LogTCPTarget {
    constructor(options) {
        assert(options);

        this.m_host = options.host;
        this.m_port = options.port;
        this.m_initString = options.init;
        if (this.m_initString) {
            assert(typeof this.m_initString === 'string');
        }

        blog.info('options:', options);

        // 重连时间间隔
        this.m_retryInterval = 1000 * 5;

        this.m_connected = false;
        this.m_pending = false;
        this.m_seq = 0;
        this.m_encoder = new LogTCPTargetPackageEncoder();
        this.m_needOpen = true;

        this._open();
    }

    increaseSeq() {
        ++this.m_seq;
        if (this.m_seq >= MAX_SEQ) {
            this.m_seq = 0;
        }
    }

    formatLog(logString) {
        if (logString[0] != '[') {
            return null;
        }
        let len = logString.length;
        let level = '',
            time = '',
            category = '',
            extInfo = '';
        let index = 1;
        for (; index < len && logString[index] != ']'; ++index) {
            level += logString[index];
        }
        index += 3; //,[
        for (; index < len && logString[index] != ']'; ++index) {
            time += logString[index];
        }
        index += 2; //,
        if (logString[index] == '{') {
            index += 1;
            for (; index < len && logString[index] != '}'; ++index) {
                category += logString[index];
            }
            index += 3; //,<
        } else if (logString[index] == '<') {
            index += 1; //<
        }
        for (; index < len && logString[index] != '>'; ++index) {
            extInfo += logString[index];
        }
        if (index == len) {
            return null;
        }
        //let [appid,ccid,frameid,seqid] = extInfo.split('@');
        let logBody = logString.slice(index + 2);

        let header = [BLogLevel.toLevel(level), new Date(time).getTime(), category, extInfo];
        return header.join('@') + '*' + logBody;
    }

    output(logString, option, OnComplete) {
        let ret;
        if (this.m_connected && !this.m_pending) {
            let formatString = this.formatLog(logString);
            assert(formatString);
            const curSeq = this.m_seq;
            this.m_encoder.encode(LOG_AGENT_CMD.LOG, curSeq, formatString);
            this.increaseSeq();
            let needCallback = false;
            // 统计发送数量和时长
//=>#ifdef _BUCKYJS
            if (typeof collector !== 'undefined') {
                collector.begin('log_send', curSeq);
            }
//=>#endif // _BUCKYJS

            ret = this.m_sock.write(this.m_encoder.getBuffer(), 'binary', () => {
//=>#ifdef _BUCKYJS
                if (typeof collector !== 'undefined') {
                    collector.end('log_send', curSeq, 0);
                }
//=>#endif // _BUCKYJS

                if (needCallback) {
                    assert(this.m_pending);
                    this.m_pending = false;
                    OnComplete(0, logString, option);
                }
            });

            // 直接发送成功
            if (ret) {
                this.m_pending = false;
            } else {
                // 需要等待回调
                this.m_pending = true;
                needCallback = true;
            }
        } else {
            // 尚未连接，直接失败
            ret = false;
            OnComplete(ErrorCode.RESULT_FAILED, logString, option);
        }

        return ret;
    }

    _open() {
        assert(!this.m_sock);
        assert(!this.m_connected);

        this.m_sock = new net.Socket({
            'readable': false,
            'writable': true,
        });

        let parser = null;

        this.m_sock.on('connect', () => {
            BX_DEBUG('connect log sock target success!');

            parser = new LogTCPDataParser((header, buffer, pos) => {
                if (header.m_magicNum != LOG_AGENT_MAGIC_NUM) {
                    BX_WARN('magic num not match, header:', header);
                    return ErrorCode.RESULT_INVALID_PARAM;
                }
                if (header.m_cmd === LOG_AGENT_CMD.REG) {
                    let bodyData = buffer.toString('utf8', pos, pos + header.m_dataLength);
                    let body = JSON.parse(bodyData);
                    if (body.enableFileLog == 1) {
                        let logDir = '';
                        let logFileName = '';
                        if (body.logDir) {
                            logDir = body.logDir;
                        } else {
                            logDir = '/var/blog/' + body.serviceid;
                        }
                        if (body.logFileName) {
                            logFileName = body.logFileName;
                        } else {
                            logFileName = `${body.serviceid}[${body.nodeid}][${process.pid}]`;
                        }
                        BX_EnableFileLog(logDir, logFileName, null, body.logFileMaxSize, body.logFileMaxCount);
                        BX_INFO('return from agent, will output file log:', logDir, logFileName);
                    }
                } else if (header.m_cmd === LOG_AGENT_CMD.LOG) {

                }
                return ErrorCode.RESULT_OK;
            });

            this.m_needOpen = false;
            assert(!this.m_connected);
            this.m_connected = true;
            this._sendInitPackage();
        });

        this.m_sock.on('data', (data) => {
            if (!parser.pushData(data)) {
                BX_WARN(`parse data error`);
                this.m_sock.destroy();
            }
        });

        this.m_sock.on('close', (hadError) => {
            //!!!注意，这里不要在设置connected和pending之前调用日志API
            this.m_connected = false;
            parser = null;
            BX_DEBUG('log sock target connection closed! hadError=', hadError);
            this._retryConnect();
        });

        this.m_sock.on('error', (err) => {
            //!!!注意，这里不要在设置connected和pending之前调用日志API
            this.m_connected = false;
            parser = null;
            BX_WARN('connect log sock target err! err=', err.stack);
        });

        this._connect();
    }

    _connect() {
        assert(this.m_sock);
        assert(!this.m_connected);

        const options = {
            'host': this.m_host,
            'port': this.m_port,
        };

        this.m_sock.connect(options);
    }

    _sendInitPackage() {
        if (this.m_initString) {
            this.m_encoder.encode(LOG_AGENT_CMD.REG, this.m_seq, this.m_initString);
            this.increaseSeq();

            // 发送initpackage不需要等待
            this.m_sock.write(this.m_encoder.getBuffer(), 'binary');
        }
    }

    _retryConnect() {
        setTimeout(() => {
            this._connect();
        }, this.m_retryInterval);
    }
}


class LogTCPPackageHeader {
    constructor() {
        this.reset();
    }

    reset() {
        this.m_magicNum = LOG_AGENT_MAGIC_NUM;
        this.m_version = LOG_AGENT_PROTOCAL_VERSION;
        this.m_cmd = LOG_AGENT_CMD.NONE;
        this.m_dataLength = 0;
        this.m_seq = 0;
    }

    decode(buffer, pos) {
        if (buffer.length < pos + g_logTCPTargetPackageHeaderSize) {
            return false;
        }
        this.m_magicNum = buffer.readUInt32LE(pos);
        this.m_version = buffer.readUInt32LE(pos + 4);
        this.m_cmd = buffer.readUInt32LE(pos + 8);
        this.m_seq = buffer.readUInt32LE(pos + 12);
        this.m_dataLength = buffer.readUInt32LE(pos + 16);

        if (this.m_magicNum != LOG_AGENT_MAGIC_NUM) {
            BX_WARN(`magic num not match, magic=${this.m_magicNum}`);
            return false;
        }

        if (this.m_dataLength <= 0 || this.m_dataLength > PACKAGE_MAX_LENGTH) {
            BX_WARN(`invalid package length, length=${this.m_dataLength}`);
            return false;
        }

        return true;
    }

    getDataLength() {
        return this.m_dataLength;
    }

    getCmd() {
        return this.m_cmd;
    }

    getSeq() {
        return this.m_seq;
    }

    getInfo() {
        return {
            magicNum: this.m_magicNum,
            version: this.m_version,
            cmd: this.m_cmd,
            seq: this.m_seq,
            dataLength: this.m_dataLength
        };
    }
}

const PACKAGE_MAX_LENGTH = 1024 * 8;

class LogTCPDataParser {
    constructor(onRecvPackage) {
        this.m_dataBuffer = Buffer.allocUnsafe(PACKAGE_MAX_LENGTH + 1);
        this.m_onRecvPackage = onRecvPackage;
        this.m_header = new LogTCPPackageHeader();
        this.m_data = null;
        this.reset();
    }


    reset() {
        this.m_leftSize = g_logTCPTargetPackageHeaderSize;
        this.m_status = 0;
        this.m_dataSize = 0;
    }

    //优化：只有当src不足个包的时候才copy，否则不做copy
    pushData(srcBuffer) {
        let srcLen = srcBuffer.length;
        let offset = 0;
        let ret = true;
        let parsePos = 0;
        let parseBuffer = null;
        let copyLen = 0;
        for (;;) {
            //start = BaseLib.getNow();
            //如果长度不足一个有效数据段（header或logBody），缓存到dataBuffer
            if (srcLen < this.m_leftSize) {
                copyLen = srcBuffer.copy(this.m_dataBuffer, this.m_dataSize, offset, offset + srcLen);
                this.m_dataSize += srcLen;
                this.m_leftSize -= srcLen;
                break;
            } else {
                if (this.m_dataSize != 0) {
                    copyLen = srcBuffer.copy(this.m_dataBuffer, this.m_dataSize, offset, offset + this.m_leftSize);
                    this.m_dataSize = 0;
                    parseBuffer = this.m_dataBuffer;
                    parsePos = 0;
                } else {
                    parseBuffer = srcBuffer;
                    parsePos = offset;
                }

                srcLen -= this.m_leftSize;
                offset += this.m_leftSize;
                if (this.m_status === 0) {
                    ret = this.onRecvHeader(parseBuffer, parsePos);
                } else if (this.m_status === 1) {
                    ret = this.onRecvBody(parseBuffer, parsePos);
                    this.reset();
                } else {
                    BX_WARN('unexpected status!', this.m_status);
                    ret = false;
                }
                if (!ret) {
                    break;
                }
            }
        }
        return ret;
    }

    onRecvHeader(buffer, pos) {
        if (!this.m_header.decode(buffer, pos)) {
            BX_WARN('decode header failed! ');
            return false;
        }

        assert(this.m_status === 0);
        this.m_status = 1;
        this.m_leftSize = this.m_header.m_dataLength;
        return true;
    }

    onRecvBody(buffer, pos) {
        let ret = this.m_onRecvPackage(this.m_header, buffer, pos);
        return ret === ErrorCode.RESULT_OK;
    }
}
