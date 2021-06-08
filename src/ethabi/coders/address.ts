

import { buffer_from_hex, ObjectId } from "../../cyfs-base";

import { Coder, Reader, Writer } from "./abstract-coder";

export class AddressCoder extends Coder {

    constructor(localName: string) {
        super("address", "address", localName, false);
    }

    defaultValue(): string {
        return ObjectId.default().to_base_58();
    }

    encode(writer: Writer, value: string): number {
        const object_id = ObjectId.from_base_58(value).unwrap();
        return writer.writeValue(object_id.as_slice());
    }

    decode(reader: Reader): any {
        return ObjectId.copy_from_slice(buffer_from_hex(reader.readValue().toHexString()).unwrap())
    }
}

