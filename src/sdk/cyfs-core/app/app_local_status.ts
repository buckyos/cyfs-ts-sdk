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
import { RawEncode } from "../../cyfs-base/base/raw_encode";
//import { ObjectId } from "../../cyfs-base/objects/object_id";

import { CoreObjectType } from "../core_obj_type";
import { DecAppId, DecAppIdDecoder } from "./dec_app";
import { protos } from "../codec";
import {
    //DirId,
    //DirIdDecoder,
    ObjectId,
    ObjectIdDecoder,
    EmptyProtobufBodyContent,
    EmptyProtobufBodyContentDecoder,
    ProtobufCodecHelper,
    ProtobufDescContent,
    ProtobufDescContentDecoder,
    BuckyHashMap,
    BuckyString,
    BuckyNumber,
    bucky_time_now
} from "../../cyfs-base";
import { AppQuota } from "./app_cmd";
import JSBI from "jsbi";

export const APP_LOCAL_STATUS_MAIN_PATH = "/app_local_status";

export class AppLocalStatusDescTypeInfo extends DescTypeInfo {
    obj_type(): number {
        return CoreObjectType.AppLocalStatus;
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

const AppLocalStatus_DESC_TYPE_INFO = new AppLocalStatusDescTypeInfo();

export enum AppLocalStatusCode {
    Init = 0,
    Installing = 1, //安装成功进入Stop或者NoService，所以没有Installed
    InstallFailed = 3,

    NoService = 4,
    Stopping = 5,
    Stop = 6,
    StopFailed = 7,

    Starting = 8,
    Running = 9,
    StartFailed = 10,

    Uninstalling = 11,
    UninstallFailed = 12,
    Uninstalled = 13,

    //Removed = 14, //已经删除
    RunException = 15, //运行异常

    //setpermissioning? upgrading? setversion?
    ErrStatus = 255,
}

export enum SubErrorCode {
    None = 0,
    Incompatible = 1,
    NoVersion = 2,
    DownloadFailed = 3,
    DockerFailed = 4,
    CommondFailed = 5,
    AppNotFound = 6,
    QueryPermissionError = 7,
    LoadFailed = 8,
    RemoveFailed = 9,
    AssignContainerIpFailed = 10,
    RegisterAppFailed = 11,
    PubDirFailed = 12,
    Unknown = 255,
}

export enum PermissionState {
    Unhandled = 0, //未处理
    Blocked = 1, //阻止
    Granted = 2, //已授权
}

export class PermissionNode implements RawEncode {
    public reason: BuckyString;
    public state: PermissionState;
    // public allow: number;
    constructor(reason: BuckyString, /*allow: number,*/ state: PermissionState) {
        this.reason = reason;
        // this.allow = allow;
        this.state = state;
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += this.reason.raw_measure().unwrap();
        size += new BuckyNumber("u32", this.state).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = this.reason.raw_encode(buf).unwrap();
        buf = new BuckyNumber("u32", this.state).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class AppLocalStatusDesc extends ProtobufDescContent {
    id: DecAppId;
    status: AppLocalStatusCode;
    last_status_update_time: JSBI;
    permissions: BuckyHashMap<BuckyString, PermissionNode>;
    quota: AppQuota;
    version?: string;
    web_dir?: ObjectId;
    sub_error: SubErrorCode;

    constructor(
        id: DecAppId,
        status: AppLocalStatusCode,
        permissions: BuckyHashMap<BuckyString, PermissionNode>,
        quota: AppQuota,
        last_status_update_time?: JSBI,
        version?: string,
        web_dir?: ObjectId,
        sub_error?: SubErrorCode,
    ) {
        super();

        this.id = id;
        this.web_dir = web_dir;
        this.status = status;
        this.version = version;
        this.last_status_update_time = last_status_update_time || bucky_time_now();
        this.permissions = permissions;
        this.quota = quota;
        this.sub_error = sub_error || SubErrorCode.None;
    }

    type_info(): DescTypeInfo {
        return AppLocalStatus_DESC_TYPE_INFO;
    }

    try_to_proto(): BuckyResult<protos.AppLocalStatusDesc> {
        const target = new protos.AppLocalStatusDesc()
        for (const [k, v] of this.permissions.entries()) {
            const permission = new protos.AppPermission()
            permission.setPermission(k.value())
            permission.setReason(v.reason.value())
            permission.setState(v.state)
            target.addPermissions(permission)
        }

        target.setId(ProtobufCodecHelper.encode_buf(this.id).unwrap())
        if (this.web_dir) {
            target.setWebDir(ProtobufCodecHelper.encode_buf(this.web_dir).unwrap())
        }
        target.setStatus(this.status)
        target.setQuota(this.quota.try_to_proto().unwrap())
        if (this.version) {
            target.setVersion(this.version)
        }
        target.setLastStatusUpdateTime(this.last_status_update_time.toString())
        target.setSubError(this.sub_error)

        return Ok(target);
    }
}

export class AppLocalStatusDescDecoder extends ProtobufDescContentDecoder<
    AppLocalStatusDesc,
    protos.AppLocalStatusDesc
> {
    constructor() {
        super(protos.AppLocalStatusDesc.deserializeBinary);
    }

    type_info(): DescTypeInfo {
        return AppLocalStatus_DESC_TYPE_INFO;
    }

    try_from_proto(
        value: protos.AppLocalStatusDesc
    ): BuckyResult<AppLocalStatusDesc> {
        const id_r = ProtobufCodecHelper.decode_buf(value.getId_asU8(), new DecAppIdDecoder());
        if (id_r.err) {
            return id_r;
        }

        let web_dir;
        if (value.hasWebDir()) {
            web_dir = ProtobufCodecHelper.decode_buf(value.getWebDir_asU8(), new ObjectIdDecoder()).unwrap();
        }

        const permissions: BuckyHashMap<BuckyString, PermissionNode> = new BuckyHashMap();
        for (const item of value.getPermissionsList()) {
            const k = new BuckyString(item.getPermission());
            const permissionNode = new PermissionNode(
                new BuckyString(item.getReason()),
                item.getState()
            );
            permissions.set(k, permissionNode);
        }

        const quota = AppQuota.try_from_proto(value.getQuota()!).unwrap()

        const result = new AppLocalStatusDesc(
            id_r.unwrap(),
            value.getStatus(),
            permissions,
            quota,
            JSBI.BigInt(value.getLastStatusUpdateTime()),
            value.getVersion(),
            web_dir,
            value.getSubError(),
        );

        return Ok(result);
    }
}

export class AppLocalStatusBuilder extends NamedObjectBuilder<AppLocalStatusDesc, EmptyProtobufBodyContent> {
    // ignore
}

export class AppLocalStatusId extends NamedObjectId<AppLocalStatusDesc, EmptyProtobufBodyContent> {
    constructor(id: ObjectId) {
        super(CoreObjectType.AppLocalStatus, id);
    }

    static default(): AppLocalStatusId {
        return named_id_gen_default(CoreObjectType.AppLocalStatus);
    }

    static from_base_58(s: string): BuckyResult<AppLocalStatusId> {
        return named_id_from_base_58(CoreObjectType.AppLocalStatus, s);
    }

    static try_from_object_id(id: ObjectId): BuckyResult<AppLocalStatusId> {
        return named_id_try_from_object_id(CoreObjectType.AppLocalStatus, id);
    }
}

export class AppLocalStatusIdDecoder extends NamedObjectIdDecoder<AppLocalStatusDesc, EmptyProtobufBodyContent> {
    constructor() {
        super(CoreObjectType.AppLocalStatus);
    }
}

export class AppLocalStatus extends NamedObject<AppLocalStatusDesc, EmptyProtobufBodyContent> {
    static create(
        owner: ObjectId,
        id: DecAppId,
    ): AppLocalStatus {
        const desc_content = new AppLocalStatusDesc(id, AppLocalStatusCode.Init, new BuckyHashMap(), new AppQuota(JSBI.BigInt(0), JSBI.BigInt(0), JSBI.BigInt(0)));
        const builder = new AppLocalStatusBuilder(desc_content, new EmptyProtobufBodyContent());

        return builder.owner(owner).no_create_time().build(AppLocalStatus);
    }

    app_id(): DecAppId {
        return this.desc().content().id;
    }

    webdir(): ObjectId | undefined {
        return this.desc().content().web_dir;
    }

    status(): AppLocalStatusCode {
        return this.desc().content().status;
    }

    version(): string | undefined {
        return this.desc().content().version;
    }

    permissions(): BuckyHashMap<BuckyString, PermissionNode> {
        return this.desc().content().permissions;
    }

    permission_unhandled(): BuckyHashMap<BuckyString, PermissionNode> {
        const permissions = this.permissions();
        const unhandled_permissions = new BuckyHashMap<
            BuckyString,
            PermissionNode
        >();
        for (const [k, v] of permissions.entries()) {
            if (v.state == PermissionState.Unhandled) {
                unhandled_permissions.set(k, v);
            }
        }
        return unhandled_permissions;
    }

    sub_error(): SubErrorCode {
        return this.desc().content().sub_error;
    }

    // set_web_dir(web_dir?: DirId) {
    //     this.body_expect().content().web_dir = web_dir;
    //     this.body_expect().set_update_time(bucky_time_now());
    // }

    // set_version(ver: string) {
    //     this.body_expect().content().version = ver;
    //     this.body_expect().set_update_time(bucky_time_now());
    // }

    quota(): AppQuota {
        return this.desc().content().quota;
    }

    last_status_update_time(): JSBI {
        return this.desc().content().last_status_update_time;
    }

    static generate_id(owner: ObjectId, id: DecAppId): ObjectId {
        return AppLocalStatus.create(owner, id)
            .desc()
            .calculate_id();
    }
}

export class AppLocalStatusDecoder extends NamedObjectDecoder<AppLocalStatusDesc, EmptyProtobufBodyContent, AppLocalStatus> {
    constructor() {
        super(
            new AppLocalStatusDescDecoder(),
            new EmptyProtobufBodyContentDecoder(),
            AppLocalStatus
        );
    }

    static create(): AppLocalStatusDecoder {
        return new AppLocalStatusDecoder();
    }
}
