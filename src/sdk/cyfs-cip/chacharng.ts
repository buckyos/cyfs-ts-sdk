import JSBI from "jsbi";
import {util} from 'node-forge';
import { Chacha20 } from "./chacha20";

export class ChaChaRng{
    private cipher: Chacha20
    constructor(seedBytes: Uint8Array) {
        if (seedBytes.length != 32) {
            throw new Error("Seed is not 32 bytes long");
        }
        const nonce = new Uint8Array(12);
        this.cipher = new Chacha20(seedBytes, nonce);
    }

    // Array is an array or Uint8Array of the desired size
    // that will be filled with random bytes.
    // The array is modified in place.
    fillBytes(array: Uint8Array): void {
        const size = array.length;
        let output = new Uint8Array(size);
        output = this.cipher.update(output)!;
        output.reverse();
        for (let i=0; i<output.length; i++) {
            array[i] = output[output.length - i - 1];
        }
    }

    getBytesSync(length: number): string {
        let output = new Uint8Array(length);
        this.fillBytes(output);
        console.log(`chacha rng get ${length} bytes, ret ${output.toHex()}`)
        return util.binary.raw.encode(output)
    }

    // Returns a number in range 0 <= n < 4294967296
    nextU32(): number {
        const n = nextFromBytes(4, this.cipher);
        return n as number;
    }

    // Returns a BigInt in range 0 <= n < 18446744073709551616
    nextU64(): JSBI {
        const n = nextFromBytes(8, this.cipher);
        return n as JSBI;
    }
}

function nextFromBytes(n: number, cipher: any): JSBI|number {
    let bytes = new Uint8Array(n);
    bytes = cipher.update(bytes);
    let v = JSBI.BigInt(0);
    // fetch 4 bytes for a u32
    for (let i=0; i<n; i++) {
        const b = bytes[i];
        const bi = JSBI.BigInt(b);
        const e = JSBI.multiply(JSBI.BigInt(8), JSBI.BigInt(i))
        v = JSBI.add(v, JSBI.multiply(bi, JSBI.exponentiate(JSBI.BigInt(2), e)))
    }
    if (n == 4) {
        // u32 is not BigInt, so convert it to a number
        return JSBI.toNumber(v)
    } else {
        return v
    }
}

exports.ChaChaRng = ChaChaRng;
