import { Err, Ok, BuckyResult, BuckyError, BuckyErrorCode } from "../base/results";
import { RawEncode, RawDecode } from "../base/raw_encode";
import {} from "../base/buffer";
import { BuckyNumber } from "../base/bucky_number";
import {get_area_info} from "../base/world_area";

export class Area implements RawEncode{
    m_country: number;  // u8
    m_carrier: number;  // u8
    m_city: number;     // u16
    m_inner: number;    // u8

    constructor(country: number, carrier: number, city: number, inner: number){
        // (国家编码9bits)+(运营商编码4bits)+城市编码(13bits)+inner(8bits)
        this.m_country = country;    // 9 bits
        this.m_carrier = carrier;     // 4 bits
        this.m_city = city;   // 13 bits
        this.m_inner = inner;         // 8 bits
    }

    get country(): number{
        return  this.m_country;
    }

    get carrier(): number {
        return  this.m_carrier;
    }

    get city():number{
        return this.m_city;
    }

    get inner():number{
        return this.m_inner;
    }

    static default(){
        return new Area(0,0,0,0);
    }

    static from_str(s:string):BuckyResult<Area>{
        const values = s.split(":");
        const array = [];
        for(const value of values){
            const v = parseInt(value, 10);
            array.push(v);
        }
        return Ok(new Area(array[0],array[1],array[2],array[3]));
    }

    clone():Area{
        return new Area(this.country, this.carrier, this.city, this.inner);
    }

    raw_measure(): BuckyResult<number> {
        return Ok(5);
    };

    raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{
        if(buf.length < this.raw_measure().unwrap()) {
            return Err(new BuckyError(BuckyErrorCode.OutOfLimit, "not enough buffer"));
        }

        // reset
        buf[0] = 0;
        buf[1] = 0;
        buf[2] = 0;
        buf[3] = 0;
        buf[4] = 0;

        // (国家编码9bits)+(运营商编码4bits)+城市编码(13bits)+inner(8bits) = 34 bit
        // 此处直接用5个bytes
        buf[0] = this.country;
        buf[1] = this.carrier;
        buf[2] = (this.city >> 8) | (this.country >> 8 << 7);
        buf[3] = (this.city << 8 >> 8)
        buf[4] = this.inner;

        buf = buf.offset(5);

        return Ok(buf);
    }

    get_area_info(): {country_name: string, state_name: string, city_name: string} | null {
        return get_area_info(this.m_country.toString(10), this.m_city.toString(10));
    }

    toString():string {
        return `${this.country}:${this.carrier}:${this.city}:${this.inner}`
    }
}

export class AreaDecoder implements RawDecode<Area> {
    constructor(){
        // ignore
    }

    raw_decode(buf: Uint8Array): BuckyResult<[Area,Uint8Array]>{
        let country = buf[0] | (buf[2] >> 7 << 8);
        let carrier = buf[1];
        let city = ((buf[2]) << 9 >> 1)|(buf[3]);
        let inner = buf[4];;
        buf = buf.offset(5);

        const ret:[Area, Uint8Array] = [new Area(country, carrier, city, inner), buf];

        return Ok(ret);
    }
}
