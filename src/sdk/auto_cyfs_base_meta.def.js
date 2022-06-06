const fs = require('fs-extra');
const path = require('path');

function rust_cyfs_base_meta(){
    
    const { importor_base, importor, importor_inner } = require('./auto_util');

    return [
        //
        // types.rs 
        //
        {
            rust: `
            pub struct UnionBalance {
                pub total: i64,
                pub left: i64,
                pub right: i64,
                pub deviation: i64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/types/union_balance.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ]
        },

        {
            rust: `
            pub enum PeerOfUnion {
                Left,
                Right
            }
            `,
            type: "enum_pure",
            output: path.join(__dirname,"cyfs-base-meta/types/peer_of_union.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ]
        },

        {
            rust: `
            pub enum FFSObjectState {
                Normal,
                Expire,
            }
            `,
            type: "enum_pure",
            output: path.join(__dirname,"cyfs-base-meta/types/ffs_object_state.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ]
        },

        //
        // view.rs
        //
        {
            rust: `
            pub enum ViewBlockEnum {
                Tip(void),
                Number(i64),
                Hash(ObjectId),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/view/view_block_enum.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ]
        },

        // method
        {
            rust: `
            pub struct ViewBalanceMethod {
                pub account: ObjectId,
                pub ctid: Vec<CoinTokenId>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/method/view_balance_method.ts"),
            depends:[
                importor_base('../../../cyfs-base/'),
                importor(['CoinTokenId', 'CoinTokenIdDecoder'], '../../tx/coin_token_id')
            ]
        },
        {
            rust: `
            pub struct ViewNameMethod {
                pub name: String,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/method/view_name_method.ts"),
            depends:[
                importor_base('../../../cyfs-base/'),
            ]
        },
        {
            rust: `
            pub struct ViewDescMethod {
                pub id: ObjectId,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/method/view_desc_method.ts"),
            depends:[
                importor_base('../../../cyfs-base/'),
            ]
        },
        {
            rust: `
            pub struct ViewRawMethod {
                pub id: ObjectId,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/method/view_raw_method.ts"),
            depends:[
                importor_base('../../../cyfs-base/'),
            ]
        },

        // result
        {
            rust: `
            pub struct ViewSingleBalanceResultItem {
                pub id: CoinTokenId,
                pub result: i64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/result/view_single_balance_result_item.ts"),
            depends:[
                importor_base('../../../cyfs-base/'),
                importor(['CoinTokenId', 'CoinTokenIdDecoder'], '../../tx/coin_token_id')
            ]
        },
        {
            rust: `
            pub struct ViewSingleBalanceResult {
                pub results: Vec<ViewSingleBalanceResultItem>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/result/view_single_balance_result.ts"),
            depends:[
                importor_base('../../../cyfs-base/'),
                importor(['ViewSingleBalanceResultItem', 'ViewSingleBalanceResultItemDecoder'], './view_single_balance_result_item')
            ]
        },

        {
            rust: `
            pub struct ViewUnionBalanceResultItem {
                pub id: CoinTokenId,
                pub union_balance: UnionBalance,
                pub result: i64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/result/view_union_balance_result_item.ts"),
            depends:[
                importor_base('../../../cyfs-base/'),
                importor(['CoinTokenId', 'CoinTokenIdDecoder'], '../../tx/coin_token_id'),
                importor(['UnionBalance', 'UnionBalanceDecoder'], '../../types/union_balance'),
            ]
        },
        {
            rust: `
            pub struct ViewUnionBalanceResult {
                pub results: Vec<ViewUnionBalanceResultItem>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/result/view_union_balance_result.ts"),
            depends:[
                importor_base('../../../cyfs-base/'),
                importor(['ViewUnionBalanceResultItem', 'ViewUnionBalanceResultItemDecoder'], '../../view/result/view_union_balance_result_item'),
            ]
        },

        {
            rust: `
            pub enum ViewBalanceResult {
                Single(ViewSingleBalanceResult),
                Union(ViewUnionBalanceResult)
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/view/result/view_balance_result.ts"),
            depends:[
                importor_base('../../../cyfs-base/'),
                importor(['ViewSingleBalanceResult', 'ViewSingleBalanceResultDecoder'], '../../view/result/view_single_balance_result'),
                importor(['ViewUnionBalanceResult', 'ViewUnionBalanceResultDecoder'], '../../view/result/view_union_balance_result'),
            ]
        },

        {
            rust: `
            pub struct ViewNameResultItem {
                pub name_info: NameInfo, 
                pub name_state: NameState,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/result/view_name_result_item.ts"),
            depends:[
                importor_base('../../../cyfs-base/'),
                importor(['NameInfo', 'NameInfoDecoder'], '../../../cyfs-base/name/name_info'),
                importor(['NameState', 'NameStateDecoder'], '../../../cyfs-base/name/name_state'),
            ],
        },

        {
            rust: `
            pub struct ViewNameResult {
                pub results: Option<ViewNameResultItem>, 
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/result/view_name_result.ts"),
            depends:[
                importor_base('../../../cyfs-base/'),
                importor(['ViewNameResultItem', 'ViewNameResultItemDecoder'], './view_name_result_item'),
            ],
        },

        // view
        {
            rust: `
            pub struct GasPrice {
                pub low: i64,
                pub medium: i64,
                pub high: i64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/gas_price.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct ChainStatus {
                pub version: u32,
                pub height: i64,
                pub gas_price: GasPrice,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/chain_status.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor(['GasPrice', 'GasPriceDecoder'], './gas_price'),
            ],
        },

        {
            rust: `
            pub enum ViewMethodEnum {
                ViewBalance(ViewBalanceMethod),
                ViewName(ViewNameMethod),
                ViewDesc(ViewDescMethod),
                ViewRaw(ViewRawMethod),
                ViewStatus(void),
                ViewBlock(void),
                ViewTx(ObjectId),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/view/view_method_enum.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'ViewBalanceMethod', 'ViewBalanceMethodDecoder',
                    'ViewNameMethod', 'ViewNameMethodDecoder',
                    'ViewDescMethod', 'ViewDescMethodDecoder',
                    'ViewRawMethod', 'ViewRawMethodDecoder',
                ]),
            ],
        },

        {
            rust: `
            pub struct ViewRequest {
                pub block: ViewBlockEnum,
                pub method: ViewMethodEnum,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/view_request.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'ViewBlockEnum', 'ViewBlockEnumDecoder',
                    'ViewMethodEnum', 'ViewMethodEnumDecoder',
                ]),
            ],
        },

        {
            rust: `
            pub struct TxFullInfo {
                pub status: u8,
                pub block_number: i64,
                pub tx: MetaTx,
                pub receipt: Option<Receipt>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/view/tx_full_info.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'MetaTx', 'MetaTxDecoder',
                    'Receipt', 'ReceiptDecoder',
                ]),
            ],
        },
        
        {
            rust: `
            pub enum ViewResponse {
                ViewBalance(ViewBalanceResult),
                ViewName(ViewNameResult),
                ViewDesc(SavedMetaObject),
                ViewRaw(Vec<u8>),
                ViewStatus(ChainStatus),
                ViewBlock(Block),
                ViewTx(TxFullInfo),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/view/view_response.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'ViewBalanceResult', 'ViewBalanceResultDecoder',
                    'ViewNameResult', 'ViewNameResultDecoder',
                    'SavedMetaObject', 'SavedMetaObjectDecoder',
                    'ChainStatus', 'ChainStatusDecoder',
                    'Block', 'BlockDecoder',
                    'TxFullInfo', 'TxFullInfoDecoder',
                ]),
            ],
        },


        //
        // tx.rs
        //
        {
            rust: `
            pub struct TransBalanceTxItem {
                pub id : ObjectId,
                pub balance: i64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/trans_balance_tx_item.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub enum CoinTokenId {
                Coin(u8),
                Token(ObjectId),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/tx/coin_token_id.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub enum TxCaller {
                People(PeopleDesc),
                Device(DeviceDesc),
                Group(SimpleGroupDesc),
                Union(UnionAccountDesc),
                Miner(ObjectId),
                Id(ObjectId),
            }
            `,
            type: "enum",
            use_ext: true,
            output: path.join(__dirname,"cyfs-base-meta/tx/tx_caller.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor(['PeopleDesc', 'PeopleDescDecoder'], "../../cyfs-base/objects/people"),
                importor(['DeviceDesc', 'DeviceDescDecoder'], "../../cyfs-base/objects/device"),
                importor(['SimpleGroupDesc', 'SimpleGroupDescDecoder'], "../../cyfs-base/objects/simple_group"),
                importor(['UnionAccountDesc', 'UnionAccountDescDecoder'], "../../cyfs-base/objects/union_account"),
            ],
        },
        {
            rust: `
            pub enum TxCondition {
                Empty(void)
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/tx/tx_condition.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct TransBalanceTx {
                pub ctid : CoinTokenId,
                pub to: Vec<TransBalanceTxItem>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/trans_balance_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'TransBalanceTxItem', 'TransBalanceTxItemDecoder',
                    'CoinTokenId', 'CoinTokenIdDecoder',
                ]),
            ],
        },
        {
            rust: `
            pub struct CreateUnionBody {
                pub account: UnionAccount,
                pub ctid: CoinTokenId,
                pub left_balance: i64,
                pub right_balance: i64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/create_union_body.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor(['UnionAccount', 'UnionAccountDecoder'], "../../cyfs-base/objects/union_account"),
                importor_inner([
                    'CoinTokenId', 'CoinTokenIdDecoder',
                ]),
            ],
        },
        {
            rust: `
            pub struct DeviateUnionBody {
                pub ctid: CoinTokenId,
                pub seq: i64,
                pub deviation : i64,
                pub union: ObjectId,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/devite_union_body.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'CoinTokenId', 'CoinTokenIdDecoder',
                ]),
            ],
        },
        {
            rust: `
            pub struct WithdrawFromFileTx {
                pub ctid: CoinTokenId,
                pub id: ObjectId,
                pub value: i64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/withdraw_from_file_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'CoinTokenId', 'CoinTokenIdDecoder',
                ]),
            ],
        },
        {
            rust: `
            pub struct WithdrawFromUnionTx {
                pub ctid : CoinTokenId,
                pub union: ObjectId,
                pub value: i64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/withdraw_from_union_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'CoinTokenId', 'CoinTokenIdDecoder',
                ]),
            ],
        },
        {
            rust: `
            pub struct Data {
                pub id: ObjectId,
                pub data: Vec<u8>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/data.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct CreateDescTx {
                pub coin_id: u8,
                pub from: Option<ObjectId>,
                pub value: i64,
                pub desc_hash: HashValue,
                pub price: u32,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/create_desc_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct MetaPrice {
                pub coin_id : u8,
                pub price : u32,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/meta_price.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct UpdateDescTx {
                pub write_flag: u8,
                pub price : Option<MetaPrice>,
                pub desc_hash: HashValue,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/update_desc_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'MetaPrice', 'MetaPriceDecoder'
                ])
            ],
        },
        {
            rust: `
            pub struct RemoveDescTx {
                pub id: ObjectId,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/remove_desc_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct BidNameTx {
                pub name : String,
                pub owner : Option<ObjectId>,
                pub name_price : u64,
                pub price : u32,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/bid_name_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct UpdateNameTx {
                pub name : String,
                pub info : NameInfo,
                pub write_flag : u8,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/update_name_tx.ts"),
            base: '../../cyfs-base',
            depends:[
                importor_base('../../cyfs-base/'),
                importor(['NameInfo', 'NameInfoDecoder'], '../../cyfs-base/name/name_info')
            ],
        },
        {
            rust: `
            pub struct AuctionNameTx {
                pub name : String,
                pub price: u64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/auction_name_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct CancelAuctionNameTx {
                pub name : String,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/cancel_aution_name.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct BuyBackNameTx {
                pub name: String,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/buy_back_name_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct TransNameTx {
                pub sub_name : Option<String>,
                pub new_owner : ObjectId,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/trans_name_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct InstanceContractTx {
                pub contract_id : ObjectId,
                pub template_parms : Vec<u8>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/instance_contract_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct ContractTx {
                pub instance_id : ObjectId,
                pub func_name : String,
                pub parm_body : Vec<u8>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/contract_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct Receipt {
                pub result: u32,
                pub fee_used: u32,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/receipt.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct SetConfigTx {
                pub key: String,
                pub value: String,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/set_config_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct BTCTxRecord {
                pub txid: String,
                pub blockHash: String,
                pub blockNumber: u64,
                pub confirmed: u64,
                pub received: u64,
                pub exodusAddress: String,
                pub btcValue: u64,
                pub version: u32,
                pub propertyID: u32,
                pub op: u32,
                pub address: String,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/btc_tx_record.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct BTCCoinageRecordTx {
                pub height: u64,
                pub list: Vec<BTCTxRecord>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/btc_coinage_record_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'BTCTxRecord', 'BTCTxRecordDecoder'
                ])
            ],
        },
        {
            rust: `
            pub struct SubChainWithdrawTx {
                pub subchain_id: ObjectId,
                pub withdraw_tx: Vec<u8>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/sub_chain_withdraw_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct WithdrawFromSubChainTx {
                pub coin_id: CoinTokenId,
                pub value: i64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/withdraw_from_sub_chain_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'CoinTokenId', 'CoinTokenIdDecoder'
                ])
            ],
        },
        {
            rust: `
            pub struct SubChainCoinageRecordTx {
                pub height: i64,
                pub list: Vec<SPVTx>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/sub_chain_coinage_record_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'SPVTx', 'SPVTxDecoder'
                ])
            ],
        },

        {
            rust: `
            pub enum FlowServiceTx {
                Create(FlowService),
                Purchase(u32),
                Settle(void),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/tx/flow_service_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'FlowService', 'FlowServiceDecoder'
                ])
            ],
        },

        {
            rust: `
            pub enum SNServiceTx {
                Publish(SNService),
                Remove(ObjectId),
                Purchase(Contract),
                Settle(ProofOfService),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/tx/sn_service_tx.ts"),
            base: '../../cyfs-base',
            depends:[
                importor_base('../../cyfs-base/'),
                importor(['Contract', 'ContractDecoder'], '../../cyfs-base/objects/contract'),
                importor(['ProofOfService', 'ProofOfServiceDecoder'], '../../cyfs-base/objects/proof_of_service/proof_of_service'),
                importor_inner([
                    'SNService', 'SNServiceDecoder',
                ])
            ],
        },
        {
            rust: `
            pub struct CreateUnionTx {
                pub body: CreateUnionBody,
                pub signs: Vec<Signature>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/create_union_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor(['Signature', 'SignatureDecoder'], '../../cyfs-base/crypto/public_key'),
                importor_inner([
                    'CreateUnionBody', 'CreateUnionBodyDecoder',
                ])
            ],
        },
        {
            rust: `
            pub struct DeviateUnionTx {
                pub body: DeviateUnionBody,
                pub signs: Vec<Signature>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/deviate_union_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor(['Signature', 'SignatureDecoder'], '../../cyfs-base/crypto/public_key'),
                importor_inner([
                    'DeviateUnionBody', 'DeviateUnionBodyDecoder',
                ])
            ],
        },
        {
            rust: `
            pub enum SavedMetaObject {
                Device(Device),
                People(People),
                UnionAccount(UnionAccount),
                Group(SimpleGroup),
                File(File),
                Data(Data),
                Org(Org),
                MinerGroup(MinerGroup),
                SNService(SNService),
                Contract(Contract),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/tx/saved_meta_object.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor(['Device', 'DeviceDecoder'], '../../cyfs-base/objects/device'),
                importor(['People', 'PeopleDecoder'], '../../cyfs-base/objects/people'),
                importor(['UnionAccount', 'UnionAccountDecoder'], '../../cyfs-base/objects/union_account'),
                importor(['SimpleGroup', 'SimpleGroupDecoder'], '../../cyfs-base/objects/simple_group'),
                importor(['File', 'FileDecoder'], '../../cyfs-base/objects/file'),
                importor(['Org', 'OrgDecoder'], '../../cyfs-base/objects/org'),
                importor(['Contract', 'ContractDecoder'], '../../cyfs-base/objects/contract'),
                importor_inner([
                    'Data', 'DataDecoder',
                    'MinerGroup', 'MinerGroupDecoder',
                    'SNService', 'SNServiceDecoder',
                ])
            ],
        },
        {
            obj_name: "MinerGroup",
            obj_type: "CoreObjectType",
            obj_type_def: "../../cyfs-core",
            sub_desc_type:{
                owner_type: "disable",
                area_type: "disable",
                author_type: "disable",
                key_type: "disable",
            },
            desc_content:`
            pub struct MinerGroupDescContent {
                
            }
            `,
            body_content:`
            pub struct MinerGroupBodyContent {
                pub members: Vec<DeviceDesc>,
            }
            `,
            type: "obj",
            use_ext: true,
            output: path.join(__dirname,"cyfs-base-meta/tx/miner_group.ts"),

            depends:[
                importor_base('../../cyfs-base/'),
                importor(['DeviceDesc', 'DeviceDescDecoder'], '../../cyfs-base/objects/device'),
            ],
        },
        {
            obj_name: "FlowService",
            obj_type: "CoreObjectType",
            obj_type_def: "../../cyfs-core",
            sub_desc_type:{
                owner_type: "has",
                area_type: "disable",
                author_type: "disable",
                key_type: "disable",
            },
            desc_content:`
            pub struct FlowServiceDescContent {
                
            }
            `,
            body_content:`
            pub struct FlowServiceBodyContent {
                pub price: i64,
            }
            `,
            type: "obj",
            output: path.join(__dirname,"cyfs-base-meta/tx/flow_service.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct TxBody {
                body: Vec<u8>
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/tx_body.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            obj_name: "Tx",
            obj_type: "ObjectTypeCode",
            obj_type_def: "../../cyfs-base",
            sub_desc_type:{
                owner_type: "disable",
                area_type: "disable",
                author_type: "disable",
                key_type: "disable",
            },
            desc_content:`
            pub struct Tx {
                pub nonce : i64,
                pub caller: TxCaller,
                pub gas_coin_id : u8,
                pub gas_price : u16,
                pub max_fee : u32,
                pub condition : Option<TxCondition>,
                pub body: Vec<TxBody>,
            }
            `,
            body_content:`
            pub struct TxBodyContent {
                pub data : Vec<u8>,
            }
            `,
            type: "obj",
            use_ext: true,
            output: path.join(__dirname,"cyfs-base-meta/tx/tx.ts"),

            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'TxBody', 'TxBodyDecoder',
                    'TxCaller', 'TxCallerDecoder',
                    'TxCondition', 'TxConditionDecoder',
                ])
            ],
        },
        {
            rust: `
            pub enum MetaTxBody {
                TransBalance(TransBalanceTx),
                CreateUnion(CreateUnionTx),
                DeviateUnion(DeviateUnionTx),
                WithdrawFromUnion(WithdrawFromUnionTx),
                CreateDesc(CreateDescTx),
                UpdateDesc(UpdateDescTx),
                RemoveDesc(RemoveDescTx),
                BidName(BidNameTx),
                UpdateName(UpdateNameTx),
                TransName(TransNameTx),
                Contract(ContractTx),
                SetConfig(SetConfigTx),
                AuctionName(AuctionNameTx),
                CancelAuctionName(CancelAuctionNameTx),
                BuyBackName(BuyBackNameTx),
                BTCCoinageRecord(BTCCoinageRecordTx),
                WithdrawFromFile(WithdrawFromFileTx),
                CreateMinerGroup(MinerGroup),
                UpdateMinerGroup(MinerGroup),
                CreateSubChainAccount(MinerGroup),
                UpdateSubChainAccount(MinerGroup),
                SubChainWithdraw(SubChainWithdrawTx),
                WithdrawFromSubChain(WithdrawFromSubChainTx),
                SubChainCoinageRecord(SubChainCoinageRecordTx),
                Extension(MetaExtensionTx),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/tx/meta_tx_body.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'TransBalanceTx', 'TransBalanceTxDecoder',
                    'CreateUnionTx', 'CreateUnionTxDecoder',
                    'DeviateUnionTx', 'DeviateUnionTxDecoder',
                    'WithdrawFromUnionTx', 'WithdrawFromUnionTxDecoder',
                    'CreateDescTx', 'CreateDescTxDecoder',
                    'UpdateDescTx', 'UpdateDescTxDecoder',
                    'RemoveDescTx', 'RemoveDescTxDecoder',
                    'BidNameTx', 'BidNameTxDecoder',
                    'UpdateNameTx', 'UpdateNameTxDecoder',
                    'TransNameTx', 'TransNameTxDecoder',
                    'ContractTx', 'ContractTxDecoder',
                    'SetConfigTx', 'SetConfigTxDecoder',
                    'AuctionNameTx', 'AuctionNameTxDecoder',
                    'CancelAuctionNameTx', 'CancelAuctionNameTxDecoder',
                    'BuyBackNameTx', 'BuyBackNameTxDecoder',
                    'BTCCoinageRecordTx', 'BTCCoinageRecordTxDecoder',
                    'WithdrawFromFileTx', 'WithdrawFromFileTxDecoder',
                    'MinerGroup', 'MinerGroupDecoder',
                    'SubChainWithdrawTx', 'SubChainWithdrawTxDecoder',
                    'WithdrawFromSubChainTx', 'WithdrawFromSubChainTxDecoder',
                    'SubChainCoinageRecordTx', 'SubChainCoinageRecordTxDecoder',
                    'MetaExtensionTx', 'MetaExtensionTxDecoder'
                ])
            ],
        },
        {
            obj_name: "MetaTx",
            obj_type: "CoreObjectType",
            obj_type_def: "../../cyfs-core",
            sub_desc_type:{
                owner_type: "disable",
                area_type: "disable",
                author_type: "disable",
                key_type: "disable",
            },
            desc_content:`
            pub struct MetaTx {
                pub nonce : i64,
                pub caller: TxCaller,
                pub gas_coin_id : u8,
                pub gas_price : u16,
                pub max_fee : u32,
                pub condition : Option<TxCondition>,
                pub body: Vec<MetaTxBody>,
            }
            `,
            body_content:`
            pub struct MetaTxBodyContent {
                pub data : Vec<u8>,
            }
            `,
            type: "obj",
            use_ext: true,
            output: path.join(__dirname,"cyfs-base-meta/tx/meta_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'TxCaller', 'TxCallerDecoder',
                    'TxCondition', 'TxConditionDecoder',
                    'MetaTxBody', 'MetaTxBodyDecoder',
                ])
            ],
        },

        // extension
        {
            rust: `
            pub enum MetaExtensionType {
                DSG(void),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/extension/meta_extension_type.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct MetaExtensionTx {
                pub extension_id: MetaExtensionType,
                pub tx_data: Vec<u8>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/extension/meta_extension_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'MetaExtensionType', 'MetaExtensionTypeDecoder',
                ])
            ],
        },

        // sn_service
        {
            rust: `
            pub enum ServiceAuthType {
                Any(void),
                WhiteList(void),
                BlackList(void),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/sn_service/service_auth_type.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct SNPurchase {
                pub service_id: ObjectId,
                pub start_time: u64,
                pub stop_time: u64,
                pub auth_type: ServiceAuthType,
                pub auth_list: Vec<ObjectId>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/sn_service/sn_purchase.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'ServiceAuthType', 'ServiceAuthTypeDecoder'
                ])
            ],
        },
        {
            // TODO: 设计了一半？应该是个NamedObject？
            rust: `
            pub struct SNContractBodyContent {
                pub auth_type: ServiceAuthType,
                pub list: Vec<ObjectId>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/sn_service/sn_contract_body_content.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'ServiceAuthType', 'ServiceAuthTypeDecoder',
                ])
            ],
        },
        {
            obj_name: "SNService",
            obj_type: "CoreObjectType",
            obj_type_def: "../../cyfs-core",
            sub_desc_type:{
                owner_type: "has",
                area_type: "disable",
                author_type: "disable",
                key_type: "disable",
            },
            desc_content:`
            pub struct SNServiceDescContent {
                pub service_type: u8,
                pub price: u64,
            }
            `,
            body_content:`
            pub struct SNServiceBodyContent {
            }
            `,
            type: "obj",
            output: path.join(__dirname,"cyfs-base-meta/sn_service/sn_service.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },

        // event
        {
            rust: `
            pub struct RentParam {
                pub id: ObjectId,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/event/rent_param.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NameRentParam {
                pub name_id: String,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/event/name_rent_param.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct ChangeNameParam {
                pub name: String,
                pub to: NameState
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/event/change_name_param.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor(['NameState', 'NameStateDecoder'], '../../cyfs-base/name/name_state')
            ],
        },
        {
            rust: `
            pub struct StopAuctionParam {
                pub name: String,
                pub stop_block: i64,
                pub starting_price: i64
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/event/stop_auction_param.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct BidName {
                pub name: String,
                pub price: i64,
                pub bid_id: ObjectId,
                pub coin_id: u8,
                pub take_effect_block: i64,
                pub rent_price: i64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/event/bid_name.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct UnionWithdraw {
                pub union_id: ObjectId,
                pub account_id: ObjectId,
                pub ctid: CoinTokenId,
                pub value: i64,
                pub height: i64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/event/union_withdraw.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'CoinTokenId', 'CoinTokenIdDecoder'
                ])
            ],
        },
        {
            rust: `
            pub struct ExtensionEvent {
                pub extension_type: MetaExtensionType,
                pub data: Vec<u8>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/event/extension_event.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'MetaExtensionType', 'MetaExtensionTypeDecoder'
                ])
            ],
        },
        {
            rust: `
            pub enum EventType {
                Rent,
                ChangeName,
                NameRent,
                BidName,
                StopAuction,
                UnionWithdraw,
                Extension,
            }
            `,
            type: "enum_pure",
            output: path.join(__dirname,"cyfs-base-meta/event/event_type.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub enum Event {
                Rent(RentParam),
                NameRent(NameRentParam),
                ChangeNameEvent(ChangeNameParam),
                BidName(BidName),
                StopAuction(StopAuctionParam),
                UnionWithdraw(UnionWithdraw),
                Extension(ExtensionEvent),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/event/event.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'RentParam, RentParamDecoder',
                    'NameRentParam, NameRentParamDecoder',
                    'ChangeNameParam, ChangeNameParamDecoder',
                    'BidName, BidNameDecoder',
                    'StopAuctionParam, StopAuctionParamDecoder',
                    'UnionWithdraw, UnionWithdrawDecoder',
                    'ExtensionEvent, ExtensionEventDecoder',
                ])
            ],
        },

        // config
        {
            rust: `
            pub struct PreBalance {
                pub id: ObjectId,
                pub balance: i64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/config/pre_balance.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct GenesisCoinConfig {
                pub coin_id: u8,
                pub pre_balance: Vec<PreBalance>
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/config/genesis_coin_config.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'PreBalance', 'PreBalanceDecoder'
                ])
            ],
        },
        {
            rust: `
            pub struct GenesisPriceConfig {
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/config/genesis_price_config.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct GenesisConfig {
                pub chain_type: Option<String>,
                pub coinbase: ObjectId,
                pub interval: u32,
                pub bfc_spv_node: String,
                pub coins: Vec<GenesisCoinConfig>,
                pub price: GenesisPriceConfig,
                pub miner_key_path: Option<String>,
                pub mg_path: Option<String>,
                pub miner_desc_path: Option<String>,
                pub sub_chain_tx: Option<String>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/config/genesis_config.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'GenesisCoinConfig', 'GenesisCoinConfigDecoder',
                    'GenesisPriceConfig', 'GenesisPriceConfigDecoder'
                ])
            ],
        },

        // block
        {
            obj_name: "Block",
            obj_type: "CoreObjectType",
            obj_type_def: "../../cyfs-core",
            sub_desc_type:{
                owner_type: "disable",
                area_type: "disable",
                author_type: "disable",
                key_type: "disable",
            },
            desc_content:`
            pub struct BlockDescContent {
                pub number: i64,
                pub coinbase: ObjectId,
                pub state_hash: HashValue,
                pub pre_block_hash: ObjectId,
                pub transactions_hash: HashValue,
                pub receipts_hash: HashValue,
            }
            `,
            body_content:`
            pub struct BlockBodyContent {
                pub transactions: Vec<MetaTx>,
                pub receipts: Vec<Receipt>
            }
            `,
            type: "obj",
            use_ext: true,
            output: path.join(__dirname,"cyfs-base-meta/block/block.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'MetaTx', 'MetaTxDecoder',
                    'Receipt', 'ReceiptDecoder',
                    'BlockExt'
                ])
            ],
        },

        // spv
        {
            rust: `
            pub struct SPVTx {
                pub hash: String,
                pub number: i64,
                pub from: String,
                pub to: String,
                pub coin_id: u8,
                pub value: i64,
                pub desc: String,
                pub create_time: i64,
                pub result: u32,
                pub use_fee: u32,
                pub nonce: i64,
                pub gas_coin_id : u8,
                pub gas_price : u16,
                pub max_fee : u32,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/spv/spv_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct BlockSection {
                pub start: i64,
                pub end: i64,
            }
            `,
            type: "struct",
            no_encode: true,
            output: path.join(__dirname,"cyfs-base-meta/spv/block_section.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct GetTxListRequest {
                pub address_list: Vec<String>,
                pub block_section: Option<BlockSection>,
                pub offset: i64,
                pub length: i64,
            }
            `,
            type: "struct",
            no_encode: true,
            output: path.join(__dirname,"cyfs-base-meta/spv/get_tx_list_request.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'BlockSection',
                ])
            ],
        },
        {
            rust: `
            pub struct GetBlocksRequest {
                pub start_block: i64,
                pub end_block: i64,
            }
            `,
            type: "struct",
            no_encode: true,
            output: path.join(__dirname,"cyfs-base-meta/spv/get_blocks_request.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct TxMetaItem {
                pub field_0: String,
                pub field_1: u8,
                pub field_2 : String,
            }
            `,
            type: "struct",
            no_encode: true,
            output: path.join(__dirname,"cyfs-base-meta/spv/tx_meta_data_item.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct TxMetaData {
                pub tx_hash: String,
                pub create_time: String,
                pub nonce : String,
                pub caller: String,
                pub gas_coin_id : u8,
                pub gas_price : u16,
                pub max_fee : u32,
                pub result: u32,
                pub use_fee: u32,
                pub to: Vec<TxMetaItem>
            }
            `,
            type: "struct",
            no_encode: true,
            output: path.join(__dirname,"cyfs-base-meta/spv/tx_meta_data.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'TxMetaItem',
                ])
            ],
        },
        {
            rust: `
            pub struct TxInfo {
                pub status: u8,
                pub tx: TxMetaData,
                pub block_number: Option<String>,
                pub block_hash: Option<String>,
                pub block_create_time: Option<String>,
            }
            `,
            type: "struct",
            no_encode: true,
            output: path.join(__dirname,"cyfs-base-meta/spv/tx_info.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'TxMetaData'
                ])
            ],
        },
        {
            rust: `
            pub struct BlockInfo {
                pub height: i64,
                pub block_hash: String,
                pub create_time: u64,
                pub tx_list: Vec<TxInfo>
            }
            `,
            type: "struct",
            no_encode: true,
            output: path.join(__dirname,"cyfs-base-meta/spv/block_info.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor_inner([
                    'TxInfo'
                ])
            ],
        },
    ];
}

module.exports = {
    code: rust_cyfs_base_meta
};