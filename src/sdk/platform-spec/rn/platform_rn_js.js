if (typeof BigInt === 'undefined') {
    global.BigInt = require('big-integer');
}

FileReader.prototype.readAsArrayBuffer = function (blob) {
    if (this.readyState === this.LOADING) throw new Error("InvalidStateError");
    this._setReadyState(this.LOADING);
    this._result = null;
    this._error = null;
    const fr = new FileReader();
    fr.onloadend = () => {
        const content = atob(fr.result.substr("data:application/octet-stream;base64,".length));
        const buffer = new ArrayBuffer(content.length);
        const view = new Uint8Array(buffer);
        view.set(Array.from(content).map(c => c.charCodeAt(0)));
        this._result = buffer;
        this._setReadyState(this.DONE);
    };
    fr.readAsDataURL(blob);
}

if (!DataView.prototype.setBigUint64) {
    DataView.prototype.setBigUint64 = function (byteOffset, value, littleEndian) {
        const highWord = Number(value.shiftRight(32).and(0xFFFFFFFF));
        const lowWord = Number(value.and(0xFFFFFFFF));

        this.setUint32(byteOffset + (littleEndian ? 0 : 4), lowWord, littleEndian);
        this.setUint32(byteOffset + (littleEndian ? 4 : 0), highWord, littleEndian);
    };

    DataView.prototype.getBigUint64 = function (byteOffset, littleEndian) {
        const lowWord = this.getUint32(byteOffset + (littleEndian ? 0 : 4), littleEndian);
        const highWord = this.getUint32(byteOffset + (littleEndian ? 4 : 0), littleEndian);

        const result = BigInt(highWord);
        return result.shiftLeft(32).add(lowWord);
    };
}