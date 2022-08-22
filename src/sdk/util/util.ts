import { HttpRequest } from "../cyfs-lib";
import { Response } from 'node-fetch';

function reqMethod(request: HttpRequest): string {
    return request.init.method!.toUpperCase()
}

function encode_body(body: any): Uint8Array | undefined {
    if (typeof body === "string") {
        return new TextEncoder().encode(body);
    } else if (body instanceof Uint8Array) {
        return body;
    } else {
        return undefined;
    }
}

function fixNormalHeader(request: HttpRequest, body_length?: number) {
    const headers = request.init.headers as Headers;
    if (!headers.has('Accept')) {
		headers.set('Accept', '*/*');
	}

    let contentLengthValue = null;
	if (request.init.body == null && /^(POST|PUT)$/i.test(request.init.method!)) {
		contentLengthValue = '0';
	}
	if (request.init.body != null && body_length) {
        contentLengthValue = body_length.toString()
	}
	if (contentLengthValue) {
		headers.set('Content-Length', contentLengthValue);
	}

    if (!headers.has('Connection')) {
		headers.set('Connection', 'close');
	}
}

export function encodeRequest(request: HttpRequest): Uint8Array {
    const url = new URL(request.url);
    const body_buf = encode_body(request.init.body);

    fixNormalHeader(request, body_buf?.length);

    let full_path = url.pathname;
    if (url.search.length > 0) {
        full_path += `?${url.search}`;
    }

    let head = `${reqMethod(request)} ${full_path} HTTP/1.1\r\n`;
    head += `HOST:${url.host}\r\n`;
    for (const [key, value] of (request.init.headers as Headers)) {
        head += `${key}: ${value}\r\n`;
    }

    head += "\r\n";

    const head_buf = new TextEncoder().encode(head);
    
    const buf = new Uint8Array(head_buf.length + (body_buf ? body_buf!.length : 0));
    buf.set(head_buf, 0);
    if (body_buf) {
        buf.set(body_buf, head_buf.length);
    }

    return buf;
}

function findBody(buf: Uint8Array): number {
    /**
     * state = 0: 没有
     * state = 1: 第一个\r
     * state = 2: 第一个\n
     * state = 3: 第二个\r
     * state = 4: 第二个\n
     */
    let state = 0;
    return buf.findIndex((value) => {
        if (value === '\r'.charCodeAt(0)) {
            if (state === 0 || state === 2) {
                state += 1;
            }
        } else if (value === '\n'.charCodeAt(0)) {
            if (state === 1 || state === 3) {
                state += 1;
            }
        } else {
            state = 0
        }

        return state === 4;
    })
}

export function decodeResponse(buf: Uint8Array): Response {
    
    const body_index = findBody(buf);   // 这个index返回的是最后一个\n的位置，header在之前3个字符，body在之后一个字符
    let head_buf, body_buf;
    if (body_index > -1) {
        head_buf = buf.slice(0, body_index-3);
        body_buf = buf.slice(body_index+1);
    } else {
        head_buf = buf;
    }

    const head = new TextDecoder().decode(head_buf);

    const heads = head.split("\r\n");
    const [ver, code, status] = heads[0].split(" ");

    const headers = [];

    for (let head_line of heads.slice(1)) {
        head_line = head_line.trim();
        if (head_line.length === 0) {
            continue;
        }

        const header_values = head_line.split(":");
        const key = header_values[0];
        const value = header_values.slice(1).join(":").trimLeft();

        headers.push([key, value.trimLeft()])
    }

    const resp = new Response(body_buf, {
        headers,
        status: parseInt(code, 10),
        statusText: status
    });

    return resp;
}