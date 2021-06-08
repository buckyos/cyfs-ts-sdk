import child_process from 'child_process';

import readline from 'readline';
export function question(msg:string): Promise<string> {
    return new Promise((reslove, reject) => {
        let cmd = readline.createInterface({input: process.stdin,output:process.stdout});
        cmd.question(msg, async (answer) => {
            reslove(answer);
        })
    })
}

export function exec(cmd: string, workspace: string) {
    console.log('');
    console.log('命令执行目录: ', workspace);
    console.log('执行命令: ', cmd,);
    console.log('');
    child_process.execSync(cmd, {stdio: 'inherit', cwd: workspace})
}