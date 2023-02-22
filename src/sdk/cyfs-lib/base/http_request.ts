import { CYFS_API_EDITION } from "../../cyfs-base";
import { CYFS_CURRENT_API_EDITION } from "./protocol";


export class HttpRequest {
    url: string
    init: RequestInit

    constructor(method: string, url: string) {
        this.url = url;
        if (typeof Headers === "undefined") {
            const { Headers } = require("node-fetch");
            this.init = { method, headers: new Headers() }
        } else {
            this.init = { method, headers: new Headers() }
        }
        this.insert_header('Cache-Control', 'no-cache');
        this.insert_header(CYFS_API_EDITION, CYFS_CURRENT_API_EDITION.toString());

    }

    insert_header(name: string, value: string): void {
        (this.init.headers as Headers).append(name, value);
    }

    set_body(buf: Uint8Array): void {
        this.init.body = buf;
        this.insert_header("Content-Type", "application/octet-stream");
    }

    set_string_body(str: string): void {
        this.init.body = str;
        this.insert_header("Content-Type", "text/html; charset=utf-8");
    }

    set_json_body(object: any): void {
        this.init.body = JSON.stringify(object);
        this.insert_header("Content-Type", "application/json");
    }
}
