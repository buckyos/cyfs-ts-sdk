import { BuckyResult } from "..";

export interface EventListenerAsyncRoutine<R> {
    call(param: any): Promise<BuckyResult<R>>
}