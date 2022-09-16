import { get_system_dec_app, GlobalStateCategory, ObjectId, RequestGlobalStatePath, RequestGlobalStateRoot } from "../sdk";

export function test_global_state_path(): void {
    let root = new RequestGlobalStatePath(undefined, "/a/b");

    let s = root.format_string();
    console.log(s);
    let r = RequestGlobalStatePath.parse(s).unwrap();
    console.assert(root.format_string() === r.format_string())

    root.global_state_category = GlobalStateCategory.RootState;
    s = root.format_string();
    console.log(s);
    r = RequestGlobalStatePath.parse(s).unwrap();
    console.assert(root.toString() === r.toString());

    root.global_state_root = RequestGlobalStateRoot.DecRoot(ObjectId.default());
    s = root.format_string();
    console.log(s);
    r = RequestGlobalStatePath.parse(s).unwrap();
    console.assert(root.toString() === r.toString());

    root._req_path = undefined;
    s = root.format_string();
    console.log(s);
    r = RequestGlobalStatePath.parse(s).unwrap();
    console.assert(root.toString() === r.toString());

    root._req_path = "/a";
    s = root.format_string();
    console.log(s);
    r = RequestGlobalStatePath.parse(s).unwrap();
    console.assert(root.toString(), r.toString());

    root.dec_id = get_system_dec_app().object_id;
    s = root.format_string();
    console.log(s);
    r = RequestGlobalStatePath.parse(s).unwrap();
    console.assert(r.dec_id === undefined);
}