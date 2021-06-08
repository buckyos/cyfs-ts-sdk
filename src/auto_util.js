function importor_base(relative_path){

    if(relative_path[relative_path.length-1]!=='/'){
        relative_path = relative_path +'/';
    }

    return`import {
    SubDescType,
    DescTypeInfo, DescContent, DescContentDecoder,
    BodyContent, BodyContentDecoder,
    NamedObjectId, NamedObjectIdDecoder,
    NamedObjectDesc, NamedObjectDescDecoder,
    NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "${relative_path}objects/object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "${relative_path}base/results";
import { Option, OptionEncoder, OptionDecoder, } from "${relative_path}base/option";
import { BuckyNumber, BuckyNumberDecoder, BuckyNumberWrapper } from "${relative_path}base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "${relative_path}base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "${relative_path}base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "${relative_path}base/bucky_buffer";
import { Vec, VecDecoder } from "${relative_path}base/vec";
import { RawDecode, RawEncode } from "${relative_path}base/raw_encode";
import { HashValue, HashValueDecoder } from "${relative_path}crypto/hash";
import { ObjectId, ObjectIdDecoder } from "${relative_path}objects/object_id";
`;
}

function importor(modules, from){
    return `import{ ${modules.join(', ')} } from '${from}'`;
}

function importor_inner(modules){
    const out = [];
    for(const m of modules){
        const mul = m.split(',');
        for(const e of mul){
            out.push({
                name: e.trim(),
            })
        }
    }
    return out;
}

module.exports = {
    importor_base,
    importor,
    importor_inner,
};