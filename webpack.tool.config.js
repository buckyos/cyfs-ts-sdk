const path = require('path');
const cc = require('./webpack.cc');
const ShebangPlugin = require('webpack-shebang-plugin');

module.exports = {
    mode : 'production',
    entry: {
        cyfs: './tool/cyfs.ts',
        contract: './tool/contract.ts'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {configFile: 'tsconfig.tool.json', transpileOnly: true}
                    },
                    cc.conditionalCompiler
                ],
                include: [/tool/]
            },
        ],
    },
    plugins: [
        new ShebangPlugin()
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'tool'),
        library: {
            type: 'commonjs2',
        }
    },
    target: 'node',
    externals: {
        'fs-extra': 'commonjs2 fs-extra',
        'websocket': 'commonjs2 websocket',
        'node-fetch': 'commonjs2 node-fetch',
        'bs58': 'commonjs2 bs58',
        'hex-to-array-buffer': 'commonjs2 hex-to-array-buffer',
        'ts-results': 'commonjs2 ts-results',
        'js-sha256': 'commonjs2 js-sha256',
        '../../src': 'commonjs2 ../src',
        '../src': 'commonjs2 ../src',
        'qrcode-terminal': 'commonjs2 qrcode-terminal',
        'node-getopt': 'commonjs2 node-getopt',
        "commander": 'commonjs2 commander'
    },
    optimization: {
        // TODO 暂时不开启优化，方便调试诊断
        minimize: false
    }
};