import assert = require('assert');
import { ObjectId } from '../';
import { BuckyVarString, BuckyString, BuckyVarStringDecoder, BuckyStringDecoder } from '../cyfs-base';

import {
    get_meta_client,
    MetaClient,
    MetaMinerTarget
} from '../cyfs-meta';
import {test_codec} from "./test_codec";
import { test_dir } from './test_dir';
import {test_file} from "./test_file";
import { test_meta } from './test_meta';
import { test_rules } from './test_rules';
import bs58 from 'bs58';

const path = require('path');
const fs = require('fs-extra');
const child_process = require('child_process');

async function main(){
    if (typeof TextDecoder == "undefined") {
        global.TextDecoder = require('util').TextDecoder;
    }

    const s = "xxxxx+++";
    try {
        const buf = bs58.decode(s);
    } catch (error) {
        console.error(error);
    }
    
    console.info('version:', process.version);
    const meta_client = get_meta_client(MetaMinerTarget.Dev);
    const object_id = ObjectId.from_base_58('5aSixgLveRFY7xLDwcuoVs1sPuv36JhPTwEE5ZqNnhWp').unwrap();
    const view_resp = await meta_client.getDesc(object_id);
    console.log(view_resp);

    //await test_dir();
    
    //await test_meta();
    //(console as any).origin.assert(false, "test origin assert");
    //console.assert(false, "test assert");
    
    let n = Number(BigInt(10));
    
    //await test_rules();
    await test_file();

    test_codec();
}


main().then(()=>{
    // process.exit(0);
});
