//
// 在此添加对象的扩展方法，该文件只会生成一次，不会被 auto.js 覆盖
//

import { BuckyResult, Ok, PublicKey } from '../../cyfs-base';
import { Tx, TxBodyContent, TxId } from './tx'

export class TxExt {
    constructor(public obj: Tx){
        // TODO:
    }

    tx_id():TxId{
        return TxId.try_from_object_id(this.obj.desc().calculate_id()).unwrap();
    }

    connect_info(): TxBodyContent {
        return this.obj.body_expect().content();
    }

    async verify_signature(public_key: PublicKey): Promise<BuckyResult<boolean>> {
        // 调用方法的 ext() 获取其扩展对象的方法
        if(this.obj.desc().content().caller.ext().is_miner()) {
            return Ok(true);
        }
        const desc_signs = this.obj.signs().desc_signs();
        if(desc_signs.is_none()) {
            return Ok(false);
        }

        const signs = desc_signs.unwrap();
        if(signs.length === 0) {
            return Ok(false);
        }

        // TODO(wuguoren):
        // const sign = signs[0];
        // let verifier = RsaCPUObjectVerifier::new(public_key);
        // async_std::task::block_on( verify_object_desc_sign(&verifier, self, sign))

        return Ok(true);
    }

    async sign(/*secret: PrivateKey*/): Promise<BuckyResult<number>> {

        // TODO(wuguoren):
        // let signer = RsaCPUObjectSigner::new(secret.public(), secret.clone());
        // async_std::task::block_on(sign_and_set_named_object(&signer, self, &SignatureSource::RefIndex(0)))

        return Ok(0);
    }
}
