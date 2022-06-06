import {create_meta_client, ObjectId} from '../sdk';

async function test_status() {
    const meta_client = create_meta_client();
    const status = await meta_client.getChainStatus();
    console.assert(status !== null);
    console.assert(status?.err === 0);
    console.log(JSON.stringify(status));
}

async function test_balance() {
    const meta_client = create_meta_client();
    const balance = await meta_client.getBalance(0, "5bnZVFXPS2kxKYj6YvmPbXitZyvJVhjeN1YYr7wHTTk5");
    console.assert(balance !== null);
    console.assert(balance?.err === 0);
    console.assert(balance?.result !== 0);
    console.log(JSON.stringify(balance));
    // balance = await meta_client.getBalance(0, "5r4MYfFKSe7uSAdGPjw1aPGK1392k3XobnfmxcXYEipD");
    // console.assert(balance !== null);
    // console.assert(balance?.err === 0);
    // //console.assert(balance?.result === 0);
    //
    // let list = [];
    // let addr1: [number, string] = [0, "5bnZVFXPS2kxKYj6YvmPbXitZyvJVhjeN1YYr7wHTTk5"];
    // list.push(addr1);
    // let addr2: [number, string] = [0, "5r4MYfFKSe7uSAdGPjw1aPGK1392k3XobnfmxcXYEipD"];
    // list.push(addr2);
    // let balance1 = await meta_client.getBalances(list);
    // console.assert(balance1 !== null);
    // console.assert(balance1?.err === 0);
    // console.assert(balance1?.result.length === 2);

}

async function test_tx() {
    const meta_client = create_meta_client();
    let ret = await meta_client.getTx("700000000016a0f72542e8b0abcc85b448a01773861aa553a3a6b7372a01e58a");
    console.assert(ret !== null);
    console.assert(ret?.err === 0);
    console.log(JSON.stringify(ret));

    ret = await meta_client.getTx("700000000016a0f72542e8b0abcc85b448a01773861aa553a3a6b7372a01e59a");
    console.assert(ret !== null);
    console.assert(ret?.err !== 0);
    console.log(JSON.stringify(ret));
}


async function test_payment_list() {
    const meta_client = create_meta_client();
    let txList = await meta_client.getPaymentTxList(["5r4MYfFKSe7uSAdGPjw1aPGK1392k3XobnfmxcXYEipD"], 0, 20, 0, 10, ["0", "1"]);
    console.assert(txList !== null);
    console.assert(txList?.err === 0);
    console.assert(txList?.result.length === 0);
    console.log(JSON.stringify(txList));

    txList = await meta_client.getPaymentTxList(["5r4MYfFKSe7uSAdGPjw1aPGK1392k3XobnfmxcXYEipD"], 0, 20, null, null,["0", "1"]);
    console.assert(txList !== null);
    console.assert(txList?.err === 0);
    console.assert(txList?.result.length!! > 0);
    console.log(JSON.stringify(txList));
}


async function test_collect_list() {
    const meta_client = create_meta_client();
    let txList = await meta_client.getCollectTxList(["5r4MYfFKSe7uSAdGPjw1aPGK1392k3XobnfmxcXYEipD"], 0, 20, 0, 10, ["0", "1"]);
    console.assert(txList !== null);
    console.assert(txList?.err === 0);
    console.assert(txList?.result.length === 0);
    console.log(JSON.stringify(txList));

    txList = await meta_client.getCollectTxList(["5r4MYfFKSe7uSAdGPjw1aPGK1392k3XobnfmxcXYEipD"], 0, 20, null, null,["0", "1"]);
    console.assert(txList !== null);
    console.assert(txList?.err === 0);
    console.assert(txList?.result.length!! > 0);
    console.log(JSON.stringify(txList));
}

async function test_tx_list() {
    const meta_client = create_meta_client();
    let txList = await meta_client.getTxList(["5r4MYfFKSe7uSAdGPjw1aPGK1392k3XobnfmxcXYEipD"], 0, 20, 0, 10, ["0", "1"]);
    console.assert(txList !== null);
    console.assert(txList?.err === 0);
    console.assert(txList?.result.length === 0);
    console.log(JSON.stringify(txList));

    txList = await meta_client.getTxList(["5r4MYfFKSe7uSAdGPjw1aPGK1392k3XobnfmxcXYEipD"], 0, 20, null, null, ["0", "1"]);
    console.assert(txList !== null);
    console.assert(txList?.err === 0);
    console.assert(txList?.result.length!! > 0);
    console.log(JSON.stringify(txList));
}

async function test_get_blocks() {
    const meta_client = create_meta_client();
    const blocks = await meta_client.getBlocksByRange(1, 10);
    console.assert(blocks !== null);
    console.assert(blocks?.err === 0);
    console.log(JSON.stringify(blocks));
}

async function test_get_benefiary() {
    const meta_client = create_meta_client();
    const benefi = await meta_client.getBeneficiary(ObjectId.from_base_58("7Tk94YfBpdUNL5RxMpWPc1NJu98AYRtHCVaeazuEYNrM").unwrap());
    console.log(benefi.unwrap().to_base_58());
}

export async function test_meta() {

    await test_status();
    await test_balance();
    // await test_tx();

    // test payment list
    await test_payment_list();

    // test collect list
    await test_collect_list();

    // test tx list
    await test_tx_list();

    // test get blocks
    await test_get_blocks();

    await test_get_benefiary();
}
