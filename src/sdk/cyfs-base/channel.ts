export enum CyfsChannel {
    Nightly = 'nightly',
    Beta = 'beta',
    Stable = 'stable',
}

let CYFS_CHANNEL: CyfsChannel;
/* IFTRUE_nightly */ CYFS_CHANNEL = CyfsChannel.Nightly /* FITRUE_nightly */
/* IFTRUE_beta CYFS_CHANNEL = CyfsChannel.Beta FITRUE_beta */
/* IFTRUE_stable CYFS_CHANNEL = CyfsChannel.Stable FITRUE_stable */

if (typeof window !== "undefined") {
    if ((window as any).CYFS_CHANNEL === undefined) {
        (window as any).CYFS_CHANNEL = CYFS_CHANNEL;
    }
} else {
    if ((global as any).CYFS_CHANNEL === undefined) {
        (global as any).CYFS_CHANNEL = CYFS_CHANNEL;
    }
}

const version = 'development version';

console.log(`cyfs-sdk version ${version}`)

export function get_channel(): CyfsChannel {
    return CYFS_CHANNEL;
}