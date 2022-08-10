import {pki, jsbn} from 'node-forge'

/**
 * RSA key constructor
 *
 * n - modulus
 * e - publicExponent
 * d - privateExponent
 * p - prime1
 * q - prime2
 * dp - exponent1 -- D mod (P-1)
 * dq - exponent2 -- D mod (Q-1)
 * qinv - coefficient -- Q^-1 mod P
 */

const SMALL_PRIMES_PRODUCT = new jsbn.BigInteger("16294579238595022365")
const SMALL_PRIMES_NUM = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53];

const SMALL_PRIMES: jsbn.BigInteger[] = [];

SMALL_PRIMES_NUM.forEach((value) => {
    SMALL_PRIMES.push(new jsbn.BigInteger(value.toString()))
})

function _toAsciiDigits(buffer: Uint8Array, offset: number) {
    for (let i = offset; i < buffer.length; i++) {
        buffer[i] += 48;
    }
}

/*
 * Performs buffer left bits shift
 */
function _leftShift(buffer: Uint8Array) {
    let carry;
    for (let i = buffer.length; i >= 0; i--) {
        carry = (buffer[i] & 0x80) !== 0;
        buffer[i] = (buffer[i] << 1) & 0xFF;
        if (carry && i >= 0) {
            buffer[i + 1] |= 0x01;
        }
    }
}

/*
     * Finds last head index of the given value in the given buffer
     * Otherwise it returns -1.
     */
function _lastHeadIndex(buffer: Uint8Array, value: number) {
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] !== value) {
            return i;
        }
    }
    return -1;
}

function to_dec_str(buffer: Uint8Array):string {
    let bits = buffer.length * 8,                               // number of bits in the buffer
        lastBit = buffer.length - 1,                            // last bit index
        digits = new Uint8Array(Math.floor(bits / 3 + 1 + 1)),   // createBuffer(Math.floor(bits / 3 + 1 + 1)),    // digits buffer
        lastDigit = digits.length - 1, carry;                   // last digit index, digit index, carry flag

    // reset digits buffer
    digits.fill(0);

    // reverse buffer if not in LE format
    buffer = buffer.reverse()

    for (let i = 0; i < bits; i++) {
        carry = buffer[lastBit] >= 0x80;

        _leftShift(buffer);  // shift buffer bits

        for (let d = lastDigit; d >= 0; d--) {
            digits[d] += digits[d] + (carry ? 1 : 0);
            carry = (digits[d] > 9);
            if (carry) {
                digits[d] -= 10;
            }
        }
    }

    // get rid of leading 0's; reuse d for the first non-zero value index
    let idx = _lastHeadIndex(digits, 0);

    // if there are only 0's use the last digit
    idx = idx >= 0 ? idx : lastDigit;

    // convert numbers to ascii digits
    _toAsciiDigits(digits, idx);

    return new TextDecoder('ascii').decode(digits.slice(idx))
}

export function data_to_biguint(data: Uint8Array): jsbn.BigInteger {
    let uint_num_str = to_dec_str(data);

    return new jsbn.BigInteger(uint_num_str);
}

function gen_prime(rng: any, bit_size: number): jsbn.BigInteger {
    if (bit_size < 2) {
        throw new Error("prime size must be at least 2-bit")
    }

    let b = bit_size % 8;
    if (b === 0) {
        b = 8;
    }

    let bytes_len = Math.floor((bit_size + 7) / 8);

    while(true) {
        let bytes: Uint8Array = rng.getBytesSync(bytes_len);

        // Clear bits in the first byte to make sure the candidate has a size <= bits.
        bytes[0] &= ((1 << b) - 1);

        // Don't let the value be too small, i.e, set the most significant two bits.
        // Setting the top two bits, rather than just the top bit,
        // means that when two of these values are multiplied together,
        // the result isn't ever one bit short.
        if (b >= 2) {
            bytes[0] |= 3 << (b - 2);
        } else {
            // Here b==1, because b cannot be zero.
            bytes[0] |= 1;
            if (bytes_len > 1) {
                bytes[1] |= 0x80;
            }
        }

        // Make the value odd since an even number this large certainly isn't prime.
        bytes[bytes_len - 1] |= 1;

        let p = data_to_biguint(bytes)
        // must always be a u64, as the SMALL_PRIMES_PRODUCT is a u64
        let rem = p.remainder(SMALL_PRIMES_PRODUCT);

        for (let delta = 0; delta < 1 << 20; delta+=2) {
            let m = rem.add(new jsbn.BigInteger(delta.toString()));

            let cont = false;
            for (const prime of SMALL_PRIMES) {
                if (m.remainder(prime).equals(jsbn.BigInteger.ZERO) 
                && (bit_size > 6 || !m.equals(prime))) {
                    cont = true;
                    break;
                }
            }

            if (cont) {
                continue;
            }

            if (delta > 0) {
                p = p.add(new jsbn.BigInteger(delta.toString()))
            }

            break;
        }

        // There is a tiny possibility that, by adding delta, we caused
        // the number to be one bit too long. Thus we check bit length here.
        if ((p.bitLength() == bit_size) && p.isProbablePrime(20)) {
            return p;
        }
    }
}

export function generate_rsa_by_rng(rng: any, bits: number): pki.rsa.PrivateKey {
    let primes: jsbn.BigInteger[] = [];
    let n_final = jsbn.BigInteger.ZERO
    let d_final = jsbn.BigInteger.ZERO

    const nprimes = 2;

    let e = new jsbn.BigInteger((65537).toString())

    while (true) {
        let todo = bits;
        for (const i of [0,1]) {
            primes[i] = gen_prime(rng, Math.floor(todo/(nprimes - i)));
            todo -= primes[i].bitLength();
        }

        if (primes[0].equals(primes[1])) {
            continue;
        }

        let n = jsbn.BigInteger.ONE;
        let totient = jsbn.BigInteger.ONE;

        for (const prime of primes) {
            n = n.multiply(prime);
            totient = totient.multiply(prime.subtract(jsbn.BigInteger.ONE))
        }

        if (n.bitLength() !== bits) {
            continue;
        }

        let d = e.modInverse(totient);
        if (!d.equals(jsbn.BigInteger.ZERO)) {
            n_final = n;
            d_final = d;
            break;
        }
    }

    let p1 = primes[0].subtract(jsbn.BigInteger.ONE);
    let q1 = primes[1].subtract(jsbn.BigInteger.ONE);
    let dp = d_final.remainder(p1)// JSBI.remainder(d_final, p1)
    let dq = d_final.remainder(q1)
    let qinv = primes[1].modInverse(primes[0])
    return pki.rsa.setPrivateKey(n_final, e, d_final, primes[0], primes[1], dp, dq, qinv)
}