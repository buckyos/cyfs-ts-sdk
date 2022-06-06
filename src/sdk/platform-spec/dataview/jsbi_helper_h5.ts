import { DataViewJSBIHelperNoBigInt, DataViewJSBIHelperWithBigInt } from './jsbi_helper';

export const DataViewJSBIHelper = (typeof window !== 'undefined' && typeof window.BigInt === 'undefined') ? DataViewJSBIHelperNoBigInt : DataViewJSBIHelperWithBigInt;