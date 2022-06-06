import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import { PeopleDecoder } from '../../sdk';
import { question } from '../lib/util';
import { Command } from 'commander';
const qrcode = require('qrcode-terminal');

function get_local_ip() {
    const ips = [];
    const ifaces = os.networkInterfaces();
    for (const iface in ifaces) {
        if (!ifaces[iface]) {
            continue;
        }
        for (const info of ifaces[iface]!) {
            if (!info.internal && info.family === 'IPv4') {
                ips.push(info.address)
            }
        }
    }

    return ips;
}

function getRandomInt(min:number, max:number):number {
    return Math.floor(Math.random() * (max - min)) + min; //不含最大值，含最小值
  }

function import_people(basePath: string): Promise<null> {
    return new Promise((reslove, reject) => {
        const local_ips = get_local_ip();
        const port = getRandomInt(50000, 60000);
        const req_path = '/import_people';
        const urls = [];
        for (const ip of local_ips) {
            const url = `http://${ip}:${port}${req_path}`;
            urls.push(url)
            console.log(`use url ${url}`);
        }
        const server = http.createServer((req, res) => {
            if (req.method === 'POST' && req.url === req_path) {
                req.setEncoding('utf-8');
                let body = ''
                req.on('data', (chunk) => {
                    body += chunk;
                });
                req.on('end', () => {
                    const data = JSON.parse(body);
                    const people_desc_path = path.join(basePath, 'people.desc');
                    const people_sec_path = path.join(basePath, 'people.sec');
                    fs.writeFileSync(people_desc_path, Buffer.from(data.desc, 'hex'));
                    fs.writeFileSync(people_sec_path, Buffer.from(data.sec, 'hex'));
                    console.log("密钥已接收，正在校验...");
                    res.writeHead(200);
                    const r = new PeopleDecoder().raw_decode(new Uint8Array(fs.readFileSync(people_desc_path)));
                    if (r.err) {
                        console.error('Desc校验失败！请重新导入');
                        res.write(JSON.stringify({code:r.val.code, msg:r.val.msg}))
                    } else {
                        const [people, _] = r.unwrap();
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
            const data = { flag: "cyfs", type: "exportPeople", data: { url: urls } }
            const blog = console;
            console = (console as any).origin;
            qrcode.generate(JSON.stringify(data), {small: true});
            console.log('请用超送扫描以上二维码，导入people密钥对');
            console.log('如果二维码显示出错，请将控制台设置为等宽字体后再次执行该命令，重新扫码')
            console.log(`密钥对存储位置： ${basePath}`);
            console = blog;
        });
        server.listen(port);
    })
}

export function makeCommand(config: any) {
    return new Command("import-people")
        .description("import people desc and sec from wallet")
        .requiredOption("-s, --save <path>", "desc save dir", config.user_profile_dir)
        .action(async (options) => {
            await run(options.save)

            process.exit(0);
        })
}

async function run(basePath: string) {
    // 检查
    if (!path.isAbsolute(basePath)) {
        basePath = path.normalize(path.join(process.cwd(), basePath));
    }
    fs.ensureDirSync(basePath);
    const people_sec_path = path.join(basePath, 'people.sec');
    if (fs.existsSync(people_sec_path)) {
        const answer = await question(`已存在people密钥在${people_sec_path}\n是否覆盖已存在的people密钥对？(yes/no)`)
        if (answer === 'yes') {
            await import_people(basePath);
        } else {
            return;
        }
    } else {
        await import_people(basePath);
    }
}