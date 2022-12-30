import * as cyfs from '../sdk';

export function test_access_string(): void {
    const access_string = cyfs.AccessString.default();
    console.log("default=", access_string);
    console.assert(access_string.to_string() === "rwxrwxrwx---rwxrwx---");

    let ret = access_string.is_accessable(cyfs.AccessGroup.CurrentDevice, cyfs.AccessPermission.Read);
    console.assert(ret);

    ret= access_string.is_accessable(cyfs.AccessGroup.CurrentDevice, cyfs.AccessPermission.Call);
    console.assert(ret);
    ret= access_string.is_accessable(cyfs.AccessGroup.CurrentDevice, cyfs.AccessPermission.Read);
    console.assert(ret);
    ret= access_string.is_accessable(cyfs.AccessGroup.CurrentDevice, cyfs.AccessPermission.Write);
    console.assert(ret);

    ret= access_string.is_accessable(cyfs.AccessGroup.OthersDec, cyfs.AccessPermission.Call);
    console.assert(!ret);
    ret= access_string.is_accessable(cyfs.AccessGroup.OthersDec, cyfs.AccessPermission.Read);
    console.assert(!ret);
    ret= access_string.is_accessable(cyfs.AccessGroup.OthersDec, cyfs.AccessPermission.Write);
    console.assert(!ret);

    access_string.set_group_permission(cyfs.AccessGroup.OthersDec, cyfs.AccessPermission.Call);
    ret= access_string.is_accessable(cyfs.AccessGroup.OthersDec, cyfs.AccessPermission.Call);
    console.assert(ret);

    access_string.clear_group_permission(cyfs.AccessGroup.OthersDec, cyfs.AccessPermission.Call);
    ret= access_string.is_accessable(cyfs.AccessGroup.OthersDec, cyfs.AccessPermission.Call);
    console.assert(!ret);


    let c = access_string.get_group_permissions(cyfs.AccessGroup.CurrentZone);
    console.assert(c.equal(cyfs.AccessPermissions.Full))

    console.log(c);
    console.assert(c.toString() === "rwx")


    access_string.clear_group_permissions(cyfs.AccessGroup.CurrentZone);
    c = access_string.get_group_permissions(cyfs.AccessGroup.CurrentZone);
    console.assert(c.equal(cyfs.AccessPermissions.None));

    access_string.set_group_permission(cyfs.AccessGroup.CurrentZone, cyfs.AccessPermission.Call);
    access_string.set_group_permission(cyfs.AccessGroup.CurrentZone, cyfs.AccessPermission.Read);

    console.log(access_string);
    console.assert(access_string.toString() === "rwxr-xrwx---rwxrwx---")

    c = access_string.get_group_permissions(cyfs.AccessGroup.CurrentZone);
    console.assert(c.equal(cyfs.AccessPermissions.ReadAndCall));
    console.log(c);
    console.assert(c.toString() === "r-x")
}