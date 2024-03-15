// webpack config file for native targets

import * as Repack from "@callstack/repack";
import * as path from "path";
import TerserPlugin from "terser-webpack-plugin";
import webpack from "webpack";
import { babelLoaderConfigurations, imageLoaderConfigurations } from "./webpack.config.common.mjs";

const appDirectory = Repack.getDirname(import.meta.url);

/** @returns {webpack.Configuration} */
export default (env) => {
  const {
    mode = "development",
    context = appDirectory,
    platform = process.env.PLATFORM,
    minimize = mode === "production",
    devServer = undefined,
    bundleFilename = undefined,
    sourceMapFilename = undefined,
    assetsPath = undefined,
    reactNativePath = new URL("./node_modules/react-native", import.meta.url).pathname,
  } = env;

  return {
    mode,
    devtool: false,
    context,
    entry: [
      ...Repack.getInitializationEntries(reactNativePath, {
        hmr: devServer && devServer.hmr,
      }),
      "./index.ts",
    ],

    // configures where the build ends up
    output: {
      clean: true,
      hashFunction: "xxhash64",
      publicPath: Repack.getPublicPath({ platform, devServer }),
      path: path.join(appDirectory, "build/generated", platform),
      filename: "index.bundle",
      chunkFilename: "[name].chunk.bundle",
      chunkFormat: "module",
    },

    optimization: {
      /** Enables minification based on values passed from React Native CLI or from fallback. */
      minimize,
      /** Configure minimizer to process the bundle. */
      minimizer: [
        new TerserPlugin({
          test: /\.(js)?bundle(\?.*)?$/i,
          /**
           * Prevents emitting text file with comments, licenses etc.
           * If you want to gather in-file licenses, feel free to remove this line or configure it
           * differently.
           */
          extractComments: false,
          terserOptions: {
            format: {
              comments: false,
            },
          },
        }),
      ],
      chunkIds: "named",
    },

    // ...the rest of your config
    module: {
      rules: [
        ...babelLoaderConfigurations({ devServer }),
        ...imageLoaderConfigurations({ platform, devServerEnabled: Boolean(devServer) }),
      ],
    },

    resolve: {
      ...Repack.getResolveOptions(platform),
    },
    plugins: [
      new webpack.EnvironmentPlugin({ REACT_NAV_LOGGING: "" }),
      new Repack.RepackPlugin({
        context,
        mode,
        platform,
        devServer,
        output: {
          bundleFilename,
          sourceMapFilename,
          assetsPath,
        },
      }),
    ],
  };
};
