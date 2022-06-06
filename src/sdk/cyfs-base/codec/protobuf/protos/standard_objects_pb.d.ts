// package: 
// file: standard_objects.proto

import * as jspb from "google-protobuf";

export class ContractBodyContent extends jspb.Message {
  getData(): Uint8Array | string;
  getData_asU8(): Uint8Array;
  getData_asB64(): string;
  setData(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ContractBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: ContractBodyContent): ContractBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ContractBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ContractBodyContent;
  static deserializeBinaryFromReader(message: ContractBodyContent, reader: jspb.BinaryReader): ContractBodyContent;
}

export namespace ContractBodyContent {
  export type AsObject = {
    data: Uint8Array | string,
  }
}

export class DeviceBodyContent extends jspb.Message {
  clearEndpointsList(): void;
  getEndpointsList(): Array<Uint8Array | string>;
  getEndpointsList_asU8(): Array<Uint8Array>;
  getEndpointsList_asB64(): Array<string>;
  setEndpointsList(value: Array<Uint8Array | string>): void;
  addEndpoints(value: Uint8Array | string, index?: number): Uint8Array | string;

  clearSnListList(): void;
  getSnListList(): Array<Uint8Array | string>;
  getSnListList_asU8(): Array<Uint8Array>;
  getSnListList_asB64(): Array<string>;
  setSnListList(value: Array<Uint8Array | string>): void;
  addSnList(value: Uint8Array | string, index?: number): Uint8Array | string;

  clearPassivePnListList(): void;
  getPassivePnListList(): Array<Uint8Array | string>;
  getPassivePnListList_asU8(): Array<Uint8Array>;
  getPassivePnListList_asB64(): Array<string>;
  setPassivePnListList(value: Array<Uint8Array | string>): void;
  addPassivePnList(value: Uint8Array | string, index?: number): Uint8Array | string;

  hasName(): boolean;
  clearName(): void;
  getName(): string;
  setName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeviceBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: DeviceBodyContent): DeviceBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DeviceBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeviceBodyContent;
  static deserializeBinaryFromReader(message: DeviceBodyContent, reader: jspb.BinaryReader): DeviceBodyContent;
}

export namespace DeviceBodyContent {
  export type AsObject = {
    endpointsList: Array<Uint8Array | string>,
    snListList: Array<Uint8Array | string>,
    passivePnListList: Array<Uint8Array | string>,
    name: string,
  }
}

export class DirBodyContent extends jspb.Message {
  getType(): DirBodyContent.TypeMap[keyof DirBodyContent.TypeMap];
  setType(value: DirBodyContent.TypeMap[keyof DirBodyContent.TypeMap]): void;

  hasChunkId(): boolean;
  clearChunkId(): void;
  getChunkId(): Uint8Array | string;
  getChunkId_asU8(): Uint8Array;
  getChunkId_asB64(): string;
  setChunkId(value: Uint8Array | string): void;

  clearObjListList(): void;
  getObjListList(): Array<DirBodyContent.ObjItem>;
  setObjListList(value: Array<DirBodyContent.ObjItem>): void;
  addObjList(value?: DirBodyContent.ObjItem, index?: number): DirBodyContent.ObjItem;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DirBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: DirBodyContent): DirBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DirBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DirBodyContent;
  static deserializeBinaryFromReader(message: DirBodyContent, reader: jspb.BinaryReader): DirBodyContent;
}

export namespace DirBodyContent {
  export type AsObject = {
    type: DirBodyContent.TypeMap[keyof DirBodyContent.TypeMap],
    chunkId: Uint8Array | string,
    objListList: Array<DirBodyContent.ObjItem.AsObject>,
  }

  export class ObjItem extends jspb.Message {
    getObjId(): Uint8Array | string;
    getObjId_asU8(): Uint8Array;
    getObjId_asB64(): string;
    setObjId(value: Uint8Array | string): void;

    getValue(): Uint8Array | string;
    getValue_asU8(): Uint8Array;
    getValue_asB64(): string;
    setValue(value: Uint8Array | string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ObjItem.AsObject;
    static toObject(includeInstance: boolean, msg: ObjItem): ObjItem.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ObjItem, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ObjItem;
    static deserializeBinaryFromReader(message: ObjItem, reader: jspb.BinaryReader): ObjItem;
  }

  export namespace ObjItem {
    export type AsObject = {
      objId: Uint8Array | string,
      value: Uint8Array | string,
    }
  }

  export interface TypeMap {
    CHUNK: 0;
    OBJLIST: 1;
  }

  export const Type: TypeMap;
}

export class ChunkList extends jspb.Message {
  getType(): ChunkList.TypeMap[keyof ChunkList.TypeMap];
  setType(value: ChunkList.TypeMap[keyof ChunkList.TypeMap]): void;

  clearChunkIdListList(): void;
  getChunkIdListList(): Array<Uint8Array | string>;
  getChunkIdListList_asU8(): Array<Uint8Array>;
  getChunkIdListList_asB64(): Array<string>;
  setChunkIdListList(value: Array<Uint8Array | string>): void;
  addChunkIdList(value: Uint8Array | string, index?: number): Uint8Array | string;

  getFileId(): Uint8Array | string;
  getFileId_asU8(): Uint8Array;
  getFileId_asB64(): string;
  setFileId(value: Uint8Array | string): void;

  hasHashMethod(): boolean;
  clearHashMethod(): void;
  getHashMethod(): ChunkList.HashMethodMap[keyof ChunkList.HashMethodMap];
  setHashMethod(value: ChunkList.HashMethodMap[keyof ChunkList.HashMethodMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChunkList.AsObject;
  static toObject(includeInstance: boolean, msg: ChunkList): ChunkList.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChunkList, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChunkList;
  static deserializeBinaryFromReader(message: ChunkList, reader: jspb.BinaryReader): ChunkList;
}

export namespace ChunkList {
  export type AsObject = {
    type: ChunkList.TypeMap[keyof ChunkList.TypeMap],
    chunkIdListList: Array<Uint8Array | string>,
    fileId: Uint8Array | string,
    hashMethod: ChunkList.HashMethodMap[keyof ChunkList.HashMethodMap],
  }

  export interface TypeMap {
    CHUNKINLIST: 0;
    CHUNKINFILE: 1;
    CHUNKINBUNDLE: 2;
  }

  export const Type: TypeMap;

  export interface HashMethodMap {
    SERIAL: 0;
  }

  export const HashMethod: HashMethodMap;
}

export class FileBodyContent extends jspb.Message {
  hasChunkList(): boolean;
  clearChunkList(): void;
  getChunkList(): ChunkList | undefined;
  setChunkList(value?: ChunkList): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FileBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: FileBodyContent): FileBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: FileBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FileBodyContent;
  static deserializeBinaryFromReader(message: FileBodyContent, reader: jspb.BinaryReader): FileBodyContent;
}

export namespace FileBodyContent {
  export type AsObject = {
    chunkList?: ChunkList.AsObject,
  }
}

export class Director extends jspb.Message {
  getId(): Uint8Array | string;
  getId_asU8(): Uint8Array;
  getId_asB64(): string;
  setId(value: Uint8Array | string): void;

  getRight(): number;
  setRight(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Director.AsObject;
  static toObject(includeInstance: boolean, msg: Director): Director.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Director, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Director;
  static deserializeBinaryFromReader(message: Director, reader: jspb.BinaryReader): Director;
}

export namespace Director {
  export type AsObject = {
    id: Uint8Array | string,
    right: number,
  }
}

export class OrgMember extends jspb.Message {
  getId(): Uint8Array | string;
  getId_asU8(): Uint8Array;
  getId_asB64(): string;
  setId(value: Uint8Array | string): void;

  getRight(): number;
  setRight(value: number): void;

  getShares(): string;
  setShares(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OrgMember.AsObject;
  static toObject(includeInstance: boolean, msg: OrgMember): OrgMember.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OrgMember, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OrgMember;
  static deserializeBinaryFromReader(message: OrgMember, reader: jspb.BinaryReader): OrgMember;
}

export namespace OrgMember {
  export type AsObject = {
    id: Uint8Array | string,
    right: number,
    shares: string,
  }
}

export class OrgBodyContent extends jspb.Message {
  clearMembersList(): void;
  getMembersList(): Array<OrgMember>;
  setMembersList(value: Array<OrgMember>): void;
  addMembers(value?: OrgMember, index?: number): OrgMember;

  clearDirectorsList(): void;
  getDirectorsList(): Array<Director>;
  setDirectorsList(value: Array<Director>): void;
  addDirectors(value?: Director, index?: number): Director;

  getTotalEquity(): string;
  setTotalEquity(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OrgBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: OrgBodyContent): OrgBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OrgBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OrgBodyContent;
  static deserializeBinaryFromReader(message: OrgBodyContent, reader: jspb.BinaryReader): OrgBodyContent;
}

export namespace OrgBodyContent {
  export type AsObject = {
    membersList: Array<OrgMember.AsObject>,
    directorsList: Array<Director.AsObject>,
    totalEquity: string,
  }
}

export class PeopleBodyContent extends jspb.Message {
  clearOodListList(): void;
  getOodListList(): Array<Uint8Array | string>;
  getOodListList_asU8(): Array<Uint8Array>;
  getOodListList_asB64(): Array<string>;
  setOodListList(value: Array<Uint8Array | string>): void;
  addOodList(value: Uint8Array | string, index?: number): Uint8Array | string;

  hasName(): boolean;
  clearName(): void;
  getName(): string;
  setName(value: string): void;

  hasIcon(): boolean;
  clearIcon(): void;
  getIcon(): Uint8Array | string;
  getIcon_asU8(): Uint8Array;
  getIcon_asB64(): string;
  setIcon(value: Uint8Array | string): void;

  hasOodWorkMode(): boolean;
  clearOodWorkMode(): void;
  getOodWorkMode(): string;
  setOodWorkMode(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PeopleBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: PeopleBodyContent): PeopleBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PeopleBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PeopleBodyContent;
  static deserializeBinaryFromReader(message: PeopleBodyContent, reader: jspb.BinaryReader): PeopleBodyContent;
}

export namespace PeopleBodyContent {
  export type AsObject = {
    oodListList: Array<Uint8Array | string>,
    name: string,
    icon: Uint8Array | string,
    oodWorkMode: string,
  }
}

export class SimpleGroupBodyContent extends jspb.Message {
  clearMembersList(): void;
  getMembersList(): Array<Uint8Array | string>;
  getMembersList_asU8(): Array<Uint8Array>;
  getMembersList_asB64(): Array<string>;
  setMembersList(value: Array<Uint8Array | string>): void;
  addMembers(value: Uint8Array | string, index?: number): Uint8Array | string;

  clearOodListList(): void;
  getOodListList(): Array<Uint8Array | string>;
  getOodListList_asU8(): Array<Uint8Array>;
  getOodListList_asB64(): Array<string>;
  setOodListList(value: Array<Uint8Array | string>): void;
  addOodList(value: Uint8Array | string, index?: number): Uint8Array | string;

  hasOodWorkMode(): boolean;
  clearOodWorkMode(): void;
  getOodWorkMode(): string;
  setOodWorkMode(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SimpleGroupBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: SimpleGroupBodyContent): SimpleGroupBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SimpleGroupBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SimpleGroupBodyContent;
  static deserializeBinaryFromReader(message: SimpleGroupBodyContent, reader: jspb.BinaryReader): SimpleGroupBodyContent;
}

export namespace SimpleGroupBodyContent {
  export type AsObject = {
    membersList: Array<Uint8Array | string>,
    oodListList: Array<Uint8Array | string>,
    oodWorkMode: string,
  }
}

export class TxBodyContent extends jspb.Message {
  getData(): Uint8Array | string;
  getData_asU8(): Uint8Array;
  getData_asB64(): string;
  setData(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TxBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: TxBodyContent): TxBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TxBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TxBodyContent;
  static deserializeBinaryFromReader(message: TxBodyContent, reader: jspb.BinaryReader): TxBodyContent;
}

export namespace TxBodyContent {
  export type AsObject = {
    data: Uint8Array | string,
  }
}

export class ProofData extends jspb.Message {
  getData(): Uint8Array | string;
  getData_asU8(): Uint8Array;
  getData_asB64(): string;
  setData(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProofData.AsObject;
  static toObject(includeInstance: boolean, msg: ProofData): ProofData.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ProofData, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProofData;
  static deserializeBinaryFromReader(message: ProofData, reader: jspb.BinaryReader): ProofData;
}

export namespace ProofData {
  export type AsObject = {
    data: Uint8Array | string,
  }
}

export class ProofOfServiceBodyContent extends jspb.Message {
  hasData(): boolean;
  clearData(): void;
  getData(): ProofData | undefined;
  setData(value?: ProofData): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProofOfServiceBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: ProofOfServiceBodyContent): ProofOfServiceBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ProofOfServiceBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProofOfServiceBodyContent;
  static deserializeBinaryFromReader(message: ProofOfServiceBodyContent, reader: jspb.BinaryReader): ProofOfServiceBodyContent;
}

export namespace ProofOfServiceBodyContent {
  export type AsObject = {
    data?: ProofData.AsObject,
  }
}

