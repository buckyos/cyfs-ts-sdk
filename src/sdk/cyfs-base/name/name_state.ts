/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../base/results";
import { BuckyNumberDecoder } from "../base/bucky_number";
import { RawDecode } from "../base/raw_encode";

export enum NameState {
    Normal = 0,
    Lock = 1,
    Auction = 2,            //正常拍卖
    ArrearsAuction = 3,     //欠费拍卖
    ArrearsAuctionWait = 4, //欠费拍卖确认
    ActiveAuction = 5,      //主动拍卖
}

export class NameStateDecoder implements RawDecode<NameState> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[NameState, Uint8Array]>{
        let val;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [val, buf] = r.unwrap();
        }

        return Ok([val.toNumber() as NameState, buf]);
    }
}
