import * as cyfs from '../sdk';
import { compareArray } from './util';

export function test_object_id_data() {
    const data = "hello!!! first id";
    const id = cyfs.ObjectId.from_string_as_data(data).unwrap()
    console.assert(id.is_data());
    console.assert(!id.is_standard_object());
    console.assert(!id.is_core_object());
    console.assert(!id.is_dec_app_object());
    console.log(id.data_as_string())

    console.log("len=", id.data_len(), id.to_string());

    const data2 = id.data_as_string();
    console.assert(data2.length === data.length);
    console.assert(data2 === data);

    const id2 = cyfs.ObjectId.default();
    console.assert(id2.is_data());
    console.log("len=", id2.data_len(), id2.to_string());
    console.assert(id2.data_len() === 0);
    console.assert(id2.data().byteLength ===  0);

    const error_data = "1234567890123456789012345678901234567890";
    const ret = cyfs.ObjectId.from_string_as_data(error_data);
    console.assert(ret.err);

    const data3 = cyfs.HashValue.hash_data(new TextEncoder().encode("1233"));
    const id3 = cyfs.ObjectId.from_data(data3.as_slice().subarray(0, 31)).unwrap()
    console.log("len=", id3.data_len(), id3.to_string());

    console.assert(id3.data_len() === 31);
    console.assert(compareArray(id3.data(), data3.as_slice().subarray(0, 31)));
    // id.data_as_string().unwrap_err();

    console.assert(id3.object_category() === cyfs.ObjectCategory.Data);

    id3.info().match<void>({
        DataObjectidInfo: (v) => {
            console.assert(compareArray(v, data3.as_slice().subarray(0, 31)));
        },
        StandardObjectIdInfo: () => {console.assert(false)},
        CoreObjectIdInfo: () => {console.assert(false)},
        DecAppObjectIdInfo: () => {console.assert(false)}

    })
}