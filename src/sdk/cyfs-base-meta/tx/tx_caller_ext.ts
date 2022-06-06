//
// 在此添加对象的扩展方法，该文件只会生成一次，不会被 auto.js 覆盖
//

import { BuckyError, BuckyErrorCode, BuckyResult, Err, ObjectId, Ok, PublicKey } from '../../cyfs-base';
import { TxCaller } from './tx_caller'

export class TxCallerExt {
    constructor(public obj: TxCaller){
        // TODO:
    }

    id(): BuckyResult<ObjectId> {
        const id:ObjectId = this.obj.match({
            People: (desc) => {
                return desc.calculate_id()
            },
            Device: (desc) => {
                return desc.calculate_id()
            },
            Group: (desc) => {
                return desc.calculate_id()
            },
            Union: (desc) => {
                return desc.calculate_id()
            },
            Miner: (_id) => {
                return _id.clone()
            },
            Id: (_id) => {
                return _id.clone()
            }
        })!;

        return Ok(id);
    }

    get_public_key(): BuckyResult<PublicKey> {
        const public_key = this.obj.match({
            People: (desc) => {
                return desc.public_key();
            },
            Device: (desc) => {
                return desc.public_key();
            },

            // 不需要的分支直接不提供 match 分支即可
            // Group: (_desc) => {
            //     return Err(new BuckyError(BuckyErrorCode.Failed, "Failed"))
            // },
            // Union: (_desc) => {
            //     return Err(new BuckyError(BuckyErrorCode.Failed, "Failed"))
            // },
            // Miner: (_) => {
            //     return Err(new BuckyError(BuckyErrorCode.Failed, "Failed"))
            // },
            // Id: (_) => {
            //     return Err(new BuckyError(BuckyErrorCode.Failed, "Failed"))
            // }
        });

        if(public_key){
            return Ok(public_key);
        }else{
            return Err(new BuckyError(BuckyErrorCode.Failed, "Failed"))
        }
    }

    is_miner(): boolean {
        const ret = this.obj.match({
            Miner: (_) => {
                return true;
            }
        });
        return ret ? ret : false;
    }
}
