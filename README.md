# Closure-Compiler-Plugin

> [Changelog](changelog.md)

## Installation

```
npm i -D closure-compiler-plugin
```

## Requirements

While there's JavaScript version of Closure Compiler, the original compiler is written in Java and thus Java version is more complete and performs better in terms of JavaScript code optimizations and compilation speed. If you want to use Java-based compiler, make sure you have installed [Java SDK](http://www.oracle.com/technetwork/java/javase/downloads/index-jsp-138363.html).

## Usage

### Options

#### compiler: &lt;Object&gt;

A hash of options to pass to
[google-closure-compiler(Flags and Options)](https://github.com/google/closure-compiler/wiki/Flags-and-Options).

You can optionally specify a path to your own version of the compiler.jar if the version provided by the plugin isn't working for you. See example below for optional parameter.

#### jsCompiler: &lt;Boolean&gt;

Use pure JavaScript version of Closure Compiler (no Java dependency). Note that compilation time will be around 2x slower. Default is `false`.

#### concurrency: &lt;Number&gt;

The maximum number of compiler instances to run in parallel, defaults to `1`.

#### test: &lt;RegExp | RegExp[]&gt;

Process only files which filename satisfies specified RegExp, defaults to `/\.js($|\?)/i`.

### Example

```js
const path = require("path");
const ClosureCompilerPlugin = require("closure-compiler-plugin");

module.exports = {
    entry: path.join(__dirname, "app.js"),
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].min.js",
    },
    mode: "production",
    devtool: "source-map",
    plugins: [
        new ClosureCompilerPlugin({
            compiler: {
                jar: "path/to/your/custom/compiler.jar", // Optional
                language_in: "ECMASCRIPT6",
                language_out: "ECMASCRIPT5",
                compilation_level: "ADVANCED",
                isolation_mode: "IIFE",
                create_source_map: true,
                externs: [path.join(__dirname, "externs.js")],
            },
        }),
    ],
    optimization: {
        minimize: false,
    },
};
```

## FAQ

-   What is the Closure Compiler?
    -   @see [Closure Compiler Homepage](https://developers.google.com/closure/compiler/)
    -   @see [Closure Compiler Wiki](https://github.com/google/closure-compiler/wiki)
-   What's the difference between this package and [webpack-closure-compiler](https://github.com/roman01la/webpack-closure-compiler)?
    -   This package inspired by webpack-closure-compiler, which support webpack 4+, but webpack-closure-compiler has been deprecated.
