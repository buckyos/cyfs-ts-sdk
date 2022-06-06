import { BuckyResult } from "..";

export interface EventListenerAsyncRoutine<R> {
    call(param: any): Promise<BuckyResult<R>>
}

export interface EventListenerAsyncRoutineT<P, R> {
    call(param: P): Promise<BuckyResult<R>>;
}