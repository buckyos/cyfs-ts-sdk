const TIME_TTO_MICROSECONDS_OFFSET: bigint = BigInt("11644473600") * BigInt(1000) * BigInt(1000);

export function bucky_time_now(): bigint {
    return js_time_to_bucky_time(Date.now());
}

export function bucky_time(date: Date): bigint {
    return js_date_to_bucky_time(date);
}

export function bucky_time_2_js_time(val: bigint): number {
    return Number((val - TIME_TTO_MICROSECONDS_OFFSET) / BigInt(1000));
}

export function bucky_time_2_js_date(val: bigint): Date {
    return new Date(bucky_time_2_js_time(val));
}

export function js_time_to_bucky_time(val: number): bigint {
    return BigInt(val) * BigInt(1000) + TIME_TTO_MICROSECONDS_OFFSET;
}

export function js_date_to_bucky_time(date: Date): bigint {
    return js_time_to_bucky_time(date.getTime());
}

export function sleep(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}