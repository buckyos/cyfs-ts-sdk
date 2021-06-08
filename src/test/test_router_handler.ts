import { ObjectId, None } from '../cyfs-base';
import { DecAppId } from '../cyfs-core';
import { RouterHandlerAction, RouterHandlerCategory, SharedObjectStack } from '../non-lib';

export async function test_router_handlers() {
    const stack = SharedObjectStack.open_runtime();
    (await stack.online()).unwrap();

   
    const dec_id = ObjectId.from_base_58('5aSixgP8EPf6HkP54Qgybddhhsd1fgrkg7Atf2icJiiz').unwrap();
    let ret = await stack.router_handlers().add_handler('first-dec', 0,
        RouterHandlerCategory.PutObject,
        `dec_id == `
        RouterAction.Default,
        None);
    console.info(ret);
}