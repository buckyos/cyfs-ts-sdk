import { BuckyError, BuckyErrorCode, BuckyResult, Err, Ok } from "../cyfs-base";

const HARDENED_BIT = 1 << 31;

export class ChildNumber {
    constructor(public number: number) {}

    is_hardened(): boolean {
		return (this.number & HARDENED_BIT) === HARDENED_BIT
	}

	is_normal(): boolean {
		return (this.number & HARDENED_BIT) === 0
	}

	to_bytes(): Uint8Array {
        let arr = new Uint8Array(4);
        let view = arr.offsetView(0);
        view.setUint32(0, this.number, false);
        return arr;
	}

    static from_str(child: string): BuckyResult<ChildNumber> {
        let mask = 0;
        if (child.endsWith("'")) {
            child = child.substring(0, child.length-1);
            mask = HARDENED_BIT
        }

        let index;
        try {
            index = parseInt(child);
        } catch (error) {
            let msg = `parse child error: child=${child}, err=${error}`
            console.log(msg)
            return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }
    

        if ((index & HARDENED_BIT) === 0) {
            return Ok(new ChildNumber(index | mask))
        } else {
			let msg = `invalid child: child=${child}, index=${index}`
			console.error(msg);

			return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg))
        }
    }
}

export class DerivationPath {
    constructor(public path: ChildNumber[]) {}

    static from_str(path: string): BuckyResult<DerivationPath> {
        let spath = path.split("/");
        if (spath[0] !== "m") {
            let msg = `invalid path format: path=${path}`
			console.error(msg);

			return Err(new BuckyError(BuckyErrorCode.InvalidFormat, msg));
        }

        let paths = [];
        for (const path of spath.slice(1)) {
            let p = ChildNumber.from_str(path)
            if (p.err) {
                return p;
            }
            paths.push(p.unwrap())
        }

        return Ok(new DerivationPath(paths))
    }
}