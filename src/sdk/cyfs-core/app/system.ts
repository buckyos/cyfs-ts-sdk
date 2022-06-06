import { ObjectId } from '../../cyfs-base';
import { DecApp, DecAppId } from './dec_app';

export const SYSTEM_DEC_APP = gen_system_dec_id();

function gen_system_dec_id(): DecAppId {
    const owner = ObjectId.default();
    const id =  DecAppId.try_from_object_id(DecApp.generate_id(owner, "cyfs-system-service")).unwrap();
    if (id.to_base_58() !== '9tGpLNncauC9kGhZ7GsztFvVegaKwBXoSDjkxGDHqrn6') {
        throw new Error(`unmatch systen dec id: expect=9tGpLNncauC9kGhZ7GsztFvVegaKwBXoSDjkxGDHqrn6, got=${id.to_base_58()}`);
    }

    return id;
}

export function get_system_dec_app(): DecAppId {
    return SYSTEM_DEC_APP;
}