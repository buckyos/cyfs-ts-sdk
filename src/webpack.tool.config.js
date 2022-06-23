const path = require('path');
const cc = require('./webpack.cc');
const ShebangPlugin = require('webpack-shebang-plugin');

module.exports = {
    mode : 'production',
    entry: {
        cyfs: './src/tool/cyfs.ts',
        contract: './src/tool/contract.ts'
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
        'jsbi': 'commonjs2 jsbi',
        '../../sdk': 'commonjs2 cyfs-sdk',
        '../sdk': 'commonjs2 cyfs-sdk',
        'qrcode-terminal': 'commonjs2 qrcode-terminal',
        "node-fetch": 'commonjs2 node-fetch',
        "commander": 'commonjs2 commander',
        "inquirer": 'commonjs2 inquirer',
        "inquirer-command-prompt": 'commonjs2 inquirer-command-prompt',
        "minimist": 'commonjs2 minimist',
        "colors-console": 'commonjs2 colors-console',
        "table": 'commonjs2 table',
    },
    optimization: {
        // TODO 暂时不开启优化，方便调试诊断
        minimize: false
    }
};