import { Ok, Err, Result } from 'ts-results';
export { Ok, Err, Result } from 'ts-results';

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
}

export class BuckyError {
    // 成员
    readonly m_code: BuckyErrorCode;
    readonly m_msg: string;
    readonly m_origin?: string;

    // 构造
    constructor(code: BuckyErrorCode, msg: string, origin?: string) {
        this.m_code = code;
        this.m_msg = msg;
        this.m_origin = origin;
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
        return this.m_code;
    }

    get msg(): string {
        return this.m_msg;
    }

    get origin(): string | undefined {
        return this.m_origin;
    }

    format(): string {
        return `err: (${this.code}, ${this.msg}, ${this.origin})`;
    }

    error_with_log<T>(msg: string): BuckyResult<T> {
        return Err(new BuckyError(BuckyErrorCode.Failed, msg));
    }

    toString(): string {
        return this.format()
    }
}

export type BuckyResult<T> = Result<T, BuckyError>;