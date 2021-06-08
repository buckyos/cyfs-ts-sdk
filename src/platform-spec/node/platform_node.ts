export function ensureDirSync(dir: string) {
    try {
        require('fs-extra').ensureDirSync(dir);
    } catch (error) {
        console.error(`create dir failed! dir=${dir}, err=`, error);
    }
}