import * as cyfs from '../sdk';

function isEqual(v1: cyfs.RawEncode, v2: cyfs.RawEncode) {
    let v1buf = cyfs.to_buf(v1).unwrap()
    let v2buf = cyfs.to_buf(v2).unwrap()
    return v1buf.toHex() === v2buf.toHex()
}

export function test_cip(): void {
    // let phrase = "bar cinnamon grow hungry lens danger treat artist hello seminar document gasp";
    let phrase = "foot alien sort flip grow tell elegant stumble muscle palm bridge dragon";
    let gen = cyfs.CyfsSeedKeyBip.from_mnemonic(phrase).unwrap();

    // 创建people，使用mnemonic+network+address_index 替代 privateKey
    let chain_path = cyfs.CyfsChainBipPath.new_people(
        cyfs.CyfsChainNetwork.Test,
        0,
    );

    console.log("path=", chain_path.to_string());
    let key1 = gen.sub_key(chain_path).unwrap();
    let key2 = gen.sub_key(chain_path).unwrap();
    console.assert(isEqual(key1, key2));
    console.log('key1 hex:', cyfs.to_buf(key1).unwrap().toHex())

    let key1_hex = cyfs.to_vec(key1).unwrap().toHex()
    let device_gen = cyfs.CyfsSeedKeyBip.from_private_key(key1_hex, "xxx").unwrap();
    // 创建device，使用mnemonic+network+account+address_index 替代 privateKey
    let device_path = cyfs.CyfsChainBipPath.new_device(
        0,
        cyfs.CyfsChainNetwork.Main,
        0,
    );

    console.log("path=", device_path.to_string());
    key1 = device_gen.sub_key(device_path).unwrap();
    key2 = device_gen.sub_key(device_path).unwrap();
    console.assert(isEqual(key1, key2));
    console.log('key1 hex:', cyfs.to_buf(key1).unwrap().toHex())
}