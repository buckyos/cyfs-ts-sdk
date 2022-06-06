const path = require('path');
const DtsBundleWebpack = require('dts-bundle-webpack');
const cc = require('./webpack.cc');


module.exports = {
    mode : 'production',
    entry: './src/sdk/index.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    'ts-loader',
                    cc.conditionalCompiler,
                    {
                        loader: 'webpack-replace-loader',
                        options: {
                            arr: [
                                {search: 'development version', replace: cc.node_sdk_version()}
                            ]
                        }
                    }
                ],
                exclude: [
                    /node_modules/,
                    /tool/,
                    /dist/
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'cyfs_node.js',
        path: path.resolve(__dirname, '../out'),
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
        "node-localstorage": 'commonjs2 node-localstorage',
    },
    plugins: [
        new DtsBundleWebpack({
            name: "cyfs",
            main: './src/sdk/index.d.ts',
            out: '../../out/cyfs_node.d.ts',
            removeSource: false,
            outputAsModuleFolder: true
        })
    ],
    optimization: {
        // TODO 暂时不开启优化，方便调试诊断
        minimize: false
    }
};