const path = require('path');
const cc = require('./webpack.cc');

module.exports = {
    mode: 'production',
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    'ts-loader',
                    cc.conditionalCompiler
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
            "crypto": false
        }
    },
    output: {
        filename: 'cyfs.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'cyfs',
        libraryTarget: 'window'
    },
    externals: {
        'fs-extra': 'commonjs2 fs-extra',
        'react-native-fs': 'commonjs2 react-native-fs'
    },
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