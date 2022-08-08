import { util } from "node-forge";

function ROTATE(v: number, c: number): number {
    return (v << c) | (v >>> (32 - c));
}

const constants = util.binary.raw.decode('expand 32-byte k');

export class Chacha20 {
    private input: Uint32Array
    private cachePos: number
    private buffer: Uint32Array
    private output: Uint8Array
    constructor(key: Uint8Array, nonce: Uint8Array) {
        this.input = new Uint32Array(16);

        // https://tools.ietf.org/html/draft-irtf-cfrg-chacha20-poly1305-01#section-2.3
        let conview = constants.offsetView(0)
        let keyview = key.offsetView(0)
        this.input[0] = conview.getUint32(0, true);
        this.input[1] = conview.getUint32(4, true);
        this.input[2] = conview.getUint32(8, true);
        this.input[3] = conview.getUint32(12, true);
        this.input[4] = keyview.getUint32(0, true);
        this.input[5] = keyview.getUint32(4, true);
        this.input[6] = keyview.getUint32(8, true);
        this.input[7] = keyview.getUint32(12, true);
        this.input[8] = keyview.getUint32(16, true);
        this.input[9] = keyview.getUint32(20, true);
        this.input[10] = keyview.getUint32(24, true);
        this.input[11] = keyview.getUint32(28, true);

        this.input[12] = 0;
        let nonceview = nonce.offsetView(0)
        this.input[13] = nonceview.getUint32(0, true);
        this.input[14] = nonceview.getUint32(4, true);
        this.input[15] = nonceview.getUint32(8, true);

        this.cachePos = 64;
        this.buffer = new Uint32Array(16);
        this.output = new Uint8Array(64);
    }

    quarterRound(a: number, b: number, c: number, d: number): void {
        let x = this.buffer;
        x[a] += x[b]; x[d] = ROTATE(x[d] ^ x[a], 16);
        x[c] += x[d]; x[b] = ROTATE(x[b] ^ x[c], 12);
        x[a] += x[b]; x[d] = ROTATE(x[d] ^ x[a], 8);
        x[c] += x[d]; x[b] = ROTATE(x[b] ^ x[c], 7);
    }

    makeBlock(output: Uint8Array, start: number): void {
        let i = -1;
        // copy input into working buffer
        while (++i < 16) {
            this.buffer[i] = this.input[i];
        }
        i = -1;
        while (++i < 10) {
            // straight round
            this.quarterRound(0, 4, 8, 12);
            this.quarterRound(1, 5, 9, 13);
            this.quarterRound(2, 6, 10, 14);
            this.quarterRound(3, 7, 11, 15);


            //diaganle round
            this.quarterRound(0, 5, 10, 15);
            this.quarterRound(1, 6, 11, 12);
            this.quarterRound(2, 7, 8, 13);
            this.quarterRound(3, 4, 9, 14);
        }
        i = -1;
        // copy working buffer into output
        let view = output.offsetView(0)
        while (++i < 16) {
            this.buffer[i] += this.input[i];
            view.setUint32(start, this.buffer[i], true);
            start += 4;
        }

        this.input[12]++;
        if (!this.input[12]) {
            throw new Error('counter is exausted');
        }
    }

    getBytes(len: number): Uint8Array {
        let dpos = 0;
        let dst = new Uint8Array(len);
        let cacheLen = 64 - this.cachePos;
        if (cacheLen) {
            if (cacheLen >= len) {
                let src_array = this.output.slice(this.cachePos, 64)
                if (src_array.length > len) {
                    src_array = src_array.slice(0, len)
                }
                dst.set(src_array, 0)
                this.cachePos += len;
                return dst;
            } else {
                let src_array = this.output.slice(this.cachePos, 64)
                if (src_array.length > len) {
                    src_array = src_array.slice(0, len)
                }
                dst.set(src_array, 0)
                len -= cacheLen;
                dpos += cacheLen;
                this.cachePos = 64;
            }
        }
        while (len > 0) {
            if (len <= 64) {
                this.makeBlock(this.output, 0);
                dst.set(this.output.slice(0, len), dpos)
                if (len < 64) {
                    this.cachePos = len;
                }
                return dst;
            } else {
                this.makeBlock(dst, dpos);
            }
            len -= 64;
            dpos += 64;
        }
        throw new Error('something bad happended');
    }

    update(data: Uint8Array): Uint8Array | undefined {
        let len = data.length;
        if (!len) {
            return;
        }
        let pad = this.getBytes(len);
        let i = -1;
        while (++i < len) {
            pad[i] ^= data[i];
        }
        return pad;
    }
}