import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import { PeopleDecoder } from '../../sdk';
import { CyfsToolConfig, question } from '../lib/util';
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
                    console.log("The key has been received, verifing...");
                    res.writeHead(200);
                    const r = new PeopleDecoder().raw_decode(new Uint8Array(fs.readFileSync(people_desc_path)));
                    if (r.err) {
                        console.error('Desc verify failed! Please re-import');
                        res.write(JSON.stringify({code:r.val.code, msg:r.val.msg}))
                    } else {
                        const [people, _] = r.unwrap();
                        console.log(`Import success，PeopleId: ${people.desc().calculate_id()}`);
                        console.log(`Key import completed！\ndesc : ${people_desc_path}\nsec : ${people_sec_path}`);
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
            console.log('Please scan the above QR code with CyberChat to import the PEOPLE identity files');
            console.log('If the QR code display error, please set the console to equal-width font and then execute the command again and scan the code again')
            console.log(`identity files storage location： ${basePath}`);
            console = blog;
        });
        server.listen(port);
    })
}

export function makeCommand(config: CyfsToolConfig) {
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
        const answer = await question(`There already exists identity files in${people_sec_path}\nOverwrite the existing PEOPLE identity files?(yes/no)`)
        if (answer === 'yes') {
            await import_people(basePath);
        } else {
            return;
        }
    } else {
        await import_people(basePath);
    }
}