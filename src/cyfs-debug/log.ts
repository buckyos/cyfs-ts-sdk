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
    (console as any).origin = {};
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

patch_console(blog);
blog.enableConsoleTarget(true);

export const clog: any = blog;