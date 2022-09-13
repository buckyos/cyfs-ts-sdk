import { BuckyError, BuckyErrorCode, BuckyResult, Err, Ok } from "../../cyfs-base";

import BitSet from 'bitset'

export const ACCESS_GROUP_MASK: number = 0b111 << 29;

export class AccessPermission {
    static Call = new AccessPermission(0b001);
    static Write = new AccessPermission(0b010);
    static Read = new AccessPermission(0b100);

    private constructor(private value: number){}
    bit(): number {
        let value = 0;
        let perm_num = this.value;
        do {
            if (perm_num === 1) {
                return value;
            }
            perm_num = perm_num >> 1;
            value += 1;
        } while (perm_num > 0);

        throw new Error(`invalid AccessPermission ${this.value}`)
    }

    test(access: number): boolean {
        return (access & this.value) === this.value
    }
}

export class AccessPermissions {
    static None = new AccessPermissions(0);
    static CallOnly = new AccessPermissions(0b001);
    static WriteOnly = new AccessPermissions(0b010);
    static WirteAndCall = new AccessPermissions(0b011);
    static ReadOnly = new AccessPermissions(0b100);
    static ReadAndCall = new AccessPermissions(0b101);
    static ReadAndWrite = new AccessPermissions(0b110);
    static Full = new AccessPermissions(0b111);

    private constructor(public value: number){}

    as_str(): string {
        let can_call = AccessPermission.Call.test(this.value);
        let can_read = AccessPermission.Read.test(this.value);
        let can_write = AccessPermission.Write.test(this.value);

        return `${can_read?"r":"-"}${can_write?"w":"-"}${can_call?"x":"-"}`
    }

    static from_u8(value: number): BuckyResult<AccessPermissions> {
        if (value > AccessPermissions.Full.value) {
            let msg = `invalid AccessPermissions value: ${value}`
            console.error(msg);
            return Err(new BuckyError(BuckyErrorCode.InvalidParam, msg))
        }

        return Ok(new AccessPermissions(value));
    }

    format_u8(v: number): string {
        let ret = AccessPermissions.from_u8(v);
        if (ret.err) {
            return v.toString()
        } else {
            return ret.unwrap().as_str()
        }
    }

    toString(): string {
        return this.as_str()
    }

    equal(perm: AccessPermissions): boolean {
        return this.value === perm.value
    }
}

export class AccessGroup {
    static CurrentDevice = new AccessGroup(0);
    static CurrentZone = new AccessGroup(3);
    static FriendZone = new AccessGroup(6);
    static OthersZone = new AccessGroup(9);

    static OwnerDec = new AccessGroup(12);
    static SystemDec = new AccessGroup(15);
    static OthersDec = new AccessGroup(18);
    private constructor(private value: number){}

    range(): {start: number, end: number} {
        return {start: this.value, end: this.value + 3}
    }

    bit(permission: AccessPermission): number {
        return this.value + permission.bit()
    }
}

export const ACCESS_GROUP_LIST: AccessGroup[] = [
    AccessGroup.CurrentDevice,
    AccessGroup.CurrentZone, 
    AccessGroup.FriendZone, 
    AccessGroup.OthersZone, 
    AccessGroup.OwnerDec, 
    AccessGroup.SystemDec, 
    AccessGroup.OthersDec,
];

export interface AccessPair {
    group: AccessGroup,
    permissions: AccessPermissions, 
}

export class AccessString {
    constructor(public value: number) {}

    static make(list: AccessPair[]): AccessString {
        let ret = new AccessString(0);
        list.forEach((p)  => ret.set_group_permissions(p.group, p.permissions));
        return ret
    }

    is_accessable(group: AccessGroup, permission: AccessPermission): boolean {
        return new BitSet(this.value).get(group.bit(permission)) === 1
    }

    set_group_permission(group: AccessGroup, permission: AccessPermission): void {
        this.value = parseInt(new BitSet(this.value).set(group.bit(permission), 1).toString(10))
    }

    clear_group_permission(group: AccessGroup, permission: AccessPermission): void {
        this.value = parseInt(new BitSet(this.value).set(group.bit(permission), 0).toString(10))
    }

    get_group_permissions(group: AccessGroup): AccessPermissions {
        let range = group.range();
        let perm = parseInt(new BitSet(this.value).slice(range.start, range.end-1).toString(10))
        return AccessPermissions.from_u8(perm).unwrap()
    }

    set_group_permissions(group: AccessGroup, permissions: AccessPermissions): void {
        let range = group.range();
        let bits = new BitSet(this.value);
        let perm_bits = new BitSet(permissions.value)
        for (let index = range.start; index < range.end; index++) {
            bits = bits.set(index, perm_bits.get(index - range.start))
            
        }
        this.value = parseInt(bits.toString(10));
    }

    clear_group_permissions(group: AccessGroup): void {
        let range = group.range();
        this.value = parseInt(new BitSet(this.value).setRange(range.start, range.end-1, 0).toString(10))
    }

    static dec_default(): AccessString {
        return AccessString.make([{
            group: AccessGroup.CurrentDevice,
            permissions: AccessPermissions.Full,
        }, {
            group: AccessGroup.CurrentZone,
            permissions: AccessPermissions.Full,
        }, {
            group: AccessGroup.FriendZone,
            permissions: AccessPermissions.Full,
        }, {
            group: AccessGroup.OwnerDec,
            permissions: AccessPermissions.Full,
        }, {
            group: AccessGroup.SystemDec,
            permissions: AccessPermissions.Full,
        }])
    }

    to_string(): string {
        let ret = ""
        ACCESS_GROUP_LIST.map((v) => {
            ret += this.get_group_permissions(v).as_str()
        })

        return ret;
    }

    static default(): AccessString {
        return AccessString.dec_default()
    }

    toString(): string {
        return this.to_string()
    }
}