/*
options
level  日志级别
target 输出目标，可以有一个or多个target
config 日志配置
*/

// 日志级别

const BLogLevel = {
    'ALL': 0,
    'TRACE': 1,
    'DEBUG': 2,
    'INFO': 3,
    'WARN': 4,
    'ERROR': 5,
    'CHECK': 6,
    'FATAL': 7,
    'CTRL': 8,
    'OFF': 9,

    'strings': ['all', 'trace', 'debug', 'info', 'warn', 'error', 'check', 'fatal', 'ctrl', 'off'],
    'toString': (level) => {
        return BLogLevel.strings[level];
    },
    'toLevel': (str) => {
        let level = BLogLevel[str.toUpperCase()];
        if (level == null) {
            level = 0;
        }

        return level;
    }
};

const origin_console = console;

// BuckyCloud的的一部分错误码
const ErrorCode = {
    RESULT_OK: 0,
    RESULT_FAILED: 1,
    RESULT_INVALID_TYPE: 4,
    RESULT_INVALID_PARAM: 11,
};
