import { Err, Ok, BuckyError, BuckyErrorCode, BuckyResult } from "./results";

declare global{
    interface Uint8Array{
        offset(offset: number):Uint8Array;
        offsetUint16Array(offset: number):Uint16Array;
        offsetUint32Array(offset: number):Uint32Array;
        offsetView(offset: number):DataView;
        toHex(): string;
        fromHex(hex: string): BuckyResult<Uint8Array>;
    }
}

Uint8Array.prototype.offset = function (size: number):Uint8Array{
    return new Uint8Array(this.buffer, this.byteOffset+size);
}

Uint8Array.prototype.offsetView = function (size: number):DataView{
    return new DataView(this.buffer, this.byteOffset+size);
}

Uint8Array.prototype.offsetUint16Array = function offsetUint16Array(size: number):Uint16Array{
    return new Uint16Array(this.buffer, this.byteOffset+size);
}

Uint8Array.prototype.offsetUint32Array = function offsetUint32Array(size: number):Uint32Array{
    return new Uint32Array(this.buffer, this.byteOffset+size);
}

Uint8Array.prototype.toHex = function toHex() {
    // TODO: nodejs 可优化
    return Array.prototype.map.call(new Uint8Array(this.buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

Uint8Array.prototype.fromHex = function fromHex(hex: string): BuckyResult<Uint8Array>{
    // TODO: nodejs 可优化
    const r = hex.match(/[\da-f]{2}/gi);
    if(r==null){
        return Err(new BuckyError(BuckyErrorCode.InvalidData, `Invalid hex string, can not convert to buffer, hex: ${hex}`));
    }
    return  Ok(new Uint8Array(r.map((h)=>{
        return parseInt(h, 16)
    })));
}

export {};