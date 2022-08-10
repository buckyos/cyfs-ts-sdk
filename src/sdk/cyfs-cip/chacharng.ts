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

    getBytesSync(length: number): Uint8Array {
        let output = new Uint8Array(length);
        this.fillBytes(output);
        return output
    }
}

exports.ChaChaRng = ChaChaRng;
