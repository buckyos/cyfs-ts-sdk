import { get_app_log_dir } from '../cyfs-base/base/path_util';

/* IFTRUE_node */
const blog = require('./blog/node_blog.js').blog;
/* FITRUE_node */

/* IFTRUE_h5
const blog = require('./blog/h5_blog.js').blog;
FITRUE_h5 */

/* IFTRUE_rn
const blog = require('./blog/rn_blog.js').blog;
FITRUE_rn */

blog.console = console;

if (typeof window !== "undefined") {
    (window as any).clog = blog;
} else {
    (global as any).clog = blog;
}


function patch_console(log: any) {
    // 保留原有的方法
    (console as any).origin = { };
    (console as any).origin.trace = console.trace;
    (console as any).origin.debug = console.debug;
    (console as any).origin.log = console.log;
    (console as any).origin.info = console.info;

    (console as any).origin.warn = console.warn;
    (console as any).origin.error = console.error;

    (console as any).origin.assert = console.assert;

    console.trace = log.trace;
    console.debug = log.debug;
    console.log = log.info;
    console.info = log.info;

    console.warn = log.warn;
    console.error = log.error;

    console.assert = log.assert;
}

function restore_console() {
    const origin = (console as any).origin;
    console.trace = origin.trace;
    console.debug = origin.debug;
    console.log = origin.info;
    console.info = origin.info;

    console.warn = origin.warn;
    console.error = origin.error;

    console.assert = origin.assert;
}

patch_console(blog);
blog.enableConsoleTarget(true);

export interface LogFileOptions {
    name: string,
    dir?: string,
    file_max_size?: number,
    file_max_count?: number,
}

(blog as any).enable_file_log = (options: LogFileOptions) => {
    const log_options: any = { };
    console.assert(options.name.length > 0);
    log_options.filename = options.name;

    if (options.dir != null) {
        log_options.rootFolder = options.dir!;
    } else {
        log_options.rootFolder = get_app_log_dir(options.name);
    }

    if (options.file_max_size != null) {
        log_options.filemaxsize = options.file_max_size!;
    }
    if (options.file_max_count != null) {
        log_options.filemaxcount = options.file_max_count!;
    }
    blog.addFileTarget(log_options);
}

(blog as any).restore_console = restore_console;
(blog as any).patch_console = patch_console.bind(undefined, blog);

export const clog: any = blog;