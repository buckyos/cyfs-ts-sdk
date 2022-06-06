import {getData, remove, setData} from "./storage";
import {bucky_time_2_js_time, bucky_time_now, ProtobufCodecHelper} from "../../cyfs-base";
import {
    namespaces_perf_isolate,
    namespaces_perf_accumulation,
    namespaces_perf_action,
    namespaces_perf_record,
    namespaces_perf_req,
    namespaces_perf_time_range
} from "./const";


export function isolates_exists(id: string, isolate: string) : boolean {
    let  number = 40;
    let i = 0;

    for (i = 0; i < number; i++) {
        let perf_isolate = `${namespaces_perf_isolate}${i.toString()}`;
        let tjArr1 = eval('(' + getData(perf_isolate) + ')');
        if (tjArr1) {
            if (tjArr1[tjArr1.length-1].id === id) {
                // console.warn(`perf isolate existed ${perf_isolate}, ${isolate}`);

                return true;
            }
        }
    }

    return  false;
}

function perf_isolate(id: string, isolate: string) {

    if (isolates_exists(id, isolate)) {
        return;
    }

    // 最多保留40个isolate
    let  number = 40;
    let i = 0;

    for (i = 0; i < number; i++) {
        let perf_isolate = `${namespaces_perf_isolate}${i.toString()}`;
        let tjArr1 = eval('(' + getData(perf_isolate) + ')');
        if (tjArr1) {
            console.warn(`perf isolate existed key ${perf_isolate}`);
        } else {
            var tjArr: any = '[]';
            var dataArr = {
                'id' : id,
                'isolate': isolate
            };
            tjArr = eval('(' + tjArr + ')');
            tjArr.push(dataArr);
            tjArr= JSON.stringify(tjArr);

            setData(perf_isolate, tjArr, false);
            break;
        }
    }
}

export function perf_begin(id: string, key: string, isolate: string) {
    let full_id = `${id}_${key}`;
    let tjArr1 = eval('(' + getData(full_id) + ')');
    if (tjArr1) {
        console.error(`perf request item already begin! id=${id}, key=${key}"`);
    } else {
        var tjArr: any = '[]';
        var dataArr = {
            'tick' : bucky_time_2_js_time(bucky_time_now())
        };
        tjArr = eval('(' + tjArr + ')');
        tjArr.push(dataArr);
        tjArr= JSON.stringify(tjArr);

        setData(full_id, tjArr, false);

        // 保存isolate
        perf_isolate(id, isolate);

    }
}

export function perf_end(id: string, key: string, err: number, bytes?: number) {
    let js_now = bucky_time_2_js_time(bucky_time_now());
    let full_id = `${id}_${key}`;
    let req_key = namespaces_perf_req + id;
    let tjArr = eval('(' + getData(full_id) + ')');
    if (tjArr) {

        remove(full_id);

        let during = js_now > tjArr[tjArr.length-1].tick ? js_now - tjArr[tjArr.length-1].tick : 0;

        let tjArr1 = eval('(' + getData(req_key) + ')');
        if (tjArr1) {

            tjArr1[tjArr1.length-1].total += 1;
            if (err === 0) {
                tjArr1[tjArr1.length-1].success += 1;
            }
            tjArr1[tjArr1.length-1].total_time += during;
            tjArr1[tjArr1.length-1].total_size += (bytes||0);
            tjArr1[tjArr1.length-1].end = bucky_time_2_js_time(bucky_time_now());
            var jsArr= JSON.stringify(tjArr1);
            setData(
                req_key,
                jsArr,
                false,
            );

        } else {
            var tjArrNew: any = '[]';
            var dataArr = {
                'id': id,
                'begin': tjArr[tjArr.length-1].tick,
                'end': bucky_time_2_js_time(bucky_time_now()),
                'total': 1,
                'success': err === 0 ? 1: 0,
                'total_time': during,
                'total_size': bytes
            };
            tjArrNew = eval('(' + tjArrNew + ')');
            tjArrNew.push(dataArr);
            tjArrNew= JSON.stringify(tjArrNew);

            setData(
                req_key,
                tjArrNew,
                false,
            );
        }

    } else {
        console.log(`perf request begin/end not match! id=${id}, key=${key}"`);
    }

    time_range(id);
}

function time_range(id: string ) {
    let key = namespaces_perf_time_range + id;
    let tjArr1 = eval('(' + getData(key) + ')');
    if (tjArr1) {
        //console.log(tjArr1[tjArr1.length-1]);
        tjArr1[tjArr1.length-1].end = bucky_time_2_js_time(bucky_time_now());
        var jsArr= JSON.stringify(tjArr1);
        setData(
            key,
            jsArr,
            false,
        );

    } else {
        var tjArrNew: any = '[]';
        var dataArr = {
            'begin': bucky_time_2_js_time(bucky_time_now()),
            'end': bucky_time_2_js_time(bucky_time_now()),
        };
        tjArrNew = eval('(' + tjArrNew + ')');
        tjArrNew.push(dataArr);
        tjArrNew= JSON.stringify(tjArrNew);

        setData(
            key,
            tjArrNew,
            false,
        );

    }
}


export function perf_acc(id: string, isolate: string, err: number, size?: number) {
    let key = namespaces_perf_accumulation + id;
    let tjArr1 = eval('(' + getData(key) + ')');
    if (tjArr1) {

        tjArr1[tjArr1.length-1].end = bucky_time_2_js_time(bucky_time_now());
        tjArr1[tjArr1.length-1].total += 1;
        if (err === 0) {
            tjArr1[tjArr1.length-1].success += 1;
        }
        tjArr1[tjArr1.length-1].total_size += (size||0);
        // console.log(`id: ${id}, total_size: (${tjArr1[tjArr1.length-1].total_size})`)
        var jsArr= JSON.stringify(tjArr1);
        setData(
            key,
            jsArr,
            false,
        );

    } else {
        var tjArrNew: any = '[]';
        var dataArr = {
            'id': id,
            'begin': bucky_time_2_js_time(bucky_time_now()),
            'end': bucky_time_2_js_time(bucky_time_now()),
            'total': 1,
            'success': err === 0 ? 1: 0,
            'total_size': (size||0)
        };
        tjArrNew = eval('(' + tjArrNew + ')');
        tjArrNew.push(dataArr);
        tjArrNew= JSON.stringify(tjArrNew);

        // console.log(`id: ${id},  total_size: (${size})`)
        setData(
            key,
            tjArrNew,
            false,
        );

        // 保存isolate
        perf_isolate(id, isolate);
    }
}


export function perf_action(id: string, isolate: string, err: number, name: string, value: string) {
    let key = namespaces_perf_action + id;
    let tjArr = eval('(' + getData(key) + ')');
    if (!tjArr) {
        tjArr = '[]';
        tjArr = eval('(' + tjArr + ')');
    }

    var dataArr = {
        'id': id,
        'time': bucky_time_2_js_time(bucky_time_now()),
        'err': err,
        'name': name,
        'value': value
    };

    tjArr.push(dataArr);
    tjArr= JSON.stringify(tjArr);

    setData(
        key,
        tjArr,
        false,
    );

    time_range(id);

    // 保存isolate
    perf_isolate(id, isolate);
}

export function perf_record(id: string, isolate: string, total: number, total_size?: number) {
    let key = namespaces_perf_record + id;
    var tjArrNew: any = '[]';
    var dataArr = {
        'id': id,
        'time': bucky_time_2_js_time(bucky_time_now()),
        'total': total,
        'total_size': total_size
    };
    tjArrNew = eval('(' + tjArrNew + ')');
    tjArrNew.push(dataArr);
    tjArrNew= JSON.stringify(tjArrNew);

    setData(
        key,
        tjArrNew,
        false,
    );

    time_range(id);

    // 保存isolate
    perf_isolate(id, isolate);
}