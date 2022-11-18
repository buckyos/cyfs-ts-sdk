import { BuckyError, BuckyErrorCode, BuckyResult, Err, Ok } from "../../cyfs-base";
import { from_base_str } from "../../cyfs-base/base/basex";

export interface NDNDataRange {
    start?: number,
    length?: number,
}

export function ndn_data_range_to_string(range: NDNDataRange): string {
    const start = range.start?range.start:0;

    if (range.length) {
        return `${start}-${start + range.length - 1}`
    } else {
        return `${start}-`
    }
}

function parse_single_range(string: string, size: number): BuckyResult<NDNDataRange|undefined> {
    const start_end = string.split("-");
    if (start_end.length < 2) {
        return Err(new BuckyError(BuckyErrorCode.InvalidInput, ""));
    }

    const start_str = start_end[0].trim()
    const end_str = start_end[1].trim()

    if (start_str.length === 0) {
        if (end_str.length === 0 || end_str.charAt(0) === "-") {
            return Err(new BuckyError(BuckyErrorCode.InvalidInput, ""));
        }

        let length = parseInt(end_str);
        if (length === 0) {
            return Ok(undefined)
        }

        if (length > size) {
            length = size;
        }

        return Ok({start: size - length, length})
    } else {
        const start = parseInt(start_str);
        if (start >= size) {
            return Ok(undefined)
        }
        let length;
        if (end_str.length === 0) {
            length = size - start;
        } else {
            let end = parseInt(end_str);
            if (start > end) {
                return Err(new BuckyError(BuckyErrorCode.InvalidInput, ""));
            }

            if (end >= size) {
                end = size - 1;
            }

            length = end - start + 1
        }

        return Ok({start, length})
    }
}

function parse_ranges(string: string, size: number): BuckyResult<NDNDataRange[]> {
    if (string.length === 0) {
        return Ok([])
    }

    if (!string.startsWith("bytes=")) {
        // as HttpRangeParseError::InvalidRange
        return Err(new BuckyError(BuckyErrorCode.InvalidInput, ""));
    }

    let no_overlap = false;

    const ranges = [];
    
    for (const value of string.substring(6).split(",")) {
        const new_value = value.trim();
        if (new_value.length === 0) {
            continue;
        }
        
        const single_ret = parse_single_range(new_value, size);
        if (single_ret.err) {
            return single_ret;
        }

        const single = single_ret.unwrap();
        if (single) {
            ranges.push(single);
        } else {
            no_overlap = true;
        }
    }

    if (no_overlap && ranges.length === 0) {
        // as HttpRangeParseError::NoOverlap
        return Err(new BuckyError(BuckyErrorCode.NotSupport, "")); 
    }

    return Ok(ranges);
}

function parse_range(range: NDNDataRange, size: number): NDNDataResponseRange|undefined {
    if (range.start) {
        if (range.start >= size) {
            return;
        }

        if (range.length) {
            let len = range.length;
            if (len === 0) {
                return;
            }

            if (range.start + range.length > size) {
                len = size - range.start;
            }

            return NDNDataResponseRange.Range([[{start: range.start, end: range.start + len}], size])
        } else {
            const len = size - range.start;
            return NDNDataResponseRange.Range([[{start: range.start, end: range.start + len}], size])
        }
    } else {
        if (range.length) {
            let len = range.length;

            if (len > size) {
                len = size;
            }

            return NDNDataResponseRange.Range([[{start: 0, end: len}], size])
        } else {
            return NDNDataResponseRange.InvalidRange();
        }

        
    }
}

export class NDNDataRequestRange {
    private constructor(private unparsed?: string, private range?:NDNDataRange[]) {}

    public static new_data_range(ranges: NDNDataRange[]): NDNDataRequestRange {
        return new NDNDataRequestRange(undefined, ranges)
    }

    public static new_unparsed(unparsed: string): NDNDataRequestRange {
        return new NDNDataRequestRange(unparsed)
    }

    toString(): string {
        if (this.unparsed) {
            return this.unparsed
        } else if (this.range) {
            return this.range.map((range) => {
                return ndn_data_range_to_string(range);
            }).join(", ")
        } else {
            throw new Error("invalid NDNDataRequestRange class");
        }
    }

    convert_to_response(size: number): NDNDataResponseRange|undefined {
        if (this.unparsed) {
            const ret = parse_ranges(this.unparsed, size);
            if (ret.err) {
                if (ret.val.code === BuckyErrorCode.InvalidInput) {
                    console.warn(`invalid range: ${this.unparsed}, size=${size}`);
                    return NDNDataResponseRange.InvalidRange();
                } else if (ret.val.code === BuckyErrorCode.NotSupport) {
                    return NDNDataResponseRange.NoOverlap(size);
                }
            } else {
                if (ret.unwrap().length === 0) {
                    return;
                }

                const range = ret.unwrap().map((value) => {
                    return {start: value.start!, end: value.start! + value.length!};
                });
                return NDNDataResponseRange.Range([range, size]);
            }
        } else if (this.range) {
            let no_overlap = false;
            let ranges: Range[] = [];
            for (const range of this.range) {
                const resp_range = parse_range(range, size);
                if (!resp_range) {
                    no_overlap = true;
                } else {
                    if (resp_range.invalid_range) {
                        return resp_range;
                    } else if (resp_range.range) {
                        ranges = ranges.concat(resp_range.range![0])
                    }
                }
            }

            if (ranges.length === 0) {
                if (no_overlap) {
                    return NDNDataResponseRange.NoOverlap(size);
                } else {
                    return;
                }
            }

            return NDNDataResponseRange.Range([ranges, size])
            
        } else {
            throw new Error("invalid NDNDataRequestRange class");
        }
    }
}

export interface Range {
    start: number,
    end: number
}

export class NDNDataResponseRange {
    private constructor(public no_overlap?: number, public invalid_range?: boolean, public range?:[Range[], number]) {}

    static InvalidRange(): NDNDataResponseRange {
        return new NDNDataResponseRange(undefined, true);
    }

    static NoOverlap(size: number): NDNDataResponseRange {
        return new NDNDataResponseRange(size)
    }

    static Range(range: [Range[], number]): NDNDataResponseRange {
        return new NDNDataResponseRange(undefined, false, range)
    }

    static from_json(value: any): BuckyResult<NDNDataResponseRange> {
        if (value === "InvalidRange") {
            return Ok(NDNDataResponseRange.InvalidRange());
        } else if (value.NoOverlap !== undefined) {
            return Ok(NDNDataResponseRange.NoOverlap(value.NoOverlap));
        } else if (value.Range) {
            return Ok(NDNDataResponseRange.Range(value.range));
        } else {
            return Err(new BuckyError(BuckyErrorCode.InvalidInput, `invalid NDNDataResponseRange value ${JSON.stringify(value)}`));
        }
    }

    to_json(): any {
        if (this.no_overlap !== undefined) {
            return {NoOverlap: this.no_overlap}
        } else if (this.invalid_range) {
            return "InvalidRange"
        } else {
            return {
                Range: this.range
            }
        }
    }

    toString(): string {
        return JSON.stringify(this.to_json());
    }

    static from_str(s: string): BuckyResult<NDNDataResponseRange> {
        return NDNDataResponseRange.from_json(JSON.parse(s))
    }
}