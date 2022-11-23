/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/


import { Ok, BuckyResult } from "../../cyfs-base/base/results";
import { Option, OptionDecoder, OptionEncoder, } from "../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { BuckyString, BuckyStringDecoder } from "../../cyfs-base/base/bucky_string";
import { Vec, VecDecoder } from "../../cyfs-base/base/vec";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";

import { GenesisCoinConfig } from './genesis_coin_config';
import { GenesisCoinConfigDecoder } from './genesis_coin_config';
import { GenesisPriceConfig } from './genesis_price_config';
import { GenesisPriceConfigDecoder } from './genesis_price_config';


export class GenesisConfig implements RawEncode {
    constructor(
        public chain_type: Option<string>,
        public coinbase: ObjectId,
        public interval: number,
        public bfc_spv_node: string,
        public coins: GenesisCoinConfig[],
        public price: GenesisPriceConfig,
        public miner_key_path: Option<string>,
        public mg_path: Option<string>,
        public miner_desc_path: Option<string>,
        public sub_chain_tx: Option<string>,
    ){
        // ignore
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += OptionEncoder.from(this.chain_type, (v:string)=>new BuckyString(v)).raw_measure().unwrap();
        size += this.coinbase.raw_measure().unwrap();
        size += new BuckyNumber('u32', this.interval).raw_measure().unwrap();
        size += new BuckyString(this.bfc_spv_node).raw_measure().unwrap();
        size += Vec.from(this.coins, (v:GenesisCoinConfig)=>v).raw_measure().unwrap();
        size += this.price.raw_measure().unwrap();
        size += OptionEncoder.from(this.miner_key_path, (v:string)=>new BuckyString(v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.mg_path, (v:string)=>new BuckyString(v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.miner_desc_path, (v:string)=>new BuckyString(v)).raw_measure().unwrap();
        size += OptionEncoder.from(this.sub_chain_tx, (v:string)=>new BuckyString(v)).raw_measure().unwrap();
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = OptionEncoder.from(this.chain_type, (v:string)=>new BuckyString(v)).raw_encode(buf).unwrap();
        buf = this.coinbase.raw_encode(buf).unwrap();
        buf = new BuckyNumber('u32', this.interval).raw_encode(buf).unwrap();
        buf = new BuckyString(this.bfc_spv_node).raw_encode(buf).unwrap();
        buf = Vec.from(this.coins, (v:GenesisCoinConfig)=>v).raw_encode(buf).unwrap();
        buf = this.price.raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.miner_key_path, (v:string)=>new BuckyString(v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.mg_path, (v:string)=>new BuckyString(v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.miner_desc_path, (v:string)=>new BuckyString(v)).raw_encode(buf).unwrap();
        buf = OptionEncoder.from(this.sub_chain_tx, (v:string)=>new BuckyString(v)).raw_encode(buf).unwrap();
        return Ok(buf);
    }
}

export class GenesisConfigDecoder implements RawDecode<GenesisConfig> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[GenesisConfig, Uint8Array]>{
        let chain_type;
        {
            const r = new OptionDecoder(new BuckyStringDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [chain_type, buf] = r.unwrap();
        }

        let coinbase;
        {
            const r = new ObjectIdDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [coinbase, buf] = r.unwrap();
        }

        let interval;
        {
            const r = new BuckyNumberDecoder('u32').raw_decode(buf);
            if(r.err){
                return r;
            }
            [interval, buf] = r.unwrap();
        }

        let bfc_spv_node;
        {
            const r = new BuckyStringDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [bfc_spv_node, buf] = r.unwrap();
        }

        let coins;
        {
            const r = new VecDecoder(new GenesisCoinConfigDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [coins, buf] = r.unwrap();
        }

        let price;
        {
            const r = new GenesisPriceConfigDecoder().raw_decode(buf);
            if(r.err){
                return r;
            }
            [price, buf] = r.unwrap();
        }

        let miner_key_path;
        {
            const r = new OptionDecoder(new BuckyStringDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [miner_key_path, buf] = r.unwrap();
        }

        let mg_path;
        {
            const r = new OptionDecoder(new BuckyStringDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [mg_path, buf] = r.unwrap();
        }

        let miner_desc_path;
        {
            const r = new OptionDecoder(new BuckyStringDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [miner_desc_path, buf] = r.unwrap();
        }

        let sub_chain_tx;
        {
            const r = new OptionDecoder(new BuckyStringDecoder()).raw_decode(buf);
            if(r.err){
                return r;
            }
            [sub_chain_tx, buf] = r.unwrap();
        }

        const ret:[GenesisConfig, Uint8Array] = [new GenesisConfig(chain_type.to((v:BuckyString)=>v.value()), coinbase, interval.toNumber(), bfc_spv_node.value(), coins.to((v:GenesisCoinConfig)=>v), price, miner_key_path.to((v:BuckyString)=>v.value()), mg_path.to((v:BuckyString)=>v.value()), miner_desc_path.to((v:BuckyString)=>v.value()), sub_chain_tx.to((v:BuckyString)=>v.value())), buf];
        return Ok(ret);
    }

}
