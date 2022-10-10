import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../base/results";
import { RawEncode, RawDecode } from "../base/raw_encode";
import {} from "../base/buffer";
import { BuckyNumber, BuckyNumberDecoder } from "../base/bucky_number";
import { Vec, VecDecoder } from "../base/vec";
import {ObjectId, ObjectIdDecoder, ObjectLink, ObjectLinkDecoder} from "../objects/object_id";
import { IpAddr, IpAddrDecoder } from "../base/endpoint";
import { NameRecord, NameRecordDecoder } from "./name_record";
import { BuckyMap, BuckyMapDecoder } from "../base/bucky_map";
import { BuckyString, BuckyStringDecoder } from "../base/bucky_string";
import { Option, OptionDecoder, OptionEncoder } from "../base/option";

// #[derive(Clone, Debug, RawEncode, RawDecode)]
// pub enum NameLink {
//     ObjectLink(ObjectId),
//     OtherNameLink(String),
//     IPLink(IpAddr),
// }

export class NameLink implements RawEncode{
    private readonly tag: number;

    private constructor(private obj_link?: ObjectId, private other_name_link?: string, private ip_link?: IpAddr){
        if(this.obj_link){
            this.tag = 0;
        }else if(this.other_name_link){
            this.tag = 1;
        }else if(this.ip_link){
            this.tag = 2;
        }else{
            this.tag = -1;
        }
    }

    static ObjectLink(obj_link: ObjectId): NameLink{
        return new NameLink(obj_link);
    }

    static OtherNameLink(other_name_link: string): NameLink {
        return new NameLink(undefined,other_name_link);
    }

    static IPLink(ip_link: IpAddr): NameLink {
        return new NameLink(undefined, undefined, ip_link);
    }

    match<T>(visitor: {
        ObjectLink?: (obj_link: ObjectId)=>T,
        OtherNameLink?: (other_name_link: string)=>T,
        IPLink?: (ip_link: IpAddr)=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.ObjectLink?.(this.obj_link!);
            case 1: return visitor.OtherNameLink?.(this.other_name_link!);
            case 2: return visitor.IPLink?.(this.ip_link!);
            default: return undefined;
        }
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            ObjectLink:(obj_link)=>{
                return obj_link.raw_measure().unwrap();
            },
            OtherNameLink: (other_name_link)=>{
                return new BuckyString(other_name_link).raw_measure().unwrap();
            },
            IPLink: (ip_link: IpAddr)=>{
                return ip_link.raw_measure().unwrap();
            }
        })!;

        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            ObjectLink:(obj_link)=>{
                return obj_link.raw_encode(buf).unwrap();
            },
            OtherNameLink: (other_name_link)=>{
                return new BuckyString(other_name_link).raw_encode(buf).unwrap();
            },
            IPLink: (ip_link: IpAddr)=>{
                return ip_link.raw_encode(buf).unwrap();
            }
        })!;

        return Ok(buf);
    }

    toString(): string {
        return this.match({
            ObjectLink:(obj_link)=>{
                return `link to obj ${obj_link}`;
            },
            OtherNameLink: (other_name_link)=>{
                return `link to name ${other_name_link}`;
            },
            IPLink: (ip_link: IpAddr)=>{
                return `link to ip ${ip_link}`;
            }
        })!
    }
}

export class NameLinkDecoder implements RawDecode<NameLink>{
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[NameLink, Uint8Array]>{
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
                const r = new ObjectIdDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let obj_link;
                [obj_link, buf] = r.unwrap();
                const ret:[NameLink, Uint8Array] =  [NameLink.ObjectLink(obj_link), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new BuckyStringDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let other_name_link;
                [other_name_link, buf] = r.unwrap();
                const ret:[NameLink, Uint8Array] =  [NameLink.OtherNameLink(other_name_link.value()), buf];
                return Ok(ret);
            }
            case 2:{
                const r = new IpAddrDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let ip_link;
                [ip_link, buf] = r.unwrap();
                const ret:[NameLink, Uint8Array] =  [NameLink.IPLink(ip_link), buf];
                return Ok(ret);
            }
            default:{
                return Err(new BuckyError(BuckyErrorCode.InvalidData, "invalid NameLinkDecoder type"));
            }
        }
    }
}