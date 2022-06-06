

// 1. 定义一个Desc类型信息
import {
    DescContent,
    DescContentDecoder,
    DescTypeInfo,
    named_id_gen_default, named_id_from_base_58, named_id_try_from_object_id, NamedObject, NamedObjectBuilder, NamedObjectDecoder, NamedObjectDesc,
    NamedObjectId, NamedObjectIdDecoder,
    SubDescType,
    NamedObjectDescDecoder
} from "./object";
import { ObjectTypeCode } from "./object_type_info";
import {
    Area, BuckyError, BuckyErrorCode,
    BuckyResult,
    ChunkId, ChunkIdDecoder,
    HashValue,
    HashValueDecoder,
} from "..";
import { Err, Ok } from "../base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../base/bucky_number";
import { ObjectId } from "./object_id";
import JSBI from 'jsbi';
import { ProtobufBodyContent, ProtobufBodyContentDecoder, ProtobufCodecHelper, protos } from '../codec';
import { to_buf } from '../base/raw_encode';
import { sha256 } from 'js-sha256';

export class FileDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return ObjectTypeCode.File;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "option",   // 是否有主，"disable": 禁用，"option": 可选
            area_type: "disable",    // 是否有区域信息，"disable": 禁用，"option": 可选
            author_type: "option",  // 是否有作者，"disable": 禁用，"option": 可选
            key_type: "disable"  // 公钥类型，"disable": 禁用，"single_key": 单PublicKey，"mn_key": M-N 公钥对
        }
    }
}

// 2. 定义一个类型信息常量
const FILE_DESC_TYPE_INFO = new FileDescTypeInfo();


// 3. 定义DescContent，继承自DescContent
export class FileDescContent extends DescContent {
    constructor(public len: JSBI, public hash: HashValue) {
        super();
    }

    type_info(): DescTypeInfo {
        return FILE_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number> {
        return Ok(new BuckyNumber('u64', this.len).raw_measure().unwrap() + this.hash.raw_measure().unwrap());
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array> {
        const r = new BuckyNumber('u64', this.len).raw_encode(buf);
        if (r.err) {
            console.error("FileDescContent::raw_encode error", r.val);
            return r;
        }
        const r2 = this.hash.raw_encode(r.unwrap());
        if (r2.err) {
            console.error("FileDescContent::raw_encode error", r2.val);
            return r2;
        }
        return Ok(r2.unwrap());
    }
}

// 4. 定义一个DescContent的解码器
export class FileDescContentDecoder extends DescContentDecoder<FileDescContent>{
    type_info(): DescTypeInfo {
        return FILE_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[FileDescContent, Uint8Array]> {
        const lenRet = new BuckyNumberDecoder('u64').raw_decode(buf);
        if (lenRet.err) {
            console.error("FileDescContentDecoder::raw_decode error:", lenRet.val);
            return lenRet;
        }

        let len;
        [len, buf] = lenRet.unwrap();
        const hashRet = new HashValueDecoder().raw_decode(buf);
        if (hashRet.err) {
            console.error("FileDescContentDecoder::raw_decode error:", hashRet.val);
            return hashRet;
        }

        let hash: HashValue;
        [hash, buf] = hashRet.unwrap();
        const fileDescContent = new FileDescContent(len.toBigInt(), hash);

        const ret: [FileDescContent, Uint8Array] = [fileDescContent, buf];
        return Ok(ret);
    }
}

export enum ChunkBundleHashMethod {
    Serial = "Serial",
}

export class ChunkBundle {
    constructor(public chunk_list: ChunkId[], public hash_method: ChunkBundleHashMethod) {

    }

    public len(): JSBI {
        let len = JSBI.BigInt(0);
        for (const chunk_id of this.chunk_list) {
            const chunk_len = JSBI.BigInt(chunk_id.length());
            len = JSBI.add(len, chunk_len);
        }

        return len;
    }

    public calc_hash_value(): HashValue {
        if (this.hash_method == ChunkBundleHashMethod.Serial) {
            return this.calc_serial_hash_value();
        } else {
            throw new Error(`invalid ChunkBundleHashMethod ${this.hash_method}`);
        }
    }

    calc_serial_hash_value(): HashValue {
        const hash = sha256.create();

        for (const chunk_id of this.chunk_list) {
            hash.update(chunk_id.as_slice());
        }

        const val = hash.arrayBuffer();

        return new HashValue(new Uint8Array(val));
    }
}

export class ChunkList {
    constructor(public chunk_in_list?: ChunkId[], public file_id?: FileId, public chunk_in_bundle?: ChunkBundle) {

    }

    public inner_chunk_list(): ChunkId[] | undefined {
        if (this.chunk_in_list != null) {
            return this.chunk_in_list;
        } else if (this.chunk_in_bundle != null) {
            return this.chunk_in_bundle.chunk_list;
        } else {
            return undefined;
        }
    }

    match<T>(visitor: {
        ChunkInList?: (list: ChunkId[]) => T,
        FileId?: (id: FileId) => T,
        ChunkInBundle?: (bundle: ChunkBundle) => T,
    }): T | undefined {
        if (this.chunk_in_list != null) {
            console.assert(this.file_id == null);
            console.assert(this.chunk_in_bundle == null);

            return visitor.ChunkInList?.(this.chunk_in_list!);
        } else if (this.file_id != null) {
            console.assert(this.chunk_in_bundle == null);

            return visitor.FileId?.(this.file_id!);
        } else {
            console.assert(this.chunk_in_bundle);
            return visitor.ChunkInBundle?.(this.chunk_in_bundle!);
        }
    }
}

// 5. 定义一个BodyContent，继承自RawEncode
export class FileBodyContent extends ProtobufBodyContent {

    constructor(public chunk_list: ChunkList) {
        super();
    }

    inner_chunk_list(): ChunkId[] | undefined {
        return this.chunk_list.inner_chunk_list();
    }

    try_to_proto(): BuckyResult<protos.FileBodyContent> {
        const chunk_list = new protos.ChunkList();

        if (this.chunk_list.chunk_in_list) {
            // chunk_list.type = protos.ChunkList.Type.ChunkInList;
            chunk_list.setType(protos.ChunkList.Type.CHUNKINLIST);
            const r = ProtobufCodecHelper.encode_buf_list(this.chunk_list.chunk_in_list!);
            if (r.err) {
                return r;
            }

            chunk_list.setChunkIdListList(r.unwrap());
        } else if (this.chunk_list.chunk_in_bundle) {
            chunk_list.setType(protos.ChunkList.Type.CHUNKINBUNDLE);
            const r = ProtobufCodecHelper.encode_buf_list(this.chunk_list.chunk_in_bundle!.chunk_list);
            if (r.err) {
                return r;
            }

            chunk_list.setChunkIdListList(r.unwrap());

            if (this.chunk_list.chunk_in_bundle!.hash_method === ChunkBundleHashMethod.Serial) {
                chunk_list.setHashMethod(protos.ChunkList.HashMethod.SERIAL);
            }
        } else {
            chunk_list.setType(protos.ChunkList.Type.CHUNKINFILE);
            const r = to_buf(this.chunk_list.file_id!);
            if (r.err) {
                return r;
            }

            chunk_list.setFileId(r.unwrap());
        }

        const target = new protos.FileBodyContent();
        target.setChunkList(chunk_list);

        return Ok(target);
    }
}

// 6. 定义一个BodyContent的解码器
export class FileBodyContentDecoder extends ProtobufBodyContentDecoder<FileBodyContent, protos.FileBodyContent> {
    constructor() {
        super(protos.FileBodyContent.deserializeBinary);
    }

    try_from_proto(value: protos.FileBodyContent): BuckyResult<FileBodyContent> {
        let file_id: FileId | undefined;
        let chunk_id_list: ChunkId[] | undefined;
        let chunk_in_bundle: ChunkBundle | undefined;

        const chunk_list = value.getChunkList()!;
        switch (chunk_list.getType()) {
            case protos.ChunkList.Type.CHUNKINFILE: {
                const r = ProtobufCodecHelper.decode_buf(chunk_list.getFileId_asU8(), new FileIdDecoder());
                if (r.err) {
                    return r;
                }

                file_id = r.unwrap();
                break;
            }
            case protos.ChunkList.Type.CHUNKINLIST: {
                const r = ProtobufCodecHelper.decode_buf_list(chunk_list.getChunkIdListList_asU8(), new ChunkIdDecoder());
                if (r.err) {
                    return r;
                }

                chunk_id_list = r.unwrap();
                break;
            }
            case protos.ChunkList.Type.CHUNKINBUNDLE: {
                const r = ProtobufCodecHelper.decode_buf_list(chunk_list.getChunkIdListList_asU8(), new ChunkIdDecoder());
                if (r.err) {
                    return r;
                }

                let hash_method = ChunkBundleHashMethod.Serial;
                if (chunk_list.getHashMethod() === protos.ChunkList.HashMethod.SERIAL) {
                    hash_method = ChunkBundleHashMethod.Serial;
                }
                chunk_in_bundle = new ChunkBundle(r.unwrap(), hash_method);
                break;
            }
            default: {
                return Err(new BuckyError(BuckyErrorCode.InvalidFormat, "invalid FileBodyContent protos"));
            }
        }

        const result = new FileBodyContent(new ChunkList(chunk_id_list, file_id, chunk_in_bundle));
        return Ok(result);
    }
}

// 7. 定义组合类型
export class FileDesc extends NamedObjectDesc<FileDescContent>{
    //
}

export class FileDescDecoder extends NamedObjectDescDecoder<FileDescContent>{
    constructor() {
        super(new FileDescContentDecoder());
    }
}

export class FileBuilder extends NamedObjectBuilder<FileDescContent, FileBodyContent>{
    //
}

// 通过继承的方式具体化
export class FileId extends NamedObjectId<FileDescContent, FileBodyContent>{
    constructor(id: ObjectId) {
        super(FILE_DESC_TYPE_INFO.obj_type(), id);
    }

    static default(): FileId {
        return named_id_gen_default(FILE_DESC_TYPE_INFO.obj_type());
    }

    static from_base_58(s: string): BuckyResult<FileId> {
        return named_id_from_base_58(FILE_DESC_TYPE_INFO.obj_type(), s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<FileId> {
        return named_id_try_from_object_id(FILE_DESC_TYPE_INFO.obj_type(), id);
    }
}

export class FileIdDecoder extends NamedObjectIdDecoder<FileDescContent, FileBodyContent>{
    constructor() {
        super(ObjectTypeCode.File);
    }
}

// 8. 定义File对象
// 继承自NamedObject<FileDescContent, FileBodyContent>
// 提供创建方法和其他自定义方法
export class File extends NamedObject<FileDescContent, FileBodyContent>{
    static create(owner: ObjectId, len: JSBI, hash: HashValue, chunk_list: ChunkList, build?: (builder: FileBuilder) => void): File {
        const desc_content = new FileDescContent(len, hash);
        const body_content = new FileBodyContent(chunk_list);
        const builder = new NamedObjectBuilder<FileDescContent, FileBodyContent>(desc_content, body_content).owner(owner);
        if (build) {
            build(builder);
        }

        return builder.build(File);
    }

    file_id(): FileId {
        return FileId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }
}

// 9. 定义File解码器
export class FileDecoder extends NamedObjectDecoder<FileDescContent, FileBodyContent, File>{
    constructor() {
        super(new FileDescContentDecoder(), new FileBodyContentDecoder(), File);
    }
}