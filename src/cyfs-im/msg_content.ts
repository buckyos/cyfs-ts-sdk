/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Fri Mar 12 2021 16:29:19 GMT+0800 (GMT+08:00)
 *****************************************************/

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../cyfs-base/base/bucky_string";
import { RawDecode, RawEncode } from "../cyfs-base/base/raw_encode";

import { MsgObjectContent } from './msg_obj_content';
import { MsgObjectContentDecoder } from './msg_obj_content';

export class MsgContent implements RawEncode {
    private readonly tag: number;
    private constructor(
        private text?: string,
        private object?: MsgObjectContent,
    ){
        if(text) {
            this.tag = 0;
        } else if(object) {
            this.tag = 1;
        } else {
            this.tag = -1;
        }
    }

    static Text(text: string): MsgContent {
        return new MsgContent(text);
    }

    static Object(object: MsgObjectContent): MsgContent {
        return new MsgContent(undefined, object);
    }

    match<T>(visitor: {
        Text?: (text: string)=>T,
        Object?: (object: MsgObjectContent)=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.Text?.(this.text!);
            case 1: return visitor.Object?.(this.object!);
            default: break;
        }
    }

    eq_type(rhs: MsgContent):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            Text:(text)=>{ return new BuckyString(this.text!).raw_measure().unwrap();},
            Object:(object)=>{ return this.object!.raw_measure().unwrap();},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Text:(text)=>{return new BuckyString(this.text!).raw_encode(buf).unwrap();},
            Object:(object)=>{return this.object!.raw_encode(buf).unwrap();},
        })!;
        return Ok(buf);
    }
}

export class MsgContentDecoder implements RawDecode<MsgContent> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[MsgContent, Uint8Array]>{
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
                const r = new BuckyStringDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let text;
                [text, buf] = r.unwrap();
                const ret:[MsgContent, Uint8Array] =  [MsgContent.Text(text.value()), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new MsgObjectContentDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let object;
                [object, buf] = r.unwrap();
                const ret:[MsgContent, Uint8Array] =  [MsgContent.Object(object), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
