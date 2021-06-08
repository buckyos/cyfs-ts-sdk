const path = require('path');
const cc = require('./webpack.cc');

module.exports = {
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
            "os": require.resolve("./src/platform-spec/rn/os_rn"),
            "process": require.resolve("process/browser"),
            "path": require.resolve("path-browserify"),
            "crypto": false
        }
    },
    output: {
        filename: 'cyfs_rn.js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            type: 'commonjs2',
        }
    },
    externals: {
        'fs-extra': 'commonjs2 fs-extra',
        'react-native': 'commonjs2 react-native',
        'react-native-fs': 'commonjs2 react-native-fs'
    },
    optimization: {
        // TODO 暂时不开启优化，方便调试诊断
        minimize: false
    }
};