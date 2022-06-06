// package: 
// file: empty_content.proto

import * as jspb from "google-protobuf";

export class EmptyContent extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EmptyContent.AsObject;
  static toObject(includeInstance: boolean, msg: EmptyContent): EmptyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: EmptyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EmptyContent;
  static deserializeBinaryFromReader(message: EmptyContent, reader: jspb.BinaryReader): EmptyContent;
}

export namespace EmptyContent {
  export type AsObject = {
  }
}

export class EmptyContentV1 extends jspb.Message {
  hasName(): boolean;
  clearName(): void;
  getName(): string;
  setName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EmptyContentV1.AsObject;
  static toObject(includeInstance: boolean, msg: EmptyContentV1): EmptyContentV1.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: EmptyContentV1, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EmptyContentV1;
  static deserializeBinaryFromReader(message: EmptyContentV1, reader: jspb.BinaryReader): EmptyContentV1;
}

export namespace EmptyContentV1 {
  export type AsObject = {
    name: string,
  }
}

