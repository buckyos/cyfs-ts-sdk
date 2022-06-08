
if (typeof window !== 'undefined' && typeof window.Buffer == 'undefined')
{
    window.Buffer = require('buffer').Buffer;
}

if (!DataView.prototype.setBigUint64)
{
    DataView.prototype.setBigUint64 = function(byteOffset, value, littleEndian)
    {
        const highWord = Number(value.shiftRight(32).and(0xFFFFFFFF));
        const lowWord = Number(value.and(0xFFFFFFFF));

        this.setUint32(byteOffset + (littleEndian ? 0 : 4), lowWord, littleEndian);
        this.setUint32(byteOffset + (littleEndian ? 4 : 0), highWord, littleEndian);
    };

    DataView.prototype.getBigUint64 = function(byteOffset, littleEndian)
    {
        const lowWord = this.getUint32(byteOffset + (littleEndian ? 0 : 4), littleEndian);
        const highWord = this.getUint32(byteOffset + (littleEndian ? 4 : 0), littleEndian);

        const result = BigInt(highWord);
        return result.shiftLeft(32).add(lowWord);
    };
}