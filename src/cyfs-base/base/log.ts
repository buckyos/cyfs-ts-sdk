import {} from "./buffer";

function convert(obj: any){
    const cache: any[] = [];

    const output = JSON.stringify(obj, (key, v ) => {
        if(typeof v=== "bigint"){
            return v.toString() + "n";
        }

        if (typeof v === "object" && v !== null) {
            if (cache.indexOf(v) !== -1) {
                return "[[circular]]";
            }

            cache.push(v);

            if(v.to_hex!=null){
                return v.to_hex();
            }

            if(v.to_base_58!=null){
                return v.to_base_58();
            }

            if(v.buffer && v.toHex!=null){
                return v.toHex();
            }
        }
        return v;
    }, 1);

    return output;
}

export function log(...args: any[]) {
    console.log(...args.map(arg=>convert(arg)));
}

export function warn(...args: any[]) {
    console.warn(...args.map(arg=>convert(arg)));
}

export function error(...args: any[]) {
    console.error(...args.map(arg=>convert(arg)));
}

export const cyfs_log_config = {
    enable_base_log: false,
    enable_base_trace: false,
    enable_base_warn: true,
    enable_base_error: true,
};

export function base_log(...args: any[]) {
    if(!cyfs_log_config.enable_base_trace){
        return;
    }
    console.log(...args.map(arg=>convert(arg)));
}

export function base_trace(...args: any[]) {
    if(!cyfs_log_config.enable_base_trace){
        return;
    }
    console.log(...args.map(arg=>convert(arg)));
}

export function base_warn(...args: any[]) {
    if(!cyfs_log_config.enable_base_warn){
        return;
    }
    console.warn(...args.map(arg=>convert(arg)));
}

export function base_error(...args: any[]) {
    if(!cyfs_log_config.enable_base_error){
        return;
    }
    console.error(...args.map(arg=>convert(arg)));
}