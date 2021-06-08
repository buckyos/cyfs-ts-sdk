import { CyfsToolContext } from "../lib/ctx";
import * as cyfs from "../../src";

export async function run(options:any, config:any, ctx: CyfsToolContext) {
    let meta_client = cyfs.create_meta_client(options.meta || "test");
    let receipt_str = options.receipt;
    let ret = await meta_client.getReceipt(cyfs.TxId.from_base_58(receipt_str).unwrap());
    if (ret.err) {
        console.error(`get receipt ${receipt_str} err ${ret.val}`);
    } else {
        let receipt_ret = ret.unwrap();
        if (receipt_ret.is_none()) {
            console.error(`cannot get receipt ${receipt_str}`)
        } else {
            let [receipt, height] = receipt_ret.unwrap();
            console.log(`get receipt ${receipt_str} on height ${height}, ret ${receipt.result}`);
            if (receipt.address.is_some()) {
                console.log(`receipt return contract address ${receipt.address.unwrap().to_base_58()}`)
            }
            if (receipt.return_value.is_some()) {
                let value = receipt.return_value.unwrap();
                console.log(`return value ${value.toHex()}`);
            }
        }
    }
}