import * as os from 'os';
import * as process from 'process';
import * as path from 'path';
import { ensureDirSync } from '../../platform-spec';

export const CFYS_ROOT_NAME = "cyfs";

function get_system_app_data_dir(): string {
    return process.env.APPDATA || (os.platform() === 'darwin' ?
        process.env.HOME + '/Library/Application Support' :
        process.env.HOME + "/.local/share");
}

export function default_cyfs_root_path(): string {
    let root_dir: string;
    const platform = os.platform() as string;

    if (platform === 'win32') {
        root_dir = `C:\\${CFYS_ROOT_NAME}`;
    } else if (platform === 'browser') {
        root_dir = "";
    } else if (platform === 'darwin') {
        root_dir = `${get_system_app_data_dir()}/${CFYS_ROOT_NAME}`;
    } else {
        // linux/android/ios
        root_dir = `/${CFYS_ROOT_NAME}`;
    }

    return root_dir;
}

let CYFS_ROOT: string = default_cyfs_root_path();


// 初始化时候调用一次
export function bind_cyfs_root_path(root_path: string) {
    console.info(`change cyfs root path from ${CYFS_ROOT} to: ${root_path}`);

    CYFS_ROOT = root_path;
}

export function get_cyfs_root_path(): string {
    return CYFS_ROOT;
}

export function get_temp_path(): string {
    const dir = path.join(get_cyfs_root_path(), 'tmp');

    ensureDirSync(dir);

    return dir;
}

export function get_log_dir(service_name: string): string {
    const dir = path.join(get_cyfs_root_path(), 'log', service_name);

    ensureDirSync(dir);

    return dir;
}

export function get_app_log_dir(app_id: string): string {
    const dir = path.join(get_cyfs_root_path(), 'log', 'app', app_id);

    ensureDirSync(dir);

    return dir;
}

export function get_app_data_dir(app_id: string): string {
    const dir = path.join(get_cyfs_root_path(), 'data', 'app', app_id);

    ensureDirSync(dir);

    return dir;
}