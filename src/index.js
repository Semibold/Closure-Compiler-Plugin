const fs = require("fs");
const path = require("path");
const temp = require("temp").track();
const async = require("async");
const { ModuleFilenameHelpers } = require("webpack");
const { RawSource, SourceMapSource } = require("webpack-sources");
const { compiler: JavaCompiler, jsCompiler: JSCompiler } = require("google-closure-compiler");

class ClosureCompilerPlugin {
    /**
     * @param {Object} [props]
     * @property {boolean} [props.jsCompiler]
     * @property {Object} [props.compiler]
     * @property {number} [props.concurrency]
     * @property {RegExp|RegExp[]} [props.test]
     */
    constructor(props) {
        this.name = ClosureCompilerPlugin.name;
        this.options = Object.assign({}, props);
        this.compilerOptions = Object.assign({}, this.options.compiler);
        this.regexObject = { test: this.options.test || /\.js($|\?)/i };
    }

    apply(compiler) {
        const queue = async.queue((task, callback) => {
            let inputSource, inputSourceMap;
            let outputSourceMapFile;
            if (this.compilerOptions.hasOwnProperty("create_source_map")) {
                if (task.asset.sourceAndMap) {
                    const sourceAndMap = task.asset.sourceAndMap();
                    inputSourceMap = sourceAndMap.map;
                    inputSource = sourceAndMap.source;
                } else {
                    inputSourceMap = task.asset.map();
                    inputSource = task.asset.source();
                }
                outputSourceMapFile = temp.openSync("ccwp-dump-", "w+");
                this.compilerOptions.create_source_map = outputSourceMapFile.path;
            } else {
                inputSource = task.asset.source();
            }

            if (this.options.jsCompiler) {
                const compiler = new JSCompiler(this.compilerOptions);
                const file = { src: inputSource, path: task.file };
                if (inputSourceMap) {
                    file.sourceMap = JSON.stringify(inputSourceMap);
                }
                compiler.run([file], (code, compiledFiles, errorMessage) => {
                    compiledFiles.forEach(compiledFile => {
                        if (errorMessage) {
                            task.error(new Error(`${task.file} from Closure Compiler\n${errorMessage}`));
                        } else {
                            if (this.compilerOptions.hasOwnProperty("create_source_map")) {
                                task.callback(
                                    new SourceMapSource(
                                        compiledFile.src,
                                        compiledFile.path,
                                        JSON.parse(compiledFile.sourceMap),
                                        file.src,
                                        file.sourceMap,
                                    ),
                                );
                            } else {
                                task.callback(new RawSource(compiledFile.src));
                            }
                        }
                    });
                    callback();
                });
            } else {
                const inputSourceFile = temp.openSync("ccwp-dump-", "w+");
                fs.writeFileSync(inputSourceFile.fd, inputSource);
                this.compilerOptions.js = inputSourceFile.path;

                const compiler = new JavaCompiler(this.compilerOptions);
                compiler.run((code, stdOutData, stdErrData) => {
                    if (stdErrData) {
                        task.error(new Error(`${task.file} from Closure Compiler\n${stdErrData}`));
                    } else {
                        if (this.compilerOptions.hasOwnProperty("create_source_map")) {
                            const outputSourceMap = JSON.parse(
                                fs.readFileSync(outputSourceMapFile.path, { encoding: "utf8" }),
                            );
                            outputSourceMap.sources = outputSourceMap.sources.map(source => {
                                return path.normalize(source) === path.normalize(inputSourceFile.path)
                                    ? task.file
                                    : source;
                            });
                            task.callback(
                                new SourceMapSource(
                                    stdOutData,
                                    task.file,
                                    outputSourceMap,
                                    inputSource,
                                    inputSourceMap,
                                ),
                            );
                        } else {
                            task.callback(new RawSource(stdOutData));
                        }
                    }
                    callback();
                });
            }
        }, this.options.concurrency || 1);

        compiler.hooks.compilation.tap(this.name, compilation => {
            compilation.hooks.optimizeChunkAssets.tapAsync(this.name, (chunks, callback) => {
                let pending = 0;
                let matching = 0;
                chunks.forEach(chunk => {
                    chunk.files.forEach(file => {
                        if (ModuleFilenameHelpers.matchObject(this.regexObject, file)) {
                            matching++;
                            pending++;
                            queue.push({
                                file: file,
                                asset: compilation.assets[file],
                                callback(asset) {
                                    compilation.assets[file] = asset;
                                    if (--pending === 0) callback();
                                },
                                error(err) {
                                    console.error(`\nCaught error: ${err}\n`);
                                    compilation.errors.push(err);
                                    if (--pending === 0) callback();
                                },
                            });
                        }
                    });
                });
                if (matching === 0) callback();
            });
        });
    }
}

module.exports = ClosureCompilerPlugin;
