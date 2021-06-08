async function ensureDir(dir: string) {
    const options = {
        NSURLIsExcludedFromBackupKey: true // iOS only
    };
    const RNFS = require('react-native-fs');
    await RNFS.mkdir(dir, options);
}

export function ensureDirSync(dir: string) {
    setImmediate(async () => {
        try {
            await ensureDir(dir);
        } catch (error) {
            console.error(`create dir failed! dir=${dir}, err=`, error);
        }
    });
}

require('./platform_rn_js.js');