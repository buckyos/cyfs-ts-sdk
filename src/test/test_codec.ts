import assert = require('assert');
import * as cyfs from '../sdk';

function test_var_string_codec(s: string) {

    const s1 = new cyfs.BuckyVarString(s);
    const size = s1.raw_measure().unwrap();
    const buf = new Uint8Array(size);
    {
        const remain = s1.raw_encode(buf).unwrap();
        assert(remain.byteLength === 0);
    }

    const decoder = new cyfs.BuckyVarStringDecoder();
    const [rs, remain] = decoder.raw_decode(buf).unwrap();

    assert(rs.value() === s);
    assert(remain.byteLength === 0);
}

function test_bucky_string_codec(s: string) {
    const s1 = new cyfs.BuckyString(s);
    const size = s1.raw_measure().unwrap();
    const buf = new Uint8Array(size);
    {
        const remain = s1.raw_encode(buf).unwrap();
        assert(remain.byteLength === 0);
    }

    const decoder = new cyfs.BuckyStringDecoder();
    const [rs, remain] = decoder.raw_decode(buf).unwrap();

    assert(rs.value() === s);
    assert(remain.byteLength === 0);
}

function test_utf8_var_string() {
    const v = new cyfs.BuckyVarString('巴克云asdasdasd');
    const bytes = v.raw_measure().unwrap();
    const arr = new Uint8Array(bytes);
    v.raw_encode(arr).unwrap();
    console.info(arr.toString());

    const [v2, buf] = new cyfs.BuckyVarStringDecoder().raw_decode(arr).unwrap();
    console.assert(v2.equals(v));
}

function test_utf8_string() {
    const v = new cyfs.BuckyString('巴克云网络科技asdasdasd');
    const bytes = v.raw_measure().unwrap();
    const arr = new Uint8Array(bytes);
    v.raw_encode(arr).unwrap();
    console.info(arr.toString());

    const [v2, buf] = new cyfs.BuckyStringDecoder().raw_decode(arr).unwrap();
    console.assert(v2.equals(v));
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
        //
    }

    test_utf8_var_string();
    test_utf8_string();
}

function test_bucky_size_impl(n: string, encoded_str: string) {

    const size = new cyfs.BuckySize(n);
    const len = size.raw_measure().unwrap();
    console.info(`BuckySize measure: var=${n}, len=${len}`);

    const buf = new Uint8Array(len);
    size.raw_encode(buf).unwrap();

    const str = Buffer.from(buf).toString('hex');
    if (str !== encoded_str) {
        console.error(`unmatch encode result: v=${n}, ret=${str}, except=${encoded_str}`);
    }

    const [ret, _buf] = new cyfs.BuckySizeDecoder().raw_decode(buf).unwrap();
    console.assert(ret === Number(n));

    {
        const buf = Uint8Array.from(Buffer.from(encoded_str, 'hex'));
        const [ret, _buf] = new cyfs.BuckySizeDecoder().raw_decode(buf).unwrap();
        console.assert(ret === Number(n));
    }
}

import JSBI from 'jsbi';

function test_bucky_size() {
    {
        let v = JSBI.BigInt('0b11000000');
        console.info(v);
    }
    {
        let v = JSBI.BigInt(12345);
        console.info(v);
    }
    {
        let v = JSBI.BigInt('0b00000000');
        console.info(v);
    }

    const bi = require('big-integer');
    const byte = bi(0);
    const v =  bi("0b11000000");
    const v2 = byte & v;
    const v3 = bi("0b00000000");
    console.info(`${v} & ${v2} === ${v3}`);
    console.info(`${byte & v}`);
    if (v2 == bi("0b00000000")) {
        console.log(`${byte}`);
    }

    const x = BigInt('0b110110');
    const y = BigInt('0b110110');
    console.info(`${x} == ${y}`);
    if (x == y) {
        console.log(`${x}`);
    }
    if (x >= y) {
        console.log(`${x}`);
    }
    if (x > y) {
        console.log(`${x}`);
    }
    //if (x.eq(y)) {
    //    console.log(`${x}`);
    //}
    if (x === y) {
        console.log(`${x}`);
    }
    if (bi('0b110110') === bi("0b110110")) {
        console.log(`${byte}`);
    }

    if (v2 != bi("0b00000000")) {
        console.log(`${byte}`);
    }

    test_bucky_size_impl('0', '00');
    test_bucky_size_impl('63', '3f');
    test_bucky_size_impl('16383', '7fff');
    test_bucky_size_impl('16384', 'c0004000');
    test_bucky_size_impl('1073741823', 'ffffffff');
    test_bucky_size_impl('1073741824', '8000000040000000');
    test_bucky_size_impl(Number.MAX_SAFE_INTEGER.toString(), '801fffffffffffff');
}

function test_object_id() {
    {
        const ood1 = cyfs.DeviceId.from_base_58('5aSixgLq9LVWbPByjRYgyjGicXtCN5S1nF1DMKZygLRE').unwrap();
        const target = ood1.object_id;
        console.info(target.toString() === '5aSixgLq9LVWbPByjRYgyjGicXtCN5S1nF1DMKZygLRE');
    }

    {
        const people1 = cyfs.PeopleId.from_base_58('5r4MYfFFQetBPDyeuBuDxPT7zowk9497SbpMQsZK2G19').unwrap();
        const target = people1.object_id;
        console.info(target.toString() === '5r4MYfFFQetBPDyeuBuDxPT7zowk9497SbpMQsZK2G19');
    }

    {
        const ret = cyfs.DeviceId.from_base_58('5r4MYfFFQetBPDyeuBuDxPT7zowk9497SbpMQsZK2G19');
        console.assert(ret.err);
    }
}

export function test_codec() {
    test_object_id();
    test_bucky_size();
    test_string_codec();
}