export interface SystemInfo {
    name: string,

    cpu_usage: number,

    total_memory: number,
    used_memory: number,

    // 每个刷新周期之间的传输的bytes
    received_bytes: number,
    transmitted_bytes: number,

    // SSD硬盘容量和已用容量，包括Unknown
    ssd_disk_total: number,
    ssd_disk_avail: number,

    // HDD硬盘容量和已用容量
    hdd_disk_total: number,
    hdd_disk_avail: number,
}

// 这里是bdt定义的SnStatus，sdk中现在只有util接口会用到它的string表示形式，这里就直接定义成string
export enum SnStatus {
    Init = 'init',
    Connecting = 'connecting',
    Online = 'online',
    Offline = 'offline'
}

export interface NamedObjectCacheStat {
    count: number,
    storage_size: number,
}