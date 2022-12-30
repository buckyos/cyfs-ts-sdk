/*****************************************************
 * This code is auto generated from auto.js
 * Please DO NOT MODIFY this file
 * author: weiqiushi@buckyos.com
 *****************************************************/


import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../../cyfs-base/base/results";
import { OptionEncoder, } from "../../cyfs-base/base/option";
import { BuckyNumber, BuckyNumberDecoder } from "../../cyfs-base/base/bucky_number";
import { RawDecode, RawEncode } from "../../cyfs-base/base/raw_encode";
import { ObjectId, ObjectIdDecoder } from "../../cyfs-base/objects/object_id";
import { BuckyTuple, BuckyTupleDecoder, FileDesc, FileDescDecoder, OptionDecoder } from "../../cyfs-base";
import { NFTListDesc, NFTListDescContentDecoder, NFTListDescDecoder } from "../../cyfs-core";

export class NFTDesc implements RawEncode {
    private readonly tag: number;
    private constructor(
        private filedesc?: FileDesc,
        private filedesc2?: [FileDesc, ObjectId|undefined],
        private listdesc?: NFTListDesc,
    ) {
        if (filedesc) {
            this.tag = 0;
        } else if (filedesc2) {
            this.tag = 1;
        } else if (listdesc) {
            this.tag = 2;
        } else {
            this.tag = -1;
        }
    }

    static FileDesc(filedesc: FileDesc): NFTDesc {
        return new NFTDesc(filedesc);
    }

    static FileDesc2(filedesc2: [FileDesc, ObjectId|undefined]): NFTDesc {
        return new NFTDesc(undefined, filedesc2);
    }

    static ListDesc(listdesc: NFTListDesc): NFTDesc {
        return new NFTDesc(undefined, undefined, listdesc);
    }

    match<T>(visitor: {
        FileDesc?: (filedesc: FileDesc) => T,
        FileDesc2?: (filedesc2: [FileDesc, ObjectId|undefined]) => T,
        ListDesc?: (listdesc: NFTListDesc) => T,
    }):T|undefined{
        switch(this.tag) {
            case 0: return visitor.FileDesc?.(this.filedesc!);
            case 1: return visitor.FileDesc2?.(this.filedesc2!);
            case 2: return visitor.ListDesc?.(this.listdesc!);
            default: break;
        }
    }

    eq_type(rhs: NFTDesc): boolean {
        return this.tag===rhs.tag;
    }

    raw_measure(ctx?: any): BuckyResult<number> {
        let size = 0;
        size += 1; // tag
        size += this.match({
            FileDesc:(filedesc) => { return filedesc.raw_measure().unwrap();},
            FileDesc2:(filedesc2) => {
                return new BuckyTuple([filedesc2[0], OptionEncoder.from(filedesc2[1])]).raw_measure().unwrap()
            },
            ListDesc:(listdesc) => { return listdesc.raw_measure().unwrap();},
        })!;
        return Ok(size);
    }

    raw_encode(buf: Uint8Array, ctx?: any): BuckyResult<Uint8Array> {
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag
        buf = this.match({
            FileDesc:(filedesc) => {return filedesc.raw_encode(buf).unwrap();},
            FileDesc2:(filedesc2) => {
                return new BuckyTuple([filedesc2[0], OptionEncoder.from(filedesc2[1])]).raw_encode(buf, ctx).unwrap();
            },
            ListDesc:(listdesc) => {return listdesc.raw_encode(buf).unwrap();},
        })!;
        return Ok(buf);
    }
}

export class NFTDescDecoder implements RawDecode<NFTDesc> {
    raw_decode(buf: Uint8Array, ctx?: any): BuckyResult<[NFTDesc, Uint8Array]> {
        let tag;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if (r.err) {
                return r;
            }
            [tag, buf] = r.unwrap();
        }

        switch(tag.toNumber()) {
            case 0:{
                const r = new FileDescDecoder().raw_decode(buf);
                if (r.err) {
                    return r;
                }
                let filedesc;
                [filedesc, buf] = r.unwrap();
                const ret: [NFTDesc, Uint8Array] =  [NFTDesc.FileDesc(filedesc), buf];
                return Ok(ret);
            }
            case 1:{
                const r = new BuckyTupleDecoder([new FileDescDecoder(), new OptionDecoder(new ObjectIdDecoder())]).raw_decode(buf)
                if (r.err) {
                    return r;
                }
                let filedesc2;
                [filedesc2, buf] = r.unwrap();
                const ret: [NFTDesc, Uint8Array] =  [NFTDesc.FileDesc2([filedesc2.index(0), filedesc2.index<ObjectId>(1)]), buf];
                return Ok(ret);
            }
            case 2:{
                const r = new NFTListDescDecoder(new NFTListDescContentDecoder()).raw_decode(buf);
                if (r.err) {
                    return r;
                }
                let listdesc;
                [listdesc, buf] = r.unwrap();
                const ret: [NFTDesc, Uint8Array] =  [NFTDesc.ListDesc(listdesc), buf];
                return Ok(ret);
            }
            default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));
        }
    }

}
