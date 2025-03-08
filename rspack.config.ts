import { defineConfig } from "@rspack/cli";
import ESLintPlugin from "eslint-webpack-plugin";

export default defineConfig({
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
        filename: "bundle.js",
        path: import.meta.dirname + "/dist",
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    experiments: {
        outputModule: true, // Enables ESM output for libraries
    },
    mode: "production",
    externalsType: "module",
});
