const fs = require('fs');
const path = require('path');

function context(args){
    // init 
    let ctx = {
        macroPrefix:{
            c: '#',
            node: '//=>'
        },
        inputPath:null,
        outputPath:null,
        restore:false,
        container:[],
        parse:()=>{
            // parse
            for (let i = 0; i < args.length; i++) {
                if (args[i].indexOf("-input") == 0) {
                    ctx.inputPath = ctx.outputPath = args[i + 1];
                }else if (args[i].indexOf("-output") == 0) {
                    ctx.outputPath = args[i + 1];
                }else if (args[i].indexOf("-r") == 0) {
                    ctx.restore = true;
                }
            }

            // abs path
            ctx.inputPath = path.join(__dirname,ctx.inputPath);
            ctx.outputPath = path.join(__dirname,ctx.outputPath);
        }
    };

    return ctx;
}

// sym前面必须只有空格和tab
function findSym(ctx, data, sym) {
    let sindex = data.indexOf(sym);
    if (sindex >= 0) {
      for (let i = 0; i < sindex; ++i) {
        if (data[i] !== ' ' && data[i] !=='\t') {
          return -1;
        }
      }

      return sindex;
    } else {
      return -1;
    }
}

function ccollector(symIndex) {
    return (ctx, data)=>{
        let sindex = symIndex(ctx, data, ctx.macroPrefix.c);
        if (sindex >= 0) {
            ctx.container.push(ctx.macroPrefix.node + data);
        }else{
            ctx.container.push(data);
        }
    };
}

function nodecollector(symIndex){
    return (ctx, data)=>{
        let sindex = symIndex(ctx, data, ctx.macroPrefix.node);
        if ( sindex>= 0) {
            ctx.container.push(data.substring(sindex + ctx.macroPrefix.node.length, data.length));
        }else{
            ctx.container.push(data);
        }
    };
}

function collector(storeCollector, restoreCollector) {
    return (ctx, data)=>{
        if (ctx.restore) {
            return storeCollector(ctx, data);
        }else{
            return restoreCollector(ctx, data);
        }    
    };
}

function reducer(){
    return (ctx)=>{
        return ctx.container.join('\n')+'\n';
    };
}

function pre(ctx, collect, reduce) {

    // parse context
    ctx.parse();

    // read files
    let input = fs.createReadStream(ctx.inputPath);

    // iterate to collect   
    let remaining = '';
    input.on('data', function(data) {

        remaining += data;
        let index = remaining.indexOf('\n');

        while (index > -1) {
            
            collect(ctx, remaining.substring(0, index));

            remaining = remaining.substring(index + 1);
            index = remaining.indexOf('\n');
        }
    });

    // final reduce
    input.on('end', function() {

        if (remaining.length > 0) {
            collect(ctx, remaining);
        }

        fs.writeFileSync(ctx.outputPath, reduce(ctx), { flags: "w+" });
    });
}

function main(){
    // [PL corner]:
    // What's Functional Programming?
    // it is a lisp, can see function dependence clearly
    pre(
        context(process.argv), 
        collector(
            ccollector(findSym),
            nodecollector(findSym)
        ), 
        reducer()
    );
}

main();

