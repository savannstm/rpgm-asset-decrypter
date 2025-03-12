// @ts-check

import { defineConfig } from "@rspack/cli";
import ESLintPlugin from "eslint-webpack-plugin";
import path from "path";

export default defineConfig([
    // ES Module output
    {
        entry: "./src/index.ts",
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: [/node_modules/],
                    loader: "builtin:swc-loader",
                    options: {
                        jsc: {
                            parser: {
                                syntax: "typescript",
                            },
                        },
                    },
                    type: "javascript/auto",
                },
            ],
        },
        plugins: [
            new ESLintPlugin({
                extensions: ["ts"],
            }),
        ],
        output: {
            filename: "index.mjs",
            path: path.resolve(process.cwd(), "dist"),
            library: {
                type: "module",
            },
        },
        resolve: {
            extensions: [".ts", ".js"],
        },
        experiments: {
            outputModule: true,
        },
        mode: "production",
        externalsType: "module",
    },
    // CommonJS output
    {
        entry: "./src/index.ts",
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: [/node_modules/],
                    loader: "builtin:swc-loader",
                    options: {
                        jsc: {
                            parser: {
                                syntax: "typescript",
                            },
                        },
                    },
                    type: "javascript/auto",
                },
            ],
        },
        plugins: [
            new ESLintPlugin({
                extensions: ["ts"],
            }),
        ],
        output: {
            filename: "index.cjs",
            path: path.resolve(process.cwd(), "dist"),
            library: {
                type: "commonjs2",
            },
        },
        resolve: {
            extensions: [".ts", ".js"],
        },
        mode: "production",
        externalsType: "commonjs",
    },
]);
