import { BuckyError, BuckyErrorCode, BuckyResult, Err, ObjectId, Ok } from "../../cyfs-base"
import { RequestSourceInfo } from "../access/source";
import { GlobalStateCategory } from "../root_state/def"

export class RequestGlobalStateRoot {
    global_root?: ObjectId;
    dec_root?: ObjectId;
    private constructor() {}
    static GlobalRoot(value: ObjectId): RequestGlobalStateRoot {
        const self = new RequestGlobalStateRoot()
        self.global_root = value;
        return self;
    }

    static DecRoot(value: ObjectId): RequestGlobalStateRoot {
        const self = new RequestGlobalStateRoot()
        self.dec_root = value;
        return self;
    }

    toString(): string {
        if (this.global_root) {
            return `root:${this.global_root}`
        } else if (this.dec_root) {
            return `dec-root:${this.dec_root}`
        } else {
            throw new Error('invalid RequestGlobalStateRoot')
        }
    }
}

export class RequestGlobalStatePath {
    // default is root-state, can be local-cache
    global_state_category?: GlobalStateCategory;

    // root or dec-root object-id
    global_state_root?: RequestGlobalStateRoot;

    // target DEC，if is none then equal as system dec-id
    dec_id?: ObjectId;

    // inernal path of global-state, without the dec-id segment
    _req_path?: string;
    // extra query params in URL query parameters format, after a question mark (?)
    req_query_string?: string;

    constructor(dec_id?: ObjectId, req_path?: string, global_state_category?: GlobalStateCategory, global_state_root?: RequestGlobalStateRoot) {
        this.dec_id = dec_id;
        this._req_path = req_path;
        this.global_state_category = global_state_category;
        this.global_state_root = global_state_root;
    }

    category(): GlobalStateCategory {
        return this.global_state_category?this.global_state_category:GlobalStateCategory.RootState
    }

    req_path(): string {
        return this._req_path?this._req_path:"/"
    }

    dec(source: RequestSourceInfo): ObjectId {
        return this.dec_id?this.dec_id:source.dec
    }

    set_req_query_string(query: string): void {
        this.req_query_string = query;
    }

    static parse_req_path_with_query_string(
        req_path_with_query_string: string,
    ): [string, string|undefined] {
        const pos = req_path_with_query_string.lastIndexOf("?")
        if (pos != -1) {
            return [req_path_with_query_string.slice(0, pos), req_path_with_query_string.slice(pos+1)]
        } else {
            return [req_path_with_query_string, undefined]
        }
    }

    /*
    The first paragraph is optional root-state/local-cache, default root-state
    The second paragraph is optional current/root:{root-id}/dec-root:{dec-root-id}, default is current
    The third paragraph is required target-dec-id
    Fourth paragraph optional global-state-inner-path
    */

    static from_str(org_req_path: string): BuckyResult<RequestGlobalStatePath> {
        const [req_path, query_string] = RequestGlobalStatePath.parse_req_path_with_query_string(org_req_path);
        const segs: string[] = []
        req_path.split("/").forEach((value) => {
            if (value) {
                segs.push(value);
            }
        });

        let index = 0;
        let global_state_category;
        if (index < segs.length) {
            const seg = segs[index];
            if (seg === "root-state" || seg == "local-cache") {
                index += 1;
                global_state_category = seg as GlobalStateCategory;
            }
        }

        let global_state_root;

        if (index < segs.length) {
            const seg = segs[index];
            if (seg === "current") {
                index += 1;
            } else if (seg.startsWith("root:")) {
                index += 1;
                const id = seg.substring(5);
                const root = ObjectId.from_base_58(id);
                if (root.err) {
                    const msg = `invalid req_path's root id: ${seg}, ${root.val}`;
                    console.error(msg);
                    return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
                }
                global_state_root = RequestGlobalStateRoot.GlobalRoot(root.unwrap())
            } else if (seg.startsWith("dec-root:")) {
                index += 1;
                const id = seg.substring(9);
                const root = ObjectId.from_base_58(id);
                if (root.err) {
                    const msg = `invalid req_path's dec root id: ${seg}, ${root.val}`;
                    console.error(msg);
                    return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
                }
                global_state_root = RequestGlobalStateRoot.DecRoot(root.unwrap())
            }
        }

        let dec_id;

        if (index < segs.length) {
            const seg = segs[index];
            if (seg.length >= 43 && seg.length <= 45) {
                const r = ObjectId.from_base_58(seg);
                if (r.err) {
                    console.warn(`try decode req_path's dec root id: ${seg} fail: ${r.val}, use no dec_id`);
                } else {
                    index += 1;
                    dec_id = r.unwrap();
                }
            }
        }


        let real_req_path;
        if (index < segs.length) {
            real_req_path = "/" + segs.slice(index).join("/") + "/"
        }

        const self = new RequestGlobalStatePath(dec_id, real_req_path);
        self.global_state_category = global_state_category;
        self.global_state_root = global_state_root;
        self.req_query_string = query_string;
        return Ok(self)
    }

    static parse(req_path: string): BuckyResult<RequestGlobalStatePath> {
        return RequestGlobalStatePath.from_str(req_path)
    }

    toString(): string {
        const segs: string[] = [];
        if (this.global_state_category) {
            segs.push(this.global_state_category)
        }
        if (this.global_state_root) {
            segs.push(this.global_state_root.toString())
        }

        if (this.dec_id) {
            segs.push(this.dec_id.to_base_58())
        }
        
        if (this._req_path) {
            if (this._req_path.startsWith("/")) {
                segs.push(this._req_path.substring(1))
            } else {
                segs.push(this._req_path)
            }
        }

        let path = "/" + segs.join("/");
        if (this.req_query_string) {
            path += `?${this.req_query_string}`;
        }

        return path;
    }

    format_string(): string {
        return this.toString()
    }
}