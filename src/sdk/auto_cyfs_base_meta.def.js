const fs = require('fs-extra');
const path = require('path');

function rust_cyfs_base_meta(){
    
    const { importor_base, importor, importor_inner } = require('./auto_util');

    return [
        /*
        {
            rust: `
            pub enum NFTDesc {
                FileDesc(FileDesc),
                FileDesc2((FileDesc, Option<ObjectId>)),
                ListDesc(NFTListDesc)
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_desc.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub enum NFTState {
                Normal(void),
                Auctioning((u64, CoinTokenId, u64)),
                Selling((u64, CoinTokenId, u64)),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_state.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NFTCreateTx {
                pub desc: NFTDesc,
                pub name: String,
                pub state: NFTState,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_create_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NFTAuctionTx {
                pub nft_id: ObjectId,
                pub price: u64,
                pub coin_id: CoinTokenId,
                pub duration_block_num: u64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_auction_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NFTBidTx {
                pub nft_id: ObjectId,
                pub price: u64,
                pub coin_id: CoinTokenId,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_bid_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NFTBuyTx {
                pub nft_id: ObjectId,
                pub price: u64,
                pub coin_id: CoinTokenId,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_buy_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NFTSellTx {
                pub nft_id: ObjectId,
                pub price: u64,
                pub coin_id: CoinTokenId,
                pub duration_block_num: u64,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_sell_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NFTSellTx2 {
                pub nft_id: ObjectId,
                pub price: u64,
                pub coin_id: CoinTokenId,
                pub sub_sell_infos: Vec<(CoinTokenId, u64)>
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_sell_tx2.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NFTCancelSellTx {
                pub nft_id: ObjectId,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_cancel_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NFTApplyBuyTx {
                pub nft_id: ObjectId,
                pub price: u64,
                pub coin_id: CoinTokenId,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_apply_buy_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NFTCancelApplyBuyTx {
                pub nft_id: ObjectId,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_cancel_apply_buy_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NFTAgreeApplyTx {
                pub nft_id: ObjectId,
                pub user_id: ObjectId,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_agree_apply_buy_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NFTLikeTx {
                pub nft_id: ObjectId,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_like_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NFTSetNameTx {
                pub nft_id: ObjectId,
                pub name: String,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_set_name_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
            ],
        },
        {
            rust: `
            pub struct NFTTransTx {
                pub nft_id: ObjectId,
                pub to: ObjectId,
                pub nft_cached: Option<ObjectId>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base-meta/tx/nft_trans_tx.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
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
                WithdrawToOwner(WithdrawToOwner),
                CreateMinerGroup(MinerGroup),
                UpdateMinerGroup(MinerGroup),
                CreateSubChainAccount(MinerGroup),
                UpdateSubChainAccount(MinerGroup),
                SubChainWithdraw(SubChainWithdrawTx),
                WithdrawFromSubChain(WithdrawFromSubChainTx),
                SubChainCoinageRecord(SubChainCoinageRecordTx),
                Extension(MetaExtensionTx),
                CreateContract(CreateContractTx),
                CreateContract2(CreateContract2Tx),
                CallContract(CallContractTx),
                SetBenefi(SetBenefiTx),
                NFTCreate(NFTCreateTx),
                NFTAuction(NFTAuctionTx),
                NFTBid(NFTBidTx),
                NFTBuy(NFTBuyTx),
                NFTSell(NFTSellTx),
                NFTApplyBuy(NFTApplyBuyTx),
                NFTCancelApplyBuyTx(NFTCancelApplyBuyTx),
                NFTAgreeApply(NFTAgreeApplyTx),
                NFTLike(NFTLikeTx),
                NFTCancelSellTx(NFTCancelSellTx),
                NFTSetNameTx(NFTSetNameTx),
                NFTCreate2(NFTCreateTx2),
                NFTSell2(NFTSellTx2),
                NFTTrans(NFTTransTx),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base-meta/tx/meta_tx_body.ts"),
            depends:[
                importor_base('../../cyfs-base/'),
                importor([
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
                ], ".")
            ],
        },
        */
    ];
}

module.exports = {
    code: rust_cyfs_base_meta
};