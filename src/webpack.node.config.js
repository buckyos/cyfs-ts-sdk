const path = require('path');
const DtsBundleWebpack = require('dts-bundle-webpack');
const cc = require('./webpack.cc');


module.exports = {
    mode : 'production',
    entry: './src/sdk/index.ts',
    devtool: 'source-map',
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
        'base-x': 'commonjs2 base-x',
        'hex-to-array-buffer': 'commonjs2 hex-to-array-buffer',
        'ts-results': 'commonjs2 ts-results',
        "node-localstorage": 'commonjs2 node-localstorage',
        'node-forge': 'commonjs2 node-forge',
        'bip39': 'commonjs2 bip39',
        'google-protobuf': 'commonjs2 google-protobuf',
        'secp256k1': 'commonjs2 secp256k1',
        '@noble/hashes': 'commonjs2 @noble/hashes'
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