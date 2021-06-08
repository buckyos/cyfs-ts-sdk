

// 1. 定义一个Desc类型信息
import {
    DescContent,
    DescContentDecoder,
    DescTypeInfo,
    named_id_gen_default, named_id_from_base_58, named_id_try_from_object_id,  NamedObject, NamedObjectBuilder, NamedObjectDecoder, NamedObjectDesc,
    NamedObjectId, NamedObjectIdDecoder,
    BodyContent,
    BodyContentDecoder,
    SubDescType,
    NamedObjectDescDecoder
} from "./object";
import {ObjectTypeCode} from "./object_type_info";
import {
    DeviceBodyContent, DeviceBodyContentDecoder, DeviceBuilder, DeviceCategory,
    DeviceDescContent, DeviceDescContentDecoder,
    DeviceDescTypeInfo,
    DeviceId,
    DeviceIdDecoder, number_2_devicecategory
} from "./device";
import {UniqueId, UniqueIdDecoder} from "./unique_id";
import {
    Area, BuckyError, BuckyErrorCode,
    BuckyResult,
    ChunkId, ChunkIdDecoder,
    HashValue,
    HashValueDecoder,
    None,
    Option, OptionDecoder,
    OptionEncoder, PublicKey,
    RawDecode,
    RawEncode,
    Some
} from "..";
import {Err, Ok} from "../base/results";
import {BuckyNumber, BuckyNumberDecoder} from "../base/bucky_number";
import {Vec, VecDecoder} from "../base/vec";
import {Endpoint, EndPointDecoder} from "../base/endpoint";
import {BuckyString, BuckyStringDecoder} from "../base/bucky_string";
import {ObjectId} from "./object_id";
import { base_error } from "../base/log";

export class FileDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return ObjectTypeCode.File;
    }

    sub_desc_type(): SubDescType{
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
    constructor(public len: bigint, public hash: HashValue){
        super();
    }

    type_info(): DescTypeInfo{
        return FILE_DESC_TYPE_INFO;
    }

    raw_measure(): BuckyResult<number>{
        return Ok(new BuckyNumber('u64', this.len).raw_measure().unwrap() + this.hash.raw_measure().unwrap());
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        const r = new BuckyNumber('u64', this.len).raw_encode(buf);
        if(r.err){
            base_error("FileDescContent::raw_encode error", r.err);
            return r;
        }
        const r2 = this.hash.raw_encode(r.unwrap());
        if(r2.err){
            base_error("FileDescContent::raw_encode error", r2.err);
            return r2;
        }
        return Ok(r2.unwrap());
    }
}

// 4. 定义一个DescContent的解码器
export class FileDescContentDecoder extends DescContentDecoder<FileDescContent>{
    type_info(): DescTypeInfo{
        return FILE_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array): BuckyResult<[FileDescContent, Uint8Array]>{
        const lenRet = new BuckyNumberDecoder('u64').raw_decode(buf);
        if(lenRet.err){
            base_error("FileDescContentDecoder::raw_decode error:", lenRet.err);
            return lenRet;
        }

        let len;
        [len, buf] = lenRet.unwrap();
        const hashRet = new HashValueDecoder().raw_decode(buf);
        if(hashRet.err){
            base_error("FileDescContentDecoder::raw_decode error:", hashRet.err);
            return hashRet;
        }

        let hash: HashValue;
        [hash, buf] = hashRet.unwrap();
        const fileDescContent = new FileDescContent(len.toBigInt(), hash);

        const ret:[FileDescContent, Uint8Array] = [fileDescContent, buf];
        return Ok(ret);
    }
}

export class ChunkList implements RawEncode {
    constructor(private isList: boolean, private chunkInList?: Vec<ChunkId>, private fileId?: FileId) {

    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('u8', this.isList ? 0 : 1).raw_encode(buf).unwrap();
        if (this.isList) {
            buf = this.chunkInList!.raw_encode(buf).unwrap();
        } else {
            buf = this.fileId!.raw_encode(buf).unwrap();
        }
        return Ok(buf);
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        if (this.isList) {
            return Ok(1 + this.chunkInList!.raw_measure().unwrap());
        } else {
            return Ok(1 + this.fileId!.raw_measure().unwrap());
        }
    }
}

export class ChunkListDecoder implements RawDecode<ChunkList> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[ChunkList, Uint8Array]> {
        let isList;
        [isList, buf] = new BuckyNumberDecoder('u8').raw_decode(buf).unwrap()
        if (isList.toNumber() === 0) {
            let checkIdList: Vec<ChunkId>;
            [checkIdList, buf] = new VecDecoder<ChunkId>(new ChunkIdDecoder()).raw_decode(buf).unwrap();
            const chunkList: ChunkList = new ChunkList(true, checkIdList);
            const ret: [ChunkList, Uint8Array] = [chunkList, buf];
            return Ok(ret);
        } else {
            let fileId: FileId;
            [fileId, buf] = new FileIdDecoder().raw_decode(buf).unwrap();
            const chunkList: ChunkList = new ChunkList(false, undefined, fileId);
            const ret: [ChunkList, Uint8Array] = [chunkList, buf];
            return Ok(ret);
        }
    }

}

// 5. 定义一个BodyContent，继承自RawEncode
export class FileBodyContent extends BodyContent{

    constructor(public chunk_list: ChunkList){
        super();
    }


    raw_measure(): BuckyResult<number>{
        let size = 0;
        size += this.chunk_list.raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        buf = this.chunk_list.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

// 6. 定义一个BodyContent的解码器
export class FileBodyContentDecoder extends BodyContentDecoder<FileBodyContent>{
    raw_decode(buf: Uint8Array): BuckyResult<[FileBodyContent, Uint8Array]>{
        let check_list: ChunkList;
        [check_list, buf] = new ChunkListDecoder().raw_decode(buf).unwrap();

        const body_content = new FileBodyContent(check_list);
        const ret:[FileBodyContent, Uint8Array] = [body_content, buf];

        return Ok(ret);
    }
}

// 7. 定义组合类型
export class FileDesc extends NamedObjectDesc<FileDescContent>{
    //
}

export class FileDescDecoder extends NamedObjectDescDecoder<FileDescContent>{
    constructor(){
        super(new FileDescContentDecoder());
    }
}

export class FileBuilder extends NamedObjectBuilder<FileDescContent, FileBodyContent>{
    //
}

// 通过继承的方式具体化
export class FileId extends NamedObjectId<FileDescContent, FileBodyContent>{
    constructor(id: ObjectId){
        super(FILE_DESC_TYPE_INFO.obj_type(), id);
    }

    static default(): FileId{
        return named_id_gen_default(FILE_DESC_TYPE_INFO.obj_type());
    }

    static from_base_58(s: string): BuckyResult<FileId> {
        return named_id_from_base_58(FILE_DESC_TYPE_INFO.obj_type(), s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<FileId>{
        return named_id_try_from_object_id(FILE_DESC_TYPE_INFO.obj_type(), id);
    }
}

export class FileIdDecoder extends NamedObjectIdDecoder<FileDescContent, FileBodyContent>{
    constructor(){
        super(ObjectTypeCode.File);
    }
}

// 8. 定义File对象
// 继承自NamedObject<FileDescContent, FileBodyContent>
// 提供创建方法和其他自定义方法
export class File extends NamedObject<FileDescContent, FileBodyContent>{
    static create(owner: ObjectId, len: number, hash: HashValue, chunk_list: ChunkList, build?:(builder: FileBuilder)=>void):File{
        const desc_content = new FileDescContent(BigInt(len), hash);
        const body_content = new FileBodyContent(chunk_list);
        const builder = new NamedObjectBuilder<FileDescContent, FileBodyContent>(desc_content, body_content).owner(owner);
        if(build){
            build(builder);
        }
        const self = builder.build();
        return new File(self.desc(), self.body(), self.signs(), self.nonce());
    }

    file_id():FileId{
        return FileId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }
}

// 9. 定义File解码器
export class FileDecoder extends NamedObjectDecoder<FileDescContent, FileBodyContent, File>{
    constructor(){
        super(new FileDescContentDecoder(), new FileBodyContentDecoder(), File);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[File, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new File(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [File, Uint8Array];
        });
    }
}