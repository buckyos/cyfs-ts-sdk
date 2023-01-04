import { Ok, Err, Result } from 'ts-results';
export { Ok, Err, Result } from 'ts-results';

// 系统的内置error code范围
export const BUCKY_SYSTEM_ERROR_CODE_START = 0;
export const BUCKY_SYSTEM_ERROR_CODE_END = 5000;

// MetaChain的error code范围
// [BUCKY_META_ERROR_CODE_START, BUCKY_META_ERROR_CODE_END)
export const BUCKY_META_ERROR_CODE_START = 5000;
export const BUCKY_META_ERROR_CODE_END = 6000;

export const BUCKY_META_ERROR_CODE_MAX =
    BUCKY_META_ERROR_CODE_END - BUCKY_META_ERROR_CODE_START - 1;

// 应用扩展的错误码范围
export const BUCKY_DEC_ERROR_CODE_START = 15000;
export const BUCKY_DEC_ERROR_CODE_END = 65535;

// 应用扩展错误码DecError(code)中的code的最大取值
export const BUCKY_DEC_ERROR_CODE_MAX = BUCKY_DEC_ERROR_CODE_END - BUCKY_DEC_ERROR_CODE_START;



export enum BuckyErrorCode {
    Ok = 0,

    Failed = 1,
    InvalidParam = 2,
    Timeout = 3,
    NotFound = 4,
    AlreadyExists = 5,
    NotSupport = 6,
    ErrorState = 7,
    InvalidFormat = 8,
    Expired = 9,
    OutOfLimit = 10,
    InternalError = 11,

    PermissionDenied = 12,
    ConnectionRefused = 13,
    ConnectionReset = 14,
    ConnectionAborted = 15,
    NotConnected = 16,
    AddrInUse = 18,
    AddrNotAvailable = 19,
    Interrupted = 20,
    InvalidInput = 21,
    InvalidData = 22,
    WriteZero = 23,
    UnexpectedEof = 24,
    BrokenPipe = 25,
    WouldBlock = 26,

    UnSupport = 27,
    Unmatch = 28,
    ExecuteError = 29,
    Reject = 30,
    Ignored = 31,
    InvalidSignature = 32,
    AlreadyExistsAndSignatureMerged = 33,

    ConnectFailed = 40,
    ConnectInterZoneFailed = 41,
    InnerPathNotFound = 42,

    Conflict = 50,

    MongoDBError = 99,
    SqliteError = 100,
    UrlError = 101,
    ZipError = 102,
    HttpError = 103,
    JsonError = 104,
    HexError = 105,
    RsaError = 106,
    CryptoError = 107,
    MpscSendError = 108,
    MpscRecvError = 109,
    IoError = 110,
    NetworkError = 111,

    CodeError = 250,
    UnknownBdtError = 253,
    UnknownIOError = 254,
    Unknown = 255,

    Pending = 256,
    NotChange = 257,

    NotMatch = 258,
    NotImplement = 259,
    NotInit = 260,
    ParseError = 261,
    NotHandled = 262,

    // 在system error code里面，meta_error默认值都取值5000
    // BuckyErrorCode.value里面是对应的meta_error值
    MetaError = 5000,

    // 在system error code里面，dec_error默认都是取值15000
    // BuckyErrorCode.value里面是对应的dec_error值
    DecError = 15000,
}

export class BuckyErrorCodeEx {
    readonly m_code: BuckyErrorCode;
    readonly m_value: number;

    get code(): BuckyErrorCode {
        return this.m_code;
    }

    // 如果是MetaError/DecError，那么获取对应的int value, 从0开始
    get value(): number {
        return this.m_value;
    }

    is_system_error(): boolean {
        return this.code < BUCKY_SYSTEM_ERROR_CODE_END;
    }

    is_meta_error(): boolean {
        return this.m_code >= BUCKY_META_ERROR_CODE_START && this.m_code < BUCKY_META_ERROR_CODE_END;
    }

    is_dec_error(): boolean {
        return this.m_code >= BUCKY_DEC_ERROR_CODE_START && this.m_code <= BUCKY_DEC_ERROR_CODE_END;
    }

    to_number(): number {
        let ret;
        if (this.is_meta_error()) {
            let v = this.m_value;
            if (v > BUCKY_META_ERROR_CODE_MAX) {
                console.error(`meta error code out of limit: ${this.m_value}`);
                v = BUCKY_META_ERROR_CODE_MAX;
            }

            ret = BUCKY_META_ERROR_CODE_START + v;
        } else if (this.is_dec_error()) {
            let v = this.m_value;
            if (v > BUCKY_DEC_ERROR_CODE_MAX) {
                console.error(`dec error code out of limit: ${this.m_value}`);
                v = BUCKY_DEC_ERROR_CODE_MAX;
            }

            ret = BUCKY_DEC_ERROR_CODE_START + v;
        } else {
            ret = this.m_value;
        }

        return ret;
    }

    static parse(code: number | string): BuckyErrorCodeEx {
        let err_code: number;
        if (typeof code === 'string') {
            err_code = parseInt(code, 10);
        } else {
            console.assert(typeof code === 'number');
            err_code = code;
        }

        return error_code_from_number(err_code);
    }

    constructor(code: BuckyErrorCode, value: number) {
        this.m_code = code;
        this.m_value = value;
    }
}

export function is_system_error_code(code: number): boolean {
    return code < BUCKY_SYSTEM_ERROR_CODE_END;
}

export function is_meta_error_code(code: number): boolean {
    return code >= BUCKY_META_ERROR_CODE_START && code < BUCKY_META_ERROR_CODE_END;
}

export function is_dec_error_code(code: number): boolean {
    return code >= BUCKY_DEC_ERROR_CODE_START && code <= BUCKY_DEC_ERROR_CODE_END;
}

export function new_meta_error(meta_err: number): BuckyErrorCodeEx {
    if (meta_err > BUCKY_META_ERROR_CODE_MAX) {
        console.error("meta error code out of limit:", meta_err)
        meta_err = BUCKY_META_ERROR_CODE_MAX;
    }
    return new BuckyErrorCodeEx(BuckyErrorCode.MetaError, meta_err);
}

export function new_dec_error(dec_err: number): BuckyErrorCodeEx {
    if (dec_err > BUCKY_DEC_ERROR_CODE_MAX) {
        console.error("dec error code out of limit:", dec_err)
        dec_err = BUCKY_DEC_ERROR_CODE_MAX;
    }

    return new BuckyErrorCodeEx(BuckyErrorCode.DecError, dec_err);
}

// 从一个整型值转换为BuckyErrorCode
export function error_code_from_number(err: number): BuckyErrorCodeEx {
    console.assert(typeof err === 'number');

    if (is_system_error_code(err)) {
        return new BuckyErrorCodeEx(err as BuckyErrorCode, err);
    } else if (is_meta_error_code(err)) {
        const code = BuckyErrorCode.MetaError;
        const value = err - BUCKY_META_ERROR_CODE_START;

        return new BuckyErrorCodeEx(code, value);
    } else if (is_dec_error_code(err)) {
        const code = BuckyErrorCode.DecError;
        const value = err - BUCKY_DEC_ERROR_CODE_START;

        return new BuckyErrorCodeEx(code, value);
    } else {
        console.error(`unknown error code: ${err}`);
        return new BuckyErrorCodeEx(BuckyErrorCode.Unknown, BuckyErrorCode.Unknown);
    }
}

export class BuckyError {
    // 成员
    readonly m_code: BuckyErrorCodeEx;
    readonly m_msg: string;
    readonly m_origin?: string;

    // 构造
    constructor(code: number | string | BuckyErrorCodeEx, msg: string, origin?: string) {
        if (typeof code === 'object') {
            this.m_code = code;
        } else {
            console.assert(typeof code === 'number' || typeof code === 'string');
            this.m_code = BuckyErrorCodeEx.parse(code);
        }

        this.m_msg = msg;
        this.m_origin = origin;
    }

    static new_meta_error(meta_err: number, msg: string, origin?: string): BuckyError {
        const code = new_meta_error(meta_err);

        return new BuckyError(code, msg, origin);
    }

    static new_dec_error(dec_err: number, msg: string, origin?: string): BuckyError {
        const code = new_dec_error(dec_err);

        return new BuckyError(code, msg, origin);
    }

    static from(arg: string | BuckyErrorCode): BuckyError {
        if (typeof arg === "string") {
            return new BuckyError(BuckyErrorCode.Failed, arg);
        } else {
            return new BuckyError(arg, `base_code_error: ${arg}`);
        }
    }

    // 属性
    get code(): BuckyErrorCode {
        return this.m_code.code;
    }

    get code_ex(): BuckyErrorCodeEx {
        return this.m_code;
    }

    // 判断错误类型
    is_system_error(): boolean {
        return this.m_code.is_system_error();
    }

    is_meta_error(): boolean {
        return this.m_code.is_meta_error();
    }

    is_dec_error(): boolean {
        return this.m_code.is_dec_error();
    }

    // 获取对应的value，必须要判断是哪种错误类型:System/Meta/Dec等
    // Meta/Dec对应的value都是从0开始
    get value(): number {
        return this.m_code.value;
    }

    get msg(): string {
        return this.m_msg;
    }

    get origin(): string | undefined {
        return this.m_origin;
    }

    format(): string {
        if (this.m_code.is_system_error()) {
            return `err: (${this.code}, ${this.msg}, ${this.origin})`;
        } else {
            return `err: (${this.code}, ${this.msg}, ${this.origin}, dec_err: ${this.m_code.value})`;
        }
    }

    error_with_log<T>(msg: string): BuckyResult<T> {
        return Err(new BuckyError(BuckyErrorCode.Failed, msg));
    }

    toString(): string {
        return this.format()
    }
}

export type BuckyResult<T> = Result<T, BuckyError>;