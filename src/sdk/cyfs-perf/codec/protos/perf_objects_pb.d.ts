// package: 
// file: perf_objects.proto

import * as jspb from "google-protobuf";

export class PerfTimeRange extends jspb.Message {
  getBegin(): string;
  setBegin(value: string): void;

  getEnd(): string;
  setEnd(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PerfTimeRange.AsObject;
  static toObject(includeInstance: boolean, msg: PerfTimeRange): PerfTimeRange.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PerfTimeRange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PerfTimeRange;
  static deserializeBinaryFromReader(message: PerfTimeRange, reader: jspb.BinaryReader): PerfTimeRange;
}

export namespace PerfTimeRange {
  export type AsObject = {
    begin: string,
    end: string,
  }
}

export class PerfRequest extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  hasTimeRange(): boolean;
  clearTimeRange(): void;
  getTimeRange(): PerfTimeRange | undefined;
  setTimeRange(value?: PerfTimeRange): void;

  getTotal(): number;
  setTotal(value: number): void;

  getSuccess(): number;
  setSuccess(value: number): void;

  getTotalTime(): string;
  setTotalTime(value: string): void;

  hasTotalSize(): boolean;
  clearTotalSize(): void;
  getTotalSize(): string;
  setTotalSize(value: string): void;

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
    id: string,
    timeRange?: PerfTimeRange.AsObject,
    total: number,
    success: number,
    totalTime: string,
    totalSize: string,
  }
}

export class PerfAccumulation extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  hasTimeRange(): boolean;
  clearTimeRange(): void;
  getTimeRange(): PerfTimeRange | undefined;
  setTimeRange(value?: PerfTimeRange): void;

  getTotal(): number;
  setTotal(value: number): void;

  getSuccess(): number;
  setSuccess(value: number): void;

  hasTotalSize(): boolean;
  clearTotalSize(): void;
  getTotalSize(): string;
  setTotalSize(value: string): void;

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
    id: string,
    timeRange?: PerfTimeRange.AsObject,
    total: number,
    success: number,
    totalSize: string,
  }
}

export class PerfRecord extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getTime(): string;
  setTime(value: string): void;

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
    id: string,
    time: string,
    total: string,
    totalSize: string,
  }
}

export class PerfAction extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getTime(): string;
  setTime(value: string): void;

  getErr(): number;
  setErr(value: number): void;

  getName(): string;
  setName(value: string): void;

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
    id: string,
    time: string,
    err: number,
    name: string,
    value: string,
  }
}

export class PerfIsolateEntity extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  hasTimeRange(): boolean;
  clearTimeRange(): void;
  getTimeRange(): PerfTimeRange | undefined;
  setTimeRange(value?: PerfTimeRange): void;

  clearActionsList(): void;
  getActionsList(): Array<PerfAction>;
  setActionsList(value: Array<PerfAction>): void;
  addActions(value?: PerfAction, index?: number): PerfAction;

  getRecordsMap(): jspb.Map<string, PerfRecord>;
  clearRecordsMap(): void;
  getAccumulationsMap(): jspb.Map<string, PerfAccumulation>;
  clearAccumulationsMap(): void;
  getReqsMap(): jspb.Map<string, PerfRequest>;
  clearReqsMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PerfIsolateEntity.AsObject;
  static toObject(includeInstance: boolean, msg: PerfIsolateEntity): PerfIsolateEntity.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PerfIsolateEntity, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PerfIsolateEntity;
  static deserializeBinaryFromReader(message: PerfIsolateEntity, reader: jspb.BinaryReader): PerfIsolateEntity;
}

export namespace PerfIsolateEntity {
  export type AsObject = {
    id: string,
    timeRange?: PerfTimeRange.AsObject,
    actionsList: Array<PerfAction.AsObject>,
    recordsMap: Array<[string, PerfRecord.AsObject]>,
    accumulationsMap: Array<[string, PerfAccumulation.AsObject]>,
    reqsMap: Array<[string, PerfRequest.AsObject]>,
  }
}

export class PerfDescContent extends jspb.Message {
  getDevice(): Uint8Array | string;
  getDevice_asU8(): Uint8Array;
  getDevice_asB64(): string;
  setDevice(value: Uint8Array | string): void;

  getPeople(): Uint8Array | string;
  getPeople_asU8(): Uint8Array;
  getPeople_asB64(): string;
  setPeople(value: Uint8Array | string): void;

  getId(): string;
  setId(value: string): void;

  getVersion(): string;
  setVersion(value: string): void;

  getHash(): string;
  setHash(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PerfDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: PerfDescContent): PerfDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PerfDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PerfDescContent;
  static deserializeBinaryFromReader(message: PerfDescContent, reader: jspb.BinaryReader): PerfDescContent;
}

export namespace PerfDescContent {
  export type AsObject = {
    device: Uint8Array | string,
    people: Uint8Array | string,
    id: string,
    version: string,
    hash: string,
  }
}

export class PerfBodyContent extends jspb.Message {
  hasTimeRange(): boolean;
  clearTimeRange(): void;
  getTimeRange(): PerfTimeRange | undefined;
  setTimeRange(value?: PerfTimeRange): void;

  getAllMap(): jspb.Map<string, PerfIsolateEntity>;
  clearAllMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PerfBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: PerfBodyContent): PerfBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PerfBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PerfBodyContent;
  static deserializeBinaryFromReader(message: PerfBodyContent, reader: jspb.BinaryReader): PerfBodyContent;
}

export namespace PerfBodyContent {
  export type AsObject = {
    timeRange?: PerfTimeRange.AsObject,
    allMap: Array<[string, PerfIsolateEntity.AsObject]>,
  }
}

