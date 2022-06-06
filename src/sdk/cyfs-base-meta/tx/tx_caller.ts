/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/
import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";

import{ PeopleDesc, PeopleDescDecoder } from '../../cyfs-base/objects/people'
import{ DeviceDesc, DeviceDescDecoder } from '../../cyfs-base/objects/device'
import{ SimpleGroupDesc, SimpleGroupDescDecoder } from '../../cyfs-base/objects/simple_group'
import{ UnionAccountDesc, UnionAccountDescDecoder } from '../../cyfs-base/objects/union_account'
import { TxCallerExt } from './tx_caller_ext'
import { match_standard_obj, StandardObject } from "../../cyfs-base/objects/any";

export class TxCaller implements RawEncode {
    private readonly tag: number;
    private m_ext?: TxCallerExt;

    private constructor(
        private people?: PeopleDesc,
        private device?: DeviceDesc,
        private group?: SimpleGroupDesc,
        private union?: UnionAccountDesc,
        private miner?: ObjectId,
        private id?: ObjectId,
    ){
        if(people) {
            this.tag = 0;
        } else if(device) {
            this.tag = 1;
        } else if(group) {
            this.tag = 2;
        } else if(union) {
            this.tag = 3;
        } else if(miner) {
            this.tag = 4;
        } else if(id) {
            this.tag = 5;
        } else {
            this.tag = -1;
        }
    }

    static try_from(object: StandardObject): BuckyResult<TxCaller> {
        let ret = match_standard_obj(object, {
            People: (o) => {return TxCaller.People(o.desc())},
            Device: (o) => {return TxCaller.Device(o.desc())},
            SimpleGroup: (o) => {return TxCaller.Group(o.desc())},
            UnionAccount: (o) => {return TxCaller.Union(o.desc())},
        });

        if (ret) {
            return Ok(ret);
        }

        return Err(new BuckyError(BuckyErrorCode.InvalidInput, "invalid object type to TxCaller"))
    }

    static People(people: PeopleDesc): TxCaller {
        return new TxCaller(people);
    }

    static Device(device: DeviceDesc): TxCaller {
        return new TxCaller(undefined, device);
    }

    static Group(group: SimpleGroupDesc): TxCaller {
        return new TxCaller(undefined, undefined, group);
    }

    static Union(union: UnionAccountDesc): TxCaller {
        return new TxCaller(undefined, undefined, undefined, union);
    }

    static Miner(miner: ObjectId): TxCaller {
        return new TxCaller(undefined, undefined, undefined, undefined, miner);
    }

    static Id(id: ObjectId): TxCaller {
        return new TxCaller(undefined, undefined, undefined, undefined, undefined, id);
    }

    match<T>(visitor: {
        People?: (people: PeopleDesc)=>T,
        Device?: (device: DeviceDesc)=>T,
        Group?: (group: SimpleGroupDesc)=>T,
        Union?: (union: UnionAccountDesc)=>T,
        Miner?: (miner: ObjectId)=>T,
        Id?: (id: ObjectId)=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.People?.(this.people!);
            case 1: return visitor.Device?.(this.device!);
            case 2: return visitor.Group?.(this.group!);
            case 3: return visitor.Union?.(this.union!);
            case 4: return visitor.Miner?.(this.miner!);
            case 5: return visitor.Id?.(this.id!);
            default: break;
        }
    }

    eq_type(rhs: TxCaller):boolean{
        return this.tag===rhs.tag;
    }

    ext():TxCallerExt{
        if(this.m_ext==null){
            this.m_ext = new TxCallerExt(this);
        }
        return this.m_ext;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            People:(people)=>{ return this.people!.raw_measure().unwrap();},
            Device:(device)=>{ return this.device!.raw_measure().unwrap();},
            Group:(group)=>{ return this.group!.raw_measure().unwrap();},
            Union:(union)=>{ return this.union!.raw_measure().unwrap();},
            Miner:(miner)=>{ return this.miner!.raw_measure().unwrap();},
            Id:(id)=>{ return this.id!.raw_measure().unwrap();},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            People:(people)=>{return this.people!.raw_encode(buf).unwrap();},
            Device:(device)=>{return this.device!.raw_encode(buf).unwrap();},
            Group:(group)=>{return this.group!.raw_encode(buf).unwrap();},
            Union:(union)=>{return this.union!.raw_encode(buf).unwrap();},
            Miner:(miner)=>{return this.miner!.raw_encode(buf).unwrap();},
            Id:(id)=>{return this.id!.raw_encode(buf).unwrap();},
        })!;
        return Ok(buf);
    }
}

export class TxCallerDecoder implements RawDecode<TxCaller> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[TxCaller, Uint8Array]>{
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
                const r = new PeopleDescDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let people;
                [people, buf] = r.unwrap();
                const ret:[TxCaller, Uint8Array] =  [TxCaller.People(people), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new DeviceDescDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let device;
                [device, buf] = r.unwrap();
                const ret:[TxCaller, Uint8Array] =  [TxCaller.Device(device), buf];
                return Ok(ret);
            }
            case 2:{
                const r = new SimpleGroupDescDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let group;
                [group, buf] = r.unwrap();
                const ret:[TxCaller, Uint8Array] =  [TxCaller.Group(group), buf];
                return Ok(ret);
            }
            case 3:{
                const r = new UnionAccountDescDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let union;
                [union, buf] = r.unwrap();
                const ret:[TxCaller, Uint8Array] =  [TxCaller.Union(union), buf];
                return Ok(ret);
            }
            case 4:{
                const r = new ObjectIdDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let miner;
                [miner, buf] = r.unwrap();
                const ret:[TxCaller, Uint8Array] =  [TxCaller.Miner(miner), buf];
                return Ok(ret);
            }
            case 5:{
                const r = new ObjectIdDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let id;
                [id, buf] = r.unwrap();
                const ret:[TxCaller, Uint8Array] =  [TxCaller.Id(id), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
