// package: 
// file: core_objects.proto

import * as jspb from "google-protobuf";

export class StorageDescContent extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  hasHash(): boolean;
  clearHash(): void;
  getHash(): Uint8Array | string;
  getHash_asU8(): Uint8Array;
  getHash_asB64(): string;
  setHash(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StorageDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: StorageDescContent): StorageDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StorageDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StorageDescContent;
  static deserializeBinaryFromReader(message: StorageDescContent, reader: jspb.BinaryReader): StorageDescContent;
}

export namespace StorageDescContent {
  export type AsObject = {
    id: string,
    hash: Uint8Array | string,
  }
}

export class StorageBodyContent extends jspb.Message {
  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StorageBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: StorageBodyContent): StorageBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StorageBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StorageBodyContent;
  static deserializeBinaryFromReader(message: StorageBodyContent, reader: jspb.BinaryReader): StorageBodyContent;
}

export namespace StorageBodyContent {
  export type AsObject = {
    value: Uint8Array | string,
  }
}

export class TextDescContent extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getHeader(): string;
  setHeader(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TextDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: TextDescContent): TextDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TextDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TextDescContent;
  static deserializeBinaryFromReader(message: TextDescContent, reader: jspb.BinaryReader): TextDescContent;
}

export namespace TextDescContent {
  export type AsObject = {
    id: string,
    header: string,
  }
}

export class TextContent extends jspb.Message {
  getValue(): string;
  setValue(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TextContent.AsObject;
  static toObject(includeInstance: boolean, msg: TextContent): TextContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TextContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TextContent;
  static deserializeBinaryFromReader(message: TextContent, reader: jspb.BinaryReader): TextContent;
}

export namespace TextContent {
  export type AsObject = {
    value: string,
  }
}

export class ZoneDescContent extends jspb.Message {
  getOwner(): Uint8Array | string;
  getOwner_asU8(): Uint8Array;
  getOwner_asB64(): string;
  setOwner(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ZoneDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: ZoneDescContent): ZoneDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ZoneDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ZoneDescContent;
  static deserializeBinaryFromReader(message: ZoneDescContent, reader: jspb.BinaryReader): ZoneDescContent;
}

export namespace ZoneDescContent {
  export type AsObject = {
    owner: Uint8Array | string,
  }
}

export class ZoneBodyContent extends jspb.Message {
  clearOodListList(): void;
  getOodListList(): Array<Uint8Array | string>;
  getOodListList_asU8(): Array<Uint8Array>;
  getOodListList_asB64(): Array<string>;
  setOodListList(value: Array<Uint8Array | string>): void;
  addOodList(value: Uint8Array | string, index?: number): Uint8Array | string;

  clearKnownDeviceListList(): void;
  getKnownDeviceListList(): Array<Uint8Array | string>;
  getKnownDeviceListList_asU8(): Array<Uint8Array>;
  getKnownDeviceListList_asB64(): Array<string>;
  setKnownDeviceListList(value: Array<Uint8Array | string>): void;
  addKnownDeviceList(value: Uint8Array | string, index?: number): Uint8Array | string;

  hasOodWorkMode(): boolean;
  clearOodWorkMode(): void;
  getOodWorkMode(): string;
  setOodWorkMode(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ZoneBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: ZoneBodyContent): ZoneBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ZoneBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ZoneBodyContent;
  static deserializeBinaryFromReader(message: ZoneBodyContent, reader: jspb.BinaryReader): ZoneBodyContent;
}

export namespace ZoneBodyContent {
  export type AsObject = {
    oodListList: Array<Uint8Array | string>,
    knownDeviceListList: Array<Uint8Array | string>,
    oodWorkMode: string,
  }
}

export class AdminGlobalStateAccessModeData extends jspb.Message {
  getCategory(): AdminGlobalStateAccessModeData.CategoryMap[keyof AdminGlobalStateAccessModeData.CategoryMap];
  setCategory(value: AdminGlobalStateAccessModeData.CategoryMap[keyof AdminGlobalStateAccessModeData.CategoryMap]): void;

  getAccessMode(): AdminGlobalStateAccessModeData.AccessModeMap[keyof AdminGlobalStateAccessModeData.AccessModeMap];
  setAccessMode(value: AdminGlobalStateAccessModeData.AccessModeMap[keyof AdminGlobalStateAccessModeData.AccessModeMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AdminGlobalStateAccessModeData.AsObject;
  static toObject(includeInstance: boolean, msg: AdminGlobalStateAccessModeData): AdminGlobalStateAccessModeData.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AdminGlobalStateAccessModeData, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AdminGlobalStateAccessModeData;
  static deserializeBinaryFromReader(message: AdminGlobalStateAccessModeData, reader: jspb.BinaryReader): AdminGlobalStateAccessModeData;
}

export namespace AdminGlobalStateAccessModeData {
  export type AsObject = {
    category: AdminGlobalStateAccessModeData.CategoryMap[keyof AdminGlobalStateAccessModeData.CategoryMap],
    accessMode: AdminGlobalStateAccessModeData.AccessModeMap[keyof AdminGlobalStateAccessModeData.AccessModeMap],
  }

  export interface CategoryMap {
    ROOTSTATE: 0;
    LOCALCACHE: 1;
  }

  export const Category: CategoryMap;

  export interface AccessModeMap {
    READ: 0;
    WRITE: 1;
  }

  export const AccessMode: AccessModeMap;
}

export class AdminDescContent extends jspb.Message {
  getTarget(): Uint8Array | string;
  getTarget_asU8(): Uint8Array;
  getTarget_asB64(): string;
  setTarget(value: Uint8Array | string): void;

  getCmd(): AdminDescContent.CommandMap[keyof AdminDescContent.CommandMap];
  setCmd(value: AdminDescContent.CommandMap[keyof AdminDescContent.CommandMap]): void;

  hasGlobalStateAccessMode(): boolean;
  clearGlobalStateAccessMode(): void;
  getGlobalStateAccessMode(): AdminGlobalStateAccessModeData | undefined;
  setGlobalStateAccessMode(value?: AdminGlobalStateAccessModeData): void;

  getDataCase(): AdminDescContent.DataCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AdminDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: AdminDescContent): AdminDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AdminDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AdminDescContent;
  static deserializeBinaryFromReader(message: AdminDescContent, reader: jspb.BinaryReader): AdminDescContent;
}

export namespace AdminDescContent {
  export type AsObject = {
    target: Uint8Array | string,
    cmd: AdminDescContent.CommandMap[keyof AdminDescContent.CommandMap],
    globalStateAccessMode?: AdminGlobalStateAccessModeData.AsObject,
  }

  export interface CommandMap {
    GLOBALSTATEACCESSMODE: 0;
  }

  export const Command: CommandMap;

  export enum DataCase {
    DATA_NOT_SET = 0,
    GLOBAL_STATE_ACCESS_MODE = 6,
  }
}

export class AppExtInfoDescContent extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppExtInfoDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: AppExtInfoDescContent): AppExtInfoDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppExtInfoDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppExtInfoDescContent;
  static deserializeBinaryFromReader(message: AppExtInfoDescContent, reader: jspb.BinaryReader): AppExtInfoDescContent;
}

export namespace AppExtInfoDescContent {
  export type AsObject = {
    id: string,
  }
}

export class AppExtInfoBodyContent extends jspb.Message {
  getInfo(): string;
  setInfo(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppExtInfoBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: AppExtInfoBodyContent): AppExtInfoBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppExtInfoBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppExtInfoBodyContent;
  static deserializeBinaryFromReader(message: AppExtInfoBodyContent, reader: jspb.BinaryReader): AppExtInfoBodyContent;
}

export namespace AppExtInfoBodyContent {
  export type AsObject = {
    info: string,
  }
}

export class AppPermission extends jspb.Message {
  getPermission(): string;
  setPermission(value: string): void;

  getReason(): string;
  setReason(value: string): void;

  getState(): number;
  setState(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppPermission.AsObject;
  static toObject(includeInstance: boolean, msg: AppPermission): AppPermission.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppPermission, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppPermission;
  static deserializeBinaryFromReader(message: AppPermission, reader: jspb.BinaryReader): AppPermission;
}

export namespace AppPermission {
  export type AsObject = {
    permission: string,
    reason: string,
    state: number,
  }
}

export class AppLocalStatusDesc extends jspb.Message {
  getId(): Uint8Array | string;
  getId_asU8(): Uint8Array;
  getId_asB64(): string;
  setId(value: Uint8Array | string): void;

  getStatus(): number;
  setStatus(value: number): void;

  hasVersion(): boolean;
  clearVersion(): void;
  getVersion(): string;
  setVersion(value: string): void;

  hasWebDir(): boolean;
  clearWebDir(): void;
  getWebDir(): Uint8Array | string;
  getWebDir_asU8(): Uint8Array;
  getWebDir_asB64(): string;
  setWebDir(value: Uint8Array | string): void;

  clearPermissionsList(): void;
  getPermissionsList(): Array<AppPermission>;
  setPermissionsList(value: Array<AppPermission>): void;
  addPermissions(value?: AppPermission, index?: number): AppPermission;

  hasQuota(): boolean;
  clearQuota(): void;
  getQuota(): AppQuota | undefined;
  setQuota(value?: AppQuota): void;

  getLastStatusUpdateTime(): string;
  setLastStatusUpdateTime(value: string): void;

  getSubError(): number;
  setSubError(value: number): void;

  getAutoUpdate(): boolean;
  setAutoUpdate(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppLocalStatusDesc.AsObject;
  static toObject(includeInstance: boolean, msg: AppLocalStatusDesc): AppLocalStatusDesc.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppLocalStatusDesc, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppLocalStatusDesc;
  static deserializeBinaryFromReader(message: AppLocalStatusDesc, reader: jspb.BinaryReader): AppLocalStatusDesc;
}

export namespace AppLocalStatusDesc {
  export type AsObject = {
    id: Uint8Array | string,
    status: number,
    version: string,
    webDir: Uint8Array | string,
    permissionsList: Array<AppPermission.AsObject>,
    quota?: AppQuota.AsObject,
    lastStatusUpdateTime: string,
    subError: number,
    autoUpdate: boolean,
  }
}

export class AppSettingDesc extends jspb.Message {
  getId(): Uint8Array | string;
  getId_asU8(): Uint8Array;
  getId_asB64(): string;
  setId(value: Uint8Array | string): void;

  getAutoUpdate(): boolean;
  setAutoUpdate(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppSettingDesc.AsObject;
  static toObject(includeInstance: boolean, msg: AppSettingDesc): AppSettingDesc.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppSettingDesc, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppSettingDesc;
  static deserializeBinaryFromReader(message: AppSettingDesc, reader: jspb.BinaryReader): AppSettingDesc;
}

export namespace AppSettingDesc {
  export type AsObject = {
    id: Uint8Array | string,
    autoUpdate: boolean,
  }
}

export class AppLocalListDesc extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  clearListList(): void;
  getListList(): Array<AppLocalListItem>;
  setListList(value: Array<AppLocalListItem>): void;
  addList(value?: AppLocalListItem, index?: number): AppLocalListItem;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppLocalListDesc.AsObject;
  static toObject(includeInstance: boolean, msg: AppLocalListDesc): AppLocalListDesc.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppLocalListDesc, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppLocalListDesc;
  static deserializeBinaryFromReader(message: AppLocalListDesc, reader: jspb.BinaryReader): AppLocalListDesc;
}

export namespace AppLocalListDesc {
  export type AsObject = {
    id: string,
    listList: Array<AppLocalListItem.AsObject>,
  }
}

export class AppLocalListItem extends jspb.Message {
  getAppId(): Uint8Array | string;
  getAppId_asU8(): Uint8Array;
  getAppId_asB64(): string;
  setAppId(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppLocalListItem.AsObject;
  static toObject(includeInstance: boolean, msg: AppLocalListItem): AppLocalListItem.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppLocalListItem, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppLocalListItem;
  static deserializeBinaryFromReader(message: AppLocalListItem, reader: jspb.BinaryReader): AppLocalListItem;
}

export namespace AppLocalListItem {
  export type AsObject = {
    appId: Uint8Array | string,
  }
}

export class AddApp extends jspb.Message {
  hasAppOwnerId(): boolean;
  clearAppOwnerId(): void;
  getAppOwnerId(): Uint8Array | string;
  getAppOwnerId_asU8(): Uint8Array;
  getAppOwnerId_asB64(): string;
  setAppOwnerId(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddApp.AsObject;
  static toObject(includeInstance: boolean, msg: AddApp): AddApp.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AddApp, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddApp;
  static deserializeBinaryFromReader(message: AddApp, reader: jspb.BinaryReader): AddApp;
}

export namespace AddApp {
  export type AsObject = {
    appOwnerId: Uint8Array | string,
  }
}

export class InstallApp extends jspb.Message {
  getVer(): string;
  setVer(value: string): void;

  getRunAfterInstall(): boolean;
  setRunAfterInstall(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InstallApp.AsObject;
  static toObject(includeInstance: boolean, msg: InstallApp): InstallApp.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InstallApp, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InstallApp;
  static deserializeBinaryFromReader(message: InstallApp, reader: jspb.BinaryReader): InstallApp;
}

export namespace InstallApp {
  export type AsObject = {
    ver: string,
    runAfterInstall: boolean,
  }
}

export class AppQuota extends jspb.Message {
  getMem(): string;
  setMem(value: string): void;

  getDiskSpace(): string;
  setDiskSpace(value: string): void;

  getCpu(): string;
  setCpu(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppQuota.AsObject;
  static toObject(includeInstance: boolean, msg: AppQuota): AppQuota.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppQuota, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppQuota;
  static deserializeBinaryFromReader(message: AppQuota, reader: jspb.BinaryReader): AppQuota;
}

export namespace AppQuota {
  export type AsObject = {
    mem: string,
    diskSpace: string,
    cpu: string,
  }
}

export class StringBoolMapItem extends jspb.Message {
  getKey(): string;
  setKey(value: string): void;

  getValue(): boolean;
  setValue(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StringBoolMapItem.AsObject;
  static toObject(includeInstance: boolean, msg: StringBoolMapItem): StringBoolMapItem.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StringBoolMapItem, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StringBoolMapItem;
  static deserializeBinaryFromReader(message: StringBoolMapItem, reader: jspb.BinaryReader): StringBoolMapItem;
}

export namespace StringBoolMapItem {
  export type AsObject = {
    key: string,
    value: boolean,
  }
}

export class ModifyAppPermission extends jspb.Message {
  clearPermissionList(): void;
  getPermissionList(): Array<StringBoolMapItem>;
  setPermissionList(value: Array<StringBoolMapItem>): void;
  addPermission(value?: StringBoolMapItem, index?: number): StringBoolMapItem;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ModifyAppPermission.AsObject;
  static toObject(includeInstance: boolean, msg: ModifyAppPermission): ModifyAppPermission.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ModifyAppPermission, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ModifyAppPermission;
  static deserializeBinaryFromReader(message: ModifyAppPermission, reader: jspb.BinaryReader): ModifyAppPermission;
}

export namespace ModifyAppPermission {
  export type AsObject = {
    permissionList: Array<StringBoolMapItem.AsObject>,
  }
}

export class CmdCode extends jspb.Message {
  getCode(): number;
  setCode(value: number): void;

  hasAddApp(): boolean;
  clearAddApp(): void;
  getAddApp(): AddApp | undefined;
  setAddApp(value?: AddApp): void;

  hasInstallApp(): boolean;
  clearInstallApp(): void;
  getInstallApp(): InstallApp | undefined;
  setInstallApp(value?: InstallApp): void;

  hasAppPermission(): boolean;
  clearAppPermission(): void;
  getAppPermission(): ModifyAppPermission | undefined;
  setAppPermission(value?: ModifyAppPermission): void;

  hasAppQuota(): boolean;
  clearAppQuota(): void;
  getAppQuota(): AppQuota | undefined;
  setAppQuota(value?: AppQuota): void;

  hasAutoUpdate(): boolean;
  clearAutoUpdate(): void;
  getAutoUpdate(): boolean;
  setAutoUpdate(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CmdCode.AsObject;
  static toObject(includeInstance: boolean, msg: CmdCode): CmdCode.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CmdCode, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CmdCode;
  static deserializeBinaryFromReader(message: CmdCode, reader: jspb.BinaryReader): CmdCode;
}

export namespace CmdCode {
  export type AsObject = {
    code: number,
    addApp?: AddApp.AsObject,
    installApp?: InstallApp.AsObject,
    appPermission?: ModifyAppPermission.AsObject,
    appQuota?: AppQuota.AsObject,
    autoUpdate: boolean,
  }
}

export class AppCmdDesc extends jspb.Message {
  getAppId(): Uint8Array | string;
  getAppId_asU8(): Uint8Array;
  getAppId_asB64(): string;
  setAppId(value: Uint8Array | string): void;

  hasCmdCode(): boolean;
  clearCmdCode(): void;
  getCmdCode(): CmdCode | undefined;
  setCmdCode(value?: CmdCode): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppCmdDesc.AsObject;
  static toObject(includeInstance: boolean, msg: AppCmdDesc): AppCmdDesc.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppCmdDesc, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppCmdDesc;
  static deserializeBinaryFromReader(message: AppCmdDesc, reader: jspb.BinaryReader): AppCmdDesc;
}

export namespace AppCmdDesc {
  export type AsObject = {
    appId: Uint8Array | string,
    cmdCode?: CmdCode.AsObject,
  }
}

export class AppCmdListDesc extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  clearListList(): void;
  getListList(): Array<AppCmdListItem>;
  setListList(value: Array<AppCmdListItem>): void;
  addList(value?: AppCmdListItem, index?: number): AppCmdListItem;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppCmdListDesc.AsObject;
  static toObject(includeInstance: boolean, msg: AppCmdListDesc): AppCmdListDesc.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppCmdListDesc, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppCmdListDesc;
  static deserializeBinaryFromReader(message: AppCmdListDesc, reader: jspb.BinaryReader): AppCmdListDesc;
}

export namespace AppCmdListDesc {
  export type AsObject = {
    id: string,
    listList: Array<AppCmdListItem.AsObject>,
  }
}

export class AppCmdListItem extends jspb.Message {
  getCmd(): Uint8Array | string;
  getCmd_asU8(): Uint8Array;
  getCmd_asB64(): string;
  setCmd(value: Uint8Array | string): void;

  getRetryCount(): number;
  setRetryCount(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppCmdListItem.AsObject;
  static toObject(includeInstance: boolean, msg: AppCmdListItem): AppCmdListItem.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppCmdListItem, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppCmdListItem;
  static deserializeBinaryFromReader(message: AppCmdListItem, reader: jspb.BinaryReader): AppCmdListItem;
}

export namespace AppCmdListItem {
  export type AsObject = {
    cmd: Uint8Array | string,
    retryCount: number,
  }
}

export class DecIpInfo extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getIp(): string;
  setIp(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DecIpInfo.AsObject;
  static toObject(includeInstance: boolean, msg: DecIpInfo): DecIpInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DecIpInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DecIpInfo;
  static deserializeBinaryFromReader(message: DecIpInfo, reader: jspb.BinaryReader): DecIpInfo;
}

export namespace DecIpInfo {
  export type AsObject = {
    name: string,
    ip: string,
  }
}

export class DecAclInfo extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getAclInfoMap(): jspb.Map<string, boolean>;
  clearAclInfoMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DecAclInfo.AsObject;
  static toObject(includeInstance: boolean, msg: DecAclInfo): DecAclInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DecAclInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DecAclInfo;
  static deserializeBinaryFromReader(message: DecAclInfo, reader: jspb.BinaryReader): DecAclInfo;
}

export namespace DecAclInfo {
  export type AsObject = {
    name: string,
    aclInfoMap: Array<[string, boolean]>,
  }
}

export class RegisterDec extends jspb.Message {
  getDockerGatewayIp(): string;
  setDockerGatewayIp(value: string): void;

  getDecListMap(): jspb.Map<string, DecIpInfo>;
  clearDecListMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterDec.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterDec): RegisterDec.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RegisterDec, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterDec;
  static deserializeBinaryFromReader(message: RegisterDec, reader: jspb.BinaryReader): RegisterDec;
}

export namespace RegisterDec {
  export type AsObject = {
    dockerGatewayIp: string,
    decListMap: Array<[string, DecIpInfo.AsObject]>,
  }
}

export class UnregisterDec extends jspb.Message {
  getDecListMap(): jspb.Map<string, string>;
  clearDecListMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnregisterDec.AsObject;
  static toObject(includeInstance: boolean, msg: UnregisterDec): UnregisterDec.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UnregisterDec, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnregisterDec;
  static deserializeBinaryFromReader(message: UnregisterDec, reader: jspb.BinaryReader): UnregisterDec;
}

export namespace UnregisterDec {
  export type AsObject = {
    decListMap: Array<[string, string]>,
  }
}

export class ModifyAcl extends jspb.Message {
  getDecListMap(): jspb.Map<string, DecAclInfo>;
  clearDecListMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ModifyAcl.AsObject;
  static toObject(includeInstance: boolean, msg: ModifyAcl): ModifyAcl.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ModifyAcl, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ModifyAcl;
  static deserializeBinaryFromReader(message: ModifyAcl, reader: jspb.BinaryReader): ModifyAcl;
}

export namespace ModifyAcl {
  export type AsObject = {
    decListMap: Array<[string, DecAclInfo.AsObject]>,
  }
}

export class AppManagerActionDesc extends jspb.Message {
  hasRegisterDec(): boolean;
  clearRegisterDec(): void;
  getRegisterDec(): RegisterDec | undefined;
  setRegisterDec(value?: RegisterDec): void;

  hasUnregisterDec(): boolean;
  clearUnregisterDec(): void;
  getUnregisterDec(): UnregisterDec | undefined;
  setUnregisterDec(value?: UnregisterDec): void;

  hasModifyAcl(): boolean;
  clearModifyAcl(): void;
  getModifyAcl(): ModifyAcl | undefined;
  setModifyAcl(value?: ModifyAcl): void;

  getAppmanageractionenumCase(): AppManagerActionDesc.AppmanageractionenumCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppManagerActionDesc.AsObject;
  static toObject(includeInstance: boolean, msg: AppManagerActionDesc): AppManagerActionDesc.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppManagerActionDesc, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppManagerActionDesc;
  static deserializeBinaryFromReader(message: AppManagerActionDesc, reader: jspb.BinaryReader): AppManagerActionDesc;
}

export namespace AppManagerActionDesc {
  export type AsObject = {
    registerDec?: RegisterDec.AsObject,
    unregisterDec?: UnregisterDec.AsObject,
    modifyAcl?: ModifyAcl.AsObject,
  }

  export enum AppmanageractionenumCase {
    APPMANAGERACTIONENUM_NOT_SET = 0,
    REGISTER_DEC = 1,
    UNREGISTER_DEC = 2,
    MODIFY_ACL = 3,
  }
}

export class AppStatusDescContent extends jspb.Message {
  getId(): Uint8Array | string;
  getId_asU8(): Uint8Array;
  getId_asB64(): string;
  setId(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppStatusDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: AppStatusDescContent): AppStatusDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppStatusDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppStatusDescContent;
  static deserializeBinaryFromReader(message: AppStatusDescContent, reader: jspb.BinaryReader): AppStatusDescContent;
}

export namespace AppStatusDescContent {
  export type AsObject = {
    id: Uint8Array | string,
  }
}

export class AppStatusContent extends jspb.Message {
  getVersion(): string;
  setVersion(value: string): void;

  getStatus(): number;
  setStatus(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppStatusContent.AsObject;
  static toObject(includeInstance: boolean, msg: AppStatusContent): AppStatusContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppStatusContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppStatusContent;
  static deserializeBinaryFromReader(message: AppStatusContent, reader: jspb.BinaryReader): AppStatusContent;
}

export namespace AppStatusContent {
  export type AsObject = {
    version: string,
    status: number,
  }
}

export class AppStoreListBodyContent extends jspb.Message {
  clearAppStoreListList(): void;
  getAppStoreListList(): Array<Uint8Array | string>;
  getAppStoreListList_asU8(): Array<Uint8Array>;
  getAppStoreListList_asB64(): Array<string>;
  setAppStoreListList(value: Array<Uint8Array | string>): void;
  addAppStoreList(value: Uint8Array | string, index?: number): Uint8Array | string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppStoreListBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: AppStoreListBodyContent): AppStoreListBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppStoreListBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppStoreListBodyContent;
  static deserializeBinaryFromReader(message: AppStoreListBodyContent, reader: jspb.BinaryReader): AppStoreListBodyContent;
}

export namespace AppStoreListBodyContent {
  export type AsObject = {
    appStoreListList: Array<Uint8Array | string>,
  }
}

export class AppListDescContent extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getCategory(): string;
  setCategory(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppListDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: AppListDescContent): AppListDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppListDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppListDescContent;
  static deserializeBinaryFromReader(message: AppListDescContent, reader: jspb.BinaryReader): AppListDescContent;
}

export namespace AppListDescContent {
  export type AsObject = {
    id: string,
    category: string,
  }
}

export class AppListSourceItem extends jspb.Message {
  getAppId(): Uint8Array | string;
  getAppId_asU8(): Uint8Array;
  getAppId_asB64(): string;
  setAppId(value: Uint8Array | string): void;

  getAppStatus(): Uint8Array | string;
  getAppStatus_asU8(): Uint8Array;
  getAppStatus_asB64(): string;
  setAppStatus(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppListSourceItem.AsObject;
  static toObject(includeInstance: boolean, msg: AppListSourceItem): AppListSourceItem.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppListSourceItem, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppListSourceItem;
  static deserializeBinaryFromReader(message: AppListSourceItem, reader: jspb.BinaryReader): AppListSourceItem;
}

export namespace AppListSourceItem {
  export type AsObject = {
    appId: Uint8Array | string,
    appStatus: Uint8Array | string,
  }
}

export class AppListContent extends jspb.Message {
  clearSourceList(): void;
  getSourceList(): Array<AppListSourceItem>;
  setSourceList(value: Array<AppListSourceItem>): void;
  addSource(value?: AppListSourceItem, index?: number): AppListSourceItem;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppListContent.AsObject;
  static toObject(includeInstance: boolean, msg: AppListContent): AppListContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AppListContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppListContent;
  static deserializeBinaryFromReader(message: AppListContent, reader: jspb.BinaryReader): AppListContent;
}

export namespace AppListContent {
  export type AsObject = {
    sourceList: Array<AppListSourceItem.AsObject>,
  }
}

export class DecAppDescContent extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DecAppDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: DecAppDescContent): DecAppDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DecAppDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DecAppDescContent;
  static deserializeBinaryFromReader(message: DecAppDescContent, reader: jspb.BinaryReader): DecAppDescContent;
}

export namespace DecAppDescContent {
  export type AsObject = {
    id: string,
  }
}

export class StringBytesMapItem extends jspb.Message {
  getKey(): string;
  setKey(value: string): void;

  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StringBytesMapItem.AsObject;
  static toObject(includeInstance: boolean, msg: StringBytesMapItem): StringBytesMapItem.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StringBytesMapItem, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StringBytesMapItem;
  static deserializeBinaryFromReader(message: StringBytesMapItem, reader: jspb.BinaryReader): StringBytesMapItem;
}

export namespace StringBytesMapItem {
  export type AsObject = {
    key: string,
    value: Uint8Array | string,
  }
}

export class StringStringMapItem extends jspb.Message {
  getKey(): string;
  setKey(value: string): void;

  getValue(): string;
  setValue(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StringStringMapItem.AsObject;
  static toObject(includeInstance: boolean, msg: StringStringMapItem): StringStringMapItem.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StringStringMapItem, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StringStringMapItem;
  static deserializeBinaryFromReader(message: StringStringMapItem, reader: jspb.BinaryReader): StringStringMapItem;
}

export namespace StringStringMapItem {
  export type AsObject = {
    key: string,
    value: string,
  }
}

export class DecAppContent extends jspb.Message {
  clearSourceList(): void;
  getSourceList(): Array<StringBytesMapItem>;
  setSourceList(value: Array<StringBytesMapItem>): void;
  addSource(value?: StringBytesMapItem, index?: number): StringBytesMapItem;

  clearSourceDescList(): void;
  getSourceDescList(): Array<StringStringMapItem>;
  setSourceDescList(value: Array<StringStringMapItem>): void;
  addSourceDesc(value?: StringStringMapItem, index?: number): StringStringMapItem;

  hasIcon(): boolean;
  clearIcon(): void;
  getIcon(): string;
  setIcon(value: string): void;

  hasDesc(): boolean;
  clearDesc(): void;
  getDesc(): string;
  setDesc(value: string): void;

  clearTagsList(): void;
  getTagsList(): Array<StringStringMapItem>;
  setTagsList(value: Array<StringStringMapItem>): void;
  addTags(value?: StringStringMapItem, index?: number): StringStringMapItem;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DecAppContent.AsObject;
  static toObject(includeInstance: boolean, msg: DecAppContent): DecAppContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DecAppContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DecAppContent;
  static deserializeBinaryFromReader(message: DecAppContent, reader: jspb.BinaryReader): DecAppContent;
}

export namespace DecAppContent {
  export type AsObject = {
    sourceList: Array<StringBytesMapItem.AsObject>,
    sourceDescList: Array<StringStringMapItem.AsObject>,
    icon: string,
    desc: string,
    tagsList: Array<StringStringMapItem.AsObject>,
  }
}

export class AddFriendDescContent extends jspb.Message {
  getTo(): Uint8Array | string;
  getTo_asU8(): Uint8Array;
  getTo_asB64(): string;
  setTo(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddFriendDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: AddFriendDescContent): AddFriendDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AddFriendDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddFriendDescContent;
  static deserializeBinaryFromReader(message: AddFriendDescContent, reader: jspb.BinaryReader): AddFriendDescContent;
}

export namespace AddFriendDescContent {
  export type AsObject = {
    to: Uint8Array | string,
  }
}

export class RemoveFriendDescContent extends jspb.Message {
  getTo(): Uint8Array | string;
  getTo_asU8(): Uint8Array;
  getTo_asB64(): string;
  setTo(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveFriendDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveFriendDescContent): RemoveFriendDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RemoveFriendDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveFriendDescContent;
  static deserializeBinaryFromReader(message: RemoveFriendDescContent, reader: jspb.BinaryReader): RemoveFriendDescContent;
}

export namespace RemoveFriendDescContent {
  export type AsObject = {
    to: Uint8Array | string,
  }
}

export class FriendOptionContent extends jspb.Message {
  hasAutoConfirm(): boolean;
  clearAutoConfirm(): void;
  getAutoConfirm(): number;
  setAutoConfirm(value: number): void;

  hasMsg(): boolean;
  clearMsg(): void;
  getMsg(): string;
  setMsg(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FriendOptionContent.AsObject;
  static toObject(includeInstance: boolean, msg: FriendOptionContent): FriendOptionContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: FriendOptionContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FriendOptionContent;
  static deserializeBinaryFromReader(message: FriendOptionContent, reader: jspb.BinaryReader): FriendOptionContent;
}

export namespace FriendOptionContent {
  export type AsObject = {
    autoConfirm: number,
    msg: string,
  }
}

export class FriendPropetyContent extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FriendPropetyContent.AsObject;
  static toObject(includeInstance: boolean, msg: FriendPropetyContent): FriendPropetyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: FriendPropetyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FriendPropetyContent;
  static deserializeBinaryFromReader(message: FriendPropetyContent, reader: jspb.BinaryReader): FriendPropetyContent;
}

export namespace FriendPropetyContent {
  export type AsObject = {
  }
}

export class MsgObjectContent extends jspb.Message {
  getId(): Uint8Array | string;
  getId_asU8(): Uint8Array;
  getId_asB64(): string;
  setId(value: Uint8Array | string): void;

  getName(): string;
  setName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MsgObjectContent.AsObject;
  static toObject(includeInstance: boolean, msg: MsgObjectContent): MsgObjectContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MsgObjectContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MsgObjectContent;
  static deserializeBinaryFromReader(message: MsgObjectContent, reader: jspb.BinaryReader): MsgObjectContent;
}

export namespace MsgObjectContent {
  export type AsObject = {
    id: Uint8Array | string,
    name: string,
  }
}

export class MsgContent extends jspb.Message {
  getType(): MsgContent.TypeMap[keyof MsgContent.TypeMap];
  setType(value: MsgContent.TypeMap[keyof MsgContent.TypeMap]): void;

  hasText(): boolean;
  clearText(): void;
  getText(): string;
  setText(value: string): void;

  hasContent(): boolean;
  clearContent(): void;
  getContent(): MsgObjectContent | undefined;
  setContent(value?: MsgObjectContent): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MsgContent.AsObject;
  static toObject(includeInstance: boolean, msg: MsgContent): MsgContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MsgContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MsgContent;
  static deserializeBinaryFromReader(message: MsgContent, reader: jspb.BinaryReader): MsgContent;
}

export namespace MsgContent {
  export type AsObject = {
    type: MsgContent.TypeMap[keyof MsgContent.TypeMap],
    text: string,
    content?: MsgObjectContent.AsObject,
  }

  export interface TypeMap {
    TEXT: 0;
    OBJECT: 1;
  }

  export const Type: TypeMap;
}

export class MsgDescContent extends jspb.Message {
  getTo(): Uint8Array | string;
  getTo_asU8(): Uint8Array;
  getTo_asB64(): string;
  setTo(value: Uint8Array | string): void;

  hasContent(): boolean;
  clearContent(): void;
  getContent(): MsgContent | undefined;
  setContent(value?: MsgContent): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MsgDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: MsgDescContent): MsgDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MsgDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MsgDescContent;
  static deserializeBinaryFromReader(message: MsgDescContent, reader: jspb.BinaryReader): MsgDescContent;
}

export namespace MsgDescContent {
  export type AsObject = {
    to: Uint8Array | string,
    content?: MsgContent.AsObject,
  }
}

export class TransContextDescContent extends jspb.Message {
  getContextPath(): string;
  setContextPath(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TransContextDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: TransContextDescContent): TransContextDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TransContextDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TransContextDescContent;
  static deserializeBinaryFromReader(message: TransContextDescContent, reader: jspb.BinaryReader): TransContextDescContent;
}

export namespace TransContextDescContent {
  export type AsObject = {
    contextPath: string,
  }
}

export class TransContextDeviceChunkCodecInfo extends jspb.Message {
  hasStart(): boolean;
  clearStart(): void;
  getStart(): number;
  setStart(value: number): void;

  hasEnd(): boolean;
  clearEnd(): void;
  getEnd(): number;
  setEnd(value: number): void;

  hasStep(): boolean;
  clearStep(): void;
  getStep(): number;
  setStep(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TransContextDeviceChunkCodecInfo.AsObject;
  static toObject(includeInstance: boolean, msg: TransContextDeviceChunkCodecInfo): TransContextDeviceChunkCodecInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TransContextDeviceChunkCodecInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TransContextDeviceChunkCodecInfo;
  static deserializeBinaryFromReader(message: TransContextDeviceChunkCodecInfo, reader: jspb.BinaryReader): TransContextDeviceChunkCodecInfo;
}

export namespace TransContextDeviceChunkCodecInfo {
  export type AsObject = {
    start: number,
    end: number,
    step: number,
  }
}

export class TransContextDevice extends jspb.Message {
  getTarget(): Uint8Array | string;
  getTarget_asU8(): Uint8Array;
  getTarget_asB64(): string;
  setTarget(value: Uint8Array | string): void;

  getChunkCodecDesc(): TransContextDevice.ChunkCodecDescMap[keyof TransContextDevice.ChunkCodecDescMap];
  setChunkCodecDesc(value: TransContextDevice.ChunkCodecDescMap[keyof TransContextDevice.ChunkCodecDescMap]): void;

  hasChunkCodecInfo(): boolean;
  clearChunkCodecInfo(): void;
  getChunkCodecInfo(): TransContextDeviceChunkCodecInfo | undefined;
  setChunkCodecInfo(value?: TransContextDeviceChunkCodecInfo): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TransContextDevice.AsObject;
  static toObject(includeInstance: boolean, msg: TransContextDevice): TransContextDevice.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TransContextDevice, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TransContextDevice;
  static deserializeBinaryFromReader(message: TransContextDevice, reader: jspb.BinaryReader): TransContextDevice;
}

export namespace TransContextDevice {
  export type AsObject = {
    target: Uint8Array | string,
    chunkCodecDesc: TransContextDevice.ChunkCodecDescMap[keyof TransContextDevice.ChunkCodecDescMap],
    chunkCodecInfo?: TransContextDeviceChunkCodecInfo.AsObject,
  }

  export interface ChunkCodecDescMap {
    UNKNOWN: 0;
    STREAM: 1;
    RAPTOR: 2;
  }

  export const ChunkCodecDesc: ChunkCodecDescMap;
}

export class TransContextBodyContent extends jspb.Message {
  clearDeviceListList(): void;
  getDeviceListList(): Array<TransContextDevice>;
  setDeviceListList(value: Array<TransContextDevice>): void;
  addDeviceList(value?: TransContextDevice, index?: number): TransContextDevice;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TransContextBodyContent.AsObject;
  static toObject(includeInstance: boolean, msg: TransContextBodyContent): TransContextBodyContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TransContextBodyContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TransContextBodyContent;
  static deserializeBinaryFromReader(message: TransContextBodyContent, reader: jspb.BinaryReader): TransContextBodyContent;
}

export namespace TransContextBodyContent {
  export type AsObject = {
    deviceListList: Array<TransContextDevice.AsObject>,
  }
}

export class NFTFileDesc extends jspb.Message {
  getDesc(): Uint8Array | string;
  getDesc_asU8(): Uint8Array;
  getDesc_asB64(): string;
  setDesc(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NFTFileDesc.AsObject;
  static toObject(includeInstance: boolean, msg: NFTFileDesc): NFTFileDesc.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NFTFileDesc, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NFTFileDesc;
  static deserializeBinaryFromReader(message: NFTFileDesc, reader: jspb.BinaryReader): NFTFileDesc;
}

export namespace NFTFileDesc {
  export type AsObject = {
    desc: Uint8Array | string,
  }
}

export class NFTListDescContent extends jspb.Message {
  clearNftListList(): void;
  getNftListList(): Array<NFTFileDesc>;
  setNftListList(value: Array<NFTFileDesc>): void;
  addNftList(value?: NFTFileDesc, index?: number): NFTFileDesc;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NFTListDescContent.AsObject;
  static toObject(includeInstance: boolean, msg: NFTListDescContent): NFTListDescContent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NFTListDescContent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NFTListDescContent;
  static deserializeBinaryFromReader(message: NFTListDescContent, reader: jspb.BinaryReader): NFTListDescContent;
}

export namespace NFTListDescContent {
  export type AsObject = {
    nftListList: Array<NFTFileDesc.AsObject>,
  }
}

export class SyncResponseObjectMetaInfo extends jspb.Message {
  getInsertTime(): number;
  setInsertTime(value: number): void;

  hasCreateDecId(): boolean;
  clearCreateDecId(): void;
  getCreateDecId(): Uint8Array | string;
  getCreateDecId_asU8(): Uint8Array;
  getCreateDecId_asB64(): string;
  setCreateDecId(value: Uint8Array | string): void;

  hasContext(): boolean;
  clearContext(): void;
  getContext(): string;
  setContext(value: string): void;

  hasLastAccessRpath(): boolean;
  clearLastAccessRpath(): void;
  getLastAccessRpath(): string;
  setLastAccessRpath(value: string): void;

  hasAccessString(): boolean;
  clearAccessString(): void;
  getAccessString(): number;
  setAccessString(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SyncResponseObjectMetaInfo.AsObject;
  static toObject(includeInstance: boolean, msg: SyncResponseObjectMetaInfo): SyncResponseObjectMetaInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SyncResponseObjectMetaInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SyncResponseObjectMetaInfo;
  static deserializeBinaryFromReader(message: SyncResponseObjectMetaInfo, reader: jspb.BinaryReader): SyncResponseObjectMetaInfo;
}

export namespace SyncResponseObjectMetaInfo {
  export type AsObject = {
    insertTime: number,
    createDecId: Uint8Array | string,
    context: string,
    lastAccessRpath: string,
    accessString: number,
  }
}

