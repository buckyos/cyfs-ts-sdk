import {
    SubDescType,
    DescTypeInfo,
    NamedObjectId,
    NamedObjectIdDecoder,
    NamedObject,
    NamedObjectBuilder,
    NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "../../cyfs-base/objects/object";

import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { DecAppId, DecAppIdDecoder } from "./dec_app";
import { protos } from "../codec";
import {
    EmptyProtobufBodyContent,
    EmptyProtobufBodyContentDecoder,
    ProtobufCodecHelper,
    ProtobufDescContent,
    ProtobufDescContentDecoder,
} from "../../cyfs-base";
import JSBI from "jsbi";

export class AppCmdDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.AppCmd;
    }

    sub_desc_type(): SubDescType {
        return {
            owner_type: "option",
            area_type: "disable",
            author_type: "disable",
            key_type: "disable",
        };
    }
}

const AppCmd_DESC_TYPE_INFO = new AppCmdDescTypeInfo();

class AddApp {
    constructor(public app_owner_id?: ObjectId) { }
    try_to_proto(): BuckyResult<protos.AddApp> {
        const ret = new protos.AddApp()

        if (this.app_owner_id) {

            const r = ProtobufCodecHelper.encode_buf(this.app_owner_id)
            if (r.err) {
                return r;
            }
            ret.setAppOwnerId(r.unwrap())
        }

        return Ok(ret);
    }
    static try_from_proto(value: protos.AddApp): BuckyResult<AddApp> {
        let id;
        if (value.hasAppOwnerId()) {
            const r = ProtobufCodecHelper.decode_buf(value.getAppOwnerId_asU8(), new ObjectIdDecoder());
            if (r.err) {
                return r;
            }
            id = r.unwrap()
        }

        return Ok(new AddApp(id));
    }
}

class InstallApp {
    constructor(public ver: string, public run_after_install: boolean) { }
    try_to_proto(): BuckyResult<protos.InstallApp> {
        const ret = new protos.InstallApp()
        ret.setVer(this.ver)
        ret.setRunAfterInstall(this.run_after_install)
        return Ok(ret);
    }
    static try_from_proto(value: protos.InstallApp): BuckyResult<InstallApp> {
        return Ok(new InstallApp(value.getVer(), value.getRunAfterInstall()));
    }
}

class ModifyAppPermission {
    constructor(public permission: Map<string, boolean>) { }
    try_to_proto(): BuckyResult<protos.ModifyAppPermission> {
        const ret = new protos.ModifyAppPermission;
        for (const [k, v] of this.permission.entries()) {
            const item = new protos.StringBoolMapItem();
            item.setKey(k)
            item.setValue(v)
            ret.addPermission(item)
        }

        return Ok(ret);
    }

    static try_from_proto(value: protos.ModifyAppPermission): BuckyResult<ModifyAppPermission> {
        const map = new Map();
        for (const item of value.getPermissionList()) {
            map.set(item.getKey(), item.getValue())
        }
        return Ok(new ModifyAppPermission(map));
    }
}

export enum AppQuotaType {
    Mem = 0,
    DiskSpace = 1,
    Cpu = 2,
    Unknown = 255,
}

export class AppQuota {
    constructor(public mem: JSBI, public disk_space: JSBI, public cpu: JSBI) { }

    static from(quotas: Map<AppQuotaType, JSBI>): AppQuota {
        const mem = quotas.get(AppQuotaType.Mem) || JSBI.BigInt(0)
        const disk_space = quotas.get(AppQuotaType.DiskSpace) || JSBI.BigInt(0)
        const cpu = quotas.get(AppQuotaType.Cpu) || JSBI.BigInt(0)

        return new AppQuota(mem, disk_space, cpu)
    }

    to(): Map<AppQuotaType, JSBI> {
        const ret = new Map()
        ret.set(AppQuotaType.Mem, this.mem)
        ret.set(AppQuotaType.DiskSpace, this.disk_space)
        ret.set(AppQuotaType.Cpu, this.cpu)
        return ret;
    }

    try_to_proto(): BuckyResult<protos.AppQuota> {
        const ret = new protos.AppQuota()
        ret.setMem(this.mem.toString())
        ret.setDiskSpace(this.disk_space.toString())
        ret.setCpu(this.cpu.toString())
        return Ok(ret);
    }

    static try_from_proto(value: protos.AppQuota): BuckyResult<AppQuota> {
        return Ok(new AppQuota(
            JSBI.BigInt(value.getMem()),
            JSBI.BigInt(value.getDiskSpace()),
            JSBI.BigInt(value.getCpu()),
        ));
    }
}

class CmdCode {
    constructor(public code: AppCmdCode, public add?: AddApp, public install?: InstallApp, public permission?: ModifyAppPermission, public qupta?: AppQuota) { }

    try_to_proto(): BuckyResult<protos.CmdCode> {
        const ret = new protos.CmdCode()

        ret.setCode(this.code)

        let install_app, app_permission, app_quota
        {
            const r = this.add?.try_to_proto();
            if (r?.err) {
                return r;
            }
            ret.setAddApp(r?.unwrap())
        }


        {
            const r = this.install?.try_to_proto();
            if (r?.err) {
                return r;
            }
            ret.setInstallApp(r?.unwrap())
        }

        {
            const r = this.permission?.try_to_proto();
            if (r?.err) {
                return r;
            }
            ret.setAppPermission(r?.unwrap())
        }

        {
            const r = this.qupta?.try_to_proto();
            if (r?.err) {
                return r;
            }
            ret.setAppQuota(r?.unwrap());
        }

        return Ok(ret);
    }

    static try_from_proto(value: protos.CmdCode): BuckyResult<CmdCode> {
        const code = value.getCode() as AppCmdCode;
        let add, install, permission, quota
        if (value.hasAddApp()) {
            const r = AddApp.try_from_proto(value.getAddApp()!)
            if (r.err) {
                return r
            }
            add = r.unwrap()
        }

        if (value.hasInstallApp()) {
            const r = InstallApp.try_from_proto(value.getInstallApp()!)
            if (r.err) {
                return r
            }
            install = r.unwrap()
        }

        if (value.hasAppPermission()) {
            const r = ModifyAppPermission.try_from_proto(value.getAppPermission()!)
            if (r.err) {
                return r
            }
            permission = r.unwrap()
        }

        if (value.hasAppQuota()) {
            const r = AppQuota.try_from_proto(value.getAppQuota()!)
            if (r.err) {
                return r
            }
            quota = r.unwrap()
        }
        return Ok(new CmdCode(
            code,
            add,
            install,
            permission,
            quota
        ));
    }
}

export class AppCmdDesc extends ProtobufDescContent {
    constructor(public app_id: DecAppId, public cmd_code: CmdCode) {
        super();
    }

    type_info(): DescTypeInfo {
        return AppCmd_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.AppCmdDesc> {
        const ret = new protos.AppCmdDesc();
        const id_r = ProtobufCodecHelper.encode_buf(this.app_id);
        if (id_r.err) {
            return id_r;
        }
        ret.setAppId(id_r.unwrap())
        const code_r = this.cmd_code.try_to_proto();
        if (code_r.err) {
            return code_r;
        }
        ret.setCmdCode(code_r.unwrap())
        return Ok(ret);
    }
}

export class AppCmdDescDecoder extends ProtobufDescContentDecoder<AppCmdDesc, protos.AppCmdDesc> {
    constructor() {
        super(protos.AppCmdDesc.deserializeBinary);
    }

    type_info(): DescTypeInfo {
        return AppCmd_DESC_TYPE_INFO;
    }

    try_from_proto(value: protos.AppCmdDesc): BuckyResult<AppCmdDesc> {
        const id_r = ProtobufCodecHelper.decode_buf(value.getAppId_asU8(), new DecAppIdDecoder());
        if (id_r.err) {
            return id_r;
        }

        const code_r = CmdCode.try_from_proto(value.getCmdCode()!);
        if (code_r.err) {
            return code_r;
        }

        return Ok(new AppCmdDesc(id_r.unwrap(), code_r.unwrap()));
    }
}

export enum AppCmdCode {
    Add = 0, //添加到appList
    Remove = 1, //从applist中移除
    Install = 2, //安装
    Uninstall = 3, //卸载
    Start = 4, //启动
    Stop = 5, //停止
    SetPermission = 6, //设置权限
    SetQuota = 7, //设置配额

    Unknown = 255,
}

export class AppCmdBuilder extends NamedObjectBuilder<AppCmdDesc, EmptyProtobufBodyContent> {
    // ignore
}

export class AppCmdId extends NamedObjectId<AppCmdDesc, EmptyProtobufBodyContent> {
    constructor(id: ObjectId) {
        super(CoreObjectType.AppCmd, id);
    }

    static default(): AppCmdId {
        return named_id_gen_default(CoreObjectType.AppCmd);
    }

    static from_base_58(s: string): BuckyResult<AppCmdId> {
        return named_id_from_base_58(CoreObjectType.AppCmd, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AppCmdId> {
        return named_id_try_from_object_id(CoreObjectType.AppCmd, id);
    }
}

export class AppCmdIdDecoder extends NamedObjectIdDecoder<AppCmdDesc, EmptyProtobufBodyContent> {
    constructor() {
        super(CoreObjectType.AppCmd);
    }
}

export class AppCmd extends NamedObject<AppCmdDesc, EmptyProtobufBodyContent> {
    static create(owner: ObjectId, id: DecAppId, code: CmdCode): AppCmd {
        const desc_content = new AppCmdDesc(id, code);
        const builder = new AppCmdBuilder(desc_content, new EmptyProtobufBodyContent());

        return builder.owner(owner).build(AppCmd);
    }
    static add(owner: ObjectId, id: DecAppId, app_owner?: ObjectId): AppCmd {
        return AppCmd.create(owner, id, new CmdCode(AppCmdCode.Add, new AddApp(app_owner)));
    }

    static remove(owner: ObjectId, id: DecAppId): AppCmd {
        return AppCmd.create(owner, id, new CmdCode(AppCmdCode.Remove));
    }

    static install(owner: ObjectId, id: DecAppId, version: string, run_after_install: boolean): AppCmd {
        return AppCmd.create(owner, id, new CmdCode(AppCmdCode.Install, undefined, new InstallApp(version, run_after_install)));
    }

    static uninstall(owner: ObjectId, id: DecAppId): AppCmd {
        return AppCmd.create(owner, id, new CmdCode(AppCmdCode.Uninstall));
    }

    static start(owner: ObjectId, id: DecAppId): AppCmd {
        return AppCmd.create(owner, id, new CmdCode(AppCmdCode.Start));
    }

    static stop(owner: ObjectId, id: DecAppId): AppCmd {
        return AppCmd.create(owner, id, new CmdCode(AppCmdCode.Stop));
    }

    //permission参数： String表示语义路径，bool表示是否授权
    static set_permission(
        owner: ObjectId,
        id: DecAppId,
        permission: Map<string, boolean>
    ): AppCmd {
        return AppCmd.create(owner, id, new CmdCode(AppCmdCode.SetPermission, undefined, undefined, new ModifyAppPermission(permission)));
    }

    //quota参数： 如果quota有改变，app会重启并应用新的配额
    static set_quota(
        owner: ObjectId,
        id: DecAppId,
        quota: Map<AppQuotaType, JSBI>
    ): AppCmd {
        return AppCmd.create(owner, id, new CmdCode(AppCmdCode.SetQuota, undefined, undefined, undefined, AppQuota.from(quota)));
    }

    app_id(): DecAppId {
        return this.desc().content().app_id;
    }

    cmd(): AppCmdCode {
        return this.desc().content().cmd_code.code;
    }
}

export class AppCmdDecoder extends NamedObjectDecoder<AppCmdDesc, EmptyProtobufBodyContent, AppCmd> {
    constructor() {
        super(new AppCmdDescDecoder(), new EmptyProtobufBodyContentDecoder(), AppCmd);
    }

    static create(): AppCmdDecoder {
        return new AppCmdDecoder();
    }
}
