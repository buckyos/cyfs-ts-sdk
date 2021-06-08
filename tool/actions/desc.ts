import path from "path";
import * as fs from 'fs-extra';

async function gen(options:any, config:any, ctx: any) {

    let workspace;
    if(config.save){
        workspace = config.save;
    }else{
        workspace = config.user_profile_dir;
    }

    const people_desc = path.join(workspace, "people.desc");
    if(fs.existsSync(people_desc)){
        console.error(`身份配置文件已存在于 ${workspace}`);
        console.error(`  * 如需覆盖请手工删除，请注意备份！`);
        console.error(`  * 或者请通过选项 -save xxx 指定其他保存位置！`);
        process.exit(0);
    }

    fs.ensureDirSync(workspace);

    const desc_pair: any = {
        workspace,
        people_unique_id: Date.now(),
        runtime_unique_id: Date.now(),
        ood_unique_id: Date.now(),
    };

    desc_pair.people = `people`;
    desc_pair.runtime = `runtime`;
    desc_pair.ood = `ood`;

    function exec(cmd: string, workspace: string) {
        require('child_process').execSync(cmd, {stdio: 'inherit', cwd: workspace})
    }

    function create_desc(params:string, name:string, workspace: string) {
        exec(`${config.desc_tool} create ${params} --idfile id`, workspace);

        const idFile = path.join(desc_pair.workspace, 'id');
        const id = fs.readFileSync(idFile).toString();

        const desc_src = path.join(desc_pair.workspace, `${id}.desc`);
        const desc_dest = path.join(desc_pair.workspace, `${name}.desc`);
        fs.renameSync(desc_src, desc_dest);

        const sec_src = path.join(desc_pair.workspace, `${id}.sec`);
        const sec_dest = path.join(desc_pair.workspace, `${name}.sec`);
        if (fs.existsSync(sec_src)) {
            fs.renameSync(sec_src, sec_dest);
        }

        return id;
    }

    fs.ensureDirSync(desc_pair.workspace);

    // create
    const people = create_desc("people", `${desc_pair.people}`, desc_pair.workspace);
    const runtime = create_desc(`device -c pc -d ${desc_pair.runtime_unique_id} -o ${people}`, `${desc_pair.runtime}`, desc_pair.workspace);
    const ood = create_desc(`device -c ood -d ${desc_pair.ood_unique_id} -o ${people}`, `${desc_pair.ood}`, desc_pair.workspace);

    // sign
    exec(`${config.desc_tool} modify ${desc_pair.people}.desc -o ${ood} -n ${desc_pair.people}`, desc_pair.workspace);
    exec(`${config.desc_tool} sign -db ${desc_pair.people}.desc -s ${desc_pair.people}.sec -t 255`, desc_pair.workspace);
	exec(`${config.desc_tool} sign -db ${desc_pair.runtime}.desc -s ${desc_pair.people}.sec -t 254`, desc_pair.workspace);
	exec(`${config.desc_tool} sign -db ${desc_pair.ood}.desc -s ${desc_pair.people}.sec -t 254`, desc_pair.workspace);

    // put
    exec(`${config.cyfs_meta_client} putdesc -c ${desc_pair.people} `, desc_pair.workspace);
    exec(`${config.cyfs_meta_client} putdesc -c ${desc_pair.ood}`, desc_pair.workspace);

    console.log("");
    console.log("");
    console.log("===============");
    console.log("已为您生成专属 CYFS 身份密钥文件，请妥善保管并按照教程使用.");
    console.log(`输出目录:  ${desc_pair.workspace} `);
    console.log("===============");
    console.log("*个人(people)身份密钥文件:");
    console.log(`    * ${path.join(desc_pair.workspace, desc_pair.people+'.desc')}`);
    console.log(`    * ${path.join(desc_pair.workspace, desc_pair.people+'.sec')}`);
    console.log("*客户端运行时(cyfs-runtime)身份密钥文件:");
    console.log(`    * ${path.join(desc_pair.workspace, desc_pair.runtime+'.desc')}`);
    console.log(`    * ${path.join(desc_pair.workspace, desc_pair.runtime+'.sec')}`);
    console.log("*OOD设备(cyfs-ood)身份密钥文件:");
    console.log(`    * ${path.join(desc_pair.workspace, desc_pair.ood+'.desc')}`);
    console.log(`    * ${path.join(desc_pair.workspace, desc_pair.ood+'.sec')}`);
    console.log("===============");
    console.log("");
}

export async function run(options:any, config:any, ctx:any) {
    await gen(options, config, ctx);
}