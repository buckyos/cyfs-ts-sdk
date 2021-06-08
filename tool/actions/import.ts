import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import { PeopleDecoder } from '../../src';
import { question } from '../lib/util';
import { CyfsToolContext } from '../lib/ctx';
const qrcode = require('qrcode-terminal');

function get_local_ip() {
    let ifaces = os.networkInterfaces();
    for (const iface in ifaces) {
        if (!ifaces[iface]) {
            continue;
        }
        for (const info of ifaces[iface]!) {
            if (!info.internal && info.family === 'IPv4') {
                return info.address;
            }
        }
    }
}

function getRandomInt(min:number, max:number):number {
    return Math.floor(Math.random() * (max - min)) + min; //不含最大值，含最小值
  }

function import_people(basePath: string, config:any): Promise<null> {
    return new Promise((reslove, reject) => {
        let local_ip = get_local_ip();
        let port = getRandomInt(50000, 60000);
        let req_path = '/import_people';
        let url = `http://${local_ip}:${port}${req_path}`;
        console.log(`use url ${url}`);
        let server = http.createServer((req, res) => {
            if (req.method === 'POST' && req.url === req_path) {
                req.setEncoding('utf-8');
                let body = ''
                req.on('data', (chunk) => {
                    body += chunk;
                });
                req.on('end', () => {
                    let data = JSON.parse(body);
                    let people_desc_path = path.join(basePath, 'people.desc');
                    let people_sec_path = path.join(basePath, 'people.sec');
                    fs.writeFileSync(people_desc_path, Buffer.from(data.desc, 'hex'));
                    fs.writeFileSync(people_sec_path, Buffer.from(data.sec, 'hex'));
                    console.log("密钥已接收，正在校验...");
                    res.writeHead(200);
                    let r = new PeopleDecoder().raw_decode(new Uint8Array(fs.readFileSync(people_desc_path)));
                    if (r.err) {
                        console.error('Desc校验失败！请重新导入');
                        res.write(JSON.stringify({code:r.val.code, msg:r.val.msg}))
                    } else {
                        let [people, _] = r.unwrap();
                        console.log(`接收成功，PeopleId: ${people.desc().calculate_id()}`);
                        console.log(`密钥导入完成！\ndesc位置: ${people_desc_path}\nsec位置: ${people_sec_path}`);
                        res.write(JSON.stringify({code:0, msg:""}))
                    }
                    res.end();
                    server.close();
                    reslove(null);
                });
            } else {
                res.writeHead(404).end();
            }
        });
        server.on('listening', () => {
            let data = { flag: "LIANYIN", type: "exportPeople", data: { url: url } }
            let blog = console;
            console = (console as any).origin;
            qrcode.generate(JSON.stringify(data), {small: true});
            console.log('请用超送扫描以上二维码，导入people密钥对');
            console.log(`密钥对存储位置： ${basePath}`);
            console = blog;
        });
        server.listen(port);
    })

}

export async function run(options:any, config:any, ctx: CyfsToolContext) {
    // 检查
    let basePath = options.s || config.user_profile_dir;
    if (!path.isAbsolute(basePath)) {
        basePath = path.normalize(path.join(process.cwd(), basePath));
    }
    fs.ensureDirSync(basePath);
    let people_sec_path = path.join(basePath, 'people.sec');
    if (fs.existsSync(people_sec_path)) {
        let answer = await question(`已存在people密钥在${people_sec_path}\n是否覆盖已存在的people密钥对？(yes/no)`)
        if (answer === 'yes') {
            await import_people(basePath, config);
        } else {
            return;
        }
    } else {
        await import_people(basePath, config);
    }
}