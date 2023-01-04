import { SharedCyfsStack } from "../../sdk";

export async function test_stack_util(stack: SharedCyfsStack): Promise<void> {
    const util_service = stack.util();
    const self_device_id = stack.local_device_id();
    const self_owner_id = stack.local_device().desc().owner()!;
    let ood_id;
    {
        const r = await util_service.get_device({
            common: {flags: 0}
        });
        if (r.err) {
            console.error("get device err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`get device ${resp.device_id} success`);
    }

    {
        // 查询自己所属的zone
        const r = await util_service.get_zone({
            common: {flags: 0},
            object_id: self_device_id.object_id
        });
        if (r.err) {
            console.error("get_zone err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`get zone ${resp.zone_id} success`);
    }

    {
        // 查询自己的ood
        const r = await util_service.resolve_ood({
            common: {flags: 0},
            object_id: self_owner_id
        });
        if (r.err) {
            console.error("resolve_ood err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`resolve_ood ${resp.device_list[0]} success`);
        ood_id = resp.device_list[0].object_id;
    }

    {
        const r = await util_service.get_ood_status({
            common: {flags: 0},
        });
        if (r.err) {
            console.error("get_ood_status err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`get_ood_status ${resp.status} success`);
    }

    {
        const r = await util_service.get_noc_info({
            common: {flags: 0},
        });
        if (r.err) {
            console.error("get_noc_info err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`get_noc_info ${JSON.stringify(resp.stat)} success`);
    }

    {
        const r = await util_service.get_noc_info({
            common: {flags: 0, target: ood_id},
        });
        if (r.err) {
            console.error("get_noc_info from ood err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`get_noc_info from ood ${JSON.stringify(resp.stat)} success`);
    }

    {
        const r = await util_service.get_network_access_info({
            common: {flags: 0},
        });
        if (r.err) {
            console.error("get_network_access_info err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`get_network_access_info ${JSON.stringify(resp.info)} success`);
    }

    {
        const r = await util_service.get_network_access_info({
            common: {flags: 0, target: ood_id},
        });
        if (r.err) {
            console.error("get_network_access_info from ood err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`get_network_access_info from ood ${JSON.stringify(resp.info)} success`);
    }

    {
        const r = await util_service.get_device_static_info({
            common: {flags: 0},
        });
        if (r.err) {
            console.error("get_device_static_info err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`get_device_static_info ${JSON.stringify(resp.info)} success`);
    }

    {
        const r = await util_service.get_device_static_info({
            common: {flags: 0, target: ood_id},
        });
        if (r.err) {
            console.error("get_device_static_info from ood err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`get_device_static_info from ood ${JSON.stringify(resp.info)} success`);
    }

    {
        const r = await util_service.get_system_info({
            common: {flags: 0},
        });
        if (r.err) {
            console.error("get_system_info err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`get_system_info ${JSON.stringify(resp.info)} success`);
    }

    {
        const r = await util_service.get_system_info({
            common: {flags: 0, target: ood_id},
        });
        if (r.err) {
            console.error("get_system_info from ood err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`get_system_info from ood ${JSON.stringify(resp.info)} success`);
    }

    {
        const r = await util_service.get_version_info({
            common: {flags: 0},
        });
        if (r.err) {
            console.error("get_version_info err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`get_version_info ${JSON.stringify(resp.info)} success`);
    }

    {
        const r = await util_service.get_version_info({
            common: {flags: 0, target: ood_id},
        });
        if (r.err) {
            console.error("get_version_info from ood err", r.val);
            return
        }

        const resp = r.unwrap();

        console.info(`get_version_info from ood ${JSON.stringify(resp.info)} success`);
    }

    console.info("test stack util pass");
}