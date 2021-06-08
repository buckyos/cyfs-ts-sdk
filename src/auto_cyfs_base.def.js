const fs = require('fs-extra');
const path = require('path');

function rust_cyfs_base(){

    const { importor_base, importor } = require('./auto_util');

    return [
        {
            rust: `
            pub enum NameState {
                Normal(void),
                Lock(void),
                Auction(void),
                ArrearsAuction(void),
                ArrearsAuctionWait(void),
                ActiveAuction(void),
            }
            `,
            type: "enum",
            no_encode: true,
            output: path.join(__dirname,"cyfs-base/name/name_state.ts"),
            depends:[
                importor_base('../'),
            ]
        },

        // proof_of_service
        {
            rust: `
            pub struct TrafficContract {
                pub price_per_kbytes : u32,
                pub avg_ping_ms : Option<u16>,
                pub max_up_bytes : Option<u64>,
                pub max_up_speed : Option<u32>,
                pub min_up_speed : Option<u32>,
                pub max_down_bytes : Option<u64>,
                pub max_down_speed : Option<u32>,
                pub min_down_speed : Option<u32>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/traffic_contract.ts"),
            depends:[
                importor_base('../../'),
            ]
        },
        {
            rust: `
            pub struct ChunkTransContract{
                pub price_per_kbytes : u32,
                pub obj_list : Option<Vec<ObjectId>>,
                pub min_speed : Option<u32>,
                pub max_speed : Option<u32>,
                pub avg_speed : Option<u32>,
                pub max_bytes : Option<u64>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/chunk_trans_contract.ts"),
            depends:[
                importor_base('../../'),
            ]
        },
        {
            rust: `
            pub enum ServiceContractBody {
                Traffic(TrafficContract),
                ChunkTrans(ChunkTransContract),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/service_contract_body.ts"),
            depends:[
                importor_base('../../'),
                importor(['TrafficContract', 'TrafficContractDecoder'], './traffic_contract'),
                importor(['ChunkTransContract', 'ChunkTransContractDecoder'], './chunk_trans_contract'),
            ]
        },
        {
            rust: `
            pub struct SNReceipt {
                pub ping_count : Option<u32>,
                pub called_count : Option<u32>,
                pub success_called_count : Option<u32>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/sn_receipt.ts"),
            depends:[
                importor_base('../../'),
            ]
        },
        {
            rust: `
            pub struct TrafficReceipt {
                pub up_bytes : u64,
                pub down_bytes : u64,
                pub total_package : u64,
                pub max_speed : Option<u32>,
                pub min_speed : Option<u32>,
                pub avg_ping_ms : Option<u16>,
                pub stream_count : Option<u32>,
                pub failed_stream_count : Option<u32>,
                pub break_stream_count : Option<u32>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/traffic_receipt.ts"),
            depends:[
                importor_base('../../'),
            ]
        },
        {
            rust: `
            pub struct ChunkTransReceipt {
                pub chunk_id : ChunkId,
                pub crypto_chunk_id : ChunkId,
                pub valid_length : Option<u64>,
                pub max_speed : Option<u32>,
                pub min_speed : Option<u32>,
                pub crypto_key : Option<u64>,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/chunk_trans_receipt.ts"),
            depends:[
                importor_base('../../'),
                importor(['ChunkId', 'ChunkIdDecoder'], '../../objects/chunk'),
            ]
        },
        {
            rust: `
            pub struct DSGReceipt {

            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/dsg_receipt.ts"),
            depends:[
                importor_base('../../'),
            ]
        },
        {
            rust: `
            pub enum ServiceReceiptBody {
                SN(SNReceipt),
                Traffic(TrafficReceipt),
                ChunkTrans(ChunkTransReceipt),
                DSG(DSGReceipt),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/service_receipt_body.ts"),
            depends:[
                importor_base('../../'),
                importor(['SNReceipt', 'SNReceiptDecoder'], './sn_receipt'),
                importor(['TrafficReceipt', 'TrafficReceiptDecoder'], './traffic_receipt'),
                importor(['ChunkTransReceipt', 'ChunkTransReceiptDecoder'], './chunk_trans_receipt'),
                importor(['DSGReceipt', 'DSGReceiptDecoder'], './dsg_receipt'),
            ],
        },
        {
            rust: `
            pub struct ServiceReceipt {
                customer : ObjectId,
                service_type : u32,
                service_start : u64,
                service_end : u64,
                receipt_body : ServiceReceiptBody
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/service_receipt.ts"),
            depends:[
                importor_base('../../'),
                importor(['ServiceReceiptBody', 'ServiceReceiptBodyDecoder'], './service_receipt_body'),
            ],
        },
        {
            rust: `
            pub enum Service {
                Contract(ServiceContract),
                Receipt(ServiceReceipt),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/service.ts"),
            base: '../../',
            depends:[
                importor_base('../../'),
                importor(['ServiceContract', 'ServiceContractDecoder'], './service_contract'),
                importor(['ServiceReceipt', 'ServiceReceiptDecoder'], './service_receipt'),
            ],
        },
        {
            rust: `
            pub struct ServiceContract {
                buyer : ObjectId,
                seller : ObjectId,
                customer : Option<ObjectId>,
                service_type : u32,
                service_start : u64,
                service_end : u64,
                coin_id : Option<u8>,
                total_price : Option<u64>,
                advance_payment : Option<u64>,
                contract_body : ServiceContractBody,
            }
            `,
            type: "struct",
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/service_contract.ts"),
            depends:[
                importor_base('../../'),
                importor(['ServiceContractBody', 'ServiceContractBodyDecoder'], './service_contract_body'),
            ],
        },
        {
            rust: `
            pub enum SnServiceReceiptVersion {
                Invalid(void),
                Current(void),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/sn_service_receipt_version.ts"),
            depends:[
                importor_base('../../'),
            ],
        },
        {
            rust: `
            pub enum SnServiceGrade {
                None(void),
                Discard(void),
                Passable(void),
                Normal(void),
                Fine(void),
                Wonderfull(void),
            }
            `,
            type: "enum",
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/sn_service_grade.ts"),
            depends:[
                importor_base('../../'),
            ],
        },
        {
            rust: `
            pub struct ProofOfSNService {
                pub version: SnServiceReceiptVersion,
                pub grade: SnServiceGrade,
                pub rto: u64,
                pub duration: u64,
                pub start_time: u64,
                pub ping_count: u64,
                pub ping_resp_count: u64,
                pub called_count: u64,
                pub call_peer_count: u64,
                pub connect_peer_count: u64,
                pub call_delay: u64,
            }
            `,
            type: "struct",
            use_ext: true,
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/proof_of_sn_service.ts"),
            depends:[
                importor_base('../../'),
                importor(['SnServiceReceiptVersion', 'SnServiceReceiptVersionDecoder'], './sn_service_receipt_version'),
                importor(['SnServiceGrade', 'SnServiceGradeDecoder'], './sn_service_grade'),
            ]
        },
        {
            rust: `
            pub struct ProofOfDSG {

            }
            `,
            type: "struct",
            use_ext: true,
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/proof_of_dsg.ts"),
            depends:[
                importor_base('../../'),
            ]
        },
        {
            rust: `
            pub enum ProofTypeCode {
                DSGStorage(void),
                DSGStorageCheck(void),
                DSGMerkleProof(void),
            }
            `,
            type: "enum",
            use_ext: true,
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/proof_type_code.ts"),
            depends:[
                importor_base('../../'),
            ]
        },
        {
            rust: `
            pub struct ProofData {
                data: Vec<u8>,
            }
            `,
            type: "struct",
            use_ext: true,
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/proof_data.ts"),
            depends:[
                importor_base('../../'),
            ]
        },
        {
            obj_name: "ProofOfService",
            obj_type: "ObjectTypeCode",
            obj_type_def: "../object_type_info",
            sub_desc_type:{
                owner_type: "option",
                area_type: "disable",
                author_type: "disable",
                key_type: "disable",
            },
            desc_content:`
            pub struct ProofOfServiceDescContent {
                pub proof_type: ProofTypeCode,
                pub data: ProofData
            }
            `,
            body_content:`
            pub struct ProofOfServiceBodyContent {
                pub data: ProofData
            }
            `,
            type: "obj",
            use_ext: true,
            output: path.join(__dirname,"cyfs-base/objects/proof_of_service/proof_of_service.ts"),
            depends:[
                importor_base('../../'),
                importor(['ProofData', 'ProofDataDecoder'], './proof_data'),
                importor(['ProofTypeCode', 'ProofTypeCodeDecoder'], './proof_type_code'),
            ]
        },
    ];
}

module.exports = {
    code: rust_cyfs_base
};