import { Command } from "commander";
import { BuckyResult, NONAPILevel, ObjectId, Ok, SharedCyfsStack } from "../../sdk";
import { create_stack, CyfsToolConfig, stop_runtime } from "../lib/util";

export function makeCommand(config: CyfsToolConfig): Command {
    return new Command("del")
        .description("delobject from cyfs stack`s noc")
        .argument("<objectid>", "delete object from noc")
        .requiredOption("-e, --endpoint <target>", "cyfs dump endpoint, ood or runtime", "runtime")
        .option('-t, --target <target>', "target cyfs stack, default is endpoint self")
        .action(async (objectid, options) => {
            console.log("options:", options)
            const [stack, writable] = await create_stack(options.endpoint, config)
            await stack.online();
            await run(objectid, options, stack);
            stop_runtime()
        })
}

export async function delete_object(object_id: ObjectId, target: ObjectId|undefined, stack: SharedCyfsStack): Promise<BuckyResult<void>> {
    const ret = await stack.non_service().delete_object({
        common: {
            level: NONAPILevel.Router,
            target,
            flags:0
        },
        object_id
    });
    if (ret.err) {
        return ret;
    } else {
        return Ok(undefined)
    }
}

async function run(id: string, options: any, stack: SharedCyfsStack): Promise<void> {
    const object_id = ObjectId.from_base_58(id).unwrap()
    let target: ObjectId|undefined;
    if (options.target) {
        if (options.target === "ood") {
            const reslove_ret = (await stack.util().resolve_ood({
                common: {flags:0},
                object_id: stack.local_device_id().object_id
            })).unwrap()
            target = reslove_ret.device_list[0].object_id
        } else {
            target = ObjectId.from_base_58(options.target).unwrap()
        }
    }
    const ret = await delete_object(object_id, target, stack)
    if (ret.err) {
        console.error(`delete object ${id} from ${target||"myself"} err ${ret.val}`)
    } else {
        console.error(`delete object ${id} from ${target||"myself"} success`)
    }
}