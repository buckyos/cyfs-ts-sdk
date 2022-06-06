import {Ok, Err, Result, BuckyResult, BuckyError, BuckyErrorCode} from "./results";
import {RawEncode, RawDecode, DecodeBuilder} from "./raw_encode";
import {} from "./buffer";
import {BuckyNumber, BuckyNumberDecoder} from "./bucky_number";
import { base_trace } from "./log";

export enum Protocol {
    Unk = 0,
    Tcp = 1,
    Udp = 2,
}

export class IpAddr implements RawEncode  {
    private tag: number;

    // ip 127.0.0.1  [1:2:3:4:5:6:7:8]
    private constructor(public is_ipv4: boolean, public ip: string) {
        if(is_ipv4){
            this.tag = 0;
        }else{
            this.tag = 1;
        }
    }

    static V4(ip:string):IpAddr{
        return new IpAddr(true, ip);
    }

    static V6(ip:string):IpAddr{
        return new IpAddr(false, ip);
    }

    match<T>(visitor: {
        V4?: (ip: string)=>T,
        V6?: (ip: string)=>T,
    }):T|undefined{
        if(this.is_ipv4){
            return visitor.V4?.(this.ip);
        }else {
            return visitor.V6?.(this.ip);
        }
    }

    toString(): string {
        return `${this.ip}`;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        if (this.is_ipv4) {
            return Ok(1+4);
        } else {
            return Ok(1+16);
        }
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap();

        if (this.is_ipv4) {
            const ips = this.ip.split('.').map(x => parseInt(x, 10));
            for (let i = 0; i < ips.length; i++) {
                buf[i + 1] = ips[i];
                buf = new BuckyNumber('u8', ips[i]).raw_encode(buf).unwrap();
            }
            return Ok(buf);
        } else {
            const ip = this.ip.substr(1, this.ip.length - 2);
            const ips = ip.split(':').map(x => parseInt(x, 10));
            for (let i = 0; i < ips.length; i++) {
                buf[i + 1] = ips[i];
                buf = new BuckyNumber('u16', ips[i]).raw_encode(buf).unwrap();
            }
            return Ok(buf);
        }
    }
}

export class IpAddrDecoder implements RawDecode<IpAddr>{
    raw_decode(buf: Uint8Array): BuckyResult<[IpAddr, Uint8Array]>{
        let tag;
        {
            const r = new BuckyNumberDecoder('u8').raw_decode(buf);
            if(r.err){
                return r;
            }
            [tag, buf] = r.unwrap();
        }

        let is_ipv4;
        if(tag.toNumber()===0){
            is_ipv4 = true;
        }else{
            is_ipv4 = false;
        }

        let ip = '';
        if (is_ipv4) {
            const ips = [];
            for (let i = 0; i < 4; i++) {
                // base_trace('IpAddrDecoder raw_decode', i, buf);
                let n;
                [n, buf] = new BuckyNumberDecoder('u8').raw_decode(buf).unwrap();
                ips.push(n.toNumber());
            }
            ip = ips.join('.');
            const ret: [IpAddr, Uint8Array] = [IpAddr.V4(ip), buf];
            return Ok(ret);
        } else {
            const ips = [];
            for (let i = 0; i < 8; i++) {
                let n;
                [n, buf] = new BuckyNumberDecoder('u16').raw_decode(buf).unwrap();
                ips.push(n.toNumber().toString(16));
            }
            ip = `[${ips.join(':')}]`;
            const ret: [IpAddr, Uint8Array] = [IpAddr.V6(ip), buf];
            return Ok(ret);
        }
    }
}

export class SocketAddr implements RawEncode  {
    // ip 127.0.0.1  [1:2:3:4:5:6:7:8]
    constructor(public is_ipv4: boolean, public ip: string, public port: number) {
    }

    toString(): string {
        return `${this.ip}:${this.port}`;
    }

    static fromString(is_ipv4: boolean, addr: string): BuckyResult<SocketAddr> {
        // ipv6的地址必须是用[]包裹的
        const tokens = addr.split(":");
        if(tokens.length<2){
            return Err(new BuckyError(BuckyErrorCode.InvalidData, "Invalid IP Address:"+addr));
        }

        const port_str = tokens.pop()!;
        const port = parseInt(port_str,10);
        const ip = tokens.join(':');
        if (!is_ipv4 && (ip.indexOf("[") !==0 || ip.indexOf("]") !== ip.length-1)) {
            return Err(new BuckyError(BuckyErrorCode.InvalidData, "Invalid IP Address:"+addr));
        }
        return Ok(new SocketAddr(is_ipv4, ip, port));
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        if (this.is_ipv4) {
            return Ok(2 + 4);
        } else {
            return Ok(2 + 16);
        }
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        if (this.is_ipv4) {
            buf = new BuckyNumber('u16', this.port).raw_encode(buf, true).unwrap();

            const ips = this.ip.split('.').map(x => parseInt(x, 10));
            for (let i = 0; i < ips.length; i++) {
                buf[i + 1] = ips[i];
                buf = new BuckyNumber('u8', ips[i]).raw_encode(buf).unwrap();
            }
            return Ok(buf);
        } else {
            buf = new BuckyNumber('u16', this.port).raw_encode(buf, true).unwrap();
            const ip = this.ip.substr(1, this.ip.length - 2);
            const ips = ip.split(':').map(x => parseInt(x, 16));
            for (let i = 0; i < ips.length; i++) {
                buf[i + 1] = ips[i];
                buf = new BuckyNumber('u16', ips[i]).raw_encode(buf).unwrap();
            }
            return Ok(buf);
        }
    }
}

class SocketAddrDecoder implements RawDecode<SocketAddr>{
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[SocketAddr, Uint8Array]>{
        const is_ipv4: boolean = ctx;
        let port;
        let ip = '';
        [port, buf] = new BuckyNumberDecoder('u16').raw_decode(buf, true).unwrap();
        if (is_ipv4) {
            const ips = [];
            for (let i = 0; i < 4; i++) {
                // base_trace('SocketAddrDecoder raw_decode', i, buf);
                let n;
                [n, buf] = new BuckyNumberDecoder('u8').raw_decode(buf).unwrap();
                ips.push(n.toNumber());
            }
            ip = ips.join('.');
        } else {
            const ips = [];
            for (let i = 0; i < 8; i++) {
                let n;
                [n, buf] = new BuckyNumberDecoder('u16').raw_decode(buf).unwrap();
                ips.push(n.toNumber().toString(16));
            }
            ip = `[${ips.join(':')}]`;
        }
        const ret: [SocketAddr, Uint8Array] = [new SocketAddr(is_ipv4, ip, port.toNumber()), buf];
        return Ok(ret);
    }
}

const ENDPOINT_PROTOCOL_UNK: number = 0;
const ENDPOINT_PROTOCOL_TCP: number	= 1<<1;
const ENDPOINT_PROTOCOL_UDP: number	= 1<<2;

const ENDPOINT_IP_VERSION_4: number	= 1<<3;
const ENDPOINT_IP_VERSION_6: number	= 1<<4;
const ENDPOINT_FLAG_STATIC_WAN: number	= 1<<6;
const ENDPOINT_FLAG_SIGNED: number	= 1<<7;

export class Endpoint implements RawEncode {

    constructor(public is_static_wan: boolean, public protocol: Protocol, public addr: SocketAddr) {
    }

    static fromString(endpoint: string):BuckyResult<Endpoint>{
        let is_static_wan:boolean;
        if(endpoint[0]==='W'){
            is_static_wan = true;
        }else if(endpoint[0]==='L'){
            is_static_wan = false;
        }else{
            return Err(new BuckyError(BuckyErrorCode.UnSupport,"Unknown endpoint type"));
        }

        let is_ipv4:boolean;
        if(endpoint[1]==='4'){
            is_ipv4 = true;
        }else if(endpoint[1]==='6'){
            is_ipv4 = false;
        }else{
            return Err(new BuckyError(BuckyErrorCode.UnSupport,"Unknown endpoint type"));
        }

        let protocol:Protocol;
        const protocol_str = endpoint.substr(2,3);
        if(protocol_str==="tcp"){
            protocol = Protocol.Tcp;
        }else if(protocol_str==="udp"){
            protocol = Protocol.Udp;
        }else if(protocol_str==="unk"){
            protocol = Protocol.Unk;
        }else{
            return Err(new BuckyError(BuckyErrorCode.UnSupport,"Unknown endpoint type"));
        }

        const addr = SocketAddr.fromString(is_ipv4, endpoint.substr(5));
        if(addr.err){
            return addr;
        }

        return Ok(new Endpoint(is_static_wan, protocol, addr.unwrap()));
    }

    toString(): string {
        let ret = '';
        if (this.is_static_wan) {
            ret = 'W';
        } else {
            ret = 'L';
        }
        if (this.addr.is_ipv4) {
            ret += '4';
        } else {
            ret += '6';
        }
        switch (this.protocol) {
            case Protocol.Tcp:
                ret += 'tcp';
                break;
            case Protocol.Udp:
                ret += 'udp';
                break;
            case Protocol.Unk:
                ret += 'unk';
                break;
        }
        return ret + this.addr.toString();
    }

    flag(): number {
        let flag = 0;
        switch(this.protocol) {
            case Protocol.Tcp:
                flag |= ENDPOINT_PROTOCOL_TCP;
                break;
            case Protocol.Udp:
                flag |= ENDPOINT_PROTOCOL_UDP;
                break;
            case Protocol.Unk:
                flag |= ENDPOINT_PROTOCOL_UNK;
                break;
        }

        if (this.is_static_wan) {
            flag |= ENDPOINT_FLAG_STATIC_WAN;
        }

        if (this.addr.is_ipv4) {
            flag |= ENDPOINT_IP_VERSION_4;
        } else {
            flag |= ENDPOINT_IP_VERSION_6;
        }
        base_trace('flag', flag);
        return flag;
    }

    raw_measure(ctx?:any): BuckyResult<number>{
        const n = this.addr.raw_measure().unwrap();
        return Ok(n + 1);
    }

    raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{
        buf = new BuckyNumber('u8', this.flag()).raw_encode(buf).unwrap();
        buf = this.addr.raw_encode(buf, ctx).unwrap();
        return Ok(buf);
    }
}

export class EndPointDecoder implements RawDecode<Endpoint>{
    raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[Endpoint, Uint8Array]>{
        let flag;
        [flag, buf] = new BuckyNumberDecoder('u8').raw_decode(buf).unwrap();

        let socketAddr: SocketAddr;
        if ((flag.toNumber() & ENDPOINT_IP_VERSION_4) > 0) {
            [socketAddr, buf] = new SocketAddrDecoder().raw_decode(buf, true).unwrap();
        } else {
            [socketAddr, buf] = new SocketAddrDecoder().raw_decode(buf, false).unwrap();
        }

        let protocol: Protocol = Protocol.Unk;
        if ((flag.toNumber() & ENDPOINT_PROTOCOL_UNK) > 0) {
            protocol = Protocol.Unk;
        } else if ((flag.toNumber() & ENDPOINT_PROTOCOL_TCP) > 0) {
            protocol = Protocol.Tcp;
        } else if ((flag.toNumber() & ENDPOINT_PROTOCOL_UDP) > 0) {
            protocol = Protocol.Udp;
        }

        const endpoint: Endpoint = new Endpoint((flag.toNumber() & ENDPOINT_FLAG_STATIC_WAN) > 0, protocol, socketAddr);
        const ret: [Endpoint, Uint8Array] = [endpoint, buf];
        return Ok(ret);
    }
}

