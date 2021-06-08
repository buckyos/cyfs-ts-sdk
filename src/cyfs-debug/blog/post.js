const fs = require("fs");

String.prototype.isEmpty = function() {
    return (this.length === 0 || !this.trim());
};

function main(){
    let file = process.argv[2];
    let lines = fs.readFileSync(file).toString().split(/\r?\n/);

    let output = [];
    for(let i in lines){
        let line = lines[i];
        line = line.trimRight();
        if(!line.isEmpty()){
            output.push(line);
        }
    }
    let code = output.join('\n');
    fs.writeFileSync(file,code);
}

main();
