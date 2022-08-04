import { ObjectTypeCode } from "../cyfs-base";

const HARDENED_OFFSET = 0x80000000;
export const CYFS_BIP = 809;

export enum CyfsChainNetwork {
    Main = 0,
    Test = 1,
}

export enum CyfsChainObjectType {
    Device,
    People,
}

export class CyfsChainBipPath {
    constructor(private purpose: number, private coin: CyfsChainObjectType, private type_code: ObjectTypeCode,
        public account: number, public network: CyfsChainNetwork, public address_index: number) {}

    static new_people(network?: CyfsChainNetwork, address_index?: number): CyfsChainBipPath {
        address_index = address_index || 0;
        console.assert(address_index < HARDENED_OFFSET);

        return new CyfsChainBipPath(CYFS_BIP, CyfsChainObjectType.People, ObjectTypeCode.People, 0, network || CyfsChainNetwork.Main, address_index)
    }

    static new_device(
        account: number,
        network?: CyfsChainNetwork,
        address_index?: number,
    ): CyfsChainBipPath {
        address_index = address_index || 0;
        console.assert(address_index < HARDENED_OFFSET);
        return new CyfsChainBipPath(CYFS_BIP, CyfsChainObjectType.Device, ObjectTypeCode.Device, account, network || CyfsChainNetwork.Main, address_index)
    }

    to_string(): string {
        return `m/${this.purpose}'/${this.type_code}'/${this.account}'/${this.network}/${this.address_index}`
    }
}