/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode, to_buf } from "../../cyfs-base/base/raw_encode";
import { HashValue, HashValueDecoder } from "../../cyfs-base/crypto/hash";

import{ Device, DeviceDecoder } from '../../cyfs-base/objects/device'
import{ People, PeopleDecoder } from '../../cyfs-base/objects/people'
import{ UnionAccount, UnionAccountDecoder } from '../../cyfs-base/objects/union_account'
import{ SimpleGroup, SimpleGroupDecoder } from '../../cyfs-base/objects/simple_group'
import{ File, FileDecoder } from '../../cyfs-base/objects/file'
import{ Org, OrgDecoder } from '../../cyfs-base/objects/org'
import{ Contract, ContractDecoder } from '../../cyfs-base/objects/contract'
import { Data } from './data';
import { DataDecoder } from './data';
import { MinerGroup } from './miner_group';
import { MinerGroupDecoder } from './miner_group';
import { SNService } from '../sn_service/sn_service';
import { SNServiceDecoder } from '../sn_service/sn_service';
import { match_standard_obj, StandardObject } from "../../cyfs-base/objects/any";

export class SavedMetaObject implements RawEncode {
    private readonly tag: number;
    private constructor(
        private device?: Device,
        private people?: People,
        private unionaccount?: UnionAccount,
        private group?: SimpleGroup,
        private file?: File,
        private data?: Data,
        private org?: Org,
        private minergroup?: MinerGroup,
        private snservice?: SNService,
        private contract?: Contract,
    ){
        if(device) {
            this.tag = 0;
        } else if(people) {
            this.tag = 1;
        } else if(unionaccount) {
            this.tag = 2;
        } else if(group) {
            this.tag = 3;
        } else if(file) {
            this.tag = 4;
        } else if(data) {
            this.tag = 5;
        } else if(org) {
            this.tag = 6;
        } else if(minergroup) {
            this.tag = 7;
        } else if(snservice) {
            this.tag = 8;
        } else if(contract) {
            this.tag = 9;
        } else {
            this.tag = -1;
        }
    }

    static try_from(object: StandardObject): BuckyResult<SavedMetaObject> {
        let ret = match_standard_obj(object, {
            People: (o) => {return SavedMetaObject.People(o)},
            Device: (o) => {return SavedMetaObject.Device(o)},
            SimpleGroup: (o) => {return SavedMetaObject.Group(o)},
            UnionAccount: (o) => {return SavedMetaObject.UnionAccount(o)},
            File: (o) => {return SavedMetaObject.File(o)},
            Org: (o) => {return SavedMetaObject.Org(o)}
        });

        if (ret) {
            return Ok(ret);
        }

        return Err(new BuckyError(BuckyErrorCode.InvalidInput, "invalid object type to TxCaller"))
    }

    static Device(device: Device): SavedMetaObject {
        return new SavedMetaObject(device);
    }

    static People(people: People): SavedMetaObject {
        return new SavedMetaObject(undefined, people);
    }

    static UnionAccount(unionaccount: UnionAccount): SavedMetaObject {
        return new SavedMetaObject(undefined, undefined, unionaccount);
    }

    static Group(group: SimpleGroup): SavedMetaObject {
        return new SavedMetaObject(undefined, undefined, undefined, group);
    }

    static File(file: File): SavedMetaObject {
        return new SavedMetaObject(undefined, undefined, undefined, undefined, file);
    }

    static Data(data: Data): SavedMetaObject {
        return new SavedMetaObject(undefined, undefined, undefined, undefined, undefined, data);
    }

    static Org(org: Org): SavedMetaObject {
        return new SavedMetaObject(undefined, undefined, undefined, undefined, undefined, undefined, org);
    }

    static MinerGroup(minergroup: MinerGroup): SavedMetaObject {
        return new SavedMetaObject(undefined, undefined, undefined, undefined, undefined, undefined, undefined, minergroup);
    }

    static SNService(snservice: SNService): SavedMetaObject {
        return new SavedMetaObject(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, snservice);
    }

    static Contract(contract: Contract): SavedMetaObject {
        return new SavedMetaObject(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, contract);
    }

    match<T>(visitor: {
        Device?: (device: Device)=>T,
        People?: (people: People)=>T,
        UnionAccount?: (unionaccount: UnionAccount)=>T,
        Group?: (group: SimpleGroup)=>T,
        File?: (file: File)=>T,
        Data?: (data: Data)=>T,
        Org?: (org: Org)=>T,
        MinerGroup?: (minergroup: MinerGroup)=>T,
        SNService?: (snservice: SNService)=>T,
        Contract?: (contract: Contract)=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.Device?.(this.device!);
            case 1: return visitor.People?.(this.people!);
            case 2: return visitor.UnionAccount?.(this.unionaccount!);
            case 3: return visitor.Group?.(this.group!);
            case 4: return visitor.File?.(this.file!);
            case 5: return visitor.Data?.(this.data!);
            case 6: return visitor.Org?.(this.org!);
            case 7: return visitor.MinerGroup?.(this.minergroup!);
            case 8: return visitor.SNService?.(this.snservice!);
            case 9: return visitor.Contract?.(this.contract!);
            default: break;
        }
    }

    eq_type(rhs: SavedMetaObject):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            Device:(device)=>{ return this.device!.raw_measure().unwrap();},
            People:(people)=>{ return this.people!.raw_measure().unwrap();},
            UnionAccount:(unionaccount)=>{ return this.unionaccount!.raw_measure().unwrap();},
            Group:(group)=>{ return this.group!.raw_measure().unwrap();},
            File:(file)=>{ return this.file!.raw_measure().unwrap();},
            Data:(data)=>{ return this.data!.raw_measure().unwrap();},
            Org:(org)=>{ return this.org!.raw_measure().unwrap();},
            MinerGroup:(minergroup)=>{ return this.minergroup!.raw_measure().unwrap();},
            SNService:(snservice)=>{ return this.snservice!.raw_measure().unwrap();},
            Contract:(contract)=>{ return this.contract!.raw_measure().unwrap();},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Device:(device)=>{return this.device!.raw_encode(buf).unwrap();},
            People:(people)=>{return this.people!.raw_encode(buf).unwrap();},
            UnionAccount:(unionaccount)=>{return this.unionaccount!.raw_encode(buf).unwrap();},
            Group:(group)=>{return this.group!.raw_encode(buf).unwrap();},
            File:(file)=>{return this.file!.raw_encode(buf).unwrap();},
            Data:(data)=>{return this.data!.raw_encode(buf).unwrap();},
            Org:(org)=>{return this.org!.raw_encode(buf).unwrap();},
            MinerGroup:(minergroup)=>{return this.minergroup!.raw_encode(buf).unwrap();},
            SNService:(snservice)=>{return this.snservice!.raw_encode(buf).unwrap();},
            Contract:(contract)=>{return this.contract!.raw_encode(buf).unwrap();},
        })!;
        return Ok(buf);
    }

    hash(): BuckyResult<HashValue> {
        let r = to_buf(this);
        if (r.err) {
            return r;
        }
        let hash = HashValue.hash_data(r.unwrap());
        return Ok(hash)
    }
}

export class SavedMetaObjectDecoder implements RawDecode<SavedMetaObject> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[SavedMetaObject, Uint8Array]>{
        let tag;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [tag, buf] = r.unwrap();
        }

        switch(tag.toNumber()){
            case 0:{
                const r = new DeviceDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let device;
                [device, buf] = r.unwrap();
                const ret:[SavedMetaObject, Uint8Array] =  [SavedMetaObject.Device(device), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new PeopleDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let people;
                [people, buf] = r.unwrap();
                const ret:[SavedMetaObject, Uint8Array] =  [SavedMetaObject.People(people), buf];
                return Ok(ret);
            }
            case 2:{
                const r = new UnionAccountDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let unionaccount;
                [unionaccount, buf] = r.unwrap();
                const ret:[SavedMetaObject, Uint8Array] =  [SavedMetaObject.UnionAccount(unionaccount), buf];
                return Ok(ret);
            }
            case 3:{
                const r = new SimpleGroupDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let group;
                [group, buf] = r.unwrap();
                const ret:[SavedMetaObject, Uint8Array] =  [SavedMetaObject.Group(group), buf];
                return Ok(ret);
            }
            case 4:{
                const r = new FileDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let file;
                [file, buf] = r.unwrap();
                const ret:[SavedMetaObject, Uint8Array] =  [SavedMetaObject.File(file), buf];
                return Ok(ret);
            }
            case 5:{
                const r = new DataDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let data;
                [data, buf] = r.unwrap();
                const ret:[SavedMetaObject, Uint8Array] =  [SavedMetaObject.Data(data), buf];
                return Ok(ret);
            }
            case 6:{
                const r = new OrgDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let org;
                [org, buf] = r.unwrap();
                const ret:[SavedMetaObject, Uint8Array] =  [SavedMetaObject.Org(org), buf];
                return Ok(ret);
            }
            case 7:{
                const r = new MinerGroupDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let minergroup;
                [minergroup, buf] = r.unwrap();
                const ret:[SavedMetaObject, Uint8Array] =  [SavedMetaObject.MinerGroup(minergroup), buf];
                return Ok(ret);
            }
            case 8:{
                const r = new SNServiceDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let snservice;
                [snservice, buf] = r.unwrap();
                const ret:[SavedMetaObject, Uint8Array] =  [SavedMetaObject.SNService(snservice), buf];
                return Ok(ret);
            }
            case 9:{
                const r = new ContractDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let contract;
                [contract, buf] = r.unwrap();
                const ret:[SavedMetaObject, Uint8Array] =  [SavedMetaObject.Contract(contract), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
