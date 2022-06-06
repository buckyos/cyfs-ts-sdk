import {BuckyError, BuckyErrorCode, BuckyResult} from "../../cyfs-base";
import {Err, Ok} from "ts-results";

const WS_PACKET_MAGIC = 0x88;
const WS_PACKET_VERSION = 0x01;
const WS_PACKET_HEADER_LENGTH = 10;

export class WSPacketHeader {
    magic: number = WS_PACKET_MAGIC;
    version: number = WS_PACKET_VERSION;

    constructor(
        public seq: number,
        public cmd: number,
        public content_length: number) {
    }

    static parse(buf: Uint8Array): BuckyResult<WSPacketHeader> {
        const dv = new DataView(buf.buffer, buf.byteOffset);
        let offset = 0;
        const magic = dv.getUint8(offset);
        if (magic !== WS_PACKET_MAGIC) {
            const msg = `invalid ws packet header magic: v=${magic}`;
            console.error(msg);

            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        offset += 1;
        const _version = dv.getUint8(offset);

        offset += 1;
        const seq = dv.getUint16(offset);
        offset += 2;
        const cmd = dv.getUint16(offset);
        offset += 2;
        const content_length = dv.getUint32(offset);
        return Ok(new WSPacketHeader(seq, cmd, content_length));
    }

    encode(buf: Uint8Array) {
        const dv = new DataView(buf.buffer, buf.byteOffset);
        let offset = 0;
        dv.setUint8(offset, this.magic);
        offset += 1;
        dv.setUint8(offset, this.version);
        offset += 1;
        dv.setUint16(offset, this.seq);
        offset += 2;
        dv.setUint16(offset, this.cmd);
        offset += 2;
        dv.setUint32(offset, this.content_length);
    }
}

export class WSPacket {
    constructor(public header: WSPacketHeader, public content: Uint8Array) {
    }

    static new_from_buffer(seq: number, cmd: number, msg: Uint8Array): WSPacket {
        // console.log('new ws packet from string:', { seq, cmd, msg });
        const header = new WSPacketHeader(seq, cmd, msg.length);
        return new WSPacket(header, msg);
    }

    static decode_from_buffer(buf: Uint8Array): WSPacket {
        const header = WSPacketHeader.parse(buf).unwrap();
        const content = new Uint8Array(buf.buffer, WS_PACKET_HEADER_LENGTH, header.content_length);
        return new WSPacket(header, content);
    }

    encode(): Uint8Array {
        const len = WS_PACKET_HEADER_LENGTH + this.content.byteLength;
        const buf = new Uint8Array(len);
        this.header.encode(buf);
        for (let i = 0; i < this.content.length; i++) {
            buf[WS_PACKET_HEADER_LENGTH + i] = this.content[i];
        }
        // console.log('WSPacket encode', buf);
        return buf;
    }
}

