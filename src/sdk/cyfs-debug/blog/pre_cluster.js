const child_process = require('child_process');

function main(){
    let args = process.argv.splice(2);
    let fileNum = 0;
    let post = false;

    if (args[0] == '-r') {
        post = true;
        args = args.splice(1);
    }

    args.forEach((val, index, array) =>{
        console.log((post?'Post':'Pre')+' => '+val);
        let preargs = ['node', 'pre.js', '-input', val];
        if (post) {
            preargs.push('-r');
        }

        child_process.exec(preargs.join(' '), (err, stdout, stderr)=>{
            fileNum += 1;
            if (fileNum == args.length) {
                process.exit(0);
            }
        });
    });
}

main();