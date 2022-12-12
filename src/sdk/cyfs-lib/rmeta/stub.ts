import { u32 } from "@noble/hashes/utils";
import { BuckyResult, None, ObjectId, Ok } from "../../cyfs-base";
import { GlobalStateObjectMetaItem, GlobalStatePathAccessItem, GlobalStatePathLinkItem } from "./def";
import { GlobalStateMetaRequestor } from "./requestor";

export class GlobalStateMetaStub {
    constructor(private requestor: GlobalStateMetaRequestor, private target?: ObjectId, private target_dec_id?: ObjectId) {}

    // path access
    async add_access(item: GlobalStatePathAccessItem): Promise<BuckyResult<boolean>> {
        const req = {
            common: {
                dec_id: this.target_dec_id,
                target: this.target,
                flags: 0,
            },
            item,
        };

        const resp = await this.requestor.add_access(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().updated)
    }

    async remove_access(
        item: GlobalStatePathAccessItem,
    ): Promise<BuckyResult<GlobalStatePathAccessItem|undefined>> {
        const req = {
            common: {
                dec_id: this.target_dec_id,
                target: this.target,
                flags: 0,
            },
            item,
        };

        const resp = await this.requestor.remove_access(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().item)
    }

    async clear_access(): Promise<BuckyResult<number>> {
        const req = {
            common: {
                dec_id: this.target_dec_id,
                target: this.target,
                flags: 0,
            },
        };

        const resp = await this.requestor.clear_access(req);
        if (resp.err) {
            return resp;
        }
        return Ok((await resp).unwrap().count)
    }

    async add_link(
        source: string,
        target: string,
    ): Promise<BuckyResult<boolean>> {
        const req = {
            common: {
                dec_id: this.target_dec_id,
                target: this.target,
                flags: 0,
            },
            source: source,
            target: target,
        };

        const resp = await this.requestor.add_link(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().updated)
    }

    async remove_link(
        source: string,
    ): Promise<BuckyResult<GlobalStatePathLinkItem|undefined>> {
        const req = {
            common: {
                dec_id: this.target_dec_id,
                target: this.target,
                flags: 0,
            },
            source: source,
        };

        const resp = await this.requestor.remove_link(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().item)
    }

    async clear_link(): Promise<BuckyResult<number>> {
        const req = {
            common: {
                dec_id: this.target_dec_id,
                target: this.target,
                flags: 0,
            },
        };

        const resp = await this.requestor.clear_link(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().count)
    }

    // object meta
    async add_object_meta(item: GlobalStateObjectMetaItem): Promise<BuckyResult<boolean>> {
        const req = {
            common: {
                target_dec_id: this.target_dec_id,
                target: this.target,
                flags: 0,
            },
            item,
        };

        const resp = await this.requestor.add_object_meta(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().updated)
    }

    async remove_object_meta(
        item: GlobalStateObjectMetaItem,
    ): Promise<BuckyResult<GlobalStateObjectMetaItem|undefined>> {
        const req = {
            common: {
                target_dec_id: this.target_dec_id,
                target: this.target,
                flags: 0,
            },
            item,
        };

        const resp = await this.requestor.remove_object_meta(req);
        if (resp.err) {
            return resp;            
        }
        return Ok(resp.unwrap().item)
    }

    async clear_object_meta(): Promise<BuckyResult<number>> {
        const req = {
            common: {
                target_dec_id: this.target_dec_id,
                target: this.target,
                flags: 0,
            },
        };

        const resp = await this.requestor.clear_object_meta(req);
        if (resp.err) {
            return resp;            
        }
        return Ok(resp.unwrap().count)
    }
}