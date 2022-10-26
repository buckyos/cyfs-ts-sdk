const path = require('path');
const DtsBundleWebpack = require('dts-bundle-webpack');
const cc = require('./webpack.cc');

module.exports = {
    mode: 'production',
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
            "os": require.resolve("os-browserify/browser"),
            "process": require.resolve("process/browser"),
            "path": require.resolve("path-browserify"),
            "constants": require.resolve("constants-browserify"),
            "assert": false,
            "node-fetch": false,
            "node-localstorage": false,
            "util": false,
            "fs": false,
            "stream": require.resolve("stream-browserify"),
            "secp256k1": require.resolve("secp256k1/elliptic")
        }
    },
    output: {
        filename: 'cyfs.js',
        path: path.resolve(__dirname, '../out'),
        library: 'cyfs',
        libraryTarget: 'window'
    },
    externals: {
        'fs-extra': 'commonjs2 fs-extra',
        'react-native-fs': 'commonjs2 react-native-fs',
    },
    plugins: [
        new DtsBundleWebpack({
            name: "cyfs",
            main: './src/sdk/index.d.ts',
            out: '../../out/cyfs.d.ts',
            removeSource: false,
            outputAsModuleFolder: true
        })
    ],
    optimization: {
        // TODO 暂时不开启优化，方便调试诊断
        minimize: false
    },
    performance: {
        hints: "warning",
        maxAssetSize: 1024 * 1024 * 10,
        maxEntrypointSize: 1024 * 1024 * 10,
        assetFilter: function (assetFilename) {
            return assetFilename.endsWith('.css') || assetFilename.endsWith('.js');
        }
    },
};
