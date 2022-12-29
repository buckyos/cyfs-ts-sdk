import {
    BuckyError,
    BuckyErrorCode,
    BuckyResult,
    DescTypeInfo,
    DeviceId, DeviceIdDecoder, Err, NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    NamedObjectDesc,
    NamedObjectDescDecoder,
    ObjectId,
    ObjectIdDecoder,
    Ok,
    ProtobufBodyContent,
    ProtobufBodyContentDecoder,
    ProtobufCodecHelper,
    ProtobufDescContent,
    ProtobufDescContentDecoder,
    SubDescType,
    Vec
} from "../../cyfs-base";
import {CoreObjectType} from "../core_obj_type";
import {protos} from "../codec";
import { ChunkCodecDesc } from "./bdt_defs";

export class TransContextTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.TransContext;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "disable",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable"
        }
    }

}

export class TransContextDescContent extends ProtobufDescContent {
    constructor(public context_path: string) {
        super();
        this.context_path = context_path;
    }

    try_to_proto(): BuckyResult<any> {
        const target = new protos.TransContextDescContent()
        target.setContextPath(this.context_path)

        return Ok(target);
    }

    type_info(): DescTypeInfo {
        return new TransContextTypeInfo();
    }

}

export class TransContextDescContentDecoder extends ProtobufDescContentDecoder<TransContextDescContent, protos.TransContextDescContent> {
    constructor() {
        super(protos.TransContextDescContent.deserializeBinary);
    }
    try_from_proto(value: protos.TransContextDescContent): BuckyResult<TransContextDescContent> {
        const context_name = value.getContextPath();
        return Ok(new TransContextDescContent(context_name));
    }

    type_info(): DescTypeInfo {
        return new TransContextTypeInfo();
    }
}

export class TransContextDevice {
    constructor(public target: DeviceId, public chunk_codec_desc: ChunkCodecDesc) {}
    
    static from_proto(proto: protos.TransContextDevice): BuckyResult<TransContextDevice> {
        const target = new DeviceIdDecoder().raw_decode(proto.getTarget_asU8());
        if (target.err) {
            return target;
        }

        const info = proto.getChunkCodecInfo();

        let chunk_codec_desc: ChunkCodecDesc;
        switch (proto.getChunkCodecDesc()) {
            case protos.TransContextDevice.ChunkCodecDesc.UNKNOWN:
                chunk_codec_desc = ChunkCodecDesc.Unknown()
                break;
            case protos.TransContextDevice.ChunkCodecDesc.STREAM:
                if (!info) {
                    return Err(new BuckyError(BuckyErrorCode.InvalidData, `chunk_codec_info field missing! type=${proto.getChunkCodecDesc()}`));
                }
                chunk_codec_desc = ChunkCodecDesc.Stream(info.hasStart()?info.getStart():undefined, info.hasEnd()?info.getEnd():undefined, info.hasStep()?info.getStep():undefined)
                break;
            case protos.TransContextDevice.ChunkCodecDesc.RAPTOR:
                if (!info) {
                    return Err(new BuckyError(BuckyErrorCode.InvalidData, `chunk_codec_info field missing! type=${proto.getChunkCodecDesc()}`));
                }
                chunk_codec_desc = ChunkCodecDesc.Raptor(info.hasStart()?info.getStart():undefined, info.hasEnd()?info.getEnd():undefined, info.hasStep()?info.getStep():undefined)
                break;
        }

        return Ok(new TransContextDevice(target.unwrap()[0], chunk_codec_desc))
    }

    to_proto(): BuckyResult<protos.TransContextDevice> {
        const obj = new protos.TransContextDevice();
        obj.setTarget(this.target.object_id.as_slice());
        
        this.chunk_codec_desc.match({
            unknown: () => {
                obj.setChunkCodecDesc(protos.TransContextDevice.ChunkCodecDesc.UNKNOWN)
            },
            stream: (start, end, step) => {
                obj.setChunkCodecDesc(protos.TransContextDevice.ChunkCodecDesc.STREAM)
                const info = new protos.TransContextDeviceChunkCodecInfo()
                if (start !== undefined) {
                    info.setStart(start)
                }
                if (end !== undefined) {
                    info.setEnd(end)
                }
                if (step !== undefined) {
                    info.setStep(step)
                }
                obj.setChunkCodecInfo(info)
                
            },
            raptor: (start, end, step) => {
                obj.setChunkCodecDesc(protos.TransContextDevice.ChunkCodecDesc.RAPTOR)
                const info = new protos.TransContextDeviceChunkCodecInfo()
                if (start !== undefined) {
                    info.setStart(start)
                }
                if (end !== undefined) {
                    info.setEnd(end)
                }
                if (step !== undefined) {
                    info.setStep(step)
                }
                obj.setChunkCodecInfo(info)
            }
        })
        return Ok(obj)
    }
}

export class TransContextBodyContent extends ProtobufBodyContent {
    constructor(public device_list: TransContextDevice[]) {
        super();
        this.device_list = device_list;
    }

    try_to_proto(): BuckyResult<protos.TransContextBodyContent> {
        const target = new protos.TransContextBodyContent()
        for (const device of this.device_list) {
            const proto = device.to_proto();
            if (proto.err) {
                return proto;
            }
            target.addDeviceList(proto.unwrap())
        }
        return Ok(target);
    }

}

export class TransContextBodyContentDecoder extends ProtobufBodyContentDecoder<TransContextBodyContent, protos.TransContextBodyContent> {
    constructor() {
        super(protos.TransContextBodyContent.deserializeBinary);
    }

    try_from_proto(value: protos.TransContextBodyContent): BuckyResult<TransContextBodyContent> {
        const device_list: TransContextDevice[] = [];
        for (const pdevice of value.getDeviceListList()) {
            const device = TransContextDevice.from_proto(pdevice);
            if (device.err) {
                return device;
            }

            device_list.push(device.unwrap())
        }

        return Ok(new TransContextBodyContent(device_list));
    }

}

export class TransContextDesc extends NamedObjectDesc<TransContextDescContent>{
    // ignore
}

export class TransContextDescDecoder extends NamedObjectDescDecoder<TransContextDescContent>{
    // ignore
}

export class TransContextBuilder extends NamedObjectBuilder<TransContextDescContent, TransContextBodyContent>{
    // ignore
}

export class TransContext extends NamedObject<TransContextDescContent, TransContextBodyContent> {
    static new(dec_id: ObjectId|undefined, context_path: string): TransContext {
        const path = TransContextPath.fix_path(context_path);

        return new TransContextBuilder(new TransContextDescContent(path), new TransContextBodyContent([])).no_create_time().option_dec_id(dec_id).build(TransContext);
    }
    static gen_context_id(dec_id: ObjectId|undefined, context_path: string): ObjectId {
        return TransContext.new(dec_id, context_path).calculate_id()
    }

    context_path(): string {
        return this.desc().content().context_path
    }
    device_list(): TransContextDevice[] {
        return this.body_expect().content().device_list
    }
}

export class TransContextDecoder extends NamedObjectDecoder<TransContextDescContent, TransContextBodyContent, TransContext> {
    constructor() {
        super(new TransContextDescContentDecoder(), new TransContextBodyContentDecoder(), TransContext);
    }
}

export class TransContextPath {
    static verify(path: string): boolean {
        if (path === "/") {
            return true;
        }

        return path.startsWith('/') && !path.endsWith('/')
    }

    static fix_path(path: string): string {
        if (path === "/") {
            return path;
        }

        path = path.replace(/^\$+/g, '').replace(/\/+$/g, '')
        if (path.startsWith('/')) {
            return path
        } else {
            return `/${path}`
        }
    }
}
