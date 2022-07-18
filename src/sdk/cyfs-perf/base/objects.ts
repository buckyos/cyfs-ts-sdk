import JSBI from "jsbi";
import { BuckyErrorCode, BuckyResult, DescTypeInfo, EmptyProtobufBodyContent, EmptyProtobufBodyContentDecoder, NamedObject, NamedObjectBuilder, 
    NamedObjectDecoder, 
    NamedObjectId, NamedObjectIdDecoder, named_id_from_base_58, named_id_gen_default, named_id_try_from_object_id, None, 
    ObjectId, Ok, Option, ProtobufCodecHelper, ProtobufDescContent, ProtobufDescContentDecoder, Some, SubDescType } from "../../cyfs-base";
import { PerfObjectType } from "./type";
import {perf_protos as protos} from "../codec/index"
import { stringify } from "querystring";

function jsbi_min(t1: JSBI, t2: JSBI): JSBI {
    return JSBI.lessThan(t1, t2)?t1:t2
}

function jsbi_max(t1: JSBI, t2: JSBI): JSBI {
    return JSBI.greaterThan(t1, t2)?t1:t2
}

export class SizeResult {
    total: JSBI
    avg: JSBI
    min: JSBI
    max: JSBI

    constructor() {
        this.total = JSBI.BigInt(0)
        this.avg = JSBI.BigInt(0)
        this.min = JSBI.BigInt(0)
        this.max = JSBI.BigInt(0)
    }

    try_to_proto(): protos.SizeResult {
        const ret = new protos.SizeResult();
        ret.setTotal(this.total.toString())
        ret.setAvg(this.avg.toString())
        ret.setMax(this.max.toString())
        ret.setMin(this.min.toString())
        return ret
    }

    static try_from_proto(value: protos.SizeResult): SizeResult {
        const ret = new SizeResult();
        ret.total = ProtobufCodecHelper.decode_int64(value.getTotal())
        ret.avg = ProtobufCodecHelper.decode_int64(value.getAvg())
        ret.min = ProtobufCodecHelper.decode_int64(value.getMin())
        ret.max = ProtobufCodecHelper.decode_int64(value.getMax())

        return ret
    }

    merge(value: JSBI, total_num: number) {
        this.total = JSBI.ADD(this.total, value);
        this.min = JSBI.equal(this.min, JSBI.BigInt(0))?value:jsbi_min(this.min, value);
        this.max = jsbi_max(this.max, value)
        this.avg = JSBI.divide(this.total, JSBI.BigInt(total_num))
    }
}

export class TimeResult {
    total: number
    avg: number
    min: number
    max: number

    constructor() {
        this.total = 0
        this.avg = 0
        this.min = 0
        this.max = 0
    }

    try_to_proto(): protos.TimeResult {
        const ret = new protos.TimeResult();
        ret.setTotal(this.total)
        ret.setAvg(this.avg)
        ret.setMax(this.max)
        ret.setMin(this.min)
        return ret
    }

    static try_from_proto(value: protos.TimeResult): TimeResult {
        const ret = new TimeResult();
        ret.total = value.getTotal()
        ret.avg = value.getAvg()
        ret.min = value.getMin()
        ret.max = value.getMax()

        return ret
    }

    merge(value: number, total_num: number) {
        this.total += value;
        this.min = (this.min === 0)?value:Math.min(this.min, value)
        this.max = Math.max(this.max, value)
        this.avg = Math.floor(this.total/total_num)
    }
}

export class SpeedResult {
    avg: number
    min: number
    max: number

    constructor() {
        this.avg = 0
        this.min = 0
        this.max = 0
    }

    try_to_proto(): protos.SpeedResult {
        const ret = new protos.SpeedResult();
        ret.setAvg(this.avg)
        ret.setMax(this.max)
        ret.setMin(this.min)
        return ret
    }

    static try_from_proto(value: protos.SpeedResult): SpeedResult {
        const ret = new SpeedResult();
        ret.avg = value.getAvg()
        ret.min = value.getMin()
        ret.max = value.getMax()

        return ret
    }

    merge(value: number) {
        this.min = (this.min === 0)?value:Math.min(this.min, value)
        this.max = Math.max(this.max, value);

    }
}

export class PerfRequestTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return PerfObjectType.Request;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }
    }
}

const PERF_REQUEST_DESC_TYPE_INFO = new PerfRequestTypeInfo();

export class PerfRequestDesc extends ProtobufDescContent {
    time: TimeResult
    speed: SpeedResult
    size: SizeResult
    success: number
    failed: number
    constructor() {
        super();
        this.time = new TimeResult()
        this.size = new SizeResult()
        this.speed = new SpeedResult()
        this.success = 0;
        this.failed = 0
    }

    type_info(): DescTypeInfo {
        return PERF_REQUEST_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.PerfRequest> {
        const target = new protos.PerfRequest()
        target.setSize(this.size.try_to_proto());
        target.setSpeed(this.speed.try_to_proto())
        target.setTime(this.time.try_to_proto())
        target.setSuccess(this.success)
        target.setFailed(this.failed)

        return Ok(target);
    }
}

export class PerfRequestDescDecoder extends ProtobufDescContentDecoder<PerfRequestDesc, protos.PerfRequest> {
    constructor() {
        super(protos.PerfRequest.deserializeBinary);
    }

    type_info(): DescTypeInfo {
        return PERF_REQUEST_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.PerfRequest): BuckyResult<PerfRequestDesc> {
        const ret = new PerfRequestDesc()
        ret.size = SizeResult.try_from_proto(value.getSize()!)
        ret.time = TimeResult.try_from_proto(value.getTime()!)
        ret.speed = SpeedResult.try_from_proto(value.getSpeed()!)
        ret.success = value.getSuccess()
        ret.failed = value.getFailed()

        return Ok(ret);
    }
}

export class PerfRequestBuilder extends NamedObjectBuilder<PerfRequestDesc, EmptyProtobufBodyContent> {
    // ignore
}

export class PerfRequestId extends NamedObjectId<PerfRequestDesc, EmptyProtobufBodyContent> {
    constructor(id: ObjectId) {
        super(PerfObjectType.Request, id);
    }

    static default(): PerfRequestId {
        return named_id_gen_default(PerfObjectType.Request);
    }

    static from_base_58(s: string): BuckyResult<PerfRequestId> {
        return named_id_from_base_58(PerfObjectType.Request, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<PerfRequestId> {
        return named_id_try_from_object_id(PerfObjectType.Request, id);
    }
}

export class PerfRequestDecoder extends NamedObjectDecoder<PerfRequestDesc, EmptyProtobufBodyContent, PerfRequest> {
    constructor() {
        super(new PerfRequestDescDecoder(), new EmptyProtobufBodyContentDecoder(), PerfRequest);
    }
}

export class PerfRequest extends NamedObject<PerfRequestDesc, EmptyProtobufBodyContent> {
    static create(owner: ObjectId, dec_id: ObjectId): PerfRequest {
        return new PerfRequestBuilder(new PerfRequestDesc(), new EmptyProtobufBodyContent()).owner(owner).dec_id(dec_id).build(PerfRequest)
    }

    success():number {
        return this.desc().content().success
    }

    failed():number {
        return this.desc().content().failed
    }

    add_stat(spend_time: number, stat: BuckyResult<Option<JSBI>>): PerfRequest {
        const desc = this.desc().content()

        if (stat.err) {
            desc.failed += 1;
        } else {
            desc.success += 1;
            desc.time.merge(spend_time, desc.success);
            if (stat.unwrap().is_some()) {
                const stat_num = stat.unwrap().unwrap()
                desc.size.merge(stat_num, desc.success);

                const speed = JSBI.divide(stat_num, JSBI.BigInt(spend_time / 1000))
                desc.speed.merge(JSBI.toNumber(speed));
                desc.speed.avg = JSBI.toNumber(JSBI.divide(desc.size.total, JSBI.BigInt(desc.time.total / 1000)))
            }
        }

        return new PerfRequestBuilder(desc, new EmptyProtobufBodyContent()).owner(this.desc().owner()!.unwrap()).dec_id(this.desc().dec_id().unwrap()).build(PerfRequest)
    }
}

export class PerfAccumulationTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return PerfObjectType.Accumulation;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }
    }
}

const PERF_ACC_DESC_TYPE_INFO = new PerfAccumulationTypeInfo();

export class PerfAccumulationDesc extends ProtobufDescContent {
    size: SizeResult
    success: number
    failed: number
    constructor() {
        super();
        this.size = new SizeResult()
        this.success = 0;
        this.failed = 0
    }

    type_info(): DescTypeInfo {
        return PERF_ACC_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.PerfAccumulation> {
        const target = new protos.PerfAccumulation()
        target.setSize(this.size.try_to_proto());
        target.setSuccess(this.success)
        target.setFailed(this.failed)

        return Ok(target);
    }
}

export class PerfAccumulationDescDecoder extends ProtobufDescContentDecoder<PerfAccumulationDesc, protos.PerfAccumulation> {
    constructor() {
        super(protos.PerfAccumulation.deserializeBinary);
    }

    type_info(): DescTypeInfo {
        return PERF_ACC_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.PerfAccumulation): BuckyResult<PerfAccumulationDesc> {
        const ret = new PerfAccumulationDesc()
        ret.size = SizeResult.try_from_proto(value.getSize()!)
        ret.success = value.getSuccess()
        ret.failed = value.getFailed()

        return Ok(ret);
    }
}

export class PerfAccumulationBuilder extends NamedObjectBuilder<PerfAccumulationDesc, EmptyProtobufBodyContent> {
    // ignore
}

export class PerfAccumulationId extends NamedObjectId<PerfAccumulationDesc, EmptyProtobufBodyContent> {
    constructor(id: ObjectId) {
        super(PerfObjectType.Accumulation, id);
    }

    static default(): PerfAccumulationId {
        return named_id_gen_default(PerfObjectType.Accumulation);
    }

    static from_base_58(s: string): BuckyResult<PerfAccumulationId> {
        return named_id_from_base_58(PerfObjectType.Accumulation, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<PerfAccumulationId> {
        return named_id_try_from_object_id(PerfObjectType.Accumulation, id);
    }
}

export class PerfAccumulationDecoder extends NamedObjectDecoder<PerfAccumulationDesc, EmptyProtobufBodyContent, PerfAccumulation> {
    constructor() {
        super(new PerfAccumulationDescDecoder(), new EmptyProtobufBodyContentDecoder(), PerfAccumulation);
    }
}

export class PerfAccumulation extends NamedObject<PerfAccumulationDesc, EmptyProtobufBodyContent> {
    static create(owner: ObjectId, dec_id: ObjectId): PerfAccumulation {
        return new PerfAccumulationBuilder(new PerfAccumulationDesc(), new EmptyProtobufBodyContent()).owner(owner).dec_id(dec_id).build(PerfAccumulation)
    }

    success():number {
        return this.desc().content().success
    }

    failed():number {
        return this.desc().content().failed
    }

    add_stat(stat: BuckyResult<JSBI>): PerfAccumulation {
        const desc = this.desc().content()

        if (stat.err) {
            desc.failed += 1;
        } else {
            desc.success += 1;
            desc.size.merge(stat.unwrap(), desc.success);
        }

        return new PerfAccumulationBuilder(desc, new EmptyProtobufBodyContent()).owner(this.desc().owner()!.unwrap()).dec_id(this.desc().dec_id().unwrap()).build(PerfAccumulation)
    }
}

export class PerfActionTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return PerfObjectType.Action;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }
    }
}

const PERF_ACTION_DESC_TYPE_INFO = new PerfActionTypeInfo();

export class PerfActionDesc extends ProtobufDescContent {
    constructor(public err: BuckyErrorCode, public key: string, public value: string) {
        super();
    }

    type_info(): DescTypeInfo {
        return PERF_ACTION_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.PerfAction> {
        const target = new protos.PerfAction()
        target.setErr(this.err)
        target.setKey(this.key)
        target.setValue(this.value)

        return Ok(target);
    }
}

export class PerfActionDescDecoder extends ProtobufDescContentDecoder<PerfActionDesc, protos.PerfAction> {
    constructor() {
        super(protos.PerfAction.deserializeBinary);
    }

    type_info(): DescTypeInfo {
        return PERF_ACTION_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.PerfAction): BuckyResult<PerfActionDesc> {
        const ret = new PerfActionDesc(value.getErr(), value.getKey(), value.getValue())
        return Ok(ret);
    }
}

export class PerfActionBuilder extends NamedObjectBuilder<PerfActionDesc, EmptyProtobufBodyContent> {
    // ignore
}

export class PerfActionId extends NamedObjectId<PerfActionDesc, EmptyProtobufBodyContent> {
    constructor(id: ObjectId) {
        super(PerfObjectType.Action, id);
    }

    static default(): PerfActionId {
        return named_id_gen_default(PerfObjectType.Action);
    }

    static from_base_58(s: string): BuckyResult<PerfActionId> {
        return named_id_from_base_58(PerfObjectType.Action, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<PerfActionId> {
        return named_id_try_from_object_id(PerfObjectType.Action, id);
    }
}

export class PerfActionDecoder extends NamedObjectIdDecoder<PerfActionDesc, EmptyProtobufBodyContent> {
    constructor() {
        super(PerfObjectType.Action);
    }
}

export class PerfAction extends NamedObject<PerfActionDesc, EmptyProtobufBodyContent> {
    static create(owner: ObjectId, dec_id: ObjectId, stat: BuckyResult<[string, string]>): PerfAction {
        let err = BuckyErrorCode.Ok;
        let key = "";
        let value = "";
        if (stat.ok) {
            key = stat.unwrap()[0];
            value = stat.unwrap()[1];
        } else {
            err = stat.val.code;
        }
        return new PerfActionBuilder(new PerfActionDesc(err, key, value), new EmptyProtobufBodyContent()).owner(owner).dec_id(dec_id).build(PerfAction)
    }

    err_code(): BuckyErrorCode {
        return this.desc().content().err
    }
}

export class PerfRecordTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return PerfObjectType.Record;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }
    }
}

const PERF_RECORD_DESC_TYPE_INFO = new PerfRecordTypeInfo();

export class PerfRecordDesc extends ProtobufDescContent {
    constructor(public total: JSBI, public total_size: Option<JSBI>) {
        super();
    }

    type_info(): DescTypeInfo {
        return PERF_RECORD_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.PerfRecord> {
        const target = new protos.PerfRecord()
        target.setTotal(this.total.toString())
        if (this.total_size.is_some()) {
            target.setTotalSize(this.total_size.unwrap().toString())
        }

        return Ok(target);
    }
}

export class PerfRecordDescDecoder extends ProtobufDescContentDecoder<PerfRecordDesc, protos.PerfRecord> {
    constructor() {
        super(protos.PerfRecord.deserializeBinary);
    }

    type_info(): DescTypeInfo {
        return PERF_RECORD_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.PerfRecord): BuckyResult<PerfRecordDesc> {
        let total_size: Option<JSBI> = None;
        if (value.hasTotalSize()) {
            total_size = Some(JSBI.BigInt(value.getTotalSize()))
        }
        const ret = new PerfRecordDesc(JSBI.BigInt(value.getTotal()), total_size)
        return Ok(ret);
    }
}

export class PerfRecordBuilder extends NamedObjectBuilder<PerfRecordDesc, EmptyProtobufBodyContent> {
    // ignore
}

export class PerfRecordId extends NamedObjectId<PerfRecordDesc, EmptyProtobufBodyContent> {
    constructor(id: ObjectId) {
        super(PerfObjectType.Record, id);
    }

    static default(): PerfRecordId {
        return named_id_gen_default(PerfObjectType.Record);
    }

    static from_base_58(s: string): BuckyResult<PerfRecordId> {
        return named_id_from_base_58(PerfObjectType.Record, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<PerfRecordId> {
        return named_id_try_from_object_id(PerfObjectType.Record, id);
    }
}

export class PerfRecordDecoder extends NamedObjectDecoder<PerfRecordDesc, EmptyProtobufBodyContent, PerfRecord> {
    constructor() {
        super(new PerfRecordDescDecoder(), new EmptyProtobufBodyContentDecoder(), PerfRecord);
    }
}

export class PerfRecord extends NamedObject<PerfRecordDesc, EmptyProtobufBodyContent> {
    static create(owner: ObjectId, dec_id: ObjectId, total: JSBI, total_size: Option<JSBI>): PerfRecord {
        return new PerfRecordBuilder(new PerfRecordDesc(total, total_size), new EmptyProtobufBodyContent()).owner(owner).dec_id(dec_id).build(PerfRecord)
    }

    total(): JSBI {
        return this.desc().content().total
    }

    total_size(): Option<JSBI> {
        return this.desc().content().total_size
    }

    add_stat(total: JSBI, total_size: Option<JSBI>): PerfRecord {
        const desc = this.desc().content()
        desc.total = total;
        desc.total_size = total_size;

        return new PerfRecordBuilder(desc, new EmptyProtobufBodyContent())
            .owner(this.desc().owner()!.unwrap())
            .dec_id(this.desc().dec_id().unwrap())
            .build(PerfRecord)

    }
}