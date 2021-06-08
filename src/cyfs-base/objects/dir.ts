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
    BuckyError, BuckyErrorCode,
    BuckyResult,
    ChunkId, ChunkIdDecoder,
    CHUNK_ID_LEN,
    Option, OptionDecoder,
    OptionEncoder,
    RawDecode,
    RawEncode,
    RawEncodePurpose,
} from "..";
import { Err, Ok } from "../base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../base/bucky_string";
import { ObjectId,ObjectIdDecoder } from "./object_id";
import { BuckyBuffer, BuckyBufferDecoder, } from "../base/bucky_buffer";
import { BuckyHashMap, BuckyHashMapDecoder } from "../base/bucky_hash_map";
import { base_error } from "../base/log";

export class DirDescTypeInfo extends DescTypeInfo{
    obj_type() : number{
        return ObjectTypeCode.Dir;
    }

    sub_desc_type(): SubDescType{
        return {
            owner_type: "option",   // 是否有主，"disable": 禁用，"option": 可选
            area_type: "disable",   // 是否有区域信息，"disable": 禁用，"option": 可选
            author_type: "option",  // 是否有作者，"disable": 禁用，"option": 可选
            key_type: "disable"     // 公钥类型，"disable": 禁用，"single_key": 单PublicKey，"mn_key": M-N 公钥对
        }
    }
}

// 2. 定义一个类型信息常量
const DIR_DESC_TYPE_INFO = new DirDescTypeInfo();

export class Attributes implements RawEncode {
    constructor(public flags: number){
        // ignore
    }
    raw_measure(): BuckyResult<number>{
        return Ok(new BuckyNumber('u32', this.flags).raw_measure().unwrap());
    }
    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        const r = new BuckyNumber('u32', this.flags).raw_encode(buf);
        if(r.err){
            base_error("Attributes encode failed, err:", r.err);
            return r;
        }
        buf = r.unwrap();
        return Ok(buf);
    }
}

export class AttributesDeocder implements RawDecode<Attributes>{
    constructor(){
        // ignore
    }
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[Attributes, Uint8Array]>{
        const r = new BuckyNumberDecoder("u32").raw_decode(buf);
        if(r.err){
            return r;
        }
        let flags;
        [flags, buf] = r.unwrap();
        const ret:[Attributes, Uint8Array] = [new Attributes(flags.toNumber()), buf];
        return Ok(ret);
    }
}

export class InnerNode implements RawEncode {
    private flags: number;
    constructor(private id:{
        object_id?: ObjectId,
        chunk_id?: ChunkId,
        index?:{offset:number, size:number}
    }){
        let valid_count = 0;
        this.flags = 0;
        if(id.object_id){
            this.flags = 0;
            valid_count++;
        }
        if(id.chunk_id){
            this.flags = 1;
            valid_count++;
        }
        if(id.index){
            this.flags = 2;
            valid_count++;
        }
        // assert(valid_count===1);
    }

    is_object_id():boolean{
        return this.id.object_id!=null;
    }

    is_chunk_id():boolean{
        return this.id.chunk_id!=null;
    }

    is_index_in_parent_chunk():boolean{
        return this.id.chunk_id!=null;
    }

    match<T>(visitor:{
        ObjId:(object_id: ObjectId)=>T,
        Chunk:(chunk_id: ChunkId)=>T,
        IndexInParentChunk:(offset: number, size: number)=>T,
    }):T{
        if(this.is_object_id()){
            return visitor.ObjId(this.object_id()!);
        }else if(this.is_chunk_id()){
            return visitor.Chunk(this.chunk_id()!);
        }else {
            const index = this.index_in_parent_chunk()!;
            return visitor.IndexInParentChunk(index.offset, index.size);
        }
    }

    object_id():ObjectId|undefined{
        return this.id.object_id;
    }

    chunk_id():ChunkId|undefined{
        return this.id.chunk_id;
    }

    index_in_parent_chunk(): {offset:number, size:number}|undefined{
        return this.id.index;
    }

    raw_measure(): BuckyResult<number>{
        let bytes = 0;

        // enum flags
        bytes += 1;

        // enum type
        bytes += this.match({
            ObjId:(object_id:ObjectId)=>object_id.raw_measure().unwrap(),
            Chunk:(chunk_id:ChunkId)=>chunk_id.raw_measure().unwrap(),
            IndexInParentChunk:(offset: number, size: number)=>new BuckyNumber("u32",offset).raw_measure().unwrap()+new BuckyNumber("u32", size).raw_measure().unwrap(),
        });

        return Ok(bytes);
    }

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        {
            const r = new BuckyNumber('u8', this.flags).raw_encode(buf);
            if(r.err){
                base_error("Attributes encode failed, err:", r.err);
                return r;
            }
            buf = r.unwrap();
        }

        {
            buf = this.match({
                ObjId:(object_id:ObjectId)=>object_id.raw_encode(buf).unwrap(),
                Chunk:(chunk_id:ChunkId)=>chunk_id.raw_encode(buf).unwrap(),
                IndexInParentChunk:(offset: number, size: number)=>{
                    const nextBuf = new BuckyNumber("u32",offset).raw_encode(buf).unwrap();
                    const lastBuf = new BuckyNumber("u32", size).raw_encode(nextBuf).unwrap();
                    return lastBuf;
                },
            })
        }

        return Ok(buf);
    }
}

export class InnerNodeDecoder implements RawDecode<InnerNode>{
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[InnerNode, Uint8Array]>{
        let flags;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [flags, buf] = r.unwrap();
        }
        switch(flags.toNumber()){
            case 0:{
                let object_id:ObjectId;
                const r = new ObjectIdDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                [object_id, buf] = r.unwrap();
                const ret:[InnerNode, Uint8Array] = [new InnerNode({object_id}), buf];
                return Ok(ret);
            }
            case 1:{
                let chunk_id:ChunkId;
                const r = new ChunkIdDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                [chunk_id, buf] = r.unwrap();
                const ret:[InnerNode, Uint8Array] = [new InnerNode({chunk_id}), buf];
                return Ok(ret);
            }
            case 2:{
                let offset;
                {
                    const r = new BuckyNumberDecoder("u32").raw_decode(buf);
                    if(r.err){
                        return r;
                    }
                    [offset, buf] = r.unwrap();
                }

                let size;
                {
                    const r = new BuckyNumberDecoder("u32").raw_decode(buf);
                    if(r.err){
                        return r;
                    }
                    [size, buf] = r.unwrap();
                }

                const ret:[InnerNode, Uint8Array] = [new InnerNode({index:{offset: offset.toNumber(), size: size.toNumber()}}), buf];
                return Ok(ret);
            }
            default:{
                return Err(new BuckyError(BuckyErrorCode.UnSupport, "invalid InnerNode flag"));
            }
        }
    }
}


export class InnerNodeInfo implements RawEncode {
    private m_attributes: Attributes;
    private m_node: InnerNode;
    constructor(attributes: Attributes, node: InnerNode){
        this.m_attributes = attributes;
        this.m_node = node;
    }

    attributes():Attributes{
        return this.m_attributes;
    }

    node(): InnerNode{
        return this.m_node;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        return Ok(this.m_attributes.raw_measure().unwrap() + this.m_node.raw_measure().unwrap())
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = this.m_attributes.raw_encode(buf).unwrap();
        buf = this.m_node.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class InnerNodeInfoDecoder implements RawDecode<InnerNodeInfo> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[InnerNodeInfo, Uint8Array]>{
        let attributes: Attributes;
        {
            const r = new AttributesDeocder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [attributes, buf] = r.unwrap();
        }

        let node: InnerNode;
        {
            const r = new InnerNodeDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [node, buf] = r.unwrap();
        }

        const ret:[InnerNodeInfo, Uint8Array] = [new InnerNodeInfo(attributes, node), buf];
        return Ok(ret);
    }
}

export class NDNObjectList implements RawEncode{
    private m_parent_chunk: Option<ChunkId>;
    private m_object_map: BuckyHashMap<BuckyString, InnerNodeInfo>;
    constructor(parent_chunk: Option<ChunkId>, object_map?:BuckyHashMap<BuckyString, InnerNodeInfo>){
        this.m_parent_chunk = parent_chunk;
        if(object_map){
            this.m_object_map = object_map;
        }else{
            this.m_object_map = new BuckyHashMap<BuckyString, InnerNodeInfo>();
        }
    }

    parent_chunk(): Option<ChunkId>{
        return this.m_parent_chunk;
    }

    object_map(): BuckyHashMap<BuckyString, InnerNodeInfo>{
        return this.m_object_map;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        const parent_chunk = new OptionEncoder(this.m_parent_chunk);
        return Ok(parent_chunk.raw_measure().unwrap()+this.m_object_map.raw_measure().unwrap());
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        const parent_chunk = new OptionEncoder(this.m_parent_chunk);
        buf = parent_chunk.raw_encode(buf).unwrap();
        buf = this.m_object_map.raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class NDNObjectListDecoder implements RawDecode<NDNObjectList> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[NDNObjectList, Uint8Array]>{
        let parent_chunk;
        {
            const r = new OptionDecoder(new ChunkIdDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [parent_chunk, buf] = r.unwrap();
        }

        let object_map: BuckyHashMap<BuckyString, InnerNodeInfo>;
        {
            const r = new BuckyHashMapDecoder(new BuckyStringDecoder(), new InnerNodeInfoDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [object_map, buf] = r.unwrap();
        }

        const ret:[NDNObjectList, Uint8Array] = [new NDNObjectList(parent_chunk.value(), object_map), buf];
        return Ok(ret);
    }
}

export class NDNObjectInfo implements RawEncode {
    private flags: number;
    constructor(private info:{
        chunk_id?: ChunkId,
        obj_list?: NDNObjectList
    }){
        this.flags = 0;
        if(info.chunk_id){
            this.flags = 0;
        }else{
            this.flags = 1;
        }
    }

    match<T>(visitor:{
        Chunk:(chunk_id: ChunkId)=>T,
        ObjList:(obj_list: NDNObjectList)=>T,
    }){
        if(this.info.chunk_id){
            return visitor.Chunk(this.info.chunk_id!);
        }else{
            return visitor.ObjList(this.info.obj_list!);
        }
    }

    async match_async<T>(visitor:{
        Chunk:(chunk_id: ChunkId)=>Promise<T>,
        ObjList:(obj_list: NDNObjectList)=>Promise<T>,
    }):Promise<T>{
        if(this.info.chunk_id){
            return await visitor.Chunk(this.info.chunk_id!);
        }else{
            return await visitor.ObjList(this.info.obj_list!);
        }
    }

    raw_measure(ctx?:any, purpose?: RawEncodePurpose): BuckyResult<number>{
        if (purpose && purpose === RawEncodePurpose.Hash) {
            return Ok(CHUNK_ID_LEN);
        } else {
            return Ok(1+this.match({
                Chunk: (chunk_id: ChunkId)=>chunk_id.raw_measure().unwrap(),
                ObjList: (obj_list: NDNObjectList)=> obj_list.raw_measure().unwrap(),
            }));
        }
    }

    raw_encode(buf: Uint8Array, ctx?:any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array>{
        if (!purpose || purpose !== RawEncodePurpose.Hash) {
            buf = new BuckyNumber('u8',this.flags).raw_encode(buf).unwrap();
        }

        buf = this.match({
            Chunk: (chunk_id: ChunkId)=>chunk_id.raw_encode(buf).unwrap(),
            ObjList: (obj_list: NDNObjectList)=> {
                if (purpose && purpose === RawEncodePurpose.Hash) {
                    let size = obj_list.raw_measure(ctx).unwrap();
                    let list_buf = new Uint8Array(size);
                    obj_list.raw_encode(list_buf, ctx).unwrap();
                    let chunk_id = ChunkId.calculate(list_buf).unwrap();
                    return chunk_id.raw_encode(buf).unwrap();
                } else {
                    return obj_list.raw_encode(buf).unwrap();
                }
            },
        });
        return Ok(buf);
    }
}

export class NDNObjectInfoDecoder implements RawDecode<NDNObjectInfo>{
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[NDNObjectInfo, Uint8Array]>{
        let flags;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [flags, buf] = r.unwrap();
        }

        switch(flags.toNumber()){
            case 0:{
                let chunk_id:ChunkId;
                const r = new ChunkIdDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                [chunk_id, buf] = r.unwrap();
                const ret:[NDNObjectInfo, Uint8Array] = [new NDNObjectInfo({chunk_id}), buf];
                return Ok(ret);
            }
            case 1:{
                let obj_list:NDNObjectList;
                const r = new NDNObjectListDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                [obj_list, buf] = r.unwrap();
                const ret:[NDNObjectInfo, Uint8Array] = [new NDNObjectInfo({obj_list}), buf];
                return Ok(ret);
            }
            default:{
                return Err(new BuckyError(BuckyErrorCode.InvalidData, "invalide flags for NDNObectInfo"));
            }
        }
    }
}

// 3. 定义DescContent，继承自DescContent
export class DirDescContent extends DescContent {
    private m_attributes: Attributes;
    private m_obj_list: NDNObjectInfo
    constructor(attributes: Attributes, obj_list: NDNObjectInfo){
        super();
        this.m_attributes = attributes;
        this.m_obj_list = obj_list;
    }

    attributes(): Attributes{
        return this.m_attributes;
    }

    obj_list(): NDNObjectInfo{
        return this.m_obj_list;
    }

    type_info(): DescTypeInfo{
        return DIR_DESC_TYPE_INFO;
    }

    raw_measure(ctx?: any, purpose?: RawEncodePurpose): BuckyResult<number>{
        return Ok(this.m_attributes.raw_measure().unwrap() + this.m_obj_list.raw_measure(ctx, purpose).unwrap());
    }

    raw_encode(buf: Uint8Array, ctx?: any, purpose?: RawEncodePurpose): BuckyResult<Uint8Array>{
        {
            const r = this.m_attributes.raw_encode(buf);
            if(r.err){
                base_error("DirDescContent::raw_encode error", r.err);
                return r;
            }
            buf = r.unwrap();
        }

        {
            const r = this.m_obj_list.raw_encode(buf, ctx, purpose);
            if(r.err){
                base_error("DirDescContent::raw_encode error", r.err);
                return r;
            }
            buf = r.unwrap();
        }

        return Ok(buf);
    }
}

export class DirDescContentDecoder extends DescContentDecoder<DirDescContent>{
    type_info(): DescTypeInfo{
        return DIR_DESC_TYPE_INFO;
    }

    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[DirDescContent, Uint8Array]>{
        let attributes: Attributes;
        {
            const r = new AttributesDeocder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [attributes, buf] = r.unwrap();
        }

        let obj_list: NDNObjectInfo;
        {
            const r = new NDNObjectInfoDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [obj_list, buf] = r.unwrap();
        }

        const ret: [DirDescContent, Uint8Array] = [new DirDescContent(attributes, obj_list), buf];
        return Ok(ret);
    }
}

export class DirBodyContent extends BodyContent {
    private flags:number;
    constructor(private member:{
        chunk_id?: ChunkId,
        obj_list?: BuckyHashMap<ObjectId, BuckyBuffer>
    }){
        super();
        if(member.chunk_id){
            this.flags = 0;
        }else{
            this.flags = 1;
        }
    }

    match<T>(visitor:{
        Chunk:(chunk_id:ChunkId)=>T,
        ObjList:(obj_list:BuckyHashMap<ObjectId, BuckyBuffer>)=>T,
    }):T{
        if(this.member.chunk_id){
            return visitor.Chunk(this.member.chunk_id!);
        }else{
            return visitor.ObjList(this.member.obj_list!);
        }
    }

    async match_async<T>(visitor:{
        Chunk:(chunk_id:ChunkId)=>Promise<T>,
        ObjList:(obj_list:BuckyHashMap<ObjectId, BuckyBuffer>)=>Promise<T>,
    }):Promise<T>{
        if(this.member.chunk_id){
            return await visitor.Chunk(this.member.chunk_id!);
        }else{
            return await visitor.ObjList(this.member.obj_list!);
        }
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        return Ok(1+this.match({
            Chunk:(chunk_id)=>chunk_id.raw_measure().unwrap(),
            ObjList:(obj_list)=>obj_list.raw_measure().unwrap()
        }));
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8',this.flags).raw_encode(buf).unwrap();
        buf = this.match({
            Chunk:(chunk_id)=>chunk_id.raw_encode(buf).unwrap(),
            ObjList:(obj_list)=>obj_list.raw_encode(buf).unwrap()
        });
        return Ok(buf);
    }
}

export class DirBodyContentDecoder extends BodyContentDecoder<DirBodyContent>{
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[DirBodyContent, Uint8Array]>{
        let flags;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [flags, buf] = r.unwrap();
        }

        switch(flags.toNumber()){
            case 0: {
                let chunk_id: ChunkId;
                const r = new ChunkIdDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                [chunk_id, buf] = r.unwrap();
                const ret:[DirBodyContent, Uint8Array] = [new DirBodyContent({chunk_id}), buf];
                return Ok(ret);
            }
            case 1:{
                let obj_list: BuckyHashMap<ObjectId, BuckyBuffer>;
                const r = new BuckyHashMapDecoder(new ObjectIdDecoder(), new BuckyBufferDecoder()).raw_decode(buf);
                if(r.err){
                    return r;
                }
                [obj_list, buf] = r.unwrap();
                const ret:[DirBodyContent, Uint8Array] = [new DirBodyContent({obj_list}), buf];
                return Ok(ret);
            }
            default:{
                return Err(new BuckyError(BuckyErrorCode.InvalidData, "invalide flags for NDNObectInfo"));
            }
        }
    }
}


// 7. 定义组合类型
export class DirDesc extends NamedObjectDesc<DirDescContent>{
    //
}

export class DirDescDecoder extends NamedObjectDescDecoder<DirDescContent>{
    constructor(){
        super(new DirDescContentDecoder());
    }
}

export class DirBuilder extends NamedObjectBuilder<DirDescContent, DirBodyContent>{
    //
}

// 通过继承的方式具体化
export class DirId extends NamedObjectId<DirDescContent, DirBodyContent>{
    constructor(id: ObjectId){
        super(DIR_DESC_TYPE_INFO.obj_type(), id);
    }

    static default(): DirId{
        return named_id_gen_default(DIR_DESC_TYPE_INFO.obj_type());
    }

    static from_base_58(s: string): BuckyResult<DirId> {
        return named_id_from_base_58(DIR_DESC_TYPE_INFO.obj_type(), s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<DirId>{
        return named_id_try_from_object_id(DIR_DESC_TYPE_INFO.obj_type(), id);
    }
}

export class DirIdDecoder extends NamedObjectIdDecoder<DirDescContent, DirBodyContent>{
    constructor(){
        super(ObjectTypeCode.Dir);
    }
}

export class Dir extends NamedObject<DirDescContent, DirBodyContent>{
    static create(
        owner: ObjectId,
        attributes: Attributes,
        obj_list: NDNObjectInfo,
        body:{
            chunk_id?: ChunkId,
            obj_list?: BuckyHashMap<ObjectId, BuckyBuffer>
        },
        build?:(builder: DirBuilder)=>void
    ):Dir{
        const desc_content = new DirDescContent(attributes, obj_list);
        const body_content = new DirBodyContent(body);
        const builder = new NamedObjectBuilder<DirDescContent, DirBodyContent>(desc_content, body_content).owner(owner);
        if(build){
            build(builder);
        }
        const self = builder.build();
        return new Dir(self.desc(), self.body(), self.signs(), self.nonce());
    }

    dir_id(): DirId{
        return DirId.try_from_object_id(this.desc().calculate_id()).unwrap();
    }
}

export class DirDecoder extends NamedObjectDecoder<DirDescContent, DirBodyContent, Dir>{
    constructor(){
        super(new DirDescContentDecoder(), new DirBodyContentDecoder(), Dir);
    }

    raw_decode(buf: Uint8Array): BuckyResult<[Dir, Uint8Array]>{
        return super.raw_decode(buf).map(r=>{
            const [obj, _buf] = r;
            const sub_obj = new Dir(obj.desc(),obj.body(), obj.signs(), obj.nonce());
            return [sub_obj, _buf] as [Dir, Uint8Array];
        });
    }
}