import JSBI from 'jsbi';
const TIME_TTO_MICROSECONDS_OFFSET: JSBI = JSBI.BigInt("11644473600000000");

export function bucky_time_now(): JSBI {
    return js_time_to_bucky_time(Date.now());
}

export function bucky_time(date: Date): JSBI {
    return js_date_to_bucky_time(date);
}

export function bucky_time_2_js_time(val: JSBI): number {
    return Number(JSBI.divide(JSBI.subtract(val, TIME_TTO_MICROSECONDS_OFFSET), JSBI.BigInt(1000)));
}

export function bucky_time_2_js_date(val: JSBI): Date {
    return new Date(bucky_time_2_js_time(val));
}

export function js_time_to_bucky_time(val: number): JSBI {
    return JSBI.add(JSBI.multiply(JSBI.BigInt(val), JSBI.BigInt(1000)), TIME_TTO_MICROSECONDS_OFFSET);
}

export function js_date_to_bucky_time(date: Date): JSBI {
    return js_time_to_bucky_time(date.getTime());
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}