

import { Ok, BuckyResult } from "../../cyfs-base"
import { RawDecode, RawEncode, RawEncodePurpose } from "../../cyfs-base";
import { PeopleId, ObjectId, ObjectIdDecoder, from_buf } from "../../cyfs-base";

import { BuckyString, BuckyStringDecoder, bucky_time_now } from "../../cyfs-base";
import { BuckyHashMap, BuckyHashMapDecoder } from "../../cyfs-base";
import JSBI from 'jsbi';


export class PerfRequest {
    constructor(public id?: string, public total?: number, public success?: number, public total_time?: JSBI, public total_size?: JSBI, public time_range?: PerfTimeRange) {

    }
}


export class PerfAccumulation  {
    constructor(public id?: string, public total?: number, public success?: number, public total_size?: JSBI, public time_range?: PerfTimeRange){
    }

}


export class PerfRecord {
    constructor(public id?: string, public total?: JSBI, public total_size?: JSBI, public time?: JSBI){

    }

}

export class PerfAction {
    constructor(public id?: string, public err?: number, public name?: string, public value?: string, public time?: JSBI){

    }
}

export class PerfTimeRange {
    constructor(public begin?: JSBI, public end?: JSBI) {
    }
}

export class PerfRequestIsolate {
    constructor(public reqs?: Map<BuckyString, PerfRequest>){

    }
}

export class PerfIsolateEntity {
    constructor(
        public id?: string,
        public time_range?: PerfTimeRange,
        public actions?: Map<BuckyString, PerfAction>,
        public records?: Map<BuckyString, PerfRecord>,
        public accumulations?: Map<BuckyString, PerfAccumulation>,
        public reqs?: PerfRequestIsolate) {
    }
}

export class PerfIsolateEntityList {
    constructor(public time_range?: PerfTimeRange, public list?: Map<BuckyString, PerfIsolateEntity>) {

    }
}
