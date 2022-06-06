/* eslint-disable @typescript-eslint/no-unused-vars */
import * as cyfs from '../sdk';
import { test_codec } from "./test_codec";
import { test_dir } from './test_dir';
import { test_file, test_trans} from "./test_file";
import { test_meta } from './test_meta';
import { test_router_handlers } from './test_router_handler';
import { test_router } from './test_router';
import { test_protobuf } from './test_protobuf';
import { test_object_codec } from './test_object_codec';
import { test_core_objects } from './test_core_object';
import { test_acl } from './test_acl';
import { test_perf } from './test_perf';
import { test_root_state } from './test_root_state';
import { BuckyErrorCode, BuckyError, BUCKY_DEC_ERROR_CODE_END, BUCKY_DEC_ERROR_CODE_START, BUCKY_META_ERROR_CODE_START, SavedMetaObject, People, PeopleDecoder, StandardObjectDecoder, EmptyContentV1, protos, DeviceId, to_buf, BuckySize, BuckySizeDecoder, Some, } from '../sdk';
import {JSBI} from '../sdk';
import { test_object_map } from './test_object_map';
import { test_base } from './test_base';
import { assert } from 'console';

function test_meta_codec() {
    {
        const device_id = DeviceId.from_base_58("5hLXAcNqgiGWe1AK3PyQoV1EEdXKGhs2trb9bCJpS4e7").unwrap();

        const v: protos.IPeopleBodyContent = {
            ood_list: [to_buf(device_id).unwrap()],
            name: '纳斯赛博伯',
            ood_work_mode: "standalone",
        };
        const buf = protos.PeopleBodyContent.encode(v).finish();
        console.info(buf.byteLength);
        console.info(buf);
    }

    {
        const bs = new BuckySize(63);
        const buf = to_buf(bs).unwrap();
        assert(buf.byteLength === 1);
        const decoder = new BuckySizeDecoder();
        const [ret, len] = decoder.raw_decode(buf).unwrap();
        assert(ret === 63);
    }
    {
        const bs = new BuckySize(64);
        const buf = to_buf(bs).unwrap();
        assert(buf.byteLength === 1);
        const decoder = new BuckySizeDecoder();
        const [ret, len] = decoder.raw_decode(buf).unwrap();
        assert(ret === 64);
    }

    const buf = "0002500e0000000000010030818902818100e0252144cac6aa8493f252c1c7d288afd9d01f04430a24f19bbd1f0fec428278b149f3b748e26a532c7e238dcdde6fb60d3820727f53b7ae090ce1bb04f637d43aea4551043a06535ded73e6a7de845e6a6187cfcd4def56b841fd098afc0671f659bfbabd1fbceb268b6fa0f47b8c7e3cb698a2d6ba120e54b6df9064c889ed0203010001000000000000000000000000000000000000000000000000000000002f3b2f6e3acd9000013f0a2045c40d30000cd65e863aa69f59d818f2090e3fa3b3d646dadc87568f773da50c120fe7bab3e696afe8b59be58d9ae4bcaf220a7374616e64616c6f6e650100ff002f3b2f6e3ad56000c661eeddb115b2b1cc8f6a0abe871b83c3108379c766303457676e1beca4836220767e72cac8fa53b3addff7686a604ee5537b4593d7ef363dcfd827dace32a51fb46c527330d6cb1a2bf37a4fcc4d6bae9ed5acf0289c7f6fa3e957c4a11362bf237746a253edd574c59acf85705d36747dd83ac65acd0995c201e76be7db5f0100ff002f3b2f6e3e09b000bb6a8d783a3be84580323e7e70b7aeb0c277c60c09705218fe77eb5a527df5cfdfe738d05c0661c9e06f59c883d7b314d4709d56675cecdde81bbb72dc692c5413c9a39f81aaf7fd928319f7bd4183132ab3c383b6e39a924a87ba1608133cbd2a6bdfeb2e613752971d24c944ed666ed5d50c9a77177ab4077143c5354f90c2";
    const decoder = new PeopleDecoder();
    const ret = decoder.from_hex(buf);
    assert(!ret.err);

    const people = ret.unwrap();
    console.info(people.name());
    // people.set_name("buckyball");
    const sd = people.to_hex().unwrap();
    console.info(sd);
   
    const data = SavedMetaObject.try_from(people).unwrap();
    const hash = data.hash().unwrap();
    console.info(hash.as_slice().toHex());
}

async function main() {

    // let so = cyfs.ObjectId.from_base_58("5r4MYfFQaVJAWiixWPYg3FePALT5AUFJxSEtEvDvRN3A").unwrap();
    // let sa = cyfs.DecAppId.from_base_58("9tGpLNnCbzZhKN58H59byK9SoKwrVvxDaBXsA4qTQES9").unwrap();
    // let status = cyfs.AppLocalStatusEx.create(so, sa);

    // console.info("status hex:", status.to_hex());

    // let status1 = cyfs.AppLocalStatusEx.create(so, sa);
    // console.info("status1 hex:", status1.to_hex());

    // let dir_id = cyfs.DirId.from_base_58("7jMmeXZWRh8u3qHTEsujtLrTXRpJn6EziWQRsY9qbNEB").unwrap();
    // status.set_web_dir(dir_id);
    // console.info("status hex:", status.to_hex());

    // status.set_version("1.0.0");
    // console.info("status hex:", status.to_hex());

    // let hex1 = "019b080248000000008e464bb209c19a1589165988e4c48369f9c5dccf3efcace70064c1000100220a2084000000001ade6e04b4198102c2fa3a4df3f12e1069311752809484c18beafe00002f341c7f769ba800010b080030c0afdafbc783cd17";
    // let status1 = cyfs.AppLocalStatusExDecoder.create().from_hex(hex1).unwrap();
    // console.info("status1:", status1.to_hex(), status1.webdir() ? status1.webdir()!.to_base_58() : "null");

    // let hex2 = "019b080248000000008e464bb209c19a1589165988e4c48369f9c5dccf3efcace70064c1000100220a2084000000001ade6e04b4198102c2fa3a4df3f12e1069311752809484c18beafe00002f341c7f76bae800012d08001a2064000000001dfd141d2b94f046c0ae0438ebb1095c902cfa0e846e52404fd90030c0afdafbc783cd17";
    // let status2 = cyfs.AppLocalStatusExDecoder.create().from_hex(hex2).unwrap();
    // console.info("status2:", status2.to_hex(), status2.webdir() ? status2.webdir()!.to_base_58() : "null");

    // let hex3 = "019b080248000000008e464bb209c19a1589165988e4c48369f9c5dccf3efcace70064c1000100220a2084000000001ade6e04b4198102c2fa3a4df3f12e1069311752809484c18beafe00002f341c80fe4b2200013230f28df987c883cd171205312e302e301a2064000000001dfd141d2b94f046c0ae0438ebb1095c902cfa0e846e52404fd900";
    // let status3 = cyfs.AppLocalStatusExDecoder.create().from_hex(hex3).unwrap();
    // console.info("status3:", status3.webdir()?.to_base_58(), status3.version());

    // let permission = status3.permission_unhandled().to(k => k, v => v);
    // for (let k in permission) {
    //     console.info(!)
    // }


    await test_base();


    cyfs.clog.enable_file_log({
        name: "test-main",
        dir: cyfs.get_app_log_dir("test-main"),
        file_max_size: 1024 * 1024 * 10,
        file_max_count: 10,
    });

    // test_perf();

    //console.log("*".repeat(128));
    //await test_meta();
    //console.log("*".repeat(128));

    //test_core_objects();
    //test_object_codec();
    //test_protobuf();
    //test_codec();

    // ROOT_STATE 必须要添加dec id
    const owner = cyfs.ObjectId.from_base_58(
        "9tGpLNnTCEdt1At9V7WtpwSNvycWR8DpdfpwgqAzdrEm"
      ).unwrap();
    const test_dec_id = cyfs.DecApp.generate_id(owner, "dec-app-test");
    const param = cyfs.SharedCyfsStackParam.new_with_ws_event_ports(21000, 21001, test_dec_id).unwrap();
    //const param = cyfs.SharedCyfsStackParam.new_with_ws_event_ports(1321, 1323, test_dec_id).unwrap();
    //const stack = cyfs.SharedCyfsStack.open_runtime(test_dec_id);
    const stack = cyfs.SharedCyfsStack.open(param);
    await stack.wait_online(Some(JSBI.BigInt(1000 * 1000 * 5)));
    (await stack.online()).unwrap();

    await test_object_map(stack);
    await test_root_state(stack);
    await test_router(stack);
    await test_router_handlers(stack);


    console.info('version:', process.version);
    const meta_client = cyfs.get_meta_client(cyfs.MetaMinerTarget.Dev);
    const object_id = cyfs.ObjectId.from_base_58('5aSixgLveRFY7xLDwcuoVs1sPuv36JhPTwEE5ZqNnhWp').unwrap();
    const view_resp = await meta_client.getDesc(object_id);
    console.log(view_resp);

    // await test_acl()
    // await test_dir();

    // (console as any).origin.assert(false, "test origin assert");
    // console.assert(false, "test assert");


    // await test_rules();
    await test_trans();

    test_codec();
}


main().then(() => {
    process.exit(0);
});
