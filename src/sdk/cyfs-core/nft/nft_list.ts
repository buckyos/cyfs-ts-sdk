import {
    SubDescType,
    DescTypeInfo, 
    NamedObjectId, NamedObjectIdDecoder,
    NamedObjectDesc, NamedObjectDescDecoder,
    NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "../../cyfs-base/objects/object"

import { Ok, BuckyResult} from "../../cyfs-base/base/results";
import { ObjectId } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { protos } from '../codec';
import { EmptyProtobufBodyContent, EmptyProtobufBodyContentDecoder, FileDesc, FileDescDecoder, ProtobufDescContent, ProtobufDescContentDecoder } from '../../cyfs-base';

export class NFTListDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.NFTList;
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

const NFTList_DESC_TYPE_INFO = new NFTListDescTypeInfo();

export class NFTListDescContent extends ProtobufDescContent {
    constructor(public nft_list: FileDesc[]) {
        super();
    }

    type_info(): DescTypeInfo {
        return NFTList_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.NFTListDescContent> {
        const target = new protos.NFTListDescContent()
        for (const desc of this.nft_list) {
            const buf = desc.encode_to_buf();
            if (buf.err) {
                return buf;
            }
            const nft_desc = new protos.NFTFileDesc()
            nft_desc.setDesc(buf.unwrap())
            target.addNftList(nft_desc)
        }

        return Ok(target);
    }
}

export class NFTListDescContentDecoder extends ProtobufDescContentDecoder<NFTListDescContent, protos.NFTListDescContent>{
    constructor() {
        super(protos.NFTListDescContent.deserializeBinary)
    }

    type_info(): DescTypeInfo {
        return NFTList_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.NFTListDescContent): BuckyResult<NFTListDescContent> {
        const list = [];
        for (const desc of value.getNftListList()) {
            const file_desc = new FileDescDecoder().raw_decode(desc.getDesc_asU8());
            if (file_desc.err) {
                return file_desc;
            }

            list.push(file_desc.unwrap()[0])
        }
        const result = new NFTListDescContent(list);

        return Ok(result);
    }
}

export class NFTListDesc extends NamedObjectDesc<NFTListDescContent>{
    // ignore
}

export class NFTListDescDecoder extends NamedObjectDescDecoder<NFTListDescContent>{
    // ignore
}

export class NFTListBuilder extends NamedObjectBuilder<NFTListDescContent, EmptyProtobufBodyContent>{
    // ignore
}

export class NFTListId extends NamedObjectId<NFTListDescContent, EmptyProtobufBodyContent>{
    constructor(id: ObjectId) {
        super(CoreObjectType.NFTList, id);
    }

    static default(): NFTListId {
        return named_id_gen_default(CoreObjectType.NFTList);
    }

    static from_base_58(s: string): BuckyResult<NFTListId> {
        return named_id_from_base_58(CoreObjectType.NFTList, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<NFTListId> {
        return named_id_try_from_object_id(CoreObjectType.NFTList, id);
    }
}

export class NFTListIdDecoder extends NamedObjectIdDecoder<NFTListDescContent, EmptyProtobufBodyContent>{
    constructor() {
        super(CoreObjectType.NFTList);
    }
}


export class NFTList extends NamedObject<NFTListDescContent, EmptyProtobufBodyContent>{
    static create(owner: ObjectId, list: FileDesc[]): NFTList {
        const desc_content = new NFTListDescContent(list);
        const body_content = new EmptyProtobufBodyContent();
        const builder = new NFTListBuilder(desc_content, body_content);

        return builder.owner(owner).no_create_time().build(NFTList);
    }

    nft_list(): FileDesc[] {
        return this.desc().content().nft_list
    }
}

export class NFTListDecoder extends NamedObjectDecoder<NFTListDescContent, EmptyProtobufBodyContent, NFTList>{
    constructor() {
        super(new NFTListDescContentDecoder(), new EmptyProtobufBodyContentDecoder(), NFTList);
    }

    static create(): NFTListDecoder {
        return new NFTListDecoder()
    }
}