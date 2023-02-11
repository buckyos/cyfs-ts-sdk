import * as fs from "fs";
import * as path from "path";
import * as cyfs from "../sdk";
import JSBI from "jsbi";
import { get_system_dec_app } from '../sdk';

function test_zone() {
  const desc_file = path.join(cyfs.get_app_data_dir("tests"), "zone.desc");

  const buf: Buffer = fs.readFileSync(desc_file);

  const [zone, left] = new cyfs.ZoneDecoder()
    .raw_decode(new Uint8Array(buf))
    .unwrap();
  console.info(zone.owner());
  console.info(zone.ood_list()[0]);

  console.assert(
    zone.owner().to_base_58() === "5aSixgLtjoYcAFH9isc6KCqDgKfTJ8jpgASAoiRz5NLk"
  );
  console.assert(
    zone.ood_list()[0].to_base_58() ===
    "5aSixgPXvhR4puWzFCHqvUXrjFWjxbq4y3thJVgZg6ty"
  );
  console.assert(
    zone.known_device_list()[0].to_base_58() ===
    "5aSixgPXvhR4puWzFCHqvUXrjFWjxbq4y3thJVgZg6ty"
  );

  // 测试下签名
  const sk = cyfs.PrivateKey.generate_rsa(1024).unwrap();
  const sr = cyfs.sign_and_set_named_object(
    sk,
    zone,
    new cyfs.SignatureRefIndex(cyfs.SIGNATURE_SOURCE_REFINDEX_OWNER)
  );
  console.assert(!sr.err);
}

function test_text() {
  {
    const rust_id = "9cfBkPspECqrFGSe5FqDZj4vTiAGnbb8JZkc4CYNqwXg";
    const empty_obj = cyfs.TextObject.create(undefined, "", "", "");
    const id = empty_obj.desc().calculate_id().to_base_58();
    console.assert(id === rust_id);
  }
  {
    const desc_file = path.join(
      cyfs.get_app_data_dir("tests"),
      "text_empty.desc"
    );

    const buf: Buffer = fs.readFileSync(desc_file);
    const [text, left] = new cyfs.TextObjectDecoder()
      .raw_decode(new Uint8Array(buf))
      .unwrap();
    console.assert(left.length === 0);

    console.assert(text.id.length === 0);
    console.assert(text.header.length === 0);
    console.assert(text.value.length === 0);
  }
  {
    const id = "test_text";
    const header = "test_header";
    const value = "test_value";

    const desc_file = path.join(cyfs.get_app_data_dir("tests"), "text.desc");

    const buf: Buffer = fs.readFileSync(desc_file);
    const [text, left] = new cyfs.TextObjectDecoder()
      .raw_decode(new Uint8Array(buf))
      .unwrap();
    console.assert(left.length === 0);

    console.assert(text.id === id);
    console.assert(text.header === header);
    console.assert(text.value === value);
  }
}

function test_app_status() {
  const owner = cyfs.ObjectId.from_base_58(
    "5aSixgLtjoYcAFH9isc6KCqDgKfTJ8jpgASAoiRz5NLk"
  ).unwrap();
  const dec_app_id = cyfs.DecApp.generate_id(owner, "test-dec-app");
  console.info(`dec_app_id=${dec_app_id}`);
  console.assert(
    dec_app_id.to_base_58() === "9tGpLNnRArrhLjYjMYu1yhKpVU9vKhMEhYXsfVDAwwxq"
  );

  const version = "1.0.0.1";

  const dec_id = cyfs.DecAppId.try_from_object_id(dec_app_id.clone()).unwrap();
  const app_status = cyfs.AppStatus.create(owner, dec_id, version, true);

  const id = app_status.desc().calculate_id();
  console.info(`app_status_id: ${id}`);
  console.assert(
    id.to_base_58() === "9tGpLNnCHnHzsmSaN3KnMRfrqxoD2Q1bLNMfbFLs3nFA"
  );

  const buf = app_status.to_vec().unwrap();
  const app_status2: cyfs.AppStatus = cyfs
    .from_buf(buf, new cyfs.AppStatusDecoder())
    .unwrap();

  console.assert(app_status2.app_id().to_base_58() === dec_id.to_base_58());
  console.assert(app_status2.version() === version);
  console.assert(app_status2.status() === true);
  const id2 = app_status2.desc().calculate_id();
  console.info(`app_status2_id: ${id2}`);

  console.assert(id2.to_base_58() === id.to_base_58());
}

// cyfs.AppLocalStatusEx
async function _getObj<T>(
  router: cyfs.NONRequestor,
  id: cyfs.ObjectId,
  decoder: cyfs.RawDecode<T>
): Promise<cyfs.BuckyResult<T>> {
  let raw;
  {
    const r = await router.get_object({
      object_id: id,
      common: {
        level: cyfs.NONAPILevel.Router,
        flags: 0,
      },
    });
    if (r.err) {
      console.log(`router get_object failed: ${r}`);
      return r;
    }
    raw = r.unwrap().object.object_raw;
  }

  let obj: T;
  {
    const r = decoder.raw_decode(raw);
    if (r.err) {
      return r;
    }

    obj = r.unwrap()[0];
  }

  return cyfs.Ok(obj);
}

async function test_app_local_status_ex() {

}

async function _putObj(
  router: cyfs.NONRequestor,
  obj: cyfs.AppCmd | cyfs.AppLocalList
): Promise<cyfs.BuckyResult<cyfs.NONPutObjectOutputResponse>> {
  const buf_len = obj.raw_measure().unwrap();
  const buf = new Uint8Array(buf_len);
  obj.raw_encode(buf);
  const r = await router.put_object({
    object: new cyfs.NONObjectInfo(obj.desc().calculate_id(), buf),
    common: {
      level: cyfs.NONAPILevel.Router,
      flags: 0,
    },
  });
  console.log("*".repeat(128));
  if (r.err && r.val.code != cyfs.BuckyErrorCode.Ignored) {
    console.log(`_putObj failed, error ${r}`);
  } else {
    console.log("_putObj success");
  }
  return r;
}

async function test_app_cmd() {
  const sharedStatck: cyfs.SharedCyfsStack =
    cyfs.SharedCyfsStack.open_runtime(get_system_dec_app().object_id);
  await sharedStatck.wait_online();
  const router: cyfs.NONRequestor = sharedStatck.non_service();
  const owner = cyfs.ObjectId.from_base_58(
    "5r4MYfF8FpNABnYjNyPh3Egmx68CTUaZxnreJJBkiboU"
  ).unwrap();
  const dec_app_id = cyfs.DecApp.generate_id(owner, "20220106-test");
  console.info(`dec_app_id=${dec_app_id}`);
  console.assert(
    dec_app_id.to_base_58() === "9tGpLNnRDgGPWTYLJNAhkSsky9bJ7w5vHHDu5xa9Tzog"
  );
  const dec_id = cyfs.DecAppId.try_from_object_id(dec_app_id.clone()).unwrap();

  {
    // register router handler for dec app
    const handler = new DecAppObjectHandler(owner, router);
    console.log(`register router handler for AppListEx object`);
    void await sharedStatck.router_handlers().add_put_object_handler(
      cyfs.RouterHandlerChain.PostNOC,
      "test_app_manager_list_listener",
      0,
      `obj_type == ${cyfs.CoreObjectType.AppLocalList}`,
      undefined,
      cyfs.RouterHandlerAction.Pass,
      handler,
    )
  }

  {
    // register router handler for dec app
    const handler = new DecAppObjectHandler(owner, router);
    console.log(`register router handler for AppLocalStatusEx object`);
    void await sharedStatck.router_handlers().add_put_object_handler(
      cyfs.RouterHandlerChain.PostNOC,
      "test_app_manager_status_listener",
      0,
      `obj_type == ${cyfs.CoreObjectType.AppLocalStatus}`,
      undefined,
      cyfs.RouterHandlerAction.Pass,
      handler,
    )
  }

  // add app cmd
  {
    console.log("*".repeat(128));
    const app_cmd = cyfs.AppCmd.add(owner, dec_id, owner);
    const id = app_cmd.desc().calculate_id();
    console.info(`add app cmd. app_cmd_id: ${id}`);
    const r = await _putObj(router, app_cmd);
    if (r.ok) {
      const response = r.unwrap();
      console.log(`add app response = ${response.result}`);
      if (response.object_update_time) {
        console.log(`add app update time: ${response.object_update_time}`);
      }
    } else {
      console.log(`add app failed`);
    }
  }

  await cyfs.sleep(1000 * 2);
  // install app cmd
  {
    console.log("*".repeat(128));
    const version = "1.0.3";
    const app_cmd = cyfs.AppCmd.install(owner, dec_id, version, true);
    const id = app_cmd.desc().calculate_id();
    console.info(`install app cmd. app_cmd_id: ${id}`);
    const r = await _putObj(router, app_cmd);
    if (r.ok) {
      const response = r.unwrap();
      console.log(`install app response = ${response.result}`);
      if (response.object_update_time) {
        console.log(`install app update time: ${response.object_update_time}`);
      }
    } else {
      console.log(`install app failed`);
    }
  }

  await cyfs.sleep(1000 * 5);
  // start app cmd
  {
    console.log("*".repeat(128));
    const app_cmd = cyfs.AppCmd.start(owner, dec_id);
    const id = app_cmd.desc().calculate_id();
    console.info(`start app cmd. app_cmd_id: ${id}`);
    const r = await _putObj(router, app_cmd);
    if (r.ok) {
      const response = r.unwrap();
      console.log(`start app response = ${response.result}`);
      if (response.object_update_time) {
        console.log(`start app update time: ${response.object_update_time}`);
      }
    } else {
      console.log(`start app failed`);
    }
  }

  await cyfs.sleep(1000 * 2);
  // set_permission cmd
  {
    console.log("*".repeat(128));
    const permission = new Map<string, boolean>();
    const app_cmd = cyfs.AppCmd.set_permission(owner, dec_id, permission);
    const id = app_cmd.desc().calculate_id();
    console.info(`set_permission cmd. app_cmd_id: ${id}`);
    const r = await _putObj(router, app_cmd);
    if (r.ok) {
      const response = r.unwrap();
      console.log(`set_permission response = ${response.result}`);
      if (response.object_update_time) {
        console.log(
          `set_permission update time: ${response.object_update_time}`
        );
      }
    } else {
      console.log(`set_permission failed`);
    }
  }

  await cyfs.sleep(1000 * 2);
  // set_quota cmd
  {
    console.log("*".repeat(128));
    const quota = new Map<cyfs.AppQuotaType, JSBI>();
    quota.set(cyfs.AppQuotaType.Cpu, JSBI.BigInt(100));
    quota.set(cyfs.AppQuotaType.DiskSpace, JSBI.BigInt(100000));
    const app_cmd = cyfs.AppCmd.set_quota(owner, dec_id, quota);
    const id = app_cmd.desc().calculate_id();
    console.info(`set_quota cmd. app_cmd_id: ${id}`);
    const r = await _putObj(router, app_cmd);
    if (r.ok) {
      const response = r.unwrap();
      console.log(`set_quota response = ${response.result}`);
      if (response.object_update_time) {
        console.log(`set_quota update time: ${response.object_update_time}`);
      }
    } else {
      console.log(`set_quota failed`);
    }
  }

  await cyfs.sleep(1000 * 200);
  // stop app cmd
  {
    console.log("*".repeat(128));
    const app_cmd = cyfs.AppCmd.stop(owner, dec_id);
    const id = app_cmd.desc().calculate_id();
    console.info(`stop app cmd. app_cmd_id: ${id}`);
    const r = await _putObj(router, app_cmd);
    if (r.ok) {
      const response = r.unwrap();
      console.log(`stop app response = ${response.result}`);
      if (response.object_update_time) {
        console.log(`stop app update time: ${response.object_update_time}`);
      }
    } else {
      console.log(`stop app failed`);
    }
  }

  await cyfs.sleep(1000 * 2);
  // uninstall app cmd
  {
    console.log("*".repeat(128));
    const app_cmd = cyfs.AppCmd.uninstall(owner, dec_id);
    const id = app_cmd.desc().calculate_id();
    console.info(`uninstall app cmd. app_cmd_id: ${id}`);
    const r = await _putObj(router, app_cmd);
    if (r.ok) {
      const response = r.unwrap();
      console.log(`uninstall app response = ${response.result}`);
      if (response.object_update_time) {
        console.log(
          `uninstall app update time: ${response.object_update_time}`
        );
      }
    } else {
      console.log(`uninstall app failed`);
    }
  }

  await cyfs.sleep(1000 * 2);
  // remove app cmd
  {
    console.log("*".repeat(128));
    const app_cmd = cyfs.AppCmd.remove(owner, dec_id);
    const id = app_cmd.desc().calculate_id();
    console.info(`remove app cmd. app_cmd_id: ${id}`);
    const r = await _putObj(router, app_cmd);
    if (r.ok) {
      const response = r.unwrap();
      console.log(`remove app response = ${response.result}`);
      if (response.object_update_time) {
        console.log(`remove app update time: ${response.object_update_time}`);
      }
    } else {
      console.log(`remove app failed`);
    }
  }

  cyfs.sleep(100 * 1000);
}

async function test_app_list_ex() {
  const sharedStatck = cyfs.SharedCyfsStack.open_runtime(get_system_dec_app().object_id);
  await sharedStatck.wait_online();
  const router: cyfs.NONRequestor = sharedStatck.non_service();

  const owner = cyfs.ObjectId.from_base_58(
    "5r4MYfF8FpNABnYjNyPh3Egmx68CTUaZxnreJJBkiboU"
  ).unwrap();
  // id category 需要指定
  {
    console.log("*".repeat(128));
    const app_list_ex = cyfs.AppLocalList.create(owner, "20220106-test");
    const dec_app_id = cyfs.DecApp.generate_id(owner, "20220106-test");
    const dec_id = cyfs.DecAppId.try_from_object_id(
      dec_app_id.clone()
    ).unwrap();
    app_list_ex.insert(dec_id);
    await _putObj(router, app_list_ex);
  }
  cyfs.sleep(1000 * 5); /*
  {
    const app_list_ex_id = cyfs.AppLocalList.generate_id(
      owner,
      "20220106-test",
    );
    const r = await _getObj(
      router,
      app_list_ex_id,
      cyfs.AppLocalListDecoder.create()
    );
    if (r.err) {
      console.log(`get object failed, error:${r}`);
      return;
    }
    const app_list_ex = r.unwrap();
    const app_list = app_list_ex.app_list();
    console.log(`app id count = ${app_list.size}`);
    for (const [app_id] of app_list.entries()) {
      console.log(`app id = ${app_id.to_string()}`);
    }
  }*/
}

class DecAppObjectHandler implements cyfs.RouterHandlerPutObjectRoutine {
  private _router: cyfs.NONRequestor;
  private _owner: cyfs.ObjectId;
  constructor(owner: cyfs.ObjectId, router: cyfs.NONRequestor) {
    this._owner = owner;
    this._router = router;
  }

  public async call(
    param: cyfs.RouterHandlerPutObjectRequest
  ): Promise<cyfs.BuckyResult<cyfs.RouterHandlerPutObjectResult>> {
    const codec = new cyfs.NONPutObjectOutputRequestJsonCodec();
    console.info(
      "put_object param: ",
      JSON.stringify(codec.encode_object(param.request))
    );

    const obj_type_number: number = param.request.object.object!.obj_type();
    const obj_type: cyfs.CoreObjectType =
      cyfs.number_2_core_object_type(obj_type_number);
    let is_success = false;
    switch (obj_type) {
      case cyfs.CoreObjectType.AppLocalStatus:
        {
          const status = cyfs.AppLocalStatusDecoder.create()
            .from_raw(param.request.object.object_raw)
            .unwrap();
          const app_id = status.app_id();
          const unhandled_permissions = status.permission_unhandled();
          const permissions = new Map<string, boolean>();
          for (const [k, v] of unhandled_permissions.entries()) {
            console.log(
              `request new permission: app ${app_id} permission ${k}, reason ${v}`
            );
            permissions.set(k.value(), true);
          }
          const cmd = cyfs.AppCmd.set_permission(
            this._owner,
            app_id,
            permissions
          );
          is_success = await this.put_object(cmd);
          if (is_success) {
            console.log(`set_permission success!`);
          } else {
            console.error(`set_permission failed!!`);
          }
        }
        break;
      case cyfs.CoreObjectType.AppLocalList:
        {
          const applistEx = cyfs.AppLocalListDecoder.create()
            .from_raw(param.request.object.object_raw)
            .unwrap();
          const app_list: cyfs.BuckyHashSet<cyfs.DecAppId> = applistEx.app_list();
          for (const [id] of app_list.entries()) {
            console.log(`Dec app ${id}`);
          }
        }
        break;
      default:
        console.error("no need handle!!");
        break;
    }

    const result: cyfs.RouterHandlerPutObjectResult = {
      action: cyfs.RouterHandlerAction.Pass,
    };
    return cyfs.Ok(result);
  }

  private async put_object(object: any): Promise<boolean> {
    const object_id = object.desc().calculate_id();
    const object_raw = object.to_vec().unwrap();
    const req = {
      common: {
        dec_id: this._owner,
        flags: 0,
        level: cyfs.NONAPILevel.Router,
      },
      object: new cyfs.NONObjectInfo(object_id, object_raw),
    };
    const r = await this._router.put_object(req);
    if (r.err) {
      const err = r.val! as cyfs.BuckyError;
      if (err.code === cyfs.BuckyErrorCode.Ignored) {
        console.error(`put obj [${object_id}] to ood failed, err ${err}`);
        return false;
      }
    }
    return true;
  }
}

export async function test_core_objects() {
  // test_text();
  // test_zone();

  // test_app_status();

  //await test_app_local_status_ex();
  //await test_app_list_ex();
  //await test_app_cmd();
}
