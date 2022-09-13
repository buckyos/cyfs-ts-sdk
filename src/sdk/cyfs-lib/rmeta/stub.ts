import { BuckyResult, ObjectId, Ok } from "../../cyfs-base";
import { GlobalStatePathAccessItem, GlobalStatePathLinkItem } from "./def";
import { GlobalStateMetaRequestor } from "./requestor";

export class GlobalStateMetaStub {
    constructor(private requestor: GlobalStateMetaRequestor, private target?: ObjectId, private dec_id?: ObjectId) {}

    // path access
    async add_access(item: GlobalStatePathAccessItem): Promise<BuckyResult<boolean>> {
        let req = {
            common: {
                dec_id: this.dec_id,
                target: this.target,
                flags: 0,
            },
            item,
        };

        let resp = await this.requestor.add_access(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().updated)
    }

    async remove_access(
        item: GlobalStatePathAccessItem,
    ): Promise<BuckyResult<GlobalStatePathAccessItem|undefined>> {
        let req = {
            common: {
                dec_id: this.dec_id,
                target: this.target,
                flags: 0,
            },
            item,
        };

        let resp = await this.requestor.remove_access(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().item)
    }

    async clear_access(): Promise<BuckyResult<number>> {
        let req = {
            common: {
                dec_id: this.dec_id,
                target: this.target,
                flags: 0,
            },
        };

        let resp = await this.requestor.clear_access(req);
        if (resp.err) {
            return resp;
        }
        return Ok((await resp).unwrap().count)
    }

    async add_link(
        source: string,
        target: string,
    ): Promise<BuckyResult<boolean>> {
        let req = {
            common: {
                dec_id: this.dec_id,
                target: this.target,
                flags: 0,
            },
            source: source,
            target: target,
        };

        let resp = await this.requestor.add_link(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().updated)
    }

    async remove_link(
        source: string,
    ): Promise<BuckyResult<GlobalStatePathLinkItem|undefined>> {
        let req = {
            common: {
                dec_id: this.dec_id,
                target: this.target,
                flags: 0,
            },
            source: source,
        };

        let resp = await this.requestor.remove_link(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().item)
    }

    async clear_link(): Promise<BuckyResult<number>> {
        let req = {
            common: {
                dec_id: this.dec_id,
                target: this.target,
                flags: 0,
            },
        };

        let resp = await this.requestor.clear_link(req);
        if (resp.err) {
            return resp;
        }
        return Ok(resp.unwrap().count)
    }
}