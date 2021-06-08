import assert = require('assert');
import { ObjectId } from '../';
import { BuckyVarString, BuckyString, BuckyVarStringDecoder, BuckyStringDecoder } from '../cyfs-base';
import {
    get_meta_client,
    MetaClient,
    MetaMinerTarget
} from '../cyfs-meta';

function test_var_string_codec(s: string) {
    
    const s1 = new BuckyVarString(s);
    const size = s1.raw_measure().unwrap();
    const buf = new Uint8Array(size);
    {
        const remain = s1.raw_encode(buf).unwrap();
        assert(remain.byteLength === 0);
    }

    const decoder = new BuckyVarStringDecoder();
    const [rs, remain] = decoder.raw_decode(buf).unwrap();

    assert(rs.value() === s);
    assert(remain.byteLength === 0);
}

function test_bucky_string_codec(s: string) {
    const s1 = new BuckyString(s);
    const size = s1.raw_measure().unwrap();
    const buf = new Uint8Array(size);
    {
        const remain = s1.raw_encode(buf).unwrap();
        assert(remain.byteLength === 0);
    }

    const decoder = new BuckyStringDecoder();
    const [rs, remain] = decoder.raw_decode(buf).unwrap();
    
    assert(rs.value() === s);
    assert(remain.byteLength === 0);
}

function test_string_codec() {
    let s = "See scope for the exact definition, and safety guidelines. The simplest and safest API is scope_and_block, used as follows";
    test_var_string_codec(s);
    test_bucky_string_codec(s);

    while (s.length < 1024 * 1024) {
        s = s + s;
    }

    test_var_string_codec(s);

    try {
        test_bucky_string_codec(s);
    } catch (error) {
        
    }
}

export function test_codec() {
    test_string_codec();
}