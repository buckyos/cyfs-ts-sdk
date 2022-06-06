export function ensureDirSync(dir: string) {
    try {
        require('fs-extra').ensureDirSync(dir);
    } catch (error) {
        console.error(`create dir failed! dir=${dir}, err=`, error);
    }
}

if (typeof TextDecoder === "undefined") {
    global.TextDecoder = require('util').TextDecoder;
}

if (typeof TextEncoder === "undefined") {
    global.TextEncoder = require('util').TextEncoder;
}