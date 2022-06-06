import {
    SubDescType,
    DescTypeInfo, DescContent, DescContentDecoder,
    BodyContent, BodyContentDecoder,
    NamedObjectId, NamedObjectIdDecoder,
    NamedObjectDesc, NamedObjectDescDecoder,
    NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
    DeviceIdDecoder,
    PeopleIdDecoder, from_buf, RawEncode, RawEncodePurpose, BuckyHashMap, Option, ObjectIdDecoder,
} from "../../cyfs-base"

import { Ok, BuckyResult } from "../../cyfs-base"
import { ObjectId, PeopleId, DeviceId } from "../../cyfs-base"


import {
    BuckyString, BuckyStringDecoder, bucky_time_now,
    ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufCodecHelper, ProtobufDescContent, ProtobufDescContentDecoder
} from "../../cyfs-base"


import {
    PerfAccumulation,
    PerfAction,
    PerfIsolateEntity, PerfIsolateEntityList,
    PerfRecord,
    PerfRequest,
    PerfRequestIsolate, PerfTimeRange
} from "./item";
import JSBI from 'jsbi';
import { perf_protos } from '../codec';
import { CoreObjectType, DecAppId, DecAppIdDecoder } from "../../cyfs-core";


export class PerfDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.PerfOperation;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "option",
            key_type: "disable"
        }
    }
}

const PERF_DESC_TYPE_INFO = new PerfDescTypeInfo();

export class PerfDescContent extends ProtobufDescContent {
    device: DeviceId;
    people: ObjectId;
    // dec id
    id: string;
    version: string;

    hash: string;

    constructor(device: DeviceId, people: ObjectId, id: string, version: string, hash: string) {
        super();
        this.device = device;
        this.people = people;
        this.id = id;
        this.version = version;
        this.hash = hash;
    }

    type_info(): DescTypeInfo {
        return PERF_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<perf_protos.PerfDescContent> {
        const target = new perf_protos.PerfDescContent();

        target.setDevice(ProtobufCodecHelper.encode_buf(this.device).unwrap());
        target.setPeople(ProtobufCodecHelper.encode_buf(this.people).unwrap());

        if (this.id != null) {
            target.setId(this.id);
        }
        if (this.version != null) {
            target.setVersion(this.version);
        }
        if (this.hash != null) {
            target.setHash(this.hash);
        }

        return Ok(target);
    }
}

export class PerfDescContentDecoder extends ProtobufDescContentDecoder<PerfDescContent, perf_protos.PerfDescContent>{
    constructor() {
        super(perf_protos.PerfDescContent.deserializeBinary)
    }

    type_info(): DescTypeInfo {
        return PERF_DESC_TYPE_INFO;
    }

    try_from_proto(value: perf_protos.PerfDescContent): BuckyResult<PerfDescContent> {

        const device: DeviceId = ProtobufCodecHelper.decode_buf(value.getDevice_asU8(), new DeviceIdDecoder()).unwrap();
        const people: ObjectId = ProtobufCodecHelper.decode_buf(value.getPeople_asU8(), new ObjectIdDecoder()).unwrap();
        const id: string = value.getId();
        const version: string = value.getVersion();
        const hash: string = value.getHash();
        const result = new PerfDescContent(device, people, id, version, hash);

        return Ok(result);
    }
}


export class PerfBodyContent extends ProtobufBodyContent {

    time_range: PerfTimeRange;
    all: Map<BuckyString, PerfIsolateEntity>;

    constructor(time_range: PerfTimeRange, all: Map<BuckyString, PerfIsolateEntity>) {
        super();

        this.time_range = time_range;
        this.all = all;
    }

    try_to_proto(): BuckyResult<perf_protos.PerfBodyContent> {
        const body = new perf_protos.PerfBodyContent();

        for (const [k, v] of this.all.entries()) {

            const entity = new perf_protos.PerfIsolateEntity();

            if (v.actions) {
                for (const [k1, v1] of v.actions.entries()) {
                    const id = v1.id;
                    const time = v1.time;
                    const err = v1.err;
                    const name = v1.name;
                    const value = v1.value;

                    const item = new perf_protos.PerfAction();
                    item.setId(id!);
                    item.setTime(time!.toString());
                    item.setErr(err!);
                    item.setName(name!);
                    item.setValue(value!);

                    entity.addActions(item);
                }
            }

            if (v.records) {
                for (const [k2, v2] of v.records.entries()) {
                    const id = v2.id!;
                    const time = v2.time!;
                    const total = v2.total!;
                    const total_size = v2.total_size!;

                    const record_body = new perf_protos.PerfRecord();
                    record_body.setId(id);
                    record_body.setTime(time.toString());
                    record_body.setTotal(total.toString());
                    record_body.setTotalSize(total_size.toString());

                    entity.getRecordsMap().set(k2.value(), record_body);
                }
            }

            if (v.accumulations) {
                for (const [k3, v3] of v.accumulations.entries()) {
                    const id = v3.id!;
                    const total = v3.total!;
                    const success = v3.success!;
                    const total_size = v3.total_size!;

                    const tr = new perf_protos.PerfTimeRange();
                    if (v3.time_range) {
                        tr.setBegin(v3.time_range!.begin!.toString());
                        tr.setEnd(v3.time_range!.end!.toString());
                    }

                    const acc_body = new perf_protos.PerfAccumulation();
                    acc_body.setId(id);
                    acc_body.setTimeRange(tr);
                    acc_body.setTotal(total);
                    acc_body.setSuccess(success);
                    acc_body.setTotalSize(total_size.toString());

                    entity.getAccumulationsMap().set(k3.value(), acc_body);
                }
            }

            if (v.reqs?.reqs) {
                for (const [k5, v5] of v.reqs.reqs.entries()) {
                    const id = v5.id!;
                    const total = v5.total!;
                    const success = v5.success!;
                    const total_time = v5.total_time!;
                    const total_size = v5.total_size!;

                    const tr = new perf_protos.PerfTimeRange();
                    if (v5.time_range) {
                        tr.setBegin(v5.time_range.begin!.toString());
                        tr.setEnd(v5.time_range.end!.toString());
                    }

                    const reqs_body = new perf_protos.PerfRequest();
                    reqs_body.setId(id);
                    reqs_body.setTimeRange(tr);
                    reqs_body.setTotal(total);
                    reqs_body.setSuccess(success);
                    reqs_body.setTotalTime(total_time.toString());
                    reqs_body.setTotalSize(total_size.toString());

                    entity.getReqsMap().set(k5.value(), reqs_body);
                }
            }

            {
                const tr = new perf_protos.PerfTimeRange();
                if (v.time_range) {
                    tr.setBegin(v.time_range.begin!.toString());
                    tr.setEnd(v.time_range.end!.toString());
                }
                entity.setTimeRange(tr);
            }

            entity.setId(v.id!);

            body.getAllMap().set(k.value(), entity);
        }

        const time_range = new perf_protos.PerfTimeRange();
        time_range.setBegin(this.time_range?.begin!.toString());
        time_range.setEnd(this.time_range?.end!.toString());

        body.setTimeRange(time_range);

        return Ok(body);
    }
}

function decode_time_range(time_range: perf_protos.PerfTimeRange | undefined): PerfTimeRange | undefined {
    if (time_range) {
        const begin: JSBI = ProtobufCodecHelper.decode_int64(time_range.getBegin());
        const end: JSBI = ProtobufCodecHelper.decode_int64(time_range.getEnd());
        return new PerfTimeRange(begin, end);
    } else {
        return undefined;
    }
}

function decode_time_range_with_default(time_range: perf_protos.PerfTimeRange | undefined): PerfTimeRange {
    if (time_range) {
        const begin: JSBI = ProtobufCodecHelper.decode_int64(time_range.getBegin());
        const end: JSBI = ProtobufCodecHelper.decode_int64(time_range.getEnd());
        return new PerfTimeRange(begin, end);
    } else {
        return new PerfTimeRange(JSBI.BigInt(0), JSBI.BigInt(0));
    }
}

export class PerfBodyContentDecoder extends ProtobufBodyContentDecoder<PerfBodyContent, perf_protos.PerfBodyContent>{
    constructor() {
        super(perf_protos.PerfBodyContent.deserializeBinary)
    }

    try_from_proto(value: perf_protos.PerfBodyContent): BuckyResult<PerfBodyContent> {
        const all: Map<BuckyString, PerfIsolateEntity> = new Map();
        const time_range: PerfTimeRange = decode_time_range_with_default(value.getTimeRange());

        for (const [k, entity] of value.getAllMap().entries()) {
            const id = entity.getId();

            // reqs
            const perf_reqs = new Map<BuckyString, PerfRequest>();

            for (const [k, v] of entity.getReqsMap().entries()) {
                const req_id: string = v.getId();
                const total: number = v.getTotal();
                const success: number = v.getSuccess();
                const total_time: JSBI = ProtobufCodecHelper.decode_int64(v.getTotalTime());
                const total_size: JSBI = ProtobufCodecHelper.decode_int64(v.getTotalSize());
                const time_range = decode_time_range(v.getTimeRange());

                const requestsObj = new PerfRequest(req_id, total, success, total_time, total_size, time_range);
                perf_reqs.set(new BuckyString(k), requestsObj);
            }

            const perf_requests = new PerfRequestIsolate(perf_reqs);

            // actions  set
            const perf_actions = new Map<BuckyString, PerfAction>();
            let counter = 0;
            for (const item of entity.getActionsList()) {
                const action_id: string = item.getId();
                const time: JSBI = ProtobufCodecHelper.decode_int64(item.getTime());
                const err: number = item.getErr();
                const name: string = item.getName();
                const value: string = item.getValue();

                counter++;
                const actionsObj = new PerfAction(action_id, err, name, value, time);
                perf_actions.set(new BuckyString(counter.toString()), actionsObj);
            }

            // records
            const perf_records = new Map<BuckyString, PerfRecord>();

            for (const [k, v] of entity.getRecordsMap().entries()) {
                const record_id: string = v.getId();
                const total: JSBI = ProtobufCodecHelper.decode_int64(v.getTotal());
                const total_size: JSBI = ProtobufCodecHelper.decode_int64(v.getTotalSize());
                const time: JSBI = ProtobufCodecHelper.decode_int64(v.getTime());
                const recordsObj = new PerfRecord(record_id, total, total_size, time);
                perf_records.set(new BuckyString(k), recordsObj);
            }


            // accumulations
            const perf_acc = new Map<BuckyString, PerfAccumulation>();
            for (const [k, v] of entity.getAccumulationsMap().entries()) {
                const acc_id: string = v.getId();
                const total: number = v.getTotal();
                const success: number = v.getSuccess();
                const total_size: JSBI = ProtobufCodecHelper.decode_int64(v.getTotalSize());

                const time_range = decode_time_range(v.getTimeRange());

                counter++;
                const accObj = new PerfAccumulation(acc_id, total, success, total_size, time_range);
                perf_acc.set(new BuckyString(k), accObj);
            }

            const perf_time_range = decode_time_range(entity.getTimeRange());

            const isolateObj = new PerfIsolateEntity(
                k,
                perf_time_range,
                perf_actions,
                perf_records,
                perf_acc,
                perf_requests);

            all.set(new BuckyString(id), isolateObj);
        }

        const result = new PerfBodyContent(time_range, all);
        return Ok(result);
    }
}

export class PerfDesc extends NamedObjectDesc<PerfDescContent>{
    // ignore
}

export class PerfDescDecoder extends NamedObjectDescDecoder<PerfDescContent>{
    // ignore
}

export class PerfBuilder extends NamedObjectBuilder<PerfDescContent, PerfBodyContent>{
    // ignore
}

export class PerfId extends NamedObjectId<PerfDescContent, PerfBodyContent>{
    constructor(id: ObjectId) {
        super(CoreObjectType.PerfOperation, id);
    }

    static default(): PerfId {
        return named_id_gen_default(CoreObjectType.PerfOperation);
    }

    static from_base_58(s: string): BuckyResult<PerfId> {
        return named_id_from_base_58(CoreObjectType.PerfOperation, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<PerfId> {
        return named_id_try_from_object_id(CoreObjectType.PerfOperation, id);
    }
}

export class PerfIdDecoder extends NamedObjectIdDecoder<PerfDescContent, PerfBodyContent>{
    constructor() {
        super(CoreObjectType.PerfOperation);
    }
}


export class Perf extends NamedObject<PerfDescContent, PerfBodyContent>{
    static create(device: DeviceId, people: ObjectId, dec_id: Option<ObjectId>, id: string, version: string, list: PerfIsolateEntityList): Perf {
        const desc_content = new PerfDescContent(device, people, id, version, "");
        const all: Map<BuckyString, PerfIsolateEntity> = new Map();
        const body_content = new PerfBodyContent(list.time_range!, list.list!);
        const builder = new PerfBuilder(desc_content, body_content);

        return builder.owner(device.object_id).no_create_time().option_dec_id(dec_id).build(Perf);
    }

    put(id: BuckyString, isolate: PerfIsolateEntity) {
        this.body_expect().content().all.set(id, isolate);
        this.body_expect().set_update_time(bucky_time_now());
    }

    set_hash(hash: string) {
        this.desc().content().hash = hash;
    }

    remove(id: BuckyString) {
        this.body_expect().content().all.delete(id);
        this.body_expect().set_update_time(bucky_time_now());
    }

    clear() {
        this.body_expect().content().all.clear();
        this.body_expect().set_update_time(bucky_time_now());
    }

    all(): Map<BuckyString, PerfIsolateEntity> {
        return this.body_expect().content().all;
    }

    exists(id: BuckyString): boolean {
        return this.body_expect().content().all.has(id)
    }
}

export class PerfDecoder extends NamedObjectDecoder<PerfDescContent, PerfBodyContent, Perf>{
    constructor() {
        super(new PerfDescContentDecoder(), new PerfBodyContentDecoder(), Perf);
    }

    static create(): PerfDecoder {
        return new PerfDecoder()
    }
}

