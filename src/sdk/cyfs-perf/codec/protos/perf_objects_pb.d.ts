// package: 
// file: perf_objects.proto

import * as jspb from "google-protobuf";

export class SizeResult extends jspb.Message {
  getTotal(): string;
  setTotal(value: string): void;

  getAvg(): string;
  setAvg(value: string): void;

  getMin(): string;
  setMin(value: string): void;

  getMax(): string;
  setMax(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SizeResult.AsObject;
  static toObject(includeInstance: boolean, msg: SizeResult): SizeResult.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SizeResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SizeResult;
  static deserializeBinaryFromReader(message: SizeResult, reader: jspb.BinaryReader): SizeResult;
}

export namespace SizeResult {
  export type AsObject = {
    total: string,
    avg: string,
    min: string,
    max: string,
  }
}

export class TimeResult extends jspb.Message {
  getTotal(): number;
  setTotal(value: number): void;

  getAvg(): number;
  setAvg(value: number): void;

  getMin(): number;
  setMin(value: number): void;

  getMax(): number;
  setMax(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TimeResult.AsObject;
  static toObject(includeInstance: boolean, msg: TimeResult): TimeResult.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TimeResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TimeResult;
  static deserializeBinaryFromReader(message: TimeResult, reader: jspb.BinaryReader): TimeResult;
}

export namespace TimeResult {
  export type AsObject = {
    total: number,
    avg: number,
    min: number,
    max: number,
  }
}

export class SpeedResult extends jspb.Message {
  getAvg(): number;
  setAvg(value: number): void;

  getMin(): number;
  setMin(value: number): void;

  getMax(): number;
  setMax(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SpeedResult.AsObject;
  static toObject(includeInstance: boolean, msg: SpeedResult): SpeedResult.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SpeedResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SpeedResult;
  static deserializeBinaryFromReader(message: SpeedResult, reader: jspb.BinaryReader): SpeedResult;
}

export namespace SpeedResult {
  export type AsObject = {
    avg: number,
    min: number,
    max: number,
  }
}

export class PerfRequest extends jspb.Message {
  hasTime(): boolean;
  clearTime(): void;
  getTime(): TimeResult | undefined;
  setTime(value?: TimeResult): void;

  hasSpeed(): boolean;
  clearSpeed(): void;
  getSpeed(): SpeedResult | undefined;
  setSpeed(value?: SpeedResult): void;

  hasSize(): boolean;
  clearSize(): void;
  getSize(): SizeResult | undefined;
  setSize(value?: SizeResult): void;

  getSuccess(): number;
  setSuccess(value: number): void;

  getFailed(): number;
  setFailed(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PerfRequest.AsObject;
  static toObject(includeInstance: boolean, msg: PerfRequest): PerfRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PerfRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PerfRequest;
  static deserializeBinaryFromReader(message: PerfRequest, reader: jspb.BinaryReader): PerfRequest;
}

export namespace PerfRequest {
  export type AsObject = {
    time?: TimeResult.AsObject,
    speed?: SpeedResult.AsObject,
    size?: SizeResult.AsObject,
    success: number,
    failed: number,
  }
}

export class PerfAccumulation extends jspb.Message {
  hasSize(): boolean;
  clearSize(): void;
  getSize(): SizeResult | undefined;
  setSize(value?: SizeResult): void;

  getSuccess(): number;
  setSuccess(value: number): void;

  getFailed(): number;
  setFailed(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PerfAccumulation.AsObject;
  static toObject(includeInstance: boolean, msg: PerfAccumulation): PerfAccumulation.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PerfAccumulation, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PerfAccumulation;
  static deserializeBinaryFromReader(message: PerfAccumulation, reader: jspb.BinaryReader): PerfAccumulation;
}

export namespace PerfAccumulation {
  export type AsObject = {
    size?: SizeResult.AsObject,
    success: number,
    failed: number,
  }
}

export class PerfAction extends jspb.Message {
  getErr(): number;
  setErr(value: number): void;

  getKey(): string;
  setKey(value: string): void;

  getValue(): string;
  setValue(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PerfAction.AsObject;
  static toObject(includeInstance: boolean, msg: PerfAction): PerfAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PerfAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PerfAction;
  static deserializeBinaryFromReader(message: PerfAction, reader: jspb.BinaryReader): PerfAction;
}

export namespace PerfAction {
  export type AsObject = {
    err: number,
    key: string,
    value: string,
  }
}

export class PerfRecord extends jspb.Message {
  getTotal(): string;
  setTotal(value: string): void;

  hasTotalSize(): boolean;
  clearTotalSize(): void;
  getTotalSize(): string;
  setTotalSize(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PerfRecord.AsObject;
  static toObject(includeInstance: boolean, msg: PerfRecord): PerfRecord.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PerfRecord, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PerfRecord;
  static deserializeBinaryFromReader(message: PerfRecord, reader: jspb.BinaryReader): PerfRecord;
}

export namespace PerfRecord {
  export type AsObject = {
    total: string,
    totalSize: string,
  }
}

