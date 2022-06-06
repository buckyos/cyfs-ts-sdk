import * as fs from 'fs';
import * as path from 'path';
import * as cyfs from '../sdk';

import {PerfDecoder} from "../sdk/cyfs-perf/base/perf";


function test_perf_objects() {
    {
        const desc_file = path.join(cyfs.get_app_data_dir('tests'), 'perf_empty.desc');

        const buf: Buffer = fs.readFileSync(desc_file);
        const [perf, left] = new PerfDecoder().raw_decode(new Uint8Array(buf)).unwrap();
        console.assert(left.length === 0);

        console.log("perf_empty:", JSON.stringify(perf));

    }
    {

        const desc_file = path.join(cyfs.get_app_data_dir('tests'), 'perf.desc');

        const buf: Buffer = fs.readFileSync(desc_file);
        const [perf, left] = new PerfDecoder().raw_decode(new Uint8Array(buf)).unwrap();
        console.assert(left.length === 0);

        console.log("perf:", JSON.stringify(perf));

    }
}

export function test_perf() {
    test_perf_objects();
}