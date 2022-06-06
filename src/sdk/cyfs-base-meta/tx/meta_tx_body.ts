/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: fanfeilong@buckyos.com
 * date: Thu Mar 04 2021 19:16:17 GMT+0800 (GMT+08:00)
 *****************************************************/

import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";

import { TransBalanceTx } from './trans_balance_tx';
import { TransBalanceTxDecoder } from './trans_balance_tx';
import { CreateUnionTx } from './create_union_tx';
import { CreateUnionTxDecoder } from './create_union_tx';
import { DeviateUnionTx } from './deviate_union_tx';
import { DeviateUnionTxDecoder } from './deviate_union_tx';
import { WithdrawFromUnionTx } from './withdraw_from_union_tx';
import { WithdrawFromUnionTxDecoder } from './withdraw_from_union_tx';
import { CreateDescTx } from './create_desc_tx';
import { CreateDescTxDecoder } from './create_desc_tx';
import { UpdateDescTx } from './update_desc_tx';
import { UpdateDescTxDecoder } from './update_desc_tx';
import { RemoveDescTx } from './remove_desc_tx';
import { RemoveDescTxDecoder } from './remove_desc_tx';
import { BidNameTx } from './bid_name_tx';
import { BidNameTxDecoder } from './bid_name_tx';
import { UpdateNameTx } from './update_name_tx';
import { UpdateNameTxDecoder } from './update_name_tx';
import { TransNameTx } from './trans_name_tx';
import { TransNameTxDecoder } from './trans_name_tx';
import { ContractTx } from './contract_tx';
import { ContractTxDecoder } from './contract_tx';
import { SetConfigTx } from './set_config_tx';
import { SetConfigTxDecoder } from './set_config_tx';
import { AuctionNameTx } from './auction_name_tx';
import { AuctionNameTxDecoder } from './auction_name_tx';
import { CancelAuctionNameTx } from './cancel_aution_name';
import { CancelAuctionNameTxDecoder } from './cancel_aution_name';
import { BuyBackNameTx } from './buy_back_name_tx';
import { BuyBackNameTxDecoder } from './buy_back_name_tx';
import { BTCCoinageRecordTx } from './btc_coinage_record_tx';
import { BTCCoinageRecordTxDecoder } from './btc_coinage_record_tx';
import { WithdrawToOwner, WithdrawToOwnerDecoder } from './withdraw_to_owner';
import { MinerGroup, MinerGroupDecoder } from './miner_group';
import { SubChainWithdrawTx, SubChainWithdrawTxDecoder } from './sub_chain_withdraw_tx';
import { WithdrawFromSubChainTx, WithdrawFromSubChainTxDecoder } from './withdraw_from_sub_chain_tx';
import { SubChainCoinageRecordTx } from './sub_chain_coinage_record_tx';
import { SubChainCoinageRecordTxDecoder } from './sub_chain_coinage_record_tx';
import { MetaExtensionTx } from '../extension/meta_extension_tx';
import { MetaExtensionTxDecoder } from '../extension/meta_extension_tx';
import { CreateContractTx, CreateContractTxDecoder } from "./create_contract";
import { CreateContract2Tx, CreateContract2TxDecoder } from "./create_contract2";
import { CallContractTx, CallContractTxDecoder } from "./call_contract";

export class MetaTxBody implements RawEncode {
    private readonly tag: number;
    private constructor(
        private transbalance?: TransBalanceTx,
        private createunion?: CreateUnionTx,
        private deviateunion?: DeviateUnionTx,
        private withdrawfromunion?: WithdrawFromUnionTx,
        private createdesc?: CreateDescTx,
        private updatedesc?: UpdateDescTx,
        private removedesc?: RemoveDescTx,
        private bidname?: BidNameTx,
        private updatename?: UpdateNameTx,
        private transname?: TransNameTx,
        private contract?: ContractTx,
        private setconfig?: SetConfigTx,
        private auctionname?: AuctionNameTx,
        private cancelauctionname?: CancelAuctionNameTx,
        private buybackname?: BuyBackNameTx,
        private btccoinagerecord?: BTCCoinageRecordTx,
        private withdrawtoowner?: WithdrawToOwner,
        private createminergroup?: MinerGroup,
        private updateminergroup?: MinerGroup,
        private createsubchainaccount?: MinerGroup,
        private updatesubchainaccount?: MinerGroup,
        private subchainwithdraw?: SubChainWithdrawTx,
        private withdrawfromsubchain?: WithdrawFromSubChainTx,
        private subchaincoinagerecord?: SubChainCoinageRecordTx,
        private extension?: MetaExtensionTx,
        private createcontract?: CreateContractTx,
        private createcontract2?: CreateContract2Tx,
        private callcontract?: CallContractTx
    ){
        if(transbalance) {
            this.tag = 0;
        } else if(createunion) {
            this.tag = 1;
        } else if(deviateunion) {
            this.tag = 2;
        } else if(withdrawfromunion) {
            this.tag = 3;
        } else if(createdesc) {
            this.tag = 4;
        } else if(updatedesc) {
            this.tag = 5;
        } else if(removedesc) {
            this.tag = 6;
        } else if(bidname) {
            this.tag = 7;
        } else if(updatename) {
            this.tag = 8;
        } else if(transname) {
            this.tag = 9;
        } else if(contract) {
            this.tag = 10;
        } else if(setconfig) {
            this.tag = 11;
        } else if(auctionname) {
            this.tag = 12;
        } else if(cancelauctionname) {
            this.tag = 13;
        } else if(buybackname) {
            this.tag = 14;
        } else if(btccoinagerecord) {
            this.tag = 15;
        } else if(withdrawtoowner) {
            this.tag = 16;
        } else if(createminergroup) {
            this.tag = 17;
        } else if(updateminergroup) {
            this.tag = 18;
        } else if(createsubchainaccount) {
            this.tag = 19;
        } else if(updatesubchainaccount) {
            this.tag = 20;
        } else if(subchainwithdraw) {
            this.tag = 21;
        } else if(withdrawfromsubchain) {
            this.tag = 22;
        } else if(subchaincoinagerecord) {
            this.tag = 23;
        } else if(extension) {
            this.tag = 24;
        } else if(createcontract) {
            this.tag = 25;
        } else if(createcontract2) {
            this.tag = 26;
        } else if(callcontract) {
            this.tag = 27;
        } else {
            this.tag = -1;
        }
    }

    static TransBalance(transbalance: TransBalanceTx): MetaTxBody {
        return new MetaTxBody(transbalance);
    }

    static CreateUnion(createunion: CreateUnionTx): MetaTxBody {
        return new MetaTxBody(undefined, createunion);
    }

    static DeviateUnion(deviateunion: DeviateUnionTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, deviateunion);
    }

    static WithdrawFromUnion(withdrawfromunion: WithdrawFromUnionTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, withdrawfromunion);
    }

    static CreateDesc(createdesc: CreateDescTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, createdesc);
    }

    static UpdateDesc(updatedesc: UpdateDescTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, updatedesc);
    }

    static RemoveDesc(removedesc: RemoveDescTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, removedesc);
    }

    static BidName(bidname: BidNameTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, bidname);
    }

    static UpdateName(updatename: UpdateNameTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, updatename);
    }

    static TransName(transname: TransNameTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, transname);
    }

    static Contract(contract: ContractTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, contract);
    }

    static SetConfig(setconfig: SetConfigTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, setconfig);
    }

    static AuctionName(auctionname: AuctionNameTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, auctionname);
    }

    static CancelAuctionName(cancelauctionname: CancelAuctionNameTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, cancelauctionname);
    }

    static BuyBackName(buybackname: BuyBackNameTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, buybackname);
    }

    static BTCCoinageRecord(btccoinagerecord: BTCCoinageRecordTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, btccoinagerecord);
    }

    static WithdrawToOwner(withdrawtoowner: WithdrawToOwner): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, withdrawtoowner);
    }

    static CreateMinerGroup(createminergroup: MinerGroup): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, createminergroup);
    }

    static UpdateMinerGroup(updateminergroup: MinerGroup): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, updateminergroup);
    }

    static CreateSubChainAccount(createsubchainaccount: MinerGroup): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, createsubchainaccount);
    }

    static UpdateSubChainAccount(updatesubchainaccount: MinerGroup): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, updatesubchainaccount);
    }

    static SubChainWithdraw(subchainwithdraw: SubChainWithdrawTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, subchainwithdraw);
    }

    static WithdrawFromSubChain(withdrawfromsubchain: WithdrawFromSubChainTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, withdrawfromsubchain);
    }

    static SubChainCoinageRecord(subchaincoinagerecord: SubChainCoinageRecordTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, subchaincoinagerecord);
    }

    static Extension(extension: MetaExtensionTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, extension);
    }

    static CreateContract(createcontract: CreateContractTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
            undefined, undefined, undefined, undefined, undefined, undefined, undefined, createcontract);
    }

    static CreateContract2(createcontract2: CreateContract2Tx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
            undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, createcontract2);
    }

    static CallContract(callcontract: CallContractTx): MetaTxBody {
        return new MetaTxBody(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
            undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, callcontract);
    }

    match<T>(visitor: {
        TransBalance?: (transbalance: TransBalanceTx)=>T,
        CreateUnion?: (createunion: CreateUnionTx)=>T,
        DeviateUnion?: (deviateunion: DeviateUnionTx)=>T,
        WithdrawFromUnion?: (withdrawfromunion: WithdrawFromUnionTx)=>T,
        CreateDesc?: (createdesc: CreateDescTx)=>T,
        UpdateDesc?: (updatedesc: UpdateDescTx)=>T,
        RemoveDesc?: (removedesc: RemoveDescTx)=>T,
        BidName?: (bidname: BidNameTx)=>T,
        UpdateName?: (updatename: UpdateNameTx)=>T,
        TransName?: (transname: TransNameTx)=>T,
        Contract?: (contract: ContractTx)=>T,
        SetConfig?: (setconfig: SetConfigTx)=>T,
        AuctionName?: (auctionname: AuctionNameTx)=>T,
        CancelAuctionName?: (cancelauctionname: CancelAuctionNameTx)=>T,
        BuyBackName?: (buybackname: BuyBackNameTx)=>T,
        BTCCoinageRecord?: (btccoinagerecord: BTCCoinageRecordTx)=>T,
        WithdrawToOwner?: (withdrawtoowner: WithdrawToOwner)=>T,
        CreateMinerGroup?: (createminergroup: MinerGroup)=>T,
        UpdateMinerGroup?: (updateminergroup: MinerGroup)=>T,
        CreateSubChainAccount?: (createsubchainaccount: MinerGroup)=>T,
        UpdateSubChainAccount?: (updatesubchainaccount: MinerGroup)=>T,
        SubChainWithdraw?: (subchainwithdraw: SubChainWithdrawTx)=>T,
        WithdrawFromSubChain?: (withdrawfromsubchain: WithdrawFromSubChainTx)=>T,
        SubChainCoinageRecord?: (subchaincoinagerecord: SubChainCoinageRecordTx)=>T,
        Extension?: (extension: MetaExtensionTx)=>T,
        CreateContract?: (tx: CreateContractTx)=>T,
        CreateContract2?: (tx: CreateContract2Tx)=>T,
        CallContract?: (tx: CallContractTx)=>T,
    }):T|undefined{
        switch(this.tag){
            case 0: return visitor.TransBalance?.(this.transbalance!);
            case 1: return visitor.CreateUnion?.(this.createunion!);
            case 2: return visitor.DeviateUnion?.(this.deviateunion!);
            case 3: return visitor.WithdrawFromUnion?.(this.withdrawfromunion!);
            case 4: return visitor.CreateDesc?.(this.createdesc!);
            case 5: return visitor.UpdateDesc?.(this.updatedesc!);
            case 6: return visitor.RemoveDesc?.(this.removedesc!);
            case 7: return visitor.BidName?.(this.bidname!);
            case 8: return visitor.UpdateName?.(this.updatename!);
            case 9: return visitor.TransName?.(this.transname!);
            case 10: return visitor.Contract?.(this.contract!);
            case 11: return visitor.SetConfig?.(this.setconfig!);
            case 12: return visitor.AuctionName?.(this.auctionname!);
            case 13: return visitor.CancelAuctionName?.(this.cancelauctionname!);
            case 14: return visitor.BuyBackName?.(this.buybackname!);
            case 15: return visitor.BTCCoinageRecord?.(this.btccoinagerecord!);
            case 16: return visitor.WithdrawToOwner?.(this.withdrawtoowner!);
            case 17: return visitor.CreateMinerGroup?.(this.createminergroup!);
            case 18: return visitor.UpdateMinerGroup?.(this.updateminergroup!);
            case 19: return visitor.CreateSubChainAccount?.(this.createsubchainaccount!);
            case 20: return visitor.UpdateSubChainAccount?.(this.updatesubchainaccount!);
            case 21: return visitor.SubChainWithdraw?.(this.subchainwithdraw!);
            case 22: return visitor.WithdrawFromSubChain?.(this.withdrawfromsubchain!);
            case 23: return visitor.SubChainCoinageRecord?.(this.subchaincoinagerecord!);
            case 24: return visitor.Extension?.(this.extension!);
            case 25: return visitor.CreateContract?.(this.createcontract!);
            case 26: return visitor.CreateContract2?.(this.createcontract2!);
            case 27: return visitor.CallContract?.(this.callcontract!);
            default: break;
        }
    }

    eq_type(rhs: MetaTxBody):boolean{
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        let size = 0;
        size += 1; // tag
        size += this.match({
            TransBalance:(transbalance)=>{ return this.transbalance!.raw_measure().unwrap();},
            CreateUnion:(createunion)=>{ return this.createunion!.raw_measure().unwrap();},
            DeviateUnion:(deviateunion)=>{ return this.deviateunion!.raw_measure().unwrap();},
            WithdrawFromUnion:(withdrawfromunion)=>{ return this.withdrawfromunion!.raw_measure().unwrap();},
            CreateDesc:(createdesc)=>{ return this.createdesc!.raw_measure().unwrap();},
            UpdateDesc:(updatedesc)=>{ return this.updatedesc!.raw_measure().unwrap();},
            RemoveDesc:(removedesc)=>{ return this.removedesc!.raw_measure().unwrap();},
            BidName:(bidname)=>{ return this.bidname!.raw_measure().unwrap();},
            UpdateName:(updatename)=>{ return this.updatename!.raw_measure().unwrap();},
            TransName:(transname)=>{ return this.transname!.raw_measure().unwrap();},
            Contract:(contract)=>{ return this.contract!.raw_measure().unwrap();},
            SetConfig:(setconfig)=>{ return this.setconfig!.raw_measure().unwrap();},
            AuctionName:(auctionname)=>{ return this.auctionname!.raw_measure().unwrap();},
            CancelAuctionName:(cancelauctionname)=>{ return this.cancelauctionname!.raw_measure().unwrap();},
            BuyBackName:(buybackname)=>{ return this.buybackname!.raw_measure().unwrap();},
            BTCCoinageRecord:(btccoinagerecord)=>{ return this.btccoinagerecord!.raw_measure().unwrap();},
            WithdrawToOwner:(withdrawtoowner)=>{ return this.withdrawtoowner!.raw_measure().unwrap();},
            CreateMinerGroup:(createminergroup)=>{ return this.createminergroup!.raw_measure().unwrap();},
            UpdateMinerGroup:(updateminergroup)=>{ return this.updateminergroup!.raw_measure().unwrap();},
            CreateSubChainAccount:(createsubchainaccount)=>{ return this.createsubchainaccount!.raw_measure().unwrap();},
            UpdateSubChainAccount:(updatesubchainaccount)=>{ return this.updatesubchainaccount!.raw_measure().unwrap();},
            SubChainWithdraw:(subchainwithdraw)=>{ return this.subchainwithdraw!.raw_measure().unwrap();},
            WithdrawFromSubChain:(withdrawfromsubchain)=>{ return this.withdrawfromsubchain!.raw_measure().unwrap();},
            SubChainCoinageRecord:(subchaincoinagerecord)=>{ return this.subchaincoinagerecord!.raw_measure().unwrap();},
            Extension:(extension)=>{ return this.extension!.raw_measure().unwrap();},
            CreateContract:(extension)=>{ return this.createcontract!.raw_measure().unwrap();},
            CreateContract2:(extension)=>{ return this.createcontract2!.raw_measure().unwrap();},
            CallContract:(extension)=>{ return this.callcontract!.raw_measure().unwrap();},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            TransBalance:(transbalance)=>{return this.transbalance!.raw_encode(buf).unwrap();},
            CreateUnion:(createunion)=>{return this.createunion!.raw_encode(buf).unwrap();},
            DeviateUnion:(deviateunion)=>{return this.deviateunion!.raw_encode(buf).unwrap();},
            WithdrawFromUnion:(withdrawfromunion)=>{return this.withdrawfromunion!.raw_encode(buf).unwrap();},
            CreateDesc:(createdesc)=>{return this.createdesc!.raw_encode(buf).unwrap();},
            UpdateDesc:(updatedesc)=>{return this.updatedesc!.raw_encode(buf).unwrap();},
            RemoveDesc:(removedesc)=>{return this.removedesc!.raw_encode(buf).unwrap();},
            BidName:(bidname)=>{return this.bidname!.raw_encode(buf).unwrap();},
            UpdateName:(updatename)=>{return this.updatename!.raw_encode(buf).unwrap();},
            TransName:(transname)=>{return this.transname!.raw_encode(buf).unwrap();},
            Contract:(contract)=>{return this.contract!.raw_encode(buf).unwrap();},
            SetConfig:(setconfig)=>{return this.setconfig!.raw_encode(buf).unwrap();},
            AuctionName:(auctionname)=>{return this.auctionname!.raw_encode(buf).unwrap();},
            CancelAuctionName:(cancelauctionname)=>{return this.cancelauctionname!.raw_encode(buf).unwrap();},
            BuyBackName:(buybackname)=>{return this.buybackname!.raw_encode(buf).unwrap();},
            BTCCoinageRecord:(btccoinagerecord)=>{return this.btccoinagerecord!.raw_encode(buf).unwrap();},
            WithdrawToOwner:(withdrawtoowner)=>{return this.withdrawtoowner!.raw_encode(buf).unwrap();},
            CreateMinerGroup:(createminergroup)=>{return this.createminergroup!.raw_encode(buf).unwrap();},
            UpdateMinerGroup:(updateminergroup)=>{return this.updateminergroup!.raw_encode(buf).unwrap();},
            CreateSubChainAccount:(createsubchainaccount)=>{return this.createsubchainaccount!.raw_encode(buf).unwrap();},
            UpdateSubChainAccount:(updatesubchainaccount)=>{return this.updatesubchainaccount!.raw_encode(buf).unwrap();},
            SubChainWithdraw:(subchainwithdraw)=>{return this.subchainwithdraw!.raw_encode(buf).unwrap();},
            WithdrawFromSubChain:(withdrawfromsubchain)=>{return this.withdrawfromsubchain!.raw_encode(buf).unwrap();},
            SubChainCoinageRecord:(subchaincoinagerecord)=>{return this.subchaincoinagerecord!.raw_encode(buf).unwrap();},
            Extension:(extension)=>{return this.extension!.raw_encode(buf).unwrap();},
            CreateContract:(extension)=>{return this.createcontract!.raw_encode(buf).unwrap();},
            CreateContract2:(extension)=>{return this.createcontract2!.raw_encode(buf).unwrap();},
            CallContract:(extension)=>{return this.callcontract!.raw_encode(buf).unwrap();},
        })!;
        return Ok(buf);
    }
}

export class MetaTxBodyDecoder implements RawDecode<MetaTxBody> {
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[MetaTxBody, Uint8Array]>{
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
                const r = new TransBalanceTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let transbalance;
                [transbalance, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.TransBalance(transbalance), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new CreateUnionTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let createunion;
                [createunion, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.CreateUnion(createunion), buf];
                return Ok(ret);
            }
            case 2:{
                const r = new DeviateUnionTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let deviateunion;
                [deviateunion, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.DeviateUnion(deviateunion), buf];
                return Ok(ret);
            }
            case 3:{
                const r = new WithdrawFromUnionTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let withdrawfromunion;
                [withdrawfromunion, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.WithdrawFromUnion(withdrawfromunion), buf];
                return Ok(ret);
            }
            case 4:{
                const r = new CreateDescTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let createdesc;
                [createdesc, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.CreateDesc(createdesc), buf];
                return Ok(ret);
            }
            case 5:{
                const r = new UpdateDescTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let updatedesc;
                [updatedesc, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.UpdateDesc(updatedesc), buf];
                return Ok(ret);
            }
            case 6:{
                const r = new RemoveDescTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let removedesc;
                [removedesc, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.RemoveDesc(removedesc), buf];
                return Ok(ret);
            }
            case 7:{
                const r = new BidNameTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let bidname;
                [bidname, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.BidName(bidname), buf];
                return Ok(ret);
            }
            case 8:{
                const r = new UpdateNameTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let updatename;
                [updatename, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.UpdateName(updatename), buf];
                return Ok(ret);
            }
            case 9:{
                const r = new TransNameTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let transname;
                [transname, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.TransName(transname), buf];
                return Ok(ret);
            }
            case 10:{
                const r = new ContractTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let contract;
                [contract, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.Contract(contract), buf];
                return Ok(ret);
            }
            case 11:{
                const r = new SetConfigTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let setconfig;
                [setconfig, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.SetConfig(setconfig), buf];
                return Ok(ret);
            }
            case 12:{
                const r = new AuctionNameTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let auctionname;
                [auctionname, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.AuctionName(auctionname), buf];
                return Ok(ret);
            }
            case 13:{
                const r = new CancelAuctionNameTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let cancelauctionname;
                [cancelauctionname, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.CancelAuctionName(cancelauctionname), buf];
                return Ok(ret);
            }
            case 14:{
                const r = new BuyBackNameTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let buybackname;
                [buybackname, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.BuyBackName(buybackname), buf];
                return Ok(ret);
            }
            case 15:{
                const r = new BTCCoinageRecordTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let btccoinagerecord;
                [btccoinagerecord, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.BTCCoinageRecord(btccoinagerecord), buf];
                return Ok(ret);
            }
            case 16:{
                const r = new WithdrawToOwnerDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let withdrawfromfile;
                [withdrawfromfile, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.WithdrawToOwner(withdrawfromfile), buf];
                return Ok(ret);
            }
            case 17:{
                const r = new MinerGroupDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let createminergroup;
                [createminergroup, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.CreateMinerGroup(createminergroup), buf];
                return Ok(ret);
            }
            case 18:{
                const r = new MinerGroupDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let updateminergroup;
                [updateminergroup, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.UpdateMinerGroup(updateminergroup), buf];
                return Ok(ret);
            }
            case 19:{
                const r = new MinerGroupDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let createsubchainaccount;
                [createsubchainaccount, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.CreateSubChainAccount(createsubchainaccount), buf];
                return Ok(ret);
            }
            case 20:{
                const r = new MinerGroupDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let updatesubchainaccount;
                [updatesubchainaccount, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.UpdateSubChainAccount(updatesubchainaccount), buf];
                return Ok(ret);
            }
            case 21:{
                const r = new SubChainWithdrawTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let subchainwithdraw;
                [subchainwithdraw, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.SubChainWithdraw(subchainwithdraw), buf];
                return Ok(ret);
            }
            case 22:{
                const r = new WithdrawFromSubChainTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let withdrawfromsubchain;
                [withdrawfromsubchain, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.WithdrawFromSubChain(withdrawfromsubchain), buf];
                return Ok(ret);
            }
            case 23:{
                const r = new SubChainCoinageRecordTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let subchaincoinagerecord;
                [subchaincoinagerecord, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.SubChainCoinageRecord(subchaincoinagerecord), buf];
                return Ok(ret);
            }
            case 24:{
                const r = new MetaExtensionTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let extension;
                [extension, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.Extension(extension), buf];
                return Ok(ret);
            }
            case 25:{
                const r = new CreateContractTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let tx;
                [tx, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.CreateContract(tx), buf];
                return Ok(ret);
            }
            case 26:{
                const r = new CreateContract2TxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let tx;
                [tx, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.CreateContract2(tx), buf];
                return Ok(ret);
            }
            case 27:{
                const r = new CallContractTxDecoder().raw_decode(buf);
                if(r.err){
                    return r;
                }
                let tx;
                [tx, buf] = r.unwrap();
                const ret:[MetaTxBody, Uint8Array] =  [MetaTxBody.CallContract(tx), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
