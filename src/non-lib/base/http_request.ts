

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
    }

    insert_header(name: string, value: string) {
        (this.init.headers as Headers).append(name, value);
    }

    set_body(buf: Uint8Array) {
        this.init.body = buf;
        this.insert_header("Content-Type", "application/octet-stream");
    }

    set_string_body(str: string) {
        this.init.body = str;
        this.insert_header("Content-Type", "text/html; charset=utf-8");
    }

    set_json_body(object: any) {
        this.init.body = JSON.stringify(object);
        this.insert_header("Content-Type", "application/json");
    }
}
