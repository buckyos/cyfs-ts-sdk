

import { ConstructorFragment, ErrorFragment, EventFragment, FormatTypes, Fragment, FunctionFragment, JsonFragment, JsonFragmentType, ParamType } from "./fragments";
import { AbiCoder, CoerceFunc, defaultAbiCoder } from "./abi-coder";
import { checkResultErrors, Indexed, Interface, LogDescription, EthAbiResult, TransactionDescription } from "./interface";
import { concat } from "@ethersproject/bytes";

export {
    ConstructorFragment,
    ErrorFragment,
    EventFragment,
    Fragment,
    FunctionFragment,
    ParamType,
    FormatTypes,

    AbiCoder,
    defaultAbiCoder,

    Interface,
    Indexed,

    /////////////////////////
    // Types

    CoerceFunc,
    JsonFragment,
    JsonFragmentType,

    EthAbiResult,
    checkResultErrors,

    LogDescription,
    TransactionDescription
};


function fromHex(hex: string): Uint8Array{
    // TODO: nodejs 可优化
    const r = hex.match(/[\da-f]{2}/gi);
    if(r==null){
        throw new Error(`Invalid hex string, can not convert to buffer, hex: ${hex}`);
    }
    return new Uint8Array(r.map((h)=>{
        return parseInt(h, 16)
    }));
}

export function encode_input(abi: string, name_or_signature: string, values: string[]): Uint8Array {
    let contract = new Interface(abi);
    return fromHex(contract.encodeFunctionData(name_or_signature, values));
}

export function encode_constructor(abi: string, code: Uint8Array, values: string[]): Uint8Array {
    let contract = new Interface(abi);
    let deploy_coder = fromHex(contract.encodeDeploy(values));
    return concat([code, deploy_coder]);
}

export function decode_call_output(abi: string, name_or_signature: string, data: Uint8Array): EthAbiResult {
    let contract = new Interface(abi);
    return contract.decodeFunctionResult(name_or_signature, data);
}

export function decode_log(abi: string, name_or_signature: string, topics: string[], data: Uint8Array): EthAbiResult {
    let contract = new Interface(abi);
    return contract.decodeEventLog(name_or_signature, data, topics);
}