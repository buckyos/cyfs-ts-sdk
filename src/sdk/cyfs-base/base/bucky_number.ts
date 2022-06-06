import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "./results";
import { RawEncode, RawDecode, DecodeBuilder } from "./raw_encode";
import { } from "./buffer";
import JSBI from 'jsbi';
import { DataViewJSBIHelper } from '../../platform-spec';

/**
 * 基础类型的编解码实现，经过探索，最合适的实现方式
 * 1. 实现一个类，扩展RawEcode
 * 2. 这个类内部持有基础类型
 * 3. 编解码保持和Rust对应类型的一致实现
 * 4. 使用方式全部采用先构造编解码对象，再调用编解码方法
 * 5. 构造编解码对象，构造函数可以传入额外的上下文，相当于每个编解码对象都是带上下文的
 * 6. JavaScript/TypeScript提供了灵活性，有些地方可以大幅度合并
 */

type Int = "u8" | "i8" | "u16" | "i16" | "u32" | "i32" | "u64" | "i64" | "u128";

const U64MAX = JSBI.BigInt("18446744073709551615");

/**
 * JavaScript真不是一个严肃的语言，整形都能搞的这么麻烦，玩具啊
 */
export class BuckyNumber implements RawEncode {

    readonly type: Int;
    val: JSBI;

    constructor(type: Int, val: JSBI | number | string) {
        this.type = type;
        if (val instanceof JSBI) {
            this.val = val;
        } else {
            this.val = JSBI.BigInt(val);
        }
    }

    value(): JSBI {
        return this.val;
    }

    raw_measure(): BuckyResult<number> {
        let bytes = 0;

        switch (this.type) {
            case "u8":
            case "i8": {
                bytes = 1;
                break;
            }
            case "u16":
            case "i16": {
                bytes = 2;
                break;
            }
            case "u32":
            case "i32": {
                bytes = 4;
                break;
            }
            case "u64":
            case "i64": {
                bytes = 8;
                break;
            }
            case "u128": {
                bytes = 16;
                break
            }
        }

        return Ok(bytes);
    }

    raw_encode(buf: Uint8Array, littleEndian?: boolean): BuckyResult<Uint8Array> {
        const size = this.raw_measure().unwrap();
        if (buf.length < size) {
            return new Err(new BuckyError(BuckyErrorCode.OutOfLimit, `not enough buffer for number type:${this.type}, require ${size}, left ${buf.length}`));
        }

        const val = this.val;
        const view = buf.offsetView(0);

        switch (this.type) {
            case "u8": {
                view.setUint8(0, JSBI.toNumber(val));
                return Ok(buf.offset(1));
            }
            case "i8": {
                view.setInt8(0, JSBI.toNumber(val));
                return Ok(buf.offset(1));
            }
            case "u16": {
                view.setUint16(0, JSBI.toNumber(val), littleEndian);
                return Ok(buf.offset(2));
            }
            case "i16": {
                view.setInt16(0, JSBI.toNumber(val), littleEndian);
                return Ok(buf.offset(2));
            }
            case "u32": {
                view.setUint32(0, JSBI.toNumber(val), littleEndian);
                return Ok(buf.offset(4));
            }
            case "i32": {
                view.setInt32(0, JSBI.toNumber(val), littleEndian);
                return Ok(buf.offset(4));
            }
            case "u64": {
                DataViewJSBIHelper.setBigUint64(view, 0, val, littleEndian);
                // view.setBigUint64(0, val, littleEndian);
                return Ok(buf.offset(8));
            }
            case "i64": {
                DataViewJSBIHelper.setBigInt64(view, 0, val, littleEndian);
                // view.setBigInt64(0, val, littleEndian);
                return Ok(buf.offset(8));
            }
            case "u128": {

                const left = JSBI.divide(val, U64MAX);
                const right = JSBI.remainder(val, U64MAX);

                DataViewJSBIHelper.setBigUint64(view, 0, left, littleEndian);
                DataViewJSBIHelper.setBigUint64(view, 8, right, littleEndian);

                // view.setBigInt64(0, left);
                // view.setBigInt64(8, right);

                return Ok(buf.offset(16));
                break
            }
        }
    }

    public toBigInt(): JSBI {
        return this.val;
    }

    public toNumber(): number {
        return JSBI.toNumber(this.val);
    }
}

export class BuckyNumberDecoder implements RawDecode<BuckyNumber>{
    readonly type: Int;

    constructor(type: Int) {
        this.type = type;
    }

    raw_decode(buf: Uint8Array, littleEndian?: boolean): BuckyResult<[BuckyNumber, Uint8Array]> {
        let val = JSBI.BigInt(0);
        const view = buf.offsetView(0);

        switch (this.type) {
            case "u8": {
                val = JSBI.BigInt(view.getUint8(0));
                buf = buf.offset(1);
                break;
            }
            case "i8": {
                val = JSBI.BigInt(view.getInt8(0));
                buf = buf.offset(1);
                break;
            }
            case "u16": {
                val = JSBI.BigInt(view.getUint16(0, littleEndian));
                buf = buf.offset(2);
                break;
            }
            case "i16": {
                val = JSBI.BigInt(view.getInt16(0, littleEndian));
                buf = buf.offset(2);
                break;
            }
            case "u32": {
                val = JSBI.BigInt(view.getUint32(0, littleEndian));
                buf = buf.offset(4);
                break;
            }
            case "i32": {
                val = JSBI.BigInt(view.getInt32(0, littleEndian));
                buf = buf.offset(4);
                break;
            }
            case "u64": {
                // val = view.getBigUint64(0, littleEndian);
                val = DataViewJSBIHelper.getBigUint64(view, 0, littleEndian);
                buf = buf.offset(8);
                break;
            }
            case "i64": {
                // val = view.getBigInt64(0, littleEndian);
                val = DataViewJSBIHelper.getBigInt64(view, 0, littleEndian);
                buf = buf.offset(8);
                break;
            }
            case "u128": {
                const left = DataViewJSBIHelper.getBigUint64(view, 0, littleEndian);
                const right = DataViewJSBIHelper.getBigUint64(view, 8, littleEndian);

                // const left = view.getBigInt64(0);
                // const right = view.getBigInt64(8);
                val = JSBI.add(JSBI.multiply(left, U64MAX), right);
                break;
            }
        }

        const ret: [BuckyNumber, Uint8Array] = [new BuckyNumber(this.type, val), buf];

        return Ok(ret);
    }
}