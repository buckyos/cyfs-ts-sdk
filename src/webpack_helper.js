const fs = require('fs');

if (process.argv[2] == "copy_h5_blog") {
    console.info('will replace src/cyfs-debug/blog/blog.js with src/cyfs-debug/blog/h5_blog.js');
    fs.copyFileSync('./src/cyfs-debug/blog/h5_blog.js', './src/cyfs-debug/blog/blog.js');
} else if (process.argv[2] == "copy_node_blog") {
    console.info('will replace src/cyfs-debug/blog/blog.js with src/cyfs-debug/blog/node_blog.js');
    fs.copyFileSync('./src/cyfs-debug/blog/node_blog.js', './src/cyfs-debug/blog/blog.js')
} else if (process.argv[2] == "copy_rn_blog") {
    console.info('will replace src/cyfs-debug/blog/blog.js with src/cyfs-debug/blog/rn_blog.js');
    fs.copyFileSync('./src/cyfs-debug/blog/rn_blog.js', './src/cyfs-debug/blog/blog.js')
} else if (process.argv[2] == "copy_node_path_util") {
    console.info('will replace src/cyfs-base/base/path_util.ts with src/os-spec/path_util.ts');
    fs.copyFileSync('./src/os-spec/path_util.ts', './src/cyfs-base/base/path_util.ts')
} else if (process.argv[2] == "copy_rn_path_util") {
    console.info('will replace src/cyfs-base/base/path_util.ts with src/os-spec/path_util_rn.ts');
    fs.copyFileSync('./src/os-spec/path_util_rn.ts', './src/cyfs-base/base/path_util.ts')
} else {
    throw new Error('not support');
}