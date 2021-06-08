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


export class CoinTokenId implements RawEncode {
    private readonly tag: number;
    private constructor(
        private coin?: number,
        private token?: ObjectId,
    ){
        if(coin !== undefined) {
            this.tag = 0;
        } else if(token !== undefined) {
            this.tag = 1;
        } else {
            this.tag = -1;
        }
    }

    static Coin(coin: number): CoinTokenId {
        return new CoinTokenId(coin);
    }

    static Token(token: ObjectId): CoinTokenId {
        return new CoinTokenId(undefined, token);
    }

    match<T>(visitor: {
        Coin?: (coin: number)=>T,
        Token?: (token: ObjectId)=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.Coin?.(this.coin!);
            case 1: return visitor.Token?.(this.token!);
            default: break;
        }
    }

    eq_type(rhs: CoinTokenId):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            Coin:(coin)=>{ return new BuckyNumber('u8', this.coin!).raw_measure().unwrap();},
            Token:(token)=>{ return this.token!.raw_measure().unwrap();},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            Coin:(coin)=>{return new BuckyNumber('u8', this.coin!).raw_encode(buf).unwrap();},
            Token:(token)=>{return this.token!.raw_encode(buf).unwrap();},
        })!;
        return Ok(buf);
    }
}

export class CoinTokenIdDecoder implements RawDecode<CoinTokenId> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[CoinTokenId, Uint8Array]>{
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
                const r = new BuckyNumberDecoder('u8').raw_decode(buf);
                if(r.err){
                    return r;
                }
                let coin;
                [coin, buf] = r.unwrap();
                const ret:[CoinTokenId, Uint8Array] =  [CoinTokenId.Coin(coin.toNumber()), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new ObjectIdDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let token;
                [token, buf] = r.unwrap();
                const ret:[CoinTokenId, Uint8Array] =  [CoinTokenId.Token(token), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
