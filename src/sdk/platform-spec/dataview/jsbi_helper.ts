import JSBI from 'jsbi';

// JSON.stringfy的友好输出
if ((JSBI.prototype as any).toJSON == null) {
    (JSBI.prototype as any).toJSON = function() {
        return this.toString(10);
    };
}

export class DataViewJSBIHelperNoBigInt {
    static setBigInt64(view: DataView, byteOffset: number, value: JSBI, littleEndian?: boolean | undefined) {
        const highWord = JSBI.bitwiseAnd(JSBI.signedRightShift(value, JSBI.BigInt(32)), JSBI.BigInt('0xFFFFFFFF'));
        const lowWord = JSBI.bitwiseAnd(value, JSBI.BigInt(0xFFFFFFFF));

        view.setUint32(byteOffset + (littleEndian ? 0 : 4), JSBI.toNumber(lowWord), littleEndian);
        view.setInt32(byteOffset + (littleEndian ? 4 : 0), JSBI.toNumber(highWord), littleEndian);
    }

    static getBigInt64(view: DataView, byteOffset: number, littleEndian?: boolean | undefined): JSBI {
        const lowWord = view.getUint32(byteOffset + (littleEndian ? 0 : 4), littleEndian);
        const highWord = view.getInt32(byteOffset + (littleEndian ? 4 : 0), littleEndian);

        const result = JSBI.BigInt(highWord);
        return JSBI.add(JSBI.leftShift(result, JSBI.BigInt(32)), JSBI.BigInt(lowWord));
    }

    static setBigUint64(view: DataView, byteOffset: number, value: JSBI, littleEndian?: boolean | undefined) {
        const highWord = JSBI.bitwiseAnd(JSBI.signedRightShift(value, JSBI.BigInt(32)), JSBI.BigInt('0xFFFFFFFF'));
        const lowWord = JSBI.bitwiseAnd(value, JSBI.BigInt(0xFFFFFFFF));

        view.setUint32(byteOffset + (littleEndian ? 0 : 4), JSBI.toNumber(lowWord), littleEndian);
        view.setUint32(byteOffset + (littleEndian ? 4 : 0), JSBI.toNumber(highWord), littleEndian);
    }

    static getBigUint64(view: DataView, byteOffset: number, littleEndian?: boolean | undefined): JSBI {
        const lowWord = view.getUint32(byteOffset + (littleEndian ? 0 : 4), littleEndian);
        const highWord = view.getUint32(byteOffset + (littleEndian ? 4 : 0), littleEndian);

        const result = JSBI.BigInt(highWord);
        return JSBI.add(JSBI.leftShift(result, JSBI.BigInt(32)), JSBI.BigInt(lowWord));
    }
}


export class DataViewJSBIHelperWithBigInt {
    static setBigInt64(view: DataView, byteOffset: number, value: JSBI, littleEndian?: boolean | undefined) {
        const bi = BigInt(JSBI.asIntN(64, value).toString());
        view.setBigInt64(byteOffset, bi, littleEndian);
    }

    static getBigInt64(view: DataView, byteOffset: number, littleEndian?: boolean | undefined): JSBI {
        const bi = view.getBigInt64(byteOffset);
        return JSBI.BigInt(bi.toString())
    }

    static setBigUint64(view: DataView, byteOffset: number, value: JSBI, littleEndian?: boolean | undefined) {
        const bi = BigInt(JSBI.asUintN(64, value).toString());
        view.setBigInt64(byteOffset, bi, littleEndian);
    }

    static getBigUint64(view: DataView, byteOffset: number, littleEndian?: boolean | undefined): JSBI {
        const bi = view.getBigUint64(byteOffset);
        return JSBI.BigInt(bi.toString())
    }
}