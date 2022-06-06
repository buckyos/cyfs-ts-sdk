import * as cyfs from '../sdk';
import {BuckyError, BuckyErrorCode, BUCKY_DEC_ERROR_CODE_START, BUCKY_META_ERROR_CODE_START, JSBI} from '../sdk';

export async function test_base() {
    {
        const r = cyfs.ObjectId.from_base_58(
            "9tGpLNnTCEdt1At9V7WtpwSNvycWR8DpdfpwgqAzdrEm"
        );
        console.info("dump result:", r.toString());
    }
    
    const i = JSBI.BigInt("100000000000000000000000000");
    console.info(i);
    console.info(`${i} `, JSON.stringify(i));

    cyfs.clog.restore_console();
    cyfs.clog.patch_console();

    {
        const error = BuckyError.new_dec_error(100, "test dec error");
        console.info(`dec_error: ${error}`);
        const code = error.code;
        console.assert(code === BuckyErrorCode.DecError);
        console.assert(error.value === 100);
        const n = error.code_ex.to_number();
        console.assert(n === BUCKY_DEC_ERROR_CODE_START + 100);
        console.assert(error.is_dec_error());
    }

    {
        const error = BuckyError.new_meta_error(100, "test meta error");
        const code = error.code;
        console.assert(code === BuckyErrorCode.MetaError);
        console.assert(error.value === 100);
        const n = error.code_ex.to_number();
        console.assert(n === BUCKY_META_ERROR_CODE_START + 100);
        console.assert(error.is_meta_error());
    }
}