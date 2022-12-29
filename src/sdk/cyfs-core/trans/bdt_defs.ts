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