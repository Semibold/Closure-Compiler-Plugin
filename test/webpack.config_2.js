const path = require("path");
const webpack = require("webpack");
const ClosureCompilerPlugin = require("../src/index.js");

const concurrency = require("os").cpus().length;

module.exports = {
    mode: "none",
    entry: { entry_1: path.join(__dirname, "entry_1.js"), entry_2: path.join(__dirname, "entry_2.js") },
    devtool: "source-map",
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].bundle.js",
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                loader: "css-loader",
            },
        ],
    },
    plugins: [
        new webpack.ProgressPlugin({ profile: true }),
        new ClosureCompilerPlugin({
            compiler: {
                language_in: "ECMASCRIPT6",
                language_out: "ECMASCRIPT5",
                compilation_level: "SIMPLE",
                isolation_mode: "IIFE",
                create_source_map: true,
            },
            concurrency,
            jsCompiler: true,
            test: /^entry_2\.bundle\.js$/,
        }),
    ],
    optimization: {
        minimize: false,
    },
};
