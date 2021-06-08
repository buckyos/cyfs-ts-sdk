const path = require('path');

module.exports = {
    entry: './app/index.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: [
                    /node_modules/,
                    /dist/
                ]
            },
        ],
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
    },
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'app',
        libraryTarget: 'window'
    },
    externals: [
        {
            "../cyfs": "cyfs"
        }
    ],
};