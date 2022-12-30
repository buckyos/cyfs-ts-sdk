import { BuckyError } from "../../cyfs-base"

export class ChunkCodecDesc {
    private constructor(
        public unknown?: boolean,
        public stream?: [number|undefined, number|undefined, number|undefined],
        public raptor?: [number|undefined, number|undefined, number|undefined]) {}

    static Unknown(): ChunkCodecDesc {
        return new ChunkCodecDesc(true, undefined, undefined)
    }

    static Stream(start?: number, end?: number, step?: number): ChunkCodecDesc {
        return new ChunkCodecDesc(undefined, [start, end, step], undefined)
    }

    static Raptor(start?: number, end?: number, step?: number): ChunkCodecDesc {
        return new ChunkCodecDesc(undefined, undefined, [start, end, step])
    }

    match<T>(funcs: {unknown?: () => T, stream?: (start?: number, end?: number, step?: number) => T, raptor?: (start?: number, end?: number, step?: number) => T}): T|undefined {
        if (this.unknown && funcs.unknown) {
            return funcs.unknown()
        } else if (this.stream && funcs.stream) {
            return funcs.stream(...this.stream)
        } else if (this.raptor && funcs.raptor) {
            return funcs.raptor(...this.raptor)
        }

        return undefined;
    }
}

export class DownloadTaskState {
    private constructor(public Downloading?: [number/*速度*/, number/*进度*/], public Paused?: boolean, public Error?: BuckyError/*被cancel的原因*/, public Finished?: boolean) {}

    static Downloading(speed: number, progress: number): DownloadTaskState {
        return new DownloadTaskState([speed, progress])
    }

    static Paused(): DownloadTaskState {
        return new DownloadTaskState(undefined, true)
    }

    static Error(error: BuckyError): DownloadTaskState {
        return new DownloadTaskState(undefined, undefined, error)
    }

    static Finished(): DownloadTaskState {
        return new DownloadTaskState(undefined, undefined, undefined, true)
    }

    static from_obj(obj: any): DownloadTaskState {
        if (typeof obj === "object" && obj.Downloading) {
            return new DownloadTaskState(obj.Downloading)
        } else if (obj === "Paused") {
            return new DownloadTaskState(undefined, true)
        } else if (typeof obj === "object" && obj.Error) {
            return new DownloadTaskState(undefined, undefined, new BuckyError(obj.Error.code, obj.Error.msg))
        } else if (obj === "Finished") {
            return new DownloadTaskState(undefined, undefined, undefined, true)
        }

        throw new Error(`invalid DownloadTaskState: ${JSON.stringify(obj)}`)
    }
}

export enum DownloadTaskControlState {
    Normal = "Normal", 
    Paused = "Paused", 
    Canceled = "Canceled", 
}