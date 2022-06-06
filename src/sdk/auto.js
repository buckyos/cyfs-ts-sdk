const fs = require('fs-extra');
const path = require('path');
const child_process = require('child_process');

function author(){
    return [
        [
            'f', 'a', 'n', 'f', 'e',
            'i', 'l', 'o', 'n', 'g',
            '@', 'b', 'u', 'c', 'k',
            'y', 'o', 's', '.', 'c',
            'o', 'm'
        ],

        // 欢迎贡献:

    ].map(i=>i.join('')).join(', ');
}


function author_public(){
    return [
        [
            'f', 'a', 'n', 'f', 'e',
            'i', 'l', 'o', 'n', 'g',
            '@', 'o', 'u', 't', 'l',
            'o', 'o', 'k', '.', 'c',
            'o', 'm'
        ],

        // 欢迎贡献:
        
    ].map(i=>i.join('')).join(', ');
}

function emit(visit, functor){
    return (code)=>{
        const r = functor(code);
        if(r.err){
            return r;
        }
        if(visit){
            visit(r);
        }
        return r;
    }
}


function seq(...argv){
    return (code)=>{
        if(argv.length===0){
            return {
                err: 0,
                code,
                name: 'seq',
                group: []
            }
        }

        const results = [];
        let rest = code;
        for(const arg of argv){
            // console.log("rest:", rest, argv.length);
            const r = arg(rest);
            if(r.err){
                return r;
            }
            rest = r.code;
            results.push(r);
        }
        // console.log('xxx');

        if(results.length>0){
            return results[results.length-1];
        }else{
            return {
                err: 1,
                name: 'seq',
                group: results
            }
        }
    };
}

function star(functor, visit){
    return (code)=>{
        let results = [];
        let r = functor(code);
        while(r.err===0){
            results.push(r);
            r = functor(r.code);
        }

        if(visit){
            visit(results);
        }

        if(results.length===0){
            return {
                err: 0,
                code,
                group: []
            }
        }else{
            return {
                err: 0,
                code: results[results.length-1].code,
                group: results
            }
        }
    }
}

function plus(functor, visit){
    return (code)=>{
        let results = [];
        let r = functor(code);
        while(r.err!==0){
            results.push(r);
            r = functor(r.code);
        }

        if(visit){
            visit(results);
        }

        if(results.length===0){
            return {
                err: 1,
            }
        }else{
            return {
                err: 0,
                code: results[results.length-1].code,
                group: results
            }
        }
    }
}

function question(functor, visit){
    return (code)=>{
        let r = functor(code);
        if(r.err){
            return {
                err: 0,
                code,
                group: []
            }
        }

        if(visit){
            visit(r);
        }

        return {
            err: 0,
            code: r.code,
            group:[
                r
            ]
        }
    }
}

function spaces(count, visit){
    const name = spaces.name;
    return emit(visit, (code)=>{
        let i=0;
        let real_count = 0;
        const values = [' ', '\t', '\b',];
        while( i<code.length ){
            const c = code[i];
            if( values.indexOf(c) < 0 ){
                break;
            }else{
                i +=1 ;
                real_count += 1;
            }
        }

        let err;
        if(count==='*'){
            err = 0;
        }else if(count==="?"){
            err = real_count>=1 ? 0 : 1;
            i = 1;
        }else if(count==="+"){
            err = real_count>=1 ? 0 : 1;
        }else if(count===real_count){
            err = 0;
        }else if(count!=null){
            err = 1;
            i = 0;
        }else{
            err = real_count>0 ? 0 : 1;
        }
        return {err, code: code.slice(i), name};
    });
}

function balance(l, r, visit){
    const name = identity.name;
    return emit(visit, (code)=>{
        const once = (rest)=>{
            let i=0;
            let values = [];
            let stack = 0;
            let start = false;
            while(i<rest.length){
                let c = rest[i];
                values.push(c);
                i+=1;
    
                if(c===l){
                    start = true;
                    stack +=1;
                }else{
                    if(!start){
                        return {
                            err: 1,
                        };
                    }
                    if(c===r){
                        stack -=1;
                        if(stack===0){
                            return {
                                err: 0,
                                i,
                                code: code.slice(i),
                                id: values.join(''),
                            }
                        }
                    }else {
                        // ignore
                    }
                }
            }
            return {
                err: 1
            }
        }

        let v = once(code);
        if(v.id.length>0){
            return {err:0, code: v.code, i: v.i, id: v.id, name};
        }else{
            return {err:1, code, name};
        }
    });
}

function identity(visit, excludes){
    const name = identity.name;
    return emit(visit, (code)=>{
        let i=0;
        let values = [' ', '\t', '\b', ',', ':'];
        if(excludes){
            values = [...values, ...excludes];
        }
        let id = [];
        while(i<code.length){
            let c = code[i];

            // test balance
            if(values.indexOf(c)>=0){
                break;
            }else if(c==='<'){
                console.log(code.slice(i));
                const r = balance('<','>')(code.slice(i));
                if(r.err){
                    return r;
                }else{
                    id.push(r.id);
                    i += r.i;
                }
            }
            else if(c==='('){
                const r = balance('(',')')(code.slice(i));
                if(r.err){
                    return r;
                }else{
                    id.push(r.id);
                    code = r.code;
                    i += r.i;
                }
            }
            else{
                i += 1;
                id.push(c);
            }
        }

        if(id.length>0){
            return {err:0, code: code.slice(i), id: id.join(''), name};
        }else{
            return {err:1, code, name};
        }
    });
}

function tuple(visit){
    const name = identity.name;
    return emit(visit, (code)=>{
        let i=0;
        const values = [' ', '\t', '\b'];
        let tag = [];
        let tag_type;
        while(i<code.length){
            let c = code[i];

            // test balance
            if(values.indexOf(c)>=0){
                i +=1;
            }else if(c==='('){
                const r = balance('(',')')(code.slice(i));
                if(r.err){
                    return r;
                }else{
                    tag_type = r.id.slice(1, r.id.length-1);
                    code = r.code;
                    i += r.i;
                    break;
                }
            }else{
                tag.push(c);
                i += 1;
            }
        }

        if(tag.length>0){
            return {err:0, code: code.slice(i), tag: tag.join(''), tag_type, name};
        }else{
            return {err:1, code, name};
        }
    });
}

function left(visit){
    const name = left.name;
    return emit(visit, (code)=>{
        if(code.startsWith('{')){
            return {err: 0, code:code.slice(1), name};
        }else{
            return {err: 1, code, name};
        }
    });
}

function colon(visit){
    const name = colon.name;
    return emit(visit, (code)=>{
        if(code.startsWith(':')){
            return {err: 0, code:code.slice(1), name};
        }else{
            return {err: 1, code, name};
        }
    });
}

function comma(visit){
    const name = comma.name;
    return emit(visit, (code)=>{
        if(code.startsWith(',')){
            return {err: 0, code:code.slice(1), name};
        }else{
            return {err: 1, code, name};
        }
    });
}

function right(visit){
    const name = right.name;
    return emit(visit, (code)=>{
        if(code.startsWith('}')){
            return {err: 0, code:code.slice(1), name};
        }else{
            return {err: 1, code, name};
        }
    });
}

function pub(visit){
    const name = pub.name;
    return emit(visit, (code)=>{
        if(code.startsWith('pub')){
            return {err: 0, token: 'pub', code: code.slice(3), name};
        }else{
            return {err: 1, code, name};
        }
    });
}

function struct(visit){
    const name = struct.name;
    return emit(visit, (code)=>{
        if(code.startsWith('struct')){
            return {err: 0, code: code.slice(6), name};
        }else{
            return {err: 1, code, name};
        }
    });
}

function enum_(visit){
    const name = 'enum';
    return emit(visit, (code)=>{
        console.log(code);
        if(code.startsWith('enum')){
            return {err: 0, code: code.slice(4), name};
        }else{
            return {err: 1, code, name};
        }
    });
}

function vec(code){
    if(!code.startsWith('Vec<')){
        return {
            err: 1
        }
    }

    console.log(code);
    code = code.slice(3);
    
    const r = balance('<','>')(code);
    if(r.err){
        return r;
    }
    let type = `Vec${r.id}`;

    const inner = r.id.slice(1, r.id.length-1);

    console.log("inner:", inner);
    const inner_type = ts_type(inner);
    if(inner_type.err){
        return inner_type;
    }

    if(inner.trim()==='u8'){
        return {
            err: 0,
            code: r.code,
            typeid: 'buffer',
            type: 'Uint8Array',
            inner_type,
        };
    }else{
        return {
            err: 0,
            code: r.code,
            typeid: 'vec',
            type: `${inner_type.type}[]`,
            inner_type,
        };
    }
}

function key(code){
    let pre = [];
    let i = 0;
    let inner_type_code;

    // console.log(i, code.length);
    while(i<code.length){
        let c = code[i];
        if(c!=='<'){
            if(c===','){
                i+=1;

                let inner_type;
                if(inner_type_code!=null){
                    console.log("inner_type_code:", inner_type_code);
                    inner_type = ts_type(inner_type_code);
                    if(inner_type.err){
                        return inner_type;
                    }
                }
                

                let key_type = ts_type(pre.join(''));
                if(key_type.err){
                    return key_type;
                }

                key_type.inner_type = inner_type;
                key_type.code = code.slice(i);

                return key_type;

                // return {
                //     err: 0,
                //     code: code.slice(i),
                //     typeid: 'key',
                //     type: pre.join(''),
                //     inner_type
                // }
            }else{
                pre.push(c);
                i+=1;
            }
        }else{
            const r = balance('<','>')(code.slice(i));
            if(r.err){
                return r;
            }
            inner_type_code = pre.join('')+r.id;
            pre.push(r.id)
            i += r.i;
        }
    }
    // console.log('xx:', pre);
}

function value(code){
    let pre = [];
    let i = 0;
    let inner_type_code;
    while(i<code.length){
        let c = code[i];
        
        if(c==='>'){
            i+=1;
            break;
        }else if(c!=='<'){
            pre.push(c);
            i+=1;
        }else{
            const r = balance('<','>')(code.slice(i));
            if(r.err){
                return r;
            }
            inner_type_code = pre.join('')+r.id;
            pre.push(r.id);
            i += r.i;
            break;
        }
    }

    let inner_type;
    if(inner_type_code!=null){
        inner_type = ts_type(inner_type_code);
        if(inner_type.err){
            return inner_type;
        }
    }

    let value_type = ts_type(pre.join(''));
    if(value_type.err){
        return value_type;
    }
    value_type.code = code.slice(i);
    value_type.inner_type = inner_type;

    return value_type;
    // return {
    //     err: 0,
    //     code: code.slice(i),
    //     typeid: 'value',
    //     type: pre.join(''),
    //     inner_type
    // }
}

function hashmap(code){
    if(!code.startsWith('HashMap<')){
        return {
            err: 1
        }
    }

    code = code.slice(7);
    
    const r = balance('<','>')(code);
    if(r.err){
        return r;
    }
    // let type = `Map${r.id}`;
    let type_code = r.code;

    code = r.id.slice(1);

    // console.log("parse key:", code);
    const key_type = key(code);
    if(key_type.err){
        return key_type;
    }
    // console.log('key_type:', key_type);
    
    code = key_type.code;
    // console.log("parse value:", code);
    const value_type = value(code);
    if(value_type.err){
        return value_type;
    }
    // console.log('value_type:', value_type);

    return {
        err: 0,
        code: type_code,
        typeid: 'map',
        type: `Map<${key_type.type}, ${value_type.type}>`,
        key_type,
        value_type
    };
}

function option(code){
    if(!code.startsWith('Option<')){
        return {
            err: 1
        }
    }

    code = code.slice(6);
    
    const r = balance('<','>')(code);
    if(r.err){
        return r;
    }
    

    const inner = r.id.slice(1, r.id.length-1);

    const inner_type = ts_type(inner);
    if(inner_type.err){
        return inner_type;
    }

    let type = `Option<${inner_type.type}>`;

    return {
        err: 0,
        code: r.code,
        typeid: 'option',
        type: type,
        inner_type,
    };
}

function string(code){
    if(!code.startsWith('String')){
        return {
            err: 1
        }
    }

    return {
        err: 0,
        code: code.slice(6),
        typeid: 'string',
        type: 'string',
    }
}

function number(code){
    if(code.startsWith('i8')){
        return {
            err: 0,
            code: code.slice(2),
            typeid: 'number',
            subtypeid: 'i8',
            is_big_int: false,
            type: 'number',
        }
    }else if(code.startsWith('i16')){
        return {
            err: 0,
            code: code.slice(3),
            typeid: 'number',
            subtypeid: 'i16',
            is_big_int: false,
            type: 'number',
        }
    }else if(code.startsWith('i32')){
        return {
            err: 0,
            code: code.slice(3),
            typeid: 'number',
            subtypeid: 'i32',
            is_big_int: false,
            type: 'number',
        }
    }else if(code.startsWith('i64')){
        return {
            err: 0,
            code: code.slice(3),
            typeid: 'number',
            subtypeid: 'i64',
            is_big_int: true,
            type: 'bigint',
        }
    }else if(code.startsWith('u8')){
        return {
            err: 0,
            code: code.slice(2),
            typeid: 'number',
            subtypeid: 'u8',
            is_big_int: false,
            type: 'number',
        }
    }else if(code.startsWith('u16')){
        return {
            err: 0,
            code: code.slice(3),
            typeid: 'number',
            subtypeid: 'u16',
            is_big_int: false,
            type: 'number',
        }
    }else if(code.startsWith('u32')){
        return {
            err: 0,
            code: code.slice(3),
            typeid: 'number',
            subtypeid: 'u32',
            is_big_int: false,
            type: 'number',
        }
    }else if(code.startsWith('u64')){
        return {
            err: 0,
            code: code.slice(3),
            typeid: 'number',
            subtypeid: 'u64',
            is_big_int: true,
            type: 'bigint',
        }
    }else{
        return {
            err: 1
        }
    }
}

function ts_type(code){
    // number?
    {
        const r = number(code);
        if(r.err===0){
            return r;
        }
    }

    // string?
    {
        const r = string(code);
        if(r.err===0){
            return r;
        }
    }

    // vec?
    {
        const r = vec(code);
        if(r.err===0){
            return r;
        }
    }

    // option?
    {
        const r = option(code);
        if(r.err===0){
            return r;
        }
    }

    // hashmap?
    {
        const r = hashmap(code);
        if(r.err===0){
            return r;
        }
    }

    return {
        err: 0,
        typeid: code,
        type: code
    }
}

function convert(ts_type_info, name){
    // 先只处理基本类型
    // TODO
    switch(ts_type_info.typeid){
        case 'number':{
            return `new BuckyNumber('${ts_type_info.subtypeid}', ${name})`;
        }
        case 'string':{
            return `new BuckyString(${name})`;
        }
        case 'buffer':{
            return `new BuckyBuffer(${name})`;
        }
        case 'vec':{
            return `new Vec(${name})`
        }
        default: {
            return `${name}`;
        }
    }
}

function convert_type(ts_type_info){
    // 先只处理基本类型
    // TODO
    switch(ts_type_info.typeid){
        case 'number':{
            return `BuckyNumberWrapper`;
        }
        case 'string':{
            return `BuckyString`;
        }
        case 'buffer':{
            return `BuckyBuffer`;
        }
        case 'vec':{
            return `Vec<${ts_type_info.inner_type.type}>`;
        }
        default: {
            return ts_type_info.type;
        }
    }
}

function ts_value(ts_type_info, name){
    // 先只处理基本类型
    // TODO
    switch(ts_type_info.typeid){
        case 'number':{
            if(ts_type_info.is_big_int){
                return `${name}.toBigInt()`;
            }else{
                return `${name}.toNumber()`;
            }
        }
        case 'string':{
            return `${name}.value()`;
        }
        case 'buffer':{
            return `${name}.value()`;
        }
        case 'vec':{
            return `${name}.value()`;
        }
        default: {
            return `${name}`;
        }
    }
}

function as(ts_type_info, name){
    switch(ts_type_info.typeid){
        case 'number':{
            if(ts_type_info.is_big_int){
                return `${name}.toBigInt()`;
            }else{
                return `${name}.toNumber()`;
            }
        }
        case 'string':{
            return `${name}.value()`;
        }
        case 'buffer':{
            return `${name}.value()`;
        }
        case 'vec':{
            return `${name}.to((v:${convert_type(ts_type_info.inner_type)})=>${ts_value(ts_type_info.inner_type, 'v')})`;
        }
        case 'option':{
            return `${name}.to((v:${convert_type(ts_type_info.inner_type)})=>${ts_value(ts_type_info.inner_type, 'v')})`;
        }
        case 'map':{
            return `${name}.to(k=>${ts_value(ts_type_info.key_type,'k')}, v=>${ts_value(ts_type_info.value_type, 'v')})`;
        }
        default: {
            return `${name}`;
        }
    }
}

function encoder(ts_type_info, name, post=''){
    // console.log(ts_type_info.type);
    switch(ts_type_info.typeid){
        case 'number':{
            return `new BuckyNumber('${ts_type_info.subtypeid}', this.${name}${post})`;
        }
        case 'string':{
            return `new BuckyString(this.${name}${post})`;
        }
        case 'vec':{
            return `Vec.from(this.${name}${post}, (v:${ts_type_info.inner_type.type})=>${convert(ts_type_info.inner_type,'v')})`;
        }
        case 'buffer':{
            return `new BuckyBuffer(this.${name}${post})`;
        }
        case 'option':{
            return `OptionEncoder.from(this.${name}${post}, (v:${ts_type_info.inner_type.type})=>${convert(ts_type_info.inner_type,'v')})`;
        }
        case 'map':{
            return `BuckyMap.from(this.${name}${post},  k=>${convert(ts_type_info.key_type,'k')},  v=>${convert(ts_type_info.value_type,'v')})`;
        }
        default: {
            return `this.${name}${post}`;
        }
    }
}

function decoder(ts_type_info){
    switch(ts_type_info.typeid){
        case 'number':{
            return `new BuckyNumberDecoder('${ts_type_info.subtypeid}')`;
        }
        case 'string':{
            return `new BuckyStringDecoder()`;
        }
        case 'vec':{
            return `new VecDecoder(${decoder(ts_type_info.inner_type)})`;
        }
        case 'buffer':{
            return `new BuckyBufferDecoder()`;
        }
        case 'option':{
            return `new OptionDecoder(${decoder(ts_type_info.inner_type)})`;
        }
        case 'map':{
            return `new BuckyMapDecoder(${decoder(ts_type_info.key_type)}, ${decoder(ts_type_info.value_type)})`;
        }
        default: {
            return `new ${ts_type_info.type}Decoder()`;
        }
    }
}

function indent(src, level = 0){
    const dest = [];
    let t = [];
    let d = level;
    while(d>0){
        d--;
        t.push('    ');
    }
    const tab = t.join('');
    for(const item of src){
        if(Array.isArray(item)){
            const flat = indent(item, level+1);
            for(const sub of flat){
                dest.push(sub);
            }
        }else{
            if(item!==''){
                dest.push(tab+item);
            }else{
                dest.push(item);
            }
        }
    }
    return dest;
}

function code_lines(code){
    const lines = code.split('\n').map(l=>l.trim()).filter(l=>l!=='');
    const out = [0,lines.length-1];
    return lines.map((l,i)=> out.indexOf(i)>=0?l:l[l.length-1]===',' ? l: l+',');
}

function depends(types){
    let r = [];
    let c=[];
    for(const t of types){
        if(c.length===4){
            r.push(c.join(', '));
            c = [t];
        }else{
            c.push(t);
        }
    }
    if(c.length>0){
        r.push(c.join(', '));
    }
    return r.map(l=>l+',');
}

function is_ts_keywords(type){
    return ['i8','i16', 'i32', 'i64', 'u8', 'u16', 'u32', 'u64', 'string', 'boolean', 'for', 'let', 'var', 'const'].indexOf(type)>=0;
}


function relative_path(src, dest){
    const relative = path.relative(path.dirname(src), dest).replace(/\\/g,'/').replace('.ts','');

    console.log(src);
    console.log(dest);
    console.log(relative);
    console.log('');
    // process.exit(0);

    return relative;
}

function parse_depends(items){

    const dict = {
        
    };

    for(const item of items){
        if(dict[item.name]!=null){
            console.error("[error] duplicate class name:", item.name, item);
            console.log('');
            return {
                err: 1
            };
        }
        console.log(item.name);
        dict[item.name] = item;
    }
    // process.exit(0);

    for(const item of items){
        if(item.ext_depends==null){
            item.ext_depends = [];
        }

        if(item.depends==null){
            item.depends = []
        }else{
            const expends = [];
            for(const d of item.depends){
                if(Array.isArray(d)){
                    for(const x of d){
                        const i = x.name.indexOf('Decoder') >=0 ? x.name.replace('Decoder','') : x.name;

                        if(dict[i]!=null){
                            const relative = relative_path(item.output, dict[i].output);

                            if(relative[0]!=='.'){
                                expends.push(`import { ${x.name} } from './${relative}';`);
                            }else{
                                expends.push(`import { ${x.name} } from '${relative}';`);
                            }

                        }else{
                            if(i.indexOf('Ext')){
                                item.ext_depends.push(i);
                                const ext = i.replace('Ext', '');
                                if(dict[ext]!=null){
                                    const relative = relative_path(item.output, dict[ext].output);
                                    if(relative!=='.'){
                                        if(relative.indexOf('ext')<0){
                                            expends.push(`import { ${x.name} } from './${relative}_ext';`);
                                        }else{
                                            expends.push(`import { ${x.name} } from './${relative}';`);
                                        }
                                    }else{
                                        expends.push(`import { ${x.name} } from '${relative}';`);
                                    }
                                }else{
                                    console.log("missing depend ext type:", i);
                                    return {
                                        err: 1
                                    }
                                }
                            }else{
                                console.log("missing depend type:", i);
                                return {
                                    err: 1
                                }
                            }
                            
                        }
                    }
                }else{
                    expends.push(d);
                }
            }
            item.depends = expends;

            if(item.use_ext){
                if(item.ext_depends.indexOf(`${item.name}Ext`)<0){
                    item.depends.push(`import { ${item.name}Ext } from './${ext_module(item)}'`);
                }
            }
            item.depends.push('');

            // if(item.name==="Block"){
            //     process.exit(0);
            // }
        }
    }

    return {
        err: 0
    }
}

function parse_struct_codes(codes){
    const tsClass = {
        name: null,
        fields: []
    }

    const schema = {
        start: [ 
            spaces('*'), 
            
            question(seq(pub(), spaces('*'))),  // 可选的至多一个 `pub\s*`

            struct(),
            spaces('+'), identity((r)=>{
                tsClass.name = r.id;
            }, ['{']), 
            spaces("*"), left(),
            spaces('*') 
        ],
        fileds: [ 
            spaces('*'), 
            
            question(seq(pub(), spaces('*'))),  // 可选的至多一个 `pub\s*`

            identity((r)=>{
                tsClass.fields.push({
                    name: r.id,
                    type: null
                });
            }),
            spaces('*'), colon(),
            spaces('*'), identity((r)=>{
                const field = tsClass.fields[tsClass.fields.length-1];
                field.id = r.id;
                field.ts_type = ts_type(field.id);
                field.type = field.ts_type.type;
                field.encoder = encoder(field.ts_type, field.name);
                field.decoder = decoder(field.ts_type);
            }),
            spaces('*'), comma(),
            spaces('*')
        ],
        end: [ 
            spaces('*'), right(), 
            spaces('*') 
        ]
    };

    // start 
    console.log("@parse class name...");
    {
        let code = codes[0];
        for(const s of schema.start){
            const r = s(code);
            console.log(` -> match ${r.name} ${r.err?'failed':'sucess'}, code: '${code}'`);
            if(r.err){
                return r;
            }
            code = r.code;
        }
    }

    // fileds
    for(let i=1;i<codes.length-1;i++){
        console.log('');
        console.log("@parse fields...");
        let code = codes[i];
        for(const s of schema.fileds){
            const r = s(code);
            console.log(` -> match ${r.name} ${r.err?'failed':'sucess'}, code:'${code}'`);
            if(r.err){
                return r;
            }
            code = r.code;
        }
    }
    
    // end
    console.log('');
    console.log("@parse class end...");
    {
        let code = codes[codes.length-1];
        for(const s of schema.end){
            const r = s(code);
            console.log(` -> match ${r.name} ${r.err?'failed':'sucess'}, code:'${code}'`);
            if(r.err){
                return r;
            }
            code = r.code;
        }
    }

    console.log(tsClass);
    return {
        err: 0,
        tsClass,
    }
}

function parse_struct(item){
    const codes = code_lines(item.rust);

    if(codes.length<2){
        console.error('not invalid struct');
        return {err: 1};
    }
    
    const r = parse_struct_codes(codes);
    if(r.err){
        return r;
    }
    item.tsClass = r.tsClass;

    if(item.depends.length>0){
        item.depends.push('');
    }

    item.name = item.tsClass.name;

    return {
        err: 0
    };
}

function emit_struct(item){
    const tsClass = item.tsClass;
    let ts;

    if(item.no_encode){
        // emit typescript code
        ts = [
            `/*****************************************************`,
            ` * This code is auto generated from auto.js`,
            ` * Please DO NOT MODIFY this file`,
            ` * author: ${author()}`,
            ` * date: ${new Date()}`,
            ` *****************************************************/`,
            ``,
            // 引用
            ...item.depends,

            // 对象+编码
            `export class ${tsClass.name} {`,
            [
                ...(item.ext_type ? [`private m_ext?: ${item.ext_type};`,'']: ''),
                // 构造函数
                `constructor(`,
                    tsClass.fields.map(f=>`public ${f.name}: ${f.type},`),
                `){`,
                [
                    '// ignore'
                ],
                '}',
                ...(item.ext_type? [
                    ``,
                    `ext():${item.ext_type}{`,
                    [
                        `if(this.m_ext==null){`,
                        [
                            `this.m_ext = new ${item.ext_type}(this);`
                        ],
                        `}`,
                        `return this.m_ext;`
                    ],
                    `}`,
                    ``,
                ] : [
                    ``,
                ]),
            ],
            `}`,
        ];
    }else{
        // emit typescript code
        ts = [
            `/*****************************************************`,
            ` * This code is auto generated from auto.js`,
            ` * Please DO NOT MODIFY this file`,
            ` * author: ${author()}`,
            ` * date: ${new Date()}`,
            ` *****************************************************/`,
            ``,
            // 引用
            ...item.depends,

            // 对象+编码
            `export class ${tsClass.name} implements RawEncode {`,
            [
                ...(item.ext_type ? [`private m_ext?: ${item.ext_type};`,'']: ''),
                // 构造函数
                `constructor(`,
                    tsClass.fields.map(f=>`public ${f.name}: ${f.type},`),
                `){`,
                [
                    '// ignore'
                ],
                '}',
                ...(item.ext_type? [
                    ``,
                    `ext():${item.ext_type}{`,
                    [
                        `if(this.m_ext==null){`,
                        [
                            `this.m_ext = new ${item.ext_type}(this);`
                        ],
                        `}`,
                        `return this.m_ext;`
                    ],
                    `}`,
                    ``,
                ] : [
                    ``,
                ]),

                // 编码器/raw_measure
                'raw_measure(ctx?:any): BuckyResult<number>{',
                [
                    `${tsClass.fields.length===0?'const':'let'} size = 0;`,
                    ...tsClass.fields.map(f=> `size += ${f.encoder}.raw_measure().unwrap();`),
                    'return Ok(size);'
                ],
                '}',
                '',
            
                // 编码器/raw_encode
                'raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{',
                [
                    ...tsClass.fields.map(f=>`buf = ${f.encoder}.raw_encode(buf).unwrap();`),
                    'return Ok(buf);'
                ],
                '}'
            ],
            `}`,
            '',
            
            // 解码
            `export class ${tsClass.name}Decoder implements RawDecode<${tsClass.name}> {`,
            [
                // 编码器/raw_decode
                `raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[${tsClass.name}, Uint8Array]>{`,
                [
                    ...[].concat.apply([],tsClass.fields.map(f=>{
                        return [
                            `let ${f.name};`,
                            '{',
                            [
                                `const r = ${f.decoder}.raw_decode(buf);`,
                                'if(r.err){',
                                [
                                    'return r;',
                                ],
                                '}',
                                `[${f.name}, buf] = r.unwrap();`,
                            ],
                            '}',
                            ''
                        ]
                    })),
                    `const ret:[${tsClass.name}, Uint8Array] = [new ${tsClass.name}(${tsClass.fields.map(f=>`${as(f.ts_type, f.name)}`).join(', ')}), buf];`,
                    'return Ok(ret);',
                ],
                '}',
                ''
            ],
            `}`,
            '',
        ];
    }

    
    console.log('')
    console.log('@ gen typescript code...');
    console.log('')

    const tsCodes = indent(ts).join('\n');
    // console.log(tsCodes);

    if(process.argv.length===3 && process.argv[2]==='-v'){
        // DO NOT write file
    }else{
        fs.ensureDirSync(path.dirname(item.output));
        fs.writeFileSync(item.output, tsCodes);
    }

    item.obj_name = tsClass.name;
    ext(item);

    return {
        err: 0
    };
}

function struct_2_ts(item){
    let r;

    r = parse_struct(item);
    if(r.err){
        return r;
    }
    
    r = emit_struct(item);

    if(r.err){
        return r;
    }

    return {
        err: 0
    };
}

function parse_enum(item){
    const codes = code_lines(item.rust);
    if(codes.length<2){
        console.error('not invalid struct');
        return {err: 1};
    }

    const tsClass = {
        name: null,
        fields: []
    }

    const schema = {
        start: [ 
            spaces('*'), 
            
            question(seq(pub(), spaces('*'))),  // 可选的至多一个 `pub\s*`

            enum_(),
            spaces('+'), identity((r)=>{
                tsClass.name = r.id;
            }, ['{']),
            spaces("*"), left(),
            spaces('*') 
        ],
        fileds: [ 
            spaces('*'), tuple((r)=>{
                const field = {
                    id: r.tag_type,
                    name: r.tag.toLowerCase(),
                    enum_name: r.tag,
                };

                if(is_ts_keywords(field.name)){
                    field.name = '_'+field.name;
                }
                
                field.ts_type = ts_type(field.id);
                field.type = field.ts_type.type;
                field.encoder = encoder(field.ts_type, field.name,'!');
                field.decoder = decoder(field.ts_type);

                if(field.type==='void'){
                    field.name = field.enum_name.toLowerCase();
                }

                tsClass.fields.push(field);
            }),
            spaces('*')
        ],
        end: [ 
            spaces('*'), right(), 
            spaces('*')
        ]
    };

    // start 
    console.log("@parse class name...");
    {
        let code = codes[0];
        for(const s of schema.start){
            const r = s(code);
            console.log(` -> match ${r.name} ${r.err?'failed':'sucess'}, code: '${code}'`);
            if(r.err){
                return r;
            }
            code = r.code;
        }
    }

    // fileds
    for(let i=1;i<codes.length-1;i++){
        console.log('');
        console.log("@parse fields...");
        let code = codes[i];
        for(const s of schema.fileds){
            const r = s(code);
            console.log(` -> match ${r.name} ${r.err?'failed':'sucess'}, code:'${code}'`);
            if(r.err){
                return r;
            }
            code = r.code;
        }
    }
    
    // end
    console.log('');
    console.log("@parse class end...");
    {
        let code = codes[codes.length-1];
        for(const s of schema.end){
            const r = s(code);
            console.log(` -> match ${r.name} ${r.err?'failed':'sucess'}, code:'${code}'`);
            if(r.err){
                return r;
            }
            code = r.code;
        }
    }

    console.log(tsClass);
    item.tsClass = tsClass;
    if(item.use_ext){
        item.ext_type = `${item.tsClass.name}Ext`;
    }

    item.name = tsClass.name;

    return {
        err: 0
    }
}

function emit_enum(item){
    // emit typescript code
    const tsClass = item.tsClass;
    const ts = [
        `/*****************************************************`,
        ` * This code is auto generated from auto.js`,
        ` * Please DO NOT MODIFY this file`,
        ` * author: ${author()}`,
        ` * date: ${new Date()}`,
        ` *****************************************************/`,
        ``,
        // 引用
        ...item.depends,

        // 对象+编码
        `export class ${tsClass.name} implements RawEncode {`,
        [
            `private readonly tag: number;`,
            ...(item.ext_type ? [`private m_ext?: ${item.ext_type};`,'']: ''),
            // 构造函数
            `private constructor(`,
                tsClass.fields.map(f=>`private ${f.name}?: ${f.type==='void'? 'number' : f.type},`),
            `){`,
            [
                ...[].concat.apply([],tsClass.fields.map((f,index)=>[
                    `${index===0?'':'} else '}if(${f.name}) {`,
                    [
                        `this.tag = ${index};`
                    ],
                ])),
                '} else {',
                [
                    'this.tag = -1;'
                ],
                '}'
            ],
            '}',
            '',

            // 枚举构造器
            ...[].concat.apply([],tsClass.fields.map((f,index)=>{
                let argv = [];
                for(let i=0;i<index;i++){
                    argv.push('undefined');
                }

                if(f.type!=='void'){
                    argv.push(f.name);
                }else{
                    argv.push('1');
                }

                return [
                    `static ${f.enum_name}(${ f.type==='void' ? '' : `${f.name}: ${f.type}`}): ${tsClass.name} {`,
                    [
                        `return new ${tsClass.name}(${argv.join(', ')});`
                    ],
                    `}`,
                    ''
                ]
            })),

            // 枚举访问者模式
            `match<T>(visitor: {`,
                tsClass.fields.map((f,index)=>`${f.enum_name}?: (${f.type==='void' ? '' : `${f.name}: ${f.type}` })=>T,`),
            `}):T|undefined{`,
            [
                `switch(this.tag){`,
                [
                    ...tsClass.fields.map((f,index)=>`case ${index}: return visitor.${f.enum_name}?.(${f.type==='void' ? ``:`this.${f.name}!`});`),
                    `default: break;`,
                ],
                '}',
            ],
            `}`,
            '',

            // 枚举比较
            `eq_type(rhs: ${tsClass.name}):boolean{`,
            [
                `return this.tag===rhs.tag;`,
            ],
            `}`,

            ...(item.ext_type? [
                ``,
                `ext():${item.ext_type}{`,
                [
                    `if(this.m_ext==null){`,
                    [
                        `this.m_ext = new ${item.ext_type}(this);`
                    ],
                    `}`,
                    `return this.m_ext;`
                ],
                `}`,
                ``,
            ] : [
                ``,
            ]),

            // 编码器/raw_measure
            'raw_measure(ctx?:any): BuckyResult<number>{',
            [
                'let size = 0;',
                'size += 1; // tag',
                `size += this.match({`,
                    tsClass.fields.map((f,index)=>`${f.enum_name}:(${f.type==='void' ? "" : f.name})=>{ return ${ f.type!=='void' ? `${f.encoder}.raw_measure().unwrap();` : `0;`}},`),
                `})!;`,
                'return Ok(size);',
            ],
            '}',
            '',
        
            // 编码器/raw_encode
            'raw_encode(buf: Uint8Array, ctx?:any): BuckyResult<Uint8Array>{',
            [
                `buf = new BuckyNumber('u8', this.tag).raw_encode(buf).unwrap(); // tag`,
                `buf = this.match({`,
                    tsClass.fields.map((f,index)=>`${f.enum_name}:(${f.type==='void' ? "" : f.name})=>{return ${ f.type!=='void' ? `${f.encoder}.raw_encode(buf).unwrap();` : 'buf;'}},`),
                `})!;`,
                'return Ok(buf);',
            ],
            '}',
        ],
        `}`,
        '',
        
        // 解码
        `export class ${tsClass.name}Decoder implements RawDecode<${tsClass.name}> {`,
        [
            // 编码器/raw_decode
            `raw_decode(buf: Uint8Array, ctx?:any): BuckyResult<[${tsClass.name}, Uint8Array]>{`,
            [
                `let tag;`,
                `{`,
                [
                    `const r = new BuckyNumberDecoder('u8').raw_decode(buf);`,
                    `if(r.err){`,
                    [
                        `return r;`,
                    ],
                    `}`,
                    `[tag, buf] = r.unwrap();`,
                ],
                `}`,
                '',
                `switch(tag.toNumber()){`,
                [
                    ...[].concat.apply([],tsClass.fields.map((f,index)=> {
                        if(f.type==='void'){
                            return [
                                `case ${index}:{`,
                                [
                                    `const ret:[${tsClass.name}, Uint8Array] =  [${tsClass.name}.${f.enum_name}(), buf];`,
                                    `return Ok(ret);`,
                                ],
                                `}`,
                            ];
                        }else{
                            return [
                                `case ${index}:{`,
                                [
                                    `const r = ${f.decoder}.raw_decode(buf);`,
                                    `if(r.err){`,
                                    [
                                        `return r;`
                                    ],
                                    `}`,
                                    `let ${f.name};`,
                                    `[${f.name}, buf] = r.unwrap();`,
                                    `const ret:[${tsClass.name}, Uint8Array] =  [${tsClass.name}.${f.enum_name}(${as(f.ts_type, f.name)}), buf];`,
                                    `return Ok(ret);`,
                                ],
                                `}`,
                            ];
                        }
                    })),
                    'default: return Err(new BuckyError(BuckyErrorCode.Failed,"SHOULD NOT COME HERE"));',
                ],
                `}`
            ],
            '}',
            ''
        ],
        `}`,
        '',
    ];

    console.log('')
    console.log('@ gen typescript code...');
    console.log('')

    const tsCodes = indent(ts).join('\n');
    // console.log(tsCodes);
    
    if(process.argv.length===3 && process.argv[2]==='-v'){
        // DO NOT write file
    }else{
        fs.ensureDirSync(path.dirname(item.output));
        fs.writeFileSync(item.output, tsCodes);
    }

    item.obj_name = tsClass.name;
    ext(item);

    return {
        err: 0
    };
}

function enum_2_ts(item){
    let r;

    r = parse_enum(item);
    if(r.err){
        return r;
    }

    r = emit_enum(item);
    if(r.err){
        return r;
    }

    return {
        err: 0
    };
}

function parse_enum_pure(item){
    const codes = code_lines(item.rust);

    if(codes.length<2){
        console.error('not invalid struct');
        return {err: 1};
    }

    const tsClass = {
        name: null,
        fields: []
    }

    const schema = {
        start: [ 
            spaces('*'), pub(), 
            spaces('+'), enum_(),
            spaces('+'), identity((r)=>{
                tsClass.name = r.id;
            }), 
            spaces("*"), left(),
            spaces('*') 
        ],
        fileds: [ 
            spaces('*'), identity((r)=>{
                const field = {
                    type: r.id
                };
                tsClass.fields.push(field);
            }),
            spaces('*')
        ],
        end: [ 
            spaces('*'), right(), 
            spaces('*')
        ]
    };

    // start 
    console.log("@parse class name...");
    {
        let code = codes[0];
        for(const s of schema.start){
            const r = s(code);
            console.log(` -> match ${r.name} ${r.err?'failed':'sucess'}, code: '${code}'`);
            if(r.err){
                return r;
            }
            code = r.code;
        }
    }

    // fileds
    for(let i=1;i<codes.length-1;i++){
        console.log('');
        console.log("@parse fields...");
        let code = codes[i];
        for(const s of schema.fileds){
            const r = s(code);
            console.log(` -> match ${r.name} ${r.err?'failed':'sucess'}, code:'${code}'`);
            if(r.err){
                return r;
            }
            code = r.code;
        }
    }
    
    // end
    console.log('');
    console.log("@parse class end...");
    {
        let code = codes[codes.length-1];
        for(const s of schema.end){
            const r = s(code);
            console.log(` -> match ${r.name} ${r.err?'failed':'sucess'}, code:'${code}'`);
            if(r.err){
                return r;
            }
            code = r.code;
        }
    }

    console.log(tsClass);
    item.tsClass = tsClass;
    if(item.use_ext){
        item.ext_type = `${item.tsClass.name}Ext`;
    }

    item.name = tsClass.name;

    return {
        err: 0
    };
}

function emit_enum_pure(item){
    // emit typescript code
    const tsClass = item.tsClass;
    const ts = [
        `/*****************************************************`,
        ` * This code is auto generated from auto.js`,
        ` * Please DO NOT MODIFY this file`,
        ` * author: ${author()}`,
        ` * date: ${new Date()}`,
        ` *****************************************************/`,
        ``,
        // 引用
        ...item.depends,

        // 对象+编码
        `export enum ${tsClass.name} {`,
        [
            ...tsClass.fields.map((f,index)=>`${f.type},`)
        ],
        `}`,
        '',
    ];

    console.log('')
    console.log('@ gen typescript code...');
    console.log('')

    const tsCodes = indent(ts).join('\n');
    // console.log(tsCodes);

    if(process.argv.length===3 && process.argv[2]==='-v'){
        // DO NOT write file
    }else{
        fs.ensureDirSync(path.dirname(item.output));
        fs.writeFileSync(item.output, tsCodes);
    }

    item.obj_name = tsClass.name;
    ext(item);
    return {
        err: 0
    };
}

function enum_pure_2_ts(item){
    let r;

    r = parse_enum_pure(item);
    if(r.err){
        return r;
    }

    r = emit_enum_pure(item);
    if(r.err){
        return r;
    }

    return {
        err: 0
    };
}

function parse_obj(item){
    const desc_codes = code_lines(item.desc_content);
    const body_codes = code_lines(item.body_content);
    if(desc_codes.length<2 || body_codes.length<2){
        console.error('not invalid struct');
        return {err: 1};
    }

    let r;
    r = parse_struct_codes(desc_codes);
    if(r.err){
        return r;
    }
    const desc_content = r.tsClass;

    r = parse_struct_codes(body_codes);
    if(r.err){
        return r;
    }
    const body_content = r.tsClass;

    // unique field name
    let fields = {};
    const all_fileds = [...desc_content.fields, ...body_content.fields];
    for(const f of all_fileds){
        let record = fields[f.name];
        if(record){
            if(record.count===0){
                record.first.arg_name = `${f.name}_${record.count}`
            }
            record.count ++;
            f.arg_name = `${f.name}_${record.count}`;
        }else{
            record = {
                count:0,
                first: f,
            };
            fields[f.name] = record;
            f.arg_name = f.name;
        }
    }

    let create_argv = [];
    const build_chains = [];
    const ts_sub_desc_type = {};
    switch(item.sub_desc_type.owner_type){
        case 'option':{
            create_argv.push({
                arg_name: 'owner',
                type: 'Option<ObjectId>'
            });
            build_chains.push(`.option_owner(owner)`);
            ts_sub_desc_type.owner_type = 'option';
            break;
        }
        case 'has':{
            create_argv.push({
                arg_name: 'owner',
                type: 'ObjectId'
            });
            build_chains.push(`.owner(owner)`);
            ts_sub_desc_type.owner_type = 'option';
            break;
        }
        default:{
            ts_sub_desc_type.owner_type = 'disable';
        }
    }

    switch(item.sub_desc_type.author_type){
        case 'option':{
            create_argv.push({
                arg_name: 'author',
                type: 'Option<ObjectId>'
            });
            build_chains.push(`.option_author(author)`);
            ts_sub_desc_type.author_type = 'option';
            break;
        }
        case 'has':{
            create_argv.push({
                arg_name: 'author',
                type: 'ObjectId'
            });
            build_chains.push(`.author(author)`);
            ts_sub_desc_type.author_type = 'option';
            break;
        }
        default:{
            ts_sub_desc_type.author_type = 'disable';
        }
    }

    switch(item.sub_desc_type.area_type){
        case 'option':{
            create_argv.push({
                arg_name: 'author',
                type: 'Option<Area>'
            });
            build_chains.push(`.option_area(area)`);
            ts_sub_desc_type.area_type = 'option';
            break;
        }
        case 'has':{
            create_argv.push({
                arg_name: 'author',
                type: 'Area'
            });
            build_chains.push(`.area(area)`);
            ts_sub_desc_type.area_type = 'option';
            break;
        }
        default:{
            ts_sub_desc_type.area_type = 'disable';
        }
    }

    switch(item.sub_desc_type.key_type){
        case 'single_key':{
            create_argv.push({
                arg_name: 'public_key',
                type: 'PublicKey'
            });
            build_chains.push(`.single_key(public_key)`);
            ts_sub_desc_type.key_type = 'single_key';
            break;
        }
        case 'mn_key':{
            create_argv.push({
                arg_name: 'mn_key',
                type: 'MNPublicKey'
            });
            build_chains.push(`.mn_key(mn_key)`);
            ts_sub_desc_type.key_type = 'mn_key';
            break;
        }
        default:{
            ts_sub_desc_type.key_type = 'disable';
        }
    }

    item.ts_sub_desc_type = ts_sub_desc_type;
    create_argv = [...create_argv, ...all_fileds.map(f=>({arg_name: f.arg_name, type: f.type}))];
    item.create_argv = create_argv;
    item.build_chains = build_chains;

    if(item.use_ext){
        item.ext_type = `${item.obj_name}Ext`;
    }

    item.desc_content = desc_content;
    item.body_content = body_content;
    item.name = item.obj_name;

    return {
        err: 0
    };
}

function emit_obj(item){

    const desc_content = item.desc_content;
    const body_content = item.body_content;

    const ts = [
        `/*****************************************************`,
        ` * This code is auto generated from auto.js`,
        ` * Please DO NOT MODIFY this file`,
        ` * author: ${author()}`,
        ` * date: ${new Date()}`,
        ` *****************************************************/`,
        ``,
        // 引用
        ...item.depends,

        `// 定义App对象的类型信息`,
        `import { ${item.obj_type} } from "${item.obj_type_def}";`,
        `export class ${item.obj_name}DescTypeInfo extends DescTypeInfo{`,
        [
            ``,
            `// 每个对象需要一个应用App唯一的编号`,
            `obj_type() : number{`,
            [
                `return ${item.obj_type}.${item.obj_name};`,
            ],
            `}`,
            ``,

            `// 配置该对象具有哪些能力`,
            `sub_desc_type(): SubDescType{`,
            [        
                `return {`,
                [   
                    `owner_type: "${item.ts_sub_desc_type.owner_type}",`,
                    `area_type: "${item.ts_sub_desc_type.area_type}",`,
                    `author_type: "${item.ts_sub_desc_type.author_type}",`,
                    `key_type: "${item.ts_sub_desc_type.key_type}"`,
                ],
                `}`,
                ``,
            ],
            `}`,
            ``,
        ],
        `}`,
        ``,

        `// 定义一个类型实例`,
        `const ${item.obj_name.toUpperCase()}_DESC_TYPE_INFO = new ${item.obj_name}DescTypeInfo();`,
        ``,
        `// 每个对象包含Desc/Body/Signs/nonce四个部分，对象的格式参考文档`,
        `// 每个用户自定义对象，需要提供DescContent和BodyContent部分的自定义`,
        `export class ${item.obj_name}DescContent extends DescContent {`,
        [
            ``,
            `constructor(`,
                desc_content.fields.map(f=>`public ${f.name}: ${f.type},`),
            `){`,
            [        
                `super();`,
            ],
            `}`,
            ``,

            `// 类型信息`,
            `type_info(): DescTypeInfo{`,
            [        
                `return ${item.obj_name.toUpperCase()}_DESC_TYPE_INFO;`,
            ],
            `}`,
            ``,

            `// 编码需要的字节`,
            `raw_measure(): BuckyResult<number>{`,
            [        
                `${desc_content.fields.length===0?'const':'let'} size = 0;`,
                ...desc_content.fields.map(f=> `size += ${f.encoder}.raw_measure().unwrap();`),
                'return Ok(size);',
            ],
            `}`,
            ``,

            `// 编码`,
            `raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{`,
            [        
                ...desc_content.fields.map(f=>`buf = ${f.encoder}.raw_encode(buf).unwrap();`),
                'return Ok(buf);',
            ],
            `}`,
            ``,
        ],
        `}`,
        ``,

        `// 同时需要提供DescContent和BodyContent对应的解码器`,
        `export class ${item.obj_name}DescContentDecoder extends DescContentDecoder<${item.obj_name}DescContent>{`,
        [
            `// 类型信息`,
            `type_info(): DescTypeInfo{`,
            [        
                `return ${item.obj_name.toUpperCase()}_DESC_TYPE_INFO;`,
            ],
            `}`,
            ``,

            `// 解码`,
            `raw_decode(buf: Uint8Array): BuckyResult<[${item.obj_name}DescContent, Uint8Array]>{`,
            [        
                ...[].concat.apply([],desc_content.fields.map(f=>{
                    return [
                        `let ${f.name};`,
                        '{',
                        [
                            `const r = ${f.decoder}.raw_decode(buf);`,
                            'if(r.err){',
                            [
                                'return r;',
                            ],
                            '}',
                            `[${f.name}, buf] = r.unwrap();`,
                        ],
                        '}',
                        ''
                    ]
                })),
                `const ret:[${item.obj_name}DescContent, Uint8Array] = [new ${item.obj_name}DescContent(${desc_content.fields.map(f=>`${as(f.ts_type, f.name)}`).join(', ')}), buf];`,
                'return Ok(ret);',
            ],
            `}`,
            ``,
        ],
        `}`,
        ``,

        `// 自定义BodyContent`,
        `export class ${item.obj_name}BodyContent extends BodyContent{`,
        [    
            `constructor(`,
                body_content.fields.map(f=>`public ${f.name}: ${f.type},`),
            `){`,
            [        
                `super();`,
            ],
            `}`,
            ``,

            `raw_measure(): BuckyResult<number>{`,
            [        
                `${body_content.fields.length===0?'const':'let'} size = 0;`,
                ...body_content.fields.map(f=> `size += ${f.encoder}.raw_measure().unwrap();`),
                'return Ok(size);',
            ],
            `}`,
            ``,

            `raw_encode(buf: Uint8Array): BuckyResult<Uint8Array>{`,
            [        
                ...body_content.fields.map(f=>`buf = ${f.encoder}.raw_encode(buf).unwrap();`),
                'return Ok(buf);',
            ],
            `}`,
            ``,
        ],
        `}`,
        ``,

        `// 自定义BodyContent的解码器`,
        `export class ${item.obj_name}BodyContentDecoder extends BodyContentDecoder<${item.obj_name}BodyContent>{`,
        [    
            `raw_decode(buf: Uint8Array): BuckyResult<[${item.obj_name}BodyContent, Uint8Array]>{`,
            [
                ...[].concat.apply([],body_content.fields.map(f=>{
                    return [
                        `let ${f.name};`,
                        '{',
                        [
                            `const r = ${f.decoder}.raw_decode(buf);`,
                            'if(r.err){',
                            [
                                'return r;',
                            ],
                            '}',
                            `[${f.name}, buf] = r.unwrap();`,
                        ],
                        '}',
                        ''
                    ]
                })),
                `const ret:[${item.obj_name}BodyContent, Uint8Array] = [new ${item.obj_name}BodyContent(${body_content.fields.map(f=>`${as(f.ts_type, f.name)}`).join(', ')}), buf];`,
                'return Ok(ret);',
            ],
            `}`,
            ``,
        ],
        `}`,
        ``,

        `// 使用自定义的DescCotent对象，通过命名对象构造器来定义对象的Desc`,
        `export class ${item.obj_name}Desc extends NamedObjectDesc<${item.obj_name}DescContent>{`,
        [    
            `// ignore`,
        ],
        `}`,
        ``,

        `// 定义Desc的解码器`,
        `export  class ${item.obj_name}DescDecoder extends NamedObjectDescDecoder<${item.obj_name}DescContent>{`,
        [    
            `constructor(){`,
            [
                `super(new ${item.obj_name}DescContentDecoder());`
            ],
            `}`,
            ``,
        ],
        `}`,
        ``,

        `// 定义一个对象的Builder`,
        `export class ${item.obj_name}Builder extends NamedObjectBuilder<${item.obj_name}DescContent, ${item.obj_name}BodyContent>{`,
        [    
            `// ignore`,
        ],
        `}`,
        ``,

        `// 定义对象的Id，对象的Id是从Desc提供的calc_id方法计算，Desc发生改变，则Id发生改变`,
        `export class ${item.obj_name}Id extends NamedObjectId<${item.obj_name}DescContent, ${item.obj_name}BodyContent>{`,
        [    
            `constructor(id: ObjectId){`,
            [        
                `super(${item.obj_type}.${item.obj_name}, id);`,
            ],
            `}`,
            ``,

            `static default(): ${item.obj_name}Id{`,
            [        
                `return named_id_gen_default(${item.obj_type}.${item.obj_name});`,
            ],
            `}`,
            ``,

            `static from_base_58(s: string): BuckyResult<${item.obj_name}Id> {`,
            [        
                `return named_id_from_base_58(${item.obj_type}.${item.obj_name}, s);`,
            ],
            `}`,
            ``,

            `static try_from_object_id(id: ObjectId): BuckyResult<${item.obj_name}Id>{`,
            [        
                `return named_id_try_from_object_id(${item.obj_type}.${item.obj_name}, id);`,
            ],
            `}`,
            ``,
        ],
        `}`,
        ``,

        `// 定义Id的解码器`,
        `export class ${item.obj_name}IdDecoder extends NamedObjectIdDecoder<${item.obj_name}DescContent, ${item.obj_name}BodyContent>{`,
        [    
            `constructor(){`,
            [        
                `super(${item.obj_type}.${item.obj_name});`,
            ],
            `}`,
            ``,
        ],
        `}`,
        ``,

        `// 现在，我们完成对象的定义`,
        `export class ${item.obj_name} extends NamedObject<${item.obj_name}DescContent, ${item.obj_name}BodyContent>{`,
        [
            ...(item.ext_type ? [`private m_ext?: ${item.ext_type};`,'']: ''),

            `// 提供一个静态的创建方法`,
            `static create(${item.create_argv.map(f=>`${f.arg_name}: ${f.type}`).join(', ')}): ${item.obj_name}{`,
            [        
                `// 创建DescContent部分`,
                `const desc_content = new ${item.obj_name}DescContent(${desc_content.fields.map(f=>`${f.arg_name}`).join(', ')});`,
                ``,
                `// 创建BodyContent部分`,
                `const body_content = new ${item.obj_name}BodyContent(${body_content.fields.map(f=>`${f.arg_name}`).join(', ')});`,
                ``,
                `// 创建一个Builder，并完成对象的构建`,
                `const builder = new ${item.obj_name}Builder(desc_content, body_content);`,
                ``,
                `// 构造，这是一个有主对象`,
                `const self:NamedObject<${item.obj_name}DescContent, ${item.obj_name}BodyContent> =`,
                [
                    `builder`,
                    ...item.build_chains,
                    `.build();`,
                ],
                ``,
                `// 这是一个绕过typescript类型的trick，通过重新调用对象构造函数（继承自父对象）, 使得返回的对象类型是具体化后的${item.obj_name}`,
                `return new ${item.obj_name}(self.desc(), self.body(), self.signs(), self.nonce());`,
            ],
            `}`,
            ...(item.ext_type? [
                ``,
                `ext():${item.ext_type}{`,
                [
                    `if(this.m_ext==null){`,
                    [
                        `this.m_ext = new ${item.ext_type}(this);`
                    ],
                    `}`,
                    `return this.m_ext;`
                ],
                `}`,
                ``,
            ] : [
                ``,
            ]),
        ],
        `}`,
        ``,

        `// 同时，我们为对象提供对应的解码器`,
        `export class ${item.obj_name}Decoder extends NamedObjectDecoder<${item.obj_name}DescContent, ${item.obj_name}BodyContent, ${item.obj_name}>{`,
        [    
            `constructor(){`,
            [        
                `super(new ${item.obj_name}DescContentDecoder(), new ${item.obj_name}BodyContentDecoder(), ${item.obj_name});`,
            ],
            `}`,
            ``,

            `raw_decode(buf: Uint8Array): BuckyResult<[${item.obj_name}, Uint8Array]>{`,
            [        
                `return super.raw_decode(buf).map(r=>{`,
                [            
                    `const [obj, _buf] = r;`,
                    `const sub_obj = new ${item.obj_name}(obj.desc(),obj.body(), obj.signs(), obj.nonce());`,
                    `return [sub_obj, _buf];`,
                ],
                `});`,
            ],
            `}`,
        ],
        `}`,
        ``,
    ];

    const tsCodes = indent(ts).join('\n');
    if(process.argv.length===3 && process.argv[2]==='-v'){
        // DO NOT write file
    }else{
        fs.ensureDirSync(path.dirname(item.output));
        fs.writeFileSync(item.output, tsCodes);
    }

    ext(item);
    return {
        err: 0
    };
}

function obj_2_ts(item){
    let r;

    r = parse_obj(item);
    if(r.err){
        return r;
    }

    r = emit_obj(item);
    if(r.err){
        return r;
    }

    return {
        err: 0
    };
}

function ext_module(item){
    const dir = path.dirname(item.output);
    const base_name = path.basename(item.output,'.ts');
    const ext_file_name = `${base_name}_ext`;
    return ext_file_name;
}

function ext(item){
    if(item.ext_type==null){
        return {
            err: 0
        }
    }

    const dir = path.dirname(item.output);
    const base_name = path.basename(item.output,'.ts');
    const ext_file_name = path.join(dir, base_name+'_ext.ts');
    if(!fs.existsSync(ext_file_name)){
        const ts_ext = [
            `//`,
            `// 在此添加对象的扩展方法，该文件只会生成一次，不会被 auto.js 覆盖`,
            `//`,
            ``,
            `import { ${item.obj_name} } from './${path.basename(item.output, '.ts')}'`,
            ``,
            `export class ${item.obj_name}Ext {`,
            [
                `constructor(public obj: ${item.obj_name}){`,
                [
                    `// TODO:`,
                ],
                '}',
                '',
            ],
            '}',
            ''
        ];

        console.log(ts_ext);

        const ext_codes = indent(ts_ext).join('\n');

        console.log(ext_codes);

        if(process.argv.length===3 && process.argv[2]==='-v'){
            // DO NOT write file
        }else{
            fs.writeFileSync(ext_file_name, ext_codes);
        }
    }
    return {
        err: 0
    }
}

function check_unique_rust(src){
    let uniques=['output','name','obj_name'];
    let dict = {};
    for(const item of src){
        for(const unique_key of uniques){
            let set = dict[unique_key];
            if(set==null){
                set = [];
                dict[unique_key] = set;
            }
            if(item[unique_key]!=null){
                if(set.indexOf(item[unique_key])>=0){
                    console.log(item);
                    console.error(`duplicate ${unique_key} value: ${item[unique_key]}.`);
                    process.exit(0);
                }
                set.push(item[unique_key]);
            }
        }
    }
}

function rust_2_ts(src){
    check_unique_rust(src);

    for(const item of src){
        switch(item.type){
            case 'enum': {
                const r = parse_enum(item); 
                if(r.err){
                    return r;
                }
                break;
            }
            case 'enum_pure': {
                const r = parse_enum_pure(item); 
                if(r.err){
                    return r;
                }
                break;
            }
            case 'struct': {
                const r = parse_struct(item); 
                if(r.err){
                    return r;
                }
                break;
            }
            case 'obj': {
                const r = parse_obj(item); 
                if(r.err){
                    return r;
                }
                break;
            }
        }
    }

    const ret = parse_depends(src);
    if(ret.err){
        return ret;
    }

    for(const item of src){
        switch(item.type){
            case 'enum': {
                const r = emit_enum(item); 
                if(r.err){
                    return r;
                }
                break;
            }
            case 'enum_pure': {
                const r = emit_enum_pure(item); 
                if(r.err){
                    return r;
                }
                break;
            }
            case 'struct': {
                const r = emit_struct(item); 
                if(r.err){
                    return r;
                }
                break;
            }
            case 'obj': {
                const r = emit_obj(item); 
                if(r.err){
                    return r;
                }
                break;
            }
        }
    }
    return {
        err: 0
    };
}

function copyleft(rust){
    console.log('');
    console.log('-------------------');
    console.log('...');
    console.log('auto generate files count: ', rust.reduce((a,b)=>(a + (b.use_ext?2:1)), 0));
    console.log(`author: ${author_public()}`);
    console.log('mission complate.');
    console.log('...');
    console.log('-------------------');
    console.log('');
}

function rust_module_2_ts(src){
    let rust = [];
    for(const def of src){
        const code = require(def).code();
        rust = [...rust, ...code];
    }

    const r = rust_2_ts(rust);
    if(r.err){
        return r;
    }

    copyleft(rust);
    return {
        err: 0
    };
}

function test_ts_type(){
    const codes = [
        'String',
        'i32',
        'u64',
        'Vec<String>',
        'HashMap<String,String>',
        'HashMap<Vec<String>,Option<String>>',
        'Vec<HashMap<String,String>>',
        'Hello'
    ];

    const ts_types = [];
    for(const code of codes){
        const r = ts_type(code);
        if(r.err){
            console.error('parse rust type to typescript type failed, code:', code, ', result:', r);
            return r;
        }else{
            ts_types.push(r);
        }
    }

    console.log(JSON.stringify(ts_types, null, 2));
}

function test_star(){
    const code = " pub pub pub ";
    const r = seq(
        spaces('+'), 
        star(
            seq(
                pub((r)=>{
                    console.log(r);
                }),
                spaces('*')
            )
        )
    )
    r(code);
}

function test_question(){
    const codes = [
        "pub",
        "pub ",
        " pub ",
        "pub pub ",
    ];

    for(const code of codes){
        const re = question(seq(pub(), spaces('*')));
        const r = re(code);
        if(r.err){
            console.error("[Error] test failed, code:`", code, '`');
        }else{
            console.log("[OK] test success, code:`", code, "`, rest: `", r.code, '`', ', group:', r.group);
        }
    }
}

function sub_desc_type_config_doc(){
    const doc = `
        // 是否有主，
        // "disable": 禁用，
        // "option": 可选
        // "has": 一定有，注意 TypeScript 代码里是不含有 'has' 选项的，配置这里是方便确认有该属性时， create 函数生成时是否使用 option
        owner_type: "disable"|"option"|"has",

        // 是否有区域信息，
        // "disable": 禁用，
        // "option": 可选
        // "has": 一定有，注意 TypeScript 代码里是不含有 'has' 选项的，配置这里是方便确认有该属性时， create 函数生成时是否使用 option
        area_type: "disable"|"option":"has",

        // 是否有作者，
        // "disable": 禁用，
        // "option": 可选
        // "has": 一定有，注意 TypeScript 代码里是不含有 'has' 选项的，配置这里是方便确认有该属性时， create 函数生成时是否使用 option
        author_type: "disable"|"option"|"has",

        // 公钥类型，
        // "disable": 禁用，
        // "single_key": 单PublicKey，
        // "mn_key": M-N 公钥对,
        // "any": 任意类型(内部用)
        key_type: "disable"|"single_key"|"mn_key"
    `;
    return doc;
}

function main(){
    // 转换
    rust_module_2_ts([
        './auto_cyfs_base.def.js',
        './auto_cyfs_base_meta.def.js',
    ]);

    // 生成导出接口索引
    if(process.argv.length===3&&process.argv[2]==='-v'){
        // DO NOT write file
    }else {
        child_process.execSync('node index.g.js');
    }
}

main();