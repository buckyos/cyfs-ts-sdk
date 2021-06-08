import { ObjectId, None } from '../cyfs-base';
import { DecAppId } from '../cyfs-core';
import { RouterAction, RouterEventFilter, RouterRuleCategory, SharedObjectStack } from '../non-lib';


export async function test_rules() {
    const stack = SharedObjectStack.open_runtime();
    (await stack.online()).unwrap();

   
    const dec_id = ObjectId.from_base_58('5aSixgP8EPf6HkP54Qgybddhhsd1fgrkg7Atf2icJiiz').unwrap();
    let ret = await stack.router_rules().add_rule('dsg-client-client',
        RouterRuleCategory.PostPutToNOC,
        new RouterEventFilter(undefined, undefined, undefined, dec_id),
        RouterAction.Default,
        None);
    console.info(ret);
}