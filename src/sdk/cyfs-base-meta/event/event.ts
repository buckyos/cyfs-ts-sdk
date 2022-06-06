/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import {
    SubDescType,
    DescTypeInfo, DescContent, DescContentDecoder,
    BodyContent, BodyContentDecoder,
    NamedObjectId, NamedObjectIdDecoder,
    NamedObjectDesc, NamedObjectDescDecoder,
    NamedObject, NamedObjectBuilder, NamedObjectDecoder,
    named_id_gen_default,
    named_id_from_base_58,
    named_id_try_from_object_id,
} from "../../cyfs-base/objects/object"

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { Option, OptionEncoder, OptionDecoder, } from "../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { BuckyMap, BuckyMapDecoder } from "../../cyfs-base/base/bucky_map";
import { BuckyBuffer, BuckyBufferDecoder } from "../../cyfs-base/base/bucky_buffer";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { HashValue, HashValueDecoder } from "../../cyfs-base/crypto/hash";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";

import { RentParam } from './rent_param';
import { RentParamDecoder } from './rent_param';
import { NameRentParam } from './name_rent_param';
import { NameRentParamDecoder } from './name_rent_param';
import { ChangeNameParam } from './change_name_param';
import { ChangeNameParamDecoder } from './change_name_param';
import { BidName } from './bid_name';
import { BidNameDecoder } from './bid_name';
import { StopAuctionParam } from './stop_auction_param';
import { StopAuctionParamDecoder } from './stop_auction_param';
import { UnionWithdraw } from './union_withdraw';
import { UnionWithdrawDecoder } from './union_withdraw';
import { ExtensionEvent } from './extension_event';
import { ExtensionEventDecoder } from './extension_event';

export class Event implements RawEncode {
    private readonly tag: number;
    private constructor(
        private rent?: RentParam,
        private namerent?: NameRentParam,
        private changenameevent?: ChangeNameParam,
        private bidname?: BidName,
        private stopauction?: StopAuctionParam,
        private unionwithdraw?: UnionWithdraw,
        private extension?: ExtensionEvent,
    ){
        if(rent) {
            this.tag = 0;
        } else if(namerent) {
            this.tag = 1;
        } else if(changenameevent) {
            this.tag = 2;
        } else if(bidname) {
            this.tag = 3;
        } else if(stopauction) {
            this.tag = 4;
        } else if(unionwithdraw) {
            this.tag = 5;
        } else if(extension) {
            this.tag = 6;
        } else {
            this.tag = -1;
        }
    }

    static Rent(rent: RentParam): Event {
        return new Event(rent);
    }

    static NameRent(namerent: NameRentParam): Event {
        return new Event(undefined, namerent);
    }

    static ChangeNameEvent(changenameevent: ChangeNameParam): Event {
        return new Event(undefined, undefined, changenameevent);
    }

    static BidName(bidname: BidName): Event {
        return new Event(undefined, undefined, undefined, bidname);
    }

    static StopAuction(stopauction: StopAuctionParam): Event {
        return new Event(undefined, undefined, undefined, undefined, stopauction);
    }

    static UnionWithdraw(unionwithdraw: UnionWithdraw): Event {
        return new Event(undefined, undefined, undefined, undefined, undefined, unionwithdraw);
    }

    static Extension(extension: ExtensionEvent): Event {
        return new Event(undefined, undefined, undefined, undefined, undefined, undefined, extension);
    }

    match<T>(visitor: {
        Rent?: (rent: RentParam)=>T,
        NameRent?: (namerent: NameRentParam)=>T,
        ChangeNameEvent?: (changenameevent: ChangeNameParam)=>T,
        BidName?: (bidname: BidName)=>T,
        StopAuction?: (stopauction: StopAuctionParam)=>T,
        UnionWithdraw?: (unionwithdraw: UnionWithdraw)=>T,
        Extension?: (extension: ExtensionEvent)=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.Rent?.(this.rent!);
            case 1: return visitor.NameRent?.(this.namerent!);
            case 2: return visitor.ChangeNameEvent?.(this.changenameevent!);
            case 3: return visitor.BidName?.(this.bidname!);
            case 4: return visitor.StopAuction?.(this.stopauction!);
            case 5: return visitor.UnionWithdraw?.(this.unionwithdraw!);
            case 6: return visitor.Extension?.(this.extension!);
            default: break;
        }
    }

    eq_type(rhs: Event):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            Rent:(rent)=>{ return this.rent!.raw_measure().unwrap();},
            NameRent:(namerent)=>{ return this.namerent!.raw_measure().unwrap();},
            ChangeNameEvent:(changenameevent)=>{ return this.changenameevent!.raw_measure().unwrap();},
            BidName:(bidname)=>{ return this.bidname!.raw_measure().unwrap();},
            StopAuction:(stopauction)=>{ return this.stopauction!.raw_measure().unwrap();},
            UnionWithdraw:(unionwithdraw)=>{ return this.unionwithdraw!.raw_measure().unwrap();},
            Extension:(extension)=>{ return this.extension!.raw_measure().unwrap();},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Rent:(rent)=>{return this.rent!.raw_encode(buf).unwrap();},
            NameRent:(namerent)=>{return this.namerent!.raw_encode(buf).unwrap();},
            ChangeNameEvent:(changenameevent)=>{return this.changenameevent!.raw_encode(buf).unwrap();},
            BidName:(bidname)=>{return this.bidname!.raw_encode(buf).unwrap();},
            StopAuction:(stopauction)=>{return this.stopauction!.raw_encode(buf).unwrap();},
            UnionWithdraw:(unionwithdraw)=>{return this.unionwithdraw!.raw_encode(buf).unwrap();},
            Extension:(extension)=>{return this.extension!.raw_encode(buf).unwrap();},
        })!;
        return Ok(buf);
    }
}

export class EventDecoder implements RawDecode<Event> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[Event, Uint8Array]>{
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
                const r = new RentParamDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let rent;
                [rent, buf] = r.unwrap();
                const ret:[Event, Uint8Array] =  [Event.Rent(rent), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new NameRentParamDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let namerent;
                [namerent, buf] = r.unwrap();
                const ret:[Event, Uint8Array] =  [Event.NameRent(namerent), buf];
                return Ok(ret);
            }
            case 2:{
                const r = new ChangeNameParamDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let changenameevent;
                [changenameevent, buf] = r.unwrap();
                const ret:[Event, Uint8Array] =  [Event.ChangeNameEvent(changenameevent), buf];
                return Ok(ret);
            }
            case 3:{
                const r = new BidNameDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let bidname;
                [bidname, buf] = r.unwrap();
                const ret:[Event, Uint8Array] =  [Event.BidName(bidname), buf];
                return Ok(ret);
            }
            case 4:{
                const r = new StopAuctionParamDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let stopauction;
                [stopauction, buf] = r.unwrap();
                const ret:[Event, Uint8Array] =  [Event.StopAuction(stopauction), buf];
                return Ok(ret);
            }
            case 5:{
                const r = new UnionWithdrawDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let unionwithdraw;
                [unionwithdraw, buf] = r.unwrap();
                const ret:[Event, Uint8Array] =  [Event.UnionWithdraw(unionwithdraw), buf];
                return Ok(ret);
            }
            case 6:{
                const r = new ExtensionEventDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let extension;
                [extension, buf] = r.unwrap();
                const ret:[Event, Uint8Array] =  [Event.Extension(extension), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
