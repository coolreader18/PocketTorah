import HtmlBundlerPlugin from "html-bundler-webpack-plugin";
import * as path from "path";
import webpack from "webpack";
import { GenerateSW } from "workbox-webpack-plugin";
import {
  appDirectory,
  babelLoaderConfigurations,
  imageLoaderConfigurations,
} from "./webpack.config.common.mjs";

const publicPath = process.env.WEBPACK_PUBLIC_PATH || "/PocketTorah/";

const platform = "web";

export default (env) => ({
  // configures where the build ends up
  output: {
    path: path.resolve(appDirectory, "dist"),
    publicPath,
    clean: {
      keep: /(\.nojekyll|\.git)$/,
    },
  },
  target: "web",

  // ...the rest of your config

  module: {
    rules: [
      {
        test: /\.webmanifest$/i,
        use: "webpack-webmanifest-loader",
        type: "asset/resource",
      },
      ...babelLoaderConfigurations(),
      ...imageLoaderConfigurations({ platform, publicPath }),
    ],
  },

  resolve: {
    // This will only alias the exact import "react-native"
    alias: {
      "react-native$": "react-native-web",
      "@react-native/assets-registry/registry": "react-native-web/dist/modules/AssetRegistry",
    },
    // If you're working on a multi-platform React Native app, web-specific
    // module implementations should be written in files using the extension
    // `.web.js`.
    extensions: [".web.js", ".js", ".web.ts", ".ts", ".web.tsx", ".tsx", ".web.jsx", ".jsx"],
    fallback: { crypto: false },
  },
  plugins: [
    new webpack.EnvironmentPlugin({ REACT_NAV_LOGGING: "" }),
    new webpack.DefinePlugin({ __DEV__: !env.production }),
    new HtmlBundlerPlugin({
      entry: { index: path.resolve(appDirectory, "web/index.html") },
      loaderOptions: {
        sources: [
          {
            tag: "link",
            attributes: ["href"],
            filter: ({ attributes }) => attributes.rel === "manifest",
          },
        ],
      },
    }),
    new GenerateSW({
      exclude: [/\.mp3$/, /\.map$/, /^manifest.*\.js$/],
      // include: [/data\/trope\/audio\/.*\.mp3$/],
      runtimeCaching: [
        {
          urlPattern: /\.mp3$/,
          handler: "CacheFirst",
        },
      ],
    }),
  ],

  devServer: {
    port: 8080,
    client: {
      overlay: {
        errors: true,
        runtimeErrors: true,
        warnings: false,
      },
    },
    onListening: (devServer) => {
      const port = devServer.server.address().port;
      console.log(`PocketTorah at http://localhost:${port}${publicPath}`);
    },
  },
});
