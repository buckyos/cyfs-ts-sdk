
const child_process = require('child_process')

let type = process.argv[2]
let channel = process.argv[3]

let build_result = child_process.spawnSync(`node build.js ${type} node ${channel}`, {stdio: 'inherit', shell: true});
if (build_result.status !== 0) {
    console.error(`build script return err ${build_result.status}, signal ${build_result.signal}`)
}

let dist_result = child_process.spawnSync(`node dist.js ${type} ${channel}`, {stdio: 'inherit', shell: true});
if (dist_result.status !== 0) {
    console.error(`dist script return err ${dist_result.status}, signal ${build_result.signal}`)
}