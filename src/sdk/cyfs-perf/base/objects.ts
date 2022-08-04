import JSBI from "jsbi";
import { BuckyErrorCode, BuckyResult, bucky_time_now, DescTypeInfo, EmptyProtobufBodyContent, EmptyProtobufBodyContentDecoder, HashValue, NamedObject, NamedObjectBuilder, 
    NamedObjectDecoder, 
    NamedObjectId, named_id_from_base_58, named_id_gen_default, named_id_try_from_object_id, None, 
    ObjectId, Ok, Option, ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufCodecHelper, ProtobufDescContent, ProtobufDescContentDecoder, Some, SubDescType, to_buf } from "../../cyfs-base";
import { PerfObjectType } from "./type";
import {perf_protos as protos} from "../codec/index"
import { Message } from "google-protobuf";

function jsbi_min(t1: JSBI, t2: JSBI, ignore?: JSBI): JSBI {
    if (ignore && JSBI.equal(t1, ignore)) {
        return t2
    }
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

    merge_record(value: JSBI, total_num: number): void {
        this.total = JSBI.ADD(this.total, value);
        this.min = jsbi_min(this.min, value, JSBI.BigInt(0))
        this.max = jsbi_max(this.max, value)
        this.avg = JSBI.divide(this.total, JSBI.BigInt(total_num))
    }

    merge(value: SizeResult): void {
        this.min = jsbi_min(this.min, value.min, JSBI.BigInt(0))
        this.max = jsbi_max(this.max, value.max)
        let total = JSBI.BigInt(0);
        if (this.avg > JSBI.BigInt(0)) {
            total = JSBI.divide(this.total, this.avg);
        }
        let other_total = JSBI.BigInt(0);
        if (value.avg > JSBI.BigInt(0)) {
            other_total = JSBI.divide(value.total, value.avg);
        }
        const total_num = JSBI.ADD(total, other_total)
        this.total = JSBI.ADD(this.total, value.total)
        if (total_num > 0) {
            this.avg = JSBI.divide(this.total, total_num)
        } else {
            this.avg = JSBI.BigInt(0);
        }
    }

    merge_records(values: JSBI[], total_num: number): void {
        let min = JSBI.BigInt(0), max = JSBI.BigInt(0);
        for (const value of values) {
            this.total = JSBI.ADD(this.total, value)
            min = jsbi_min(min, value);
            max = jsbi_max(max, value);
        }

        this.min = jsbi_min(this.min, min, JSBI.BigInt(0))
        this.max = jsbi_max(this.max, max)
        
        this.avg = total_num > 0 ? JSBI.divide(this.total, JSBI.BigInt(total_num)) : JSBI.BigInt(0);
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

    merge_record(value: number, total_num: number): void {
        this.total += value;
        this.min = (this.min === 0)?value:Math.min(this.min, value)
        this.max = Math.max(this.max, value)
        this.avg = Math.floor(this.total/total_num)
    }

    merge(value: TimeResult): void {
        this.min = (this.min === 0)?value.min:Math.min(this.min, value.min)
        this.max = Math.max(this.max, value.max)
        let total = 0;
        if (this.avg > 0) {
            total = this.total / this.avg;
        }
        let other_total = 0;
        if (value.avg > 0) {
            other_total = value.total / value.avg;
        }
        const total_num = Math.floor(total + other_total)
        this.total += value.total
        if (total_num > 0) {
            this.avg = Math.floor(this.total/total_num)
        } else {
            this.avg = 0;
        }

    }

    merge_records(values: number[], total_num: number): void {
        let min = 0, max = 0;
        for (const value of values) {
            this.total += value;
            min = Math.min(min, value);
            max = Math.max(max, value);
        }

        this.min = (this.min === 0)?min:Math.min(this.min, min)
        this.max = Math.max(this.max, max)
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

    merge_record(value: number): void {
        this.min = (this.min === 0)?value:Math.min(this.min, value)
        this.max = Math.max(this.max, value);
    }

    merge_records(values: number[]): void {
        for (const value of values) {
            this.min = (this.min === 0)?value:Math.min(this.min, value)
            this.max = Math.max(this.max, value);
        }
    }

    merge(value: SpeedResult): void {
        this.min = (this.min === 0)?value.min:Math.min(this.min, value.min)
        this.max = Math.max(this.max, value.max);
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

export interface PerfRequestItem {
    time: JSBI,
    spend_time: number,
    err: BuckyErrorCode,
    stat: Option<JSBI>
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

    add_stat(stat: PerfRequestItem): PerfRequest {
        const desc = this.desc().content()

        if (stat.err !== BuckyErrorCode.Ok) {
            desc.failed += 1;
        } else {
            desc.success += 1;
            desc.time.merge_record(stat.spend_time, desc.success);
            if (stat.stat.is_some()) {
                const stat_num = stat.stat.unwrap()
                desc.size.merge_record(stat_num, desc.success);

                const speed = JSBI.divide(stat_num, JSBI.BigInt(stat.spend_time / 1000))
                desc.speed.merge_record(JSBI.toNumber(speed));
                desc.speed.avg = desc.time.total / 1000 > 0 ? JSBI.toNumber(JSBI.divide(desc.size.total, JSBI.BigInt(desc.time.total / 1000))) : 0;
            }
        }

        return new PerfRequestBuilder(desc, new EmptyProtobufBodyContent()).owner(this.desc().owner()!.unwrap()).dec_id(this.desc().dec_id().unwrap()).build(PerfRequest)
    }

    add_stats(stats: PerfRequestItem[]): PerfRequest {
        const desc = this.desc().content()

        const spend_times = [];
        const stat_nums = [];
        const speeds = [];
        for (const stat of stats) {
            if (stat.err !== BuckyErrorCode.Ok) {
                desc.failed += 1;
            } else {
                desc.success += 1;
                spend_times.push(stat.spend_time);
                desc.time.merge_record(stat.spend_time, desc.success);
                if (stat.stat.is_some()) {
                    stat_nums.push(stat.stat.unwrap())
    
                    const speed = stat.spend_time / 1000 > 0 ? JSBI.divide(stat.stat.unwrap(), JSBI.BigInt(stat.spend_time / 1000)) : JSBI.BigInt(0);
                    speeds.push(JSBI.toNumber(speed));
                }
            }
        }

        desc.time.merge_records(spend_times, desc.success)
        desc.size.merge_records(stat_nums, desc.success);
        desc.speed.avg = desc.time.total / 1000 > 0 ? JSBI.toNumber(JSBI.divide(desc.size.total, JSBI.BigInt(desc.time.total / 1000))) : 0;
        desc.speed.merge_records(speeds);

        return new PerfRequestBuilder(desc, new EmptyProtobufBodyContent()).owner(this.desc().owner()!.unwrap()).dec_id(this.desc().dec_id().unwrap()).build(PerfRequest)
    }

    merge(value: PerfRequest) {
        const desc = this.desc().content()
        const value_desc = value.desc().content()

        desc.failed += value_desc.failed
        desc.success += value_desc.success

        desc.time.merge(value_desc.time)

        desc.size.merge(value_desc.size)

        desc.speed.merge(value_desc.speed)

        const total = JSBI.BigInt(Math.floor(desc.time.total / 1000));
        if (JSBI.equal(total, JSBI.BigInt(0))) {
            desc.speed.avg = 0;
        } else {
            desc.speed.avg = JSBI.toNumber(JSBI.divide(desc.size.total, total))
        }
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

export interface PerfAccumulationItem {
    time: JSBI,
    err: BuckyErrorCode,
    stat: JSBI
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

    add_stat(stat: PerfAccumulationItem): PerfAccumulation {
        const desc = this.desc().content()

        if (stat.err !== BuckyErrorCode.Ok) {
            desc.failed += 1;
        } else {
            desc.success += 1;
            desc.size.merge_record(stat.stat, desc.success);
        }

        return new PerfAccumulationBuilder(desc, new EmptyProtobufBodyContent()).owner(this.desc().owner()!.unwrap()).dec_id(this.desc().dec_id().unwrap()).build(PerfAccumulation)
    }

    add_stats(stats: PerfAccumulationItem[]): PerfAccumulation {
        const desc = this.desc().content()

        const stat_nums = [];
        for (const stat of stats) {
            if (stat.err !== BuckyErrorCode.Ok) {
                desc.failed += 1;
            } else {
                desc.success += 1;
                stat_nums.push(stat.stat)
            }
        }

        desc.size.merge_records(stat_nums, desc.success);

        return new PerfAccumulationBuilder(desc, new EmptyProtobufBodyContent())
            .owner(this.desc().owner()!.unwrap())
            .dec_id(this.desc().dec_id().unwrap())
            .build(PerfAccumulation)
    }

    merge(value: PerfAccumulation) {
        const desc = this.desc().content()
        const value_desc = value.desc().content()

        desc.failed += value_desc.failed
        desc.success += value_desc.success

        desc.size.merge(value_desc.size)
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

export class PerfActionItem {
    time: JSBI

    constructor(public err: BuckyErrorCode, public key: string, public value: string){
        this.time = bucky_time_now()
    }

    try_to_proto(): BuckyResult<protos.PerfActionItem> {
        const target = new protos.PerfActionItem()
        target.setErr(this.err)
        target.setKey(this.key)
        target.setValue(this.value)
        target.setTime(this.time.toString())

        return Ok(target);
    }

    static try_from_proto(value: protos.PerfActionItem): BuckyResult<PerfActionItem> {
        const ret = new PerfActionItem(value.getErr(), value.getKey(), value.getValue())
        ret.time = JSBI.BigInt(value.getTime())
        return Ok(ret);
    }
}

const PERF_ACTION_DESC_TYPE_INFO = new PerfActionTypeInfo();

export class PerfActionDesc extends ProtobufDescContent {
    constructor(public body_hash: HashValue) {
        super();
    }

    static new(body: PerfActionBody): PerfActionDesc {
        return new PerfActionDesc(HashValue.hash_data(to_buf(body).unwrap()))
    }

    type_info(): DescTypeInfo {
        return PERF_ACTION_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.PerfAction> {
        const target = new protos.PerfAction()
        target.setBodyHash(this.body_hash.as_slice())

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
        const ret = new PerfActionDesc(HashValue.copy_from_slice(value.getBodyHash_asU8()))
        return Ok(ret);
    }
}

export class PerfActionBody extends ProtobufBodyContent {
    constructor(public actions: PerfActionItem[]) {
        super();
    }

    try_to_proto(): BuckyResult<protos.PerfActionBody> {
        const target = new protos.PerfActionBody()
        for (const action of this.actions) {
            const r = action.try_to_proto();
            if (r.err) {
                return r;
            }
            target.addActions(r.unwrap())
        }

        return Ok(target);
    }
}

export class PerfActionBodyDecoder extends ProtobufBodyContentDecoder<PerfActionBody, protos.PerfActionBody> {
    constructor() {
        super(protos.PerfActionBody.deserializeBinary);
    }

    type_info(): DescTypeInfo {
        return PERF_ACTION_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.PerfActionBody): BuckyResult<PerfActionBody> {
        const actions = [];
        for (const action of value.getActionsList()) {
            const r = PerfActionItem.try_from_proto(action)
            if (r.err) {
                return r;
            }

            actions.push(r.unwrap())
        }
        const ret = new PerfActionBody(actions)
        return Ok(ret);
    }
}

export class PerfActionBuilder extends NamedObjectBuilder<PerfActionDesc, PerfActionBody> {
    // ignore
}

export class PerfActionId extends NamedObjectId<PerfActionDesc, PerfActionBody> {
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

export class PerfActionDecoder extends NamedObjectDecoder<PerfActionDesc, PerfActionBody, PerfAction> {
    constructor() {
        super(new PerfActionDescDecoder(), new PerfActionBodyDecoder(), PerfAction);
    }
}

export class PerfAction extends NamedObject<PerfActionDesc, PerfActionBody> {
    static create(owner: ObjectId, dec_id: ObjectId): PerfAction {
        const body = new PerfActionBody([]);
        return new PerfActionBuilder(PerfActionDesc.new(body), body).owner(owner).dec_id(dec_id).build(PerfAction)
    }

    add_stat(action: PerfActionItem): PerfAction {
        const body = this.body_expect().content()
        
        body.actions.push(action)

        return new PerfActionBuilder(PerfActionDesc.new(body), body)
            .owner(this.desc().owner()!.unwrap())
            .dec_id(this.desc().dec_id().unwrap())
            .build(PerfAction) 
    }

    add_stats(actions: PerfActionItem[]): PerfAction {
        const body = this.body_expect().content()
        body.actions = body.actions.concat(actions);
        
        return new PerfActionBuilder(PerfActionDesc.new(body), body)
            .owner(this.desc().owner()!.unwrap())
            .dec_id(this.desc().dec_id().unwrap())
            .build(PerfAction) 
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

export interface PerfRecordItem {
    time: JSBI,
    total: JSBI,
    total_size: Option<JSBI>
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

    add_stat(stat: PerfRecordItem): PerfRecord {
        const desc = this.desc().content()
        desc.total = stat.total;
        desc.total_size = stat.total_size;

        return new PerfRecordBuilder(desc, new EmptyProtobufBodyContent())
            .owner(this.desc().owner()!.unwrap())
            .dec_id(this.desc().dec_id().unwrap())
            .build(PerfRecord)
    }
}