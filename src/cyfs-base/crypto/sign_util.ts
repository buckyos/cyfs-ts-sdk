import { OptionWrapper } from "../base/option";
import { raw_hash_encode } from "../base/raw_encode_util";
import { BuckyResult, Ok } from "../base/results";
import { BodyContent, DescContent, NamedObject } from "../objects/object";
import { PrivateKey } from "./private_key";
import { Signature, SignatureSource } from "./public_key";

export function sign_named_object_desc<DC extends DescContent, BC extends BodyContent>(private_key: PrivateKey, obj: NamedObject<DC, BC>, sign_source: SignatureSource): BuckyResult<Signature> {
    let hash;
    {
        let r = raw_hash_encode(obj.desc());
        if (r.err) {
            return r;
        }
        hash = r.unwrap();
    }

    return Ok(private_key.sign(hash.as_slice(), sign_source));
}

export function sign_named_object_body<DC extends DescContent, BC extends BodyContent>(private_key: PrivateKey, obj: NamedObject<DC, BC>, sign_source: SignatureSource): BuckyResult<Signature> {
    let hash;
    {
        let r = raw_hash_encode(new OptionWrapper(obj.body()));
        if (r.err) {
            return r;
        }
        hash = r.unwrap();
    }

    return Ok(private_key.sign(hash.as_slice(), sign_source));
}

export function sign_and_set_named_object<DC extends DescContent, BC extends BodyContent>(private_key: PrivateKey, obj: NamedObject<DC, BC>, sign_source: SignatureSource): BuckyResult<{}>{
    let desc_r = sign_named_object_desc(private_key, obj, sign_source);
    if (desc_r.err) {
        return desc_r;
    }
    obj.signs().push_desc_sign(desc_r.unwrap());

    if (obj.body().is_some()) {
        let body_r = sign_named_object_body(private_key, obj, sign_source);
        if (body_r.err) {
            return body_r;
        }

        obj.signs().push_body_sign(body_r.unwrap());
    }
    return Ok({})
}