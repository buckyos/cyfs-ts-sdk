import { Block, ChainStatus, CoinTokenId, CreateDescTx, MetaPrice, MetaTxBody, Receipt, ReceiptDecoder, SavedMetaObject, TransBalanceTx, TransBalanceTxItem, Tx, TxBody, TxCaller, TxId, TxIdDecoder, TxInfo, UpdateDescTx, ViewBalanceMethod, ViewBlockEnum, ViewDescMethod, ViewMethodEnum, ViewNameMethod, ViewNameResult, ViewNameResultItem, ViewRawMethod, ViewRequest, ViewResponse, ViewResponseDecoder } from "../cyfs-base-meta";
import { BuckyError, BuckyErrorCode, BuckyNumber, BuckyNumberDecoder, BuckyResult, buffer_from_hex, Err, from_hex, NameInfo, NameState, ObjectId, Ok, Result, to_hex, Option, OptionDecoder, OptionWrapper, StandardObject, PrivateKey, None, to_buf, SignatureRefIndex, OptionEncoder } from "../cyfs-base";
import { HttpRequest, HttpRequestor } from "../non-lib";
import { BuckyResultDecoder } from "../cyfs-base/base/bucky_result";
import { BuckyTuple, BuckyTupleDecoder } from "../cyfs-base/base/bucky_tuple";
import { sign_and_set_named_object } from "../cyfs-base/crypto/sign_util";
import { WithdrawToOwner } from "../cyfs-base-meta/tx/withdraw_to_owner";
import { CreateContractTx } from "../cyfs-base-meta/tx/create_contract";
import { CallContractTx } from "../cyfs-base-meta/tx/call_contract";
import { ViewContractResult } from "../cyfs-base-meta/view/result/view_contract_result";
import { ViewContract } from "../cyfs-base-meta/view/method/view_contract";

export interface MetaResult<T> {
    err: number;
    msg: string;
    result: T;
}

export interface RawTxInfo {
    create_time: number;
    nonce: number;
    caller: string;
    gas_coin_id: number;
    gas_price: number;
    max_fee: number;
    result: number;
    use_fee: number;
    to: [string, number, number][];
    block_number: number;
    block_hash: number;
    block_create_time: number;
}

export interface RawTxRecord {
    hash: string;
    number: number;
    from: string;
    to: string;
    coin_id: number;
    value: number;
    desc: string;
}

export interface RawBlock {
    height: number,
    block_hash: string,
    create_time: number,
    tx_list: RawTxInfo[],
}

export enum MetaMinerTarget {
    Dev,
    Test,
    Formal
}

export function get_meta_miner_host(target: MetaMinerTarget): string {
    if (target === MetaMinerTarget.Dev) {
        return "http://120.24.6.201:880/meta_miner";
    } else if (target === MetaMinerTarget.Test) {
        const urls = [
            "http://106.75.156.225:1523",
            "http://106.75.152.253:1523",
            "http://106.75.136.42:1523",
        ];
        return urls[Math.floor(Math.random()*urls.length)];
    } else {
        return "";
    }
}

export function meta_target_from_str(target?: string): MetaMinerTarget|undefined {
    if (!target) {
        return MetaMinerTarget.Test;
    }
    if (target === "dev") {
        return MetaMinerTarget.Dev;
    } else if (target === "test") {
        return MetaMinerTarget.Test;
    } else if (target === "formal") {
        return MetaMinerTarget.Formal;
    } else {
        return undefined
    }
}

export function get_meta_client(target: MetaMinerTarget): MetaClient {
    return new MetaClient(get_meta_miner_host(target));
}

export function create_meta_client(target_str?: string): MetaClient {
    const target = meta_target_from_str(target_str);
    if (target) {
        return get_meta_client(target);
    } else {
        return new MetaClient(target_str!);
    }
}

export class MetaClient {
    private meta_url: string;

    constructor(meta_url: string) {
        console.info(`meta url = ${meta_url}`);
        this.meta_url = meta_url;
    }

    stringToUint8Array(str: string): Uint8Array {
        const arr = [];
        for (let i = 0, j = str.length; i < j; ++i) {
            arr.push(str.charCodeAt(i));
        }

        const tmpUint8Array = new Uint8Array(arr);
        return tmpUint8Array;
    }

    private async getJson(url: string): Promise<[any]> {
        const resp = await this.request(url, 'GET');
        if (resp.err) {
            return [null];
        }
        return [await resp.unwrap().json()];
    }

    private async postJson(url: string, data: any): Promise<any|null> {
        const resp = await this.request(url, 'POST', JSON.stringify(data));
        if (resp.err) {
            return null;
        }
        return await resp.unwrap().json();
    }

    private async postHex(url: string, data?: string|Uint8Array): Promise<BuckyResult<Uint8Array>> {
        const resp = await this.request(url, 'POST', data);
        if (resp.err) {
            return resp;
        }
        let text = await resp.unwrap().text();
        return Uint8Array.prototype.fromHex(text);
    }

    private async getHex(url: string): Promise<BuckyResult<Uint8Array>> {
        const resp = await this.request(url, 'GET');
        if (resp.err) {
            return resp;
        }
        let text = await resp.unwrap().text();
        return Uint8Array.prototype.fromHex(text);
    }

    private async request(url: string, method: 'GET'|'POST', data?: string|Uint8Array): Promise<BuckyResult<Response>> {
        const http_req = new HttpRequest(method, url);
        if (data) {
            if (typeof(data) === 'string') {
                http_req.set_body(this.stringToUint8Array(data));
            } else {
                http_req.set_body(data)
            }
        }
        const requestor = new HttpRequestor(url);
        return await requestor.request(http_req);
    }

    private async commit_signed_tx(tx: Tx): Promise<BuckyResult<Uint8Array>> {
        let body_r = tx.encode_to_buf();
        if (body_r.err) {
            return body_r;
        }
        return await this.postHex(this.meta_url + "/commit", body_r.unwrap())
    }

    // {
    //     "err": 0,
    //     "msg": "",
    //     "result": {
    //         "status": 2,
    //         "tx": {
    //             "create_time": 13248342114084477,
    //             "nonce": 9,
    //             "caller": "480000000036e516c30f4739ed4dc1bbc07dea72475585c9dd1f8d0df70907aa",
    //             "gas_coin_id": 0,
    //             "gas_price": 0,
    //             "max_fee": 0,
    //             "result": 0,
    //             "use_fee": 0,
    //             "to": [
    //                 [
    //                     "0400000000a68e7d817cad005b3c252a9b52ee39d2b304f495addbc7dafcebf3",
    //                     0,
    //                     10
    //                 ]
    //             ]
    //         },
    //         "block_number": 107,
    //         "block_hash": "8400000000d7a6878d896cb97be3103186e7444645eb8b63ceb9790e8aa81926",
    //         "block_create_time": 13248342126495849
    //     }
    // }
    async getTx(txId: string): Promise<MetaResult<RawTxInfo> | null> {
        const [ret] = await this.getJson(this.meta_url + "/tx/" + txId);
        return ret;
    }

    // {
    //     "err": 0,
    //     "msg": "",
    //     "result": 50
    // }
    async getBalance(coidId: number, accountId: string): Promise<MetaResult<number> | null> {
        const data = [[coidId, accountId]];
        const ret = await this.postJson(this.meta_url + "/balance", data);
        if (ret !== null && ret.err === 0) {
            ret.result = ret.result[0];
        }
        return ret;
    }

    // {
    //     "err": 0,
    //     "msg": "",
    //     "result": [
    //         50
    //     ]
    // }
    async getBalances(list: [number, string][]): Promise<MetaResult<number[]> | null> {
        const [ret] = await this.postJson(this.meta_url + "/balance", list);
        return ret;
    }

    // {
    //     "err": 0,
    //     "msg": "",
    //     "result": {
    //         "version": 0,
    //         "height": 253,
    //         "gas_price": {
    //             "low": 0,
    //             "medium": 0,
    //             "high": 0
    //         }
    //     }
    // }
    async getChainStatus(): Promise<MetaResult<{ version: number, height: number, gas_price: { low: number, medium: number, high: number} }> | null> {
        const [ret] = await this.getJson(this.meta_url + "/status");
        return ret;
    }

    // {
    //     "err": 0,
    //     "msg": "",
    //     "result": [
    //         {
    //             "hash": "70000000001f3f90cddeefbf466b014f27756579ea9fdcc558886e602a66c0e1",
    //             "number": 184,
    //             "from": "480000000036e516c30f4739ed4dc1bbc07dea72475585c9dd1f8d0df70907aa",
    //             "to": "0400000000a68e7d817cad005b3c252a9b52ee39d2b304f495addbc7dafcebf3",
    //             "coin_id": 0,
    //             "value": 10,
    //             "desc": "转账"
    //         }
    //      ]
    // }
    async getPaymentTxList(address_list: string[], offset: number, length: number, start_block: number | null = null, end_block: number | null = null): Promise<MetaResult<RawTxRecord[]> | null> {
        let data;
        if (start_block !== null && end_block !== null) {
            data = {
                address_list,
                block_section: [start_block, end_block],
                offset,
                length
            };
        } else {
            data = {
                address_list,
                offset,
                length
            };
        }

        const ret = await this.postJson(this.meta_url + "/payment_tx_list", data);
        return ret;
    }

    // {
    //     "err": 0,
    //     "msg": "",
    //     "result": [
    //         {
    //             "hash": "70000000001f3f90cddeefbf466b014f27756579ea9fdcc558886e602a66c0e1",
    //             "number": 184,
    //             "from": "480000000036e516c30f4739ed4dc1bbc07dea72475585c9dd1f8d0df70907aa",
    //             "to": "0400000000a68e7d817cad005b3c252a9b52ee39d2b304f495addbc7dafcebf3",
    //             "coin_id": 0,
    //             "value": 10,
    //             "desc": "转账"
    //         }
    //      ]
    // }
    async getCollectTxList(address_list: string[], offset: number, length: number, start_block: number | null = null, end_block: number | null = null): Promise<MetaResult<RawTxRecord[]> | null> {
        let data;
        if (start_block !== null && end_block !== null) {
            data = {
                address_list,
                block_section: [start_block, end_block],
                offset,
                length
            };
        } else {
            data = {
                address_list,
                offset,
                length
            };
        }

        const ret = await this.postJson(this.meta_url + "/collect_tx_list", data);
        return ret;
    }

    // {
    //     "err": 0,
    //     "msg": "",
    //     "result": [
    //         {
    //             "hash": "70000000001f3f90cddeefbf466b014f27756579ea9fdcc558886e602a66c0e1",
    //             "number": 184,
    //             "from": "480000000036e516c30f4739ed4dc1bbc07dea72475585c9dd1f8d0df70907aa",
    //             "to": "0400000000a68e7d817cad005b3c252a9b52ee39d2b304f495addbc7dafcebf3",
    //             "coin_id": 0,
    //             "value": 10,
    //             "desc": "转账"
    //         }
    //      ]
    // }
    async getTxList(address_list: string[], offset: number, length: number, start_block: number | null = null, end_block: number | null = null): Promise<MetaResult<RawTxRecord[]> | null> {
        let data;
        if (start_block !== null && end_block !== null) {
            data = {
                address_list,
                block_section: [start_block, end_block],
                offset,
                length
            };
        } else {
            data = {
                address_list,
                offset,
                length
            };
        }

        const ret = await this.postJson(this.meta_url + "/tx_list", data);
        return ret;
    }

    // {
    //     "err": 0,
    //     "msg": "",
    //     "result": [
    //         {
    //             "height": 0,
    //             "block_hash": "9tGpLNn95tmyAnKvwv3r1WDsz9izU2k1H1KNS2mg4CBy",
    //             "create_time": 13248966498955783,
    //             "tx_list": []
    //         }
    //     ]
    // }
    async getBlocksByRange(start_block: number, end_block: number): Promise<MetaResult<RawBlock[] | null>> {
        const data = {
            start_block,
            end_block
        };

        const ret = await this.postJson(this.meta_url + "/blocks", data);

        return ret;
    }

    // {
    //     "err": 0,
    //     "msg": "",
    //     "result": 0
    // }
    async getFileRewardAmount(address: string): Promise<MetaResult<number>> {
        const [ret] = await this.getJson(this.meta_url + "/reward_amount/" + address);
        return ret;
    }

    async view_request(view: ViewRequest): Promise<BuckyResult<ViewResponse>>{
        let view_hex: string;
        {
            const r = to_hex(view);
            if(r.err){
                return r;
            }
            view_hex = r.unwrap();
        }

        const resp = await this.postHex(this.meta_url + "/view", view_hex);
        if(resp.err){
            return Err(new BuckyError(BuckyErrorCode.HttpError, "view request failed"));
        }

        let view_resp: ViewResponse;
        {
            const r = new BuckyResultDecoder<ViewResponse, ViewResponseDecoder, BuckyNumber, BuckyNumberDecoder>(new ViewResponseDecoder(), new BuckyNumberDecoder('u8')).raw_decode(resp.unwrap());
            if(r.err){
                console.error('decode BuckyResult<ViewResponse, BuckyNumber> faild, ret:', r);
                return r;
            }
            const [result, rest_buf] = r.unwrap();
            if(result.err){
                return Err(new BuckyError(BuckyErrorCode.CodeError, "view responose error, err:"+JSON.stringify(result.val.toNumber())));
            }
            view_resp = result.unwrap() as ViewResponse;
        }

        return Ok(view_resp);
    }

    async getDesc(id: ObjectId): Promise<BuckyResult<SavedMetaObject>> {
        const view = new ViewRequest(
            ViewBlockEnum.Tip(),
            ViewMethodEnum.ViewDesc(new ViewDescMethod(id)),
        );

        const view_resp_ret = await this.view_request(view);
        if(view_resp_ret.err){
            return view_resp_ret;
        }
        const view_resp = view_resp_ret.unwrap();

        let ret;
        view_resp.match({
            ViewDesc: (desc)=>{
                ret = Ok(desc);
            }
        });

        if(ret){
            return ret;
        }else{
            return Err(new BuckyError(BuckyErrorCode.NotMatch, 'view response type is not match'));
        }
    }

    async getBalance2(id: ObjectId, coinId: number): Promise<BuckyResult<bigint>> {
        const view = new ViewRequest(
            ViewBlockEnum.Tip(),
            ViewMethodEnum.ViewBalance(new ViewBalanceMethod(id, [CoinTokenId.Coin(coinId)])),
        );

        const view_resp_ret = await this.view_request(view);
        if(view_resp_ret.err){
            return view_resp_ret;
        }
        const view_resp = view_resp_ret.unwrap();

        let ret;
        view_resp.match({
            ViewBalance: (result)=>{
                result.match({
                    Single: (signle) => {ret = signle.results[0].result}
                })
            }
        });

        if(ret){
            return Ok(ret);
        }else{
            return Err(new BuckyError(BuckyErrorCode.NotMatch, 'view response type is not match'));
        }
    }

    async getRawData(id: ObjectId): Promise<BuckyResult<Uint8Array>>{
        const view = new ViewRequest(
            ViewBlockEnum.Tip(),
            ViewMethodEnum.ViewRaw(new ViewRawMethod(id)),
        );

        const view_resp_ret = await this.view_request(view);
        if(view_resp_ret.err){
            return view_resp_ret;
        }
        const view_resp = view_resp_ret.unwrap();

        let ret;
        view_resp.match({
            ViewRaw: (data)=>{
                ret = Ok(data);
            }
        });

        if(ret){
            return ret;
        }else{
            return Err(new BuckyError(BuckyErrorCode.NotMatch, 'view response type is not match'));
        }
    }

    async getChainViewStatus(): Promise<BuckyResult<ChainStatus>>{
        const view = new ViewRequest(
            ViewBlockEnum.Tip(),
            ViewMethodEnum.ViewStatus()
        );

        const view_resp_ret = await this.view_request(view);
        if(view_resp_ret.err){
            return view_resp_ret;
        }
        const view_resp = view_resp_ret.unwrap();

        let ret;
        view_resp.match({
            ViewStatus: (status)=>{
                ret = Ok(status);
            }
        });

        if(ret){
            return ret;
        }else{
            return Err(new BuckyError(BuckyErrorCode.NotMatch, 'view response type is not match'));
        }
    }

    async getBlock(height: bigint): Promise<BuckyResult<Block>>{
        const view = new ViewRequest(
            ViewBlockEnum.Number(height),
            ViewMethodEnum.ViewBlock()
        );

        const view_resp_ret = await this.view_request(view);
        if(view_resp_ret.err){
            return view_resp_ret;
        }
        const view_resp = view_resp_ret.unwrap();

        let ret;
        view_resp.match({
            ViewBlock: (block)=>{
                ret = Ok(block);
            }
        });

        if(ret){
            return ret;
        }else{
            return Err(new BuckyError(BuckyErrorCode.NotMatch, 'view response type is not match'));
        }
    }

    async getName(name: string): Promise<BuckyResult<Option<ViewNameResultItem>>>{
        const view = new ViewRequest(
            ViewBlockEnum.Tip(),
            ViewMethodEnum.ViewName(new ViewNameMethod(name))
        );

        const view_resp_ret = await this.view_request(view);
        if(view_resp_ret.err){
            return view_resp_ret;
        }
        const view_resp = view_resp_ret.unwrap();

        let ret;
        view_resp.match({
            ViewName: (n)=>{
                ret = Ok(n.results);
            }
        });

        if(ret){
            return ret;
        }else{
            return Err(new BuckyError(BuckyErrorCode.NotMatch, 'view response type is not match'));
        }
    }

    async getReceipt(id: TxId): Promise<BuckyResult<Option<[Receipt, number]>>> {
        let resp = await this.getHex(`${this.meta_url}/receipt?tx=${id.to_base_58()}`);
        if(resp.err){
            return Err(new BuckyError(BuckyErrorCode.HttpError, "view request failed"));
        }

        let r = new BuckyResultDecoder(new OptionDecoder(new BuckyTupleDecoder([new ReceiptDecoder(), new BuckyNumberDecoder('i64')])), new BuckyNumberDecoder("u32")).raw_decode(resp.unwrap());
        if (r.err) {
            return r;
        }
        let [ret, buf] = r.unwrap();
        if (ret.err) {
            return Err(new BuckyError(BuckyErrorCode.CodeError, "MetaError", `MetaErrCode: ${(ret.val as BuckyNumber).toNumber()}`))
        }
        let new_ret = (ret.unwrap() as OptionWrapper<BuckyTuple>).to((v)=> {
            let [receipt, number] = v.members as [Receipt, BuckyNumber];
            return [receipt, number.toNumber()] as [Receipt, number];
        })
        return Ok(new_ret);
    }

    async get_nonce(id: ObjectId): Promise<BuckyResult<bigint>> {
        let resp = await this.getHex(`${this.meta_url}/nonce?id=${id.to_base_58()}`);
        if(resp.err){
            return Err(new BuckyError(BuckyErrorCode.HttpError, "get nonce failed"));
        }

        let r = new BuckyResultDecoder(new BuckyNumberDecoder('i64'), new BuckyNumberDecoder("u32")).raw_decode(resp.unwrap());
        if (r.err) {
            return r;
        }
        let [ret, buf] = r.unwrap();
        if (ret.err) {
            return Err(new BuckyError(BuckyErrorCode.CodeError, `err code ${(ret.val as BuckyNumber).toNumber()}`));
        }
        return Ok((ret.unwrap() as BuckyNumber).toBigInt())
    }

    private async create_tx(caller: TxCaller, body: MetaTxBody, gas_price: number, max_fee: number, tx_data: Uint8Array): Promise<BuckyResult<Tx>> {
        let nonce_r = await this.get_nonce(caller.ext().id().unwrap());
        if (nonce_r.err) {
            return nonce_r;
        }
        let nonce = nonce_r.unwrap() + BigInt(1);

        let tx = Tx.create(nonce, caller, 0, gas_price, max_fee, None, body, tx_data);

        return Ok(tx)
    }

    private sign_tx(tx: Tx, secret: PrivateKey): BuckyResult<{}> {
        return sign_and_set_named_object(secret, tx, new SignatureRefIndex(0));
    }

    private async sign_and_put_tx(tx: Tx, secret: PrivateKey): Promise<BuckyResult<TxId>> {
        this.sign_tx(tx, secret);

        let resp_r = await this.commit_signed_tx(tx);
        if (resp_r.err) {
            return resp_r;
        }

        let r = new BuckyResultDecoder<TxId, TxIdDecoder, BuckyNumber, BuckyNumberDecoder>(new TxIdDecoder(), new BuckyNumberDecoder("u32")).raw_decode(resp_r.unwrap());
        if (r.err) {
            return r;
        }
        let [ret, buf] = r.unwrap();
        if (ret.err) {
            return Err(new BuckyError(BuckyErrorCode.CodeError, `err code ${ret.val.toNumber()}`));
        }

        return Ok(ret.unwrap() as TxId)
    }

    private async put_tx(caller: StandardObject, secret: PrivateKey, body: MetaTxBody, gas_price?: number, max_fee?: number, data?: Uint8Array): Promise<BuckyResult<TxId>> {
        let caller_r = TxCaller.try_from(caller);
        if (caller_r.err) {
            return caller_r;
        }

        let txcaller = caller_r.unwrap();
        let tx_r = await this.create_tx(txcaller, body, gas_price || 0, max_fee || 0, data || new Uint8Array(0));
        if (tx_r.err) {
            return tx_r;
        }
        return await this.sign_and_put_tx(tx_r.unwrap(), secret);
    }

    async create_desc(owner: StandardObject, desc: SavedMetaObject, v: bigint, price: number, secret: PrivateKey): Promise<BuckyResult<TxId>> {
        return await this.put_tx(owner, secret, MetaTxBody.CreateDesc(new CreateDescTx(0, None, v, desc.hash().unwrap(), price)), 0,0,to_buf(desc).unwrap());
    }

    async update_desc(owner: StandardObject, desc: SavedMetaObject, price: Option<number>, secret: PrivateKey): Promise<BuckyResult<TxId>> {
        let meta_price = price.to((v) => {return new MetaPrice(0, v);});
        return await this.put_tx(owner, secret, MetaTxBody.UpdateDesc(new UpdateDescTx(0, meta_price, desc.hash().unwrap())), 0,0,to_buf(desc).unwrap());
    }

    async trans_balance(from: StandardObject, to: ObjectId, v: bigint, secret: PrivateKey): Promise<BuckyResult<TxId>> {
        return await this.put_tx(from, secret, MetaTxBody.TransBalance(new TransBalanceTx(CoinTokenId.Coin(0), [new TransBalanceTxItem(to, v)])));
    }

    async withdraw_from_file(caller: StandardObject, file_id: ObjectId, v: bigint, secret: PrivateKey): Promise<BuckyResult<TxId>> {
        return await this.put_tx(caller, secret, MetaTxBody.WithdrawToOwner(new WithdrawToOwner(CoinTokenId.Coin(0), file_id, v)));
    }

    async create_contract(caller: StandardObject, secret: PrivateKey, value: bigint, init_data: Uint8Array, gas_price: number, max_fee: number): Promise<BuckyResult<TxId>> {
        return await this.put_tx(caller, secret, MetaTxBody.CreateContract(new CreateContractTx(value, init_data)), gas_price, max_fee);
    }

    async call_contract(caller: StandardObject, secret: PrivateKey, address: ObjectId, value: bigint, data: Uint8Array, gas_price: number, max_fee: number): Promise<BuckyResult<TxId>> {
        return await this.put_tx(caller, secret, MetaTxBody.CallContract(new CallContractTx(address, value, data)), gas_price, max_fee);
    }

    async view_contract(address: ObjectId, data: Uint8Array): Promise<BuckyResult<ViewContractResult>> {
        const view = new ViewRequest(
            ViewBlockEnum.Tip(),
            ViewMethodEnum.ViewContract(new ViewContract(address, data)),
        );

        const view_resp_ret = await this.view_request(view);
        if(view_resp_ret.err){
            return view_resp_ret;
        }
        const view_resp = view_resp_ret.unwrap();

        let ret = view_resp.match({
            ViewContract: (result)=>result
        });

        if(ret){
            return Ok(ret);
        }else{
            return Err(new BuckyError(BuckyErrorCode.NotMatch, 'view response type is not match'));
        }
    }
}
