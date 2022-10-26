const path = require('path');
const cc = require('./webpack.cc');
const DtsBundleWebpack = require('dts-bundle-webpack');

module.exports = {
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
                                {search: 'development version', replace: cc.sdk_version()}
                            ]
                        }
                    }
                ],
                exclude: [
                    /node_modules/,
                    /tool/,
                    /dist/
                ]
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            "os": require.resolve("./sdk/platform-spec/rn/os_rn"),
            "process": require.resolve("process/browser"),
            "path": require.resolve("path-browserify"),
            "constants": require.resolve("constants-browserify"),
            "assert": false,
            "stream": require.resolve("stream-browserify"),
            "fs": false,
            "secp256k1": require.resolve("secp256k1/elliptic")
        }
    },
    output: {
        filename: 'cyfs_rn.js',
        path: path.resolve(__dirname, '../out'),
        library: {
            type: 'commonjs2',
        }
    },
    externals: {
        'fs-extra': 'commonjs2 fs-extra',
        'react-native': 'commonjs2 react-native',
        'react-native-fs': 'commonjs2 react-native-fs',
        "crypto": 'commonjs2 crypto',
        "node-localstorage": 'commonjs2 node-localstorage'
    },
    plugins: [
        new DtsBundleWebpack({
            name: "cyfs",
            main: './src/sdk/index.d.ts',
            out: '../../out/cyfs_rn.d.ts',
            removeSource: false,
            outputAsModuleFolder: true
        })
    ],
    optimization: {
        // TODO 暂时不开启优化，方便调试诊断
        minimize: true
    }
};